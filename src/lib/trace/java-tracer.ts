import { instrumentCFamilySource } from "./c-family-instrument";

const TRACE_START = "___SPURA_TRACE_START___";
const TRACE_END = "___SPURA_TRACE_END___";

const JAVA_TRACE_HELPER = `
class __SpuraTrace {
  private static final int MAX_STEPS = 400;
  private static final java.util.List<String> steps = new java.util.ArrayList<>();
  private static final java.util.List<FrameData> frames = new java.util.ArrayList<>();
  private static final java.io.ByteArrayOutputStream stdoutCap = new java.io.ByteArrayOutputStream();
  private static final java.io.PrintStream realErr = System.err;
  private static boolean truncated = false;
  private static boolean hooked = false;

  private static class FrameData {
    String name;
    int line;
    String varsJson = "[]";
    FrameData(String name, int line) {
      this.name = name;
      this.line = line;
    }
  }

  private static synchronized void initHook() {
    if (hooked) return;
    hooked = true;
    final java.io.PrintStream origOut = System.out;
    System.setOut(new java.io.PrintStream(new java.io.OutputStream() {
      @Override public void write(int b) {
        origOut.write(b);
        if (stdoutCap.size() < 32768) stdoutCap.write(b);
      }
      @Override public void write(byte[] b, int off, int len) {
        origOut.write(b, off, len);
        if (stdoutCap.size() < 32768) {
          stdoutCap.write(b, off, Math.min(len, 32768 - stdoutCap.size()));
        }
      }
      @Override public void flush() { origOut.flush(); }
    }, true));

    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      try {
        origOut.flush();
        StringBuilder sb = new StringBuilder();
        sb.append("\\n${TRACE_START}\\n{\\"steps\\":[");
        for (int i = 0; i < steps.size(); i++) {
          if (i > 0) sb.append(",");
          sb.append(steps.get(i));
        }
        sb.append("],\\"truncated\\":").append(truncated ? "true" : "false").append("}\\n${TRACE_END}\\n");
        realErr.print(sb.toString());
        realErr.flush();
      } catch (Throwable ignored) {}
    }));
  }

  public static synchronized void enter(String fn, int line, Object... pairs) {
    initHook();
    frames.add(new FrameData(fn != null ? fn : "fn", line));
    step(line, pairs);
  }

  public static synchronized void exit() {
    if (!frames.isEmpty()) {
      frames.remove(frames.size() - 1);
    }
  }

  public static synchronized void step(int line, Object... pairs) {
    initHook();
    if (steps.size() >= MAX_STEPS) {
      truncated = true;
      return;
    }
    HeapBuilder hb = new HeapBuilder();
    StringBuilder varsJson = new StringBuilder("[");
    int count = 0;
    for (int i = 0; i + 1 < pairs.length; i += 2) {
      if (count > 0) varsJson.append(",");
      String name = String.valueOf(pairs[i]);
      varsJson.append("[").append(jsonStr(name)).append(",").append(encodeVal(pairs[i + 1], hb, 0)).append("]");
      count++;
    }
    varsJson.append("]");

    if (!frames.isEmpty()) {
      FrameData top = frames.get(frames.size() - 1);
      top.line = line;
      top.varsJson = varsJson.toString();
    }

    StringBuilder stackJson = new StringBuilder("[");
    if (frames.isEmpty()) {
      stackJson.append("{\\"name\\":\\"main\\",\\"line\\":").append(line).append(",\\"vars\\":").append(varsJson).append("}");
    } else {
      for (int fi = 0; fi < frames.size(); fi++) {
        if (fi > 0) stackJson.append(",");
        FrameData fr = frames.get(fi);
        stackJson.append("{\\"name\\":").append(jsonStr(fr.name))
          .append(",\\"line\\":").append(fr.line)
          .append(",\\"vars\\":").append(fr.varsJson).append("}");
      }
    }
    stackJson.append("]");

    StringBuilder heapJson = new StringBuilder("{");
    for (int i = 0; i < hb.entries.size(); i++) {
      if (i > 0) heapJson.append(",");
      heapJson.append(hb.entries.get(i));
    }
    heapJson.append("}");

    String outNow;
    try {
      outNow = stdoutCap.toString(java.nio.charset.StandardCharsets.UTF_8);
    } catch (Throwable t) {
      outNow = "";
    }

    steps.add("{\\"line\\":" + line +
      ",\\"event\\":\\"line\\",\\"stack\\":" + stackJson +
      ",\\"heap\\":" + heapJson +
      ",\\"stdout\\":" + jsonStr(outNow) + "}");
  }

  private static class HeapBuilder {
    final java.util.List<String> entries = new java.util.ArrayList<>();
    final java.util.IdentityHashMap<Object, String> seen = new java.util.IdentityHashMap<>();
    int seq = 1;
    String nextId() { return "h" + (seq++); }
  }

  private static String jsonStr(String s) {
    if (s == null) return "null";
    StringBuilder out = new StringBuilder("\\"");
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '"': out.append("\\\\\\""); break;
        case '\\\\': out.append("\\\\\\\\"); break;
        case '\\b': out.append("\\\\b"); break;
        case '\\f': out.append("\\\\f"); break;
        case '\\n': out.append("\\\\n"); break;
        case '\\r': out.append("\\\\r"); break;
        case '\\t': out.append("\\\\t"); break;
        default:
          if (c < 0x20) out.append(String.format("\\\\u%04x", (int) c));
          else out.append(c);
      }
    }
    out.append('"');
    return out.toString();
  }

  private static String prim(String k, String r) {
    return "{\\"t\\":\\"p\\",\\"k\\":" + jsonStr(k) + ",\\"r\\":" + jsonStr(r) + "}";
  }

  private static String primNum(String k, String r, String n) {
    return "{\\"t\\":\\"p\\",\\"k\\":" + jsonStr(k) + ",\\"r\\":" + jsonStr(r) + ",\\"n\\":" + n + "}";
  }

  private static String encodeVal(Object val, HeapBuilder hb, int depth) {
    if (depth > 20) return prim("str", "...");
    if (val == null) return prim("none", "null");
    if (val instanceof Boolean) return prim("bool", String.valueOf(val));
    if (val instanceof Character) return prim("str", "'" + val + "'");
    if (val instanceof Integer || val instanceof Long || val instanceof Short || val instanceof Byte) {
      String s = String.valueOf(val);
      return primNum("int", s, s);
    }
    if (val instanceof Double || val instanceof Float) {
      double d = ((Number) val).doubleValue();
      String s = String.valueOf(val);
      if (Double.isNaN(d) || Double.isInfinite(d)) return prim("float", s);
      return primNum("float", s, s);
    }
    if (val instanceof String) return prim("str", (String) val);
    if (val instanceof StringBuilder || val instanceof StringBuffer) return prim("str", val.toString());

    String existing = hb.seen.get(val);
    if (existing != null) return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(existing) + "}";

    if (val.getClass().isArray()) {
      String id = hb.nextId();
      hb.seen.put(val, id);
      int len = java.lang.reflect.Array.getLength(val);
      StringBuilder items = new StringBuilder("[");
      for (int i = 0; i < Math.min(len, 40); i++) {
        if (i > 0) items.append(",");
        items.append(encodeVal(java.lang.reflect.Array.get(val, i), hb, depth + 1));
      }
      items.append("]");
      hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"list\\",\\"items\\":" + items + ",\\"len\\":" + len + "}");
      return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
    }

    if (val instanceof java.util.Stack<?> || val instanceof java.util.Queue<?> || val instanceof java.util.Deque<?>) {
      String id = hb.nextId();
      hb.seen.put(val, id);
      java.util.Collection<?> col = (java.util.Collection<?>) val;
      StringBuilder items = new StringBuilder("[");
      int i = 0;
      for (Object el : col) {
        if (i >= 40) break;
        if (i > 0) items.append(",");
        items.append(encodeVal(el, hb, depth + 1));
        i++;
      }
      items.append("]");
      hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"deque\\",\\"items\\":" + items + ",\\"len\\":" + col.size() + "}");
      return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
    }

    if (val instanceof java.util.List<?>) {
      String id = hb.nextId();
      hb.seen.put(val, id);
      java.util.List<?> list = (java.util.List<?>) val;
      StringBuilder items = new StringBuilder("[");
      for (int i = 0; i < Math.min(list.size(), 40); i++) {
        if (i > 0) items.append(",");
        items.append(encodeVal(list.get(i), hb, depth + 1));
      }
      items.append("]");
      hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"list\\",\\"items\\":" + items + ",\\"len\\":" + list.size() + "}");
      return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
    }

    if (val instanceof java.util.Map<?, ?>) {
      String id = hb.nextId();
      hb.seen.put(val, id);
      java.util.Map<?, ?> m = (java.util.Map<?, ?>) val;
      StringBuilder entries = new StringBuilder("[");
      int i = 0;
      for (java.util.Map.Entry<?, ?> e : m.entrySet()) {
        if (i >= 30) break;
        if (i > 0) entries.append(",");
        entries.append("[").append(encodeVal(e.getKey(), hb, depth + 1)).append(",").append(encodeVal(e.getValue(), hb, depth + 1)).append("]");
        i++;
      }
      entries.append("]");
      hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"dict\\",\\"entries\\":" + entries + ",\\"len\\":" + m.size() + "}");
      return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
    }

    if (val instanceof java.util.Set<?>) {
      String id = hb.nextId();
      hb.seen.put(val, id);
      java.util.Set<?> st = (java.util.Set<?>) val;
      StringBuilder items = new StringBuilder("[");
      int i = 0;
      for (Object el : st) {
        if (i >= 40) break;
        if (i > 0) items.append(",");
        items.append(encodeVal(el, hb, depth + 1));
        i++;
      }
      items.append("]");
      hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"set\\",\\"items\\":" + items + ",\\"len\\":" + st.size() + "}");
      return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
    }

    // Custom classes (e.g. ListNode, TreeNode) via field inspection
    try {
      java.lang.reflect.Field[] fs = val.getClass().getDeclaredFields();
      if (fs.length > 0 && fs.length <= 8) {
        String id = hb.nextId();
        hb.seen.put(val, id);
        StringBuilder fieldsJson = new StringBuilder("[");
        int fc = 0;
        for (java.lang.reflect.Field f : fs) {
          if (java.lang.reflect.Modifier.isStatic(f.getModifiers())) continue;
          f.setAccessible(true);
          if (fc > 0) fieldsJson.append(",");
          fieldsJson.append("[").append(jsonStr(f.getName())).append(",").append(encodeVal(f.get(val), hb, depth + 1)).append("]");
          fc++;
        }
        fieldsJson.append("]");
        if (fc > 0) {
          hb.entries.add(jsonStr(id) + ":{\\"kind\\":\\"object\\",\\"cls\\":" + jsonStr(val.getClass().getSimpleName()) + ",\\"fields\\":" + fieldsJson + "}");
          return "{\\"t\\":\\"r\\",\\"id\\":" + jsonStr(id) + "}";
        }
      }
    } catch (Throwable ignored) {}

    return prim("object", String.valueOf(val));
  }
}
`;

export function instrumentJavaForTrace(sourceCode: string): string {
  const instrumented = instrumentCFamilySource(sourceCode, "java", {
    onEnterFunction: (fnName, line, params) => {
      const args = params.flatMap((p) => [JSON.stringify(p), p]).join(", ");
      const sep = args ? `, ${args}` : "";
      return ` __SpuraTrace.enter(${JSON.stringify(fnName)}, ${line}${sep});`;
    },
    onExitFunction: () => `__SpuraTrace.exit();`,
    onStep: (line, vars) => {
      const args = vars.flatMap((v) => [JSON.stringify(v), v]).join(", ");
      const sep = args ? `, ${args}` : "";
      return ` __SpuraTrace.step(${line}${sep});`;
    },
  });

  return `${instrumented}\n${JAVA_TRACE_HELPER}\n`;
}
