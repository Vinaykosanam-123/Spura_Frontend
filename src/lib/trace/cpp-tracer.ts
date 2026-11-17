import { instrumentCFamilySource } from "./c-family-instrument";
import type { TraceStep } from "./types";

const TRACE_START = "___SPURA_TRACE_START___";
const TRACE_END = "___SPURA_TRACE_END___";

const CPP_TRACE_RUNTIME = `#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <array>
#include <deque>
#include <stack>
#include <queue>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <type_traits>
#include <utility>
#include <cstdint>
#include <cstdio>

namespace __spura {

struct TeeBuf : public std::streambuf {
  std::streambuf* orig = nullptr;
  std::string captured;
  int overflow(int c) override {
    if (c == EOF) return !EOF;
    if (captured.size() < 32768) captured.push_back(static_cast<char>(c));
    return orig ? orig->sputc(static_cast<char>(c)) : c;
  }
  std::streamsize xsputn(const char* s, std::streamsize count) override {
    if (s && count > 0 && captured.size() < 32768) {
      size_t take = std::min<size_t>(static_cast<size_t>(count), 32768 - captured.size());
      captured.append(s, take);
    }
    return orig ? orig->sputn(s, count) : count;
  }
  int sync() override {
    return orig ? orig->pubsync() : 0;
  }
};

struct FrameInfo {
  std::string name;
  int line;
  std::vector<std::pair<std::string, std::string>> vars;
};

struct Runtime {
  TeeBuf tee;
  std::streambuf* savedOrig = nullptr;
  std::vector<FrameInfo> frames;
  std::vector<std::string> stepJsons;
  bool truncated = false;
  bool dumped = false;
  static constexpr size_t MAX_STEPS = 400;

  Runtime() {
    savedOrig = std::cout.rdbuf();
    tee.orig = savedOrig;
    std::cout.rdbuf(&tee);
  }
  ~Runtime() {
    dump();
    if (savedOrig) {
      std::cout.rdbuf(savedOrig);
    }
  }

  void dump() {
    if (dumped) return;
    dumped = true;
    std::fprintf(stderr, "\\n${TRACE_START}\\n{\\"steps\\":[");
    for (size_t i = 0; i < stepJsons.size(); ++i) {
      if (i > 0) std::fprintf(stderr, ",");
      std::fwrite(stepJsons[i].data(), 1, stepJsons[i].size(), stderr);
    }
    std::fprintf(stderr, "],\\"truncated\\":%s}\\n${TRACE_END}\\n", truncated ? "true" : "false");
    std::fflush(stderr);
  }
};

inline Runtime& rt() {
  static Runtime instance;
  return instance;
}

inline std::string jsonEscape(const std::string& s) {
  std::string out = "\\"";
  for (unsigned char c : s) {
    switch (c) {
      case '\\"': out += "\\\\\\""; break;
      case '\\\\': out += "\\\\\\\\"; break;
      case '\\b': out += "\\\\b"; break;
      case '\\f': out += "\\\\f"; break;
      case '\\n': out += "\\\\n"; break;
      case '\\r': out += "\\\\r"; break;
      case '\\t': out += "\\\\t"; break;
      default:
        if (c < 0x20) {
          char buf[8];
          std::snprintf(buf, sizeof(buf), "\\\\u%04x", c);
          out += buf;
        } else {
          out.push_back(static_cast<char>(c));
        }
    }
  }
  out.push_back('"');
  return out;
}

struct HeapBuilder {
  std::vector<std::pair<std::string, std::string>> objects;
  std::unordered_map<const void*, std::string> ptrIds;
  int nextId = 1;

  std::string allocId() { return "h" + std::to_string(nextId++); }
};

template <typename T>
std::string encodeVal(const T& val, HeapBuilder& hb, int depth = 0);

template <typename T>
std::string encodePrimNum(const std::string& k, const std::string& r, const std::string& numStr) {
  return "{\\"t\\":\\"p\\",\\"k\\":" + jsonEscape(k) + ",\\"r\\":" + jsonEscape(r) + ",\\"n\\":" + numStr + "}";
}

inline std::string encodePrim(const std::string& k, const std::string& r) {
  return "{\\"t\\":\\"p\\",\\"k\\":" + jsonEscape(k) + ",\\"r\\":" + jsonEscape(r) + "}";
}

template <typename T> struct is_std_vector : std::false_type {};
template <typename T, typename A> struct is_std_vector<std::vector<T, A>> : std::true_type {};

template <typename T> struct is_std_deque : std::false_type {};
template <typename T, typename A> struct is_std_deque<std::deque<T, A>> : std::true_type {};

template <typename T> struct is_std_array : std::false_type {};
template <typename T, size_t N> struct is_std_array<std::array<T, N>> : std::true_type {};

template <typename T> struct is_std_stack : std::false_type {};
template <typename T, typename C> struct is_std_stack<std::stack<T, C>> : std::true_type {};

template <typename T> struct is_std_queue : std::false_type {};
template <typename T, typename C> struct is_std_queue<std::queue<T, C>> : std::true_type {};

template <typename T> struct is_std_pq : std::false_type {};
template <typename T, typename C, typename Cmp> struct is_std_pq<std::priority_queue<T, C, Cmp>> : std::true_type {};

template <typename T> struct is_std_map : std::false_type {};
template <typename K, typename V, typename C, typename A> struct is_std_map<std::map<K, V, C, A>> : std::true_type {};
template <typename K, typename V, typename H, typename E, typename A> struct is_std_map<std::unordered_map<K, V, H, E, A>> : std::true_type {};

template <typename T> struct is_std_set : std::false_type {};
template <typename K, typename C, typename A> struct is_std_set<std::set<K, C, A>> : std::true_type {};
template <typename K, typename H, typename E, typename A> struct is_std_set<std::unordered_set<K, H, E, A>> : std::true_type {};

template <typename T> struct is_std_pair : std::false_type {};
template <typename A, typename B> struct is_std_pair<std::pair<A, B>> : std::true_type {};

template <typename P>
concept HasListNodeFields = std::is_pointer_v<P> && requires(P p) {
  p->next;
} && (requires(P p) { p->val; } || requires(P p) { p->value; } || requires(P p) { p->data; });

template <typename P>
concept HasTreeNodeFields = std::is_pointer_v<P> && requires(P p) {
  p->left;
  p->right;
} && (requires(P p) { p->val; } || requires(P p) { p->value; } || requires(P p) { p->data; });

template <typename P>
std::string extractNodeVal(P p, HeapBuilder& hb, int depth) {
  if constexpr (requires { p->val; }) return encodeVal(p->val, hb, depth + 1);
  else if constexpr (requires { p->value; }) return encodeVal(p->value, hb, depth + 1);
  else if constexpr (requires { p->data; }) return encodeVal(p->data, hb, depth + 1);
  else return encodePrim("none", "?");
}

template <typename T>
std::string encodeVal(const T& rawVal, HeapBuilder& hb, int depth) {
  using D = std::decay_t<T>;
  if (depth > 24) return encodePrim("str", "...");

  if constexpr (std::is_same_v<D, bool>) {
    return encodePrim("bool", rawVal ? "true" : "false");
  } else if constexpr (std::is_same_v<D, char>) {
    return encodePrim("str", std::string("'") + rawVal + "'");
  } else if constexpr (std::is_integral_v<D>) {
    std::string s = std::to_string(rawVal);
    return encodePrimNum<D>("int", s, s);
  } else if constexpr (std::is_floating_point_v<D>) {
    std::ostringstream oss;
    oss << rawVal;
    std::string s = oss.str();
    if (s == "nan" || s == "inf" || s == "-inf" || s == "NaN") return encodePrim("float", s);
    return encodePrimNum<D>("float", s, s);
  } else if constexpr (std::is_same_v<D, std::string>) {
    return encodePrim("str", rawVal);
  } else if constexpr (std::is_same_v<D, const char*> || std::is_same_v<D, char*>) {
    return rawVal ? encodePrim("str", std::string(rawVal)) : encodePrim("none", "nullptr");
  } else if constexpr (std::is_null_pointer_v<D>) {
    return encodePrim("none", "nullptr");
  } else if constexpr (HasTreeNodeFields<D>) {
    if (rawVal == nullptr) return encodePrim("none", "nullptr");
    auto it = hb.ptrIds.find(static_cast<const void*>(rawVal));
    if (it != hb.ptrIds.end()) return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(it->second) + "}";
    std::string id = hb.allocId();
    hb.ptrIds[static_cast<const void*>(rawVal)] = id;
    std::string v = extractNodeVal(rawVal, hb, depth);
    std::string l = encodeVal(rawVal->left, hb, depth + 1);
    std::string r = encodeVal(rawVal->right, hb, depth + 1);
    hb.objects.push_back({id, "{\\"kind\\":\\"object\\",\\"cls\\":\\"TreeNode\\",\\"fields\\":[[\\"val\\"," + v + "],[\\"left\\"," + l + "],[\\"right\\"," + r + "]]}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (HasListNodeFields<D>) {
    if (rawVal == nullptr) return encodePrim("none", "nullptr");
    auto it = hb.ptrIds.find(static_cast<const void*>(rawVal));
    if (it != hb.ptrIds.end()) return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(it->second) + "}";
    std::string id = hb.allocId();
    hb.ptrIds[static_cast<const void*>(rawVal)] = id;
    std::string v = extractNodeVal(rawVal, hb, depth);
    std::string nx = encodeVal(rawVal->next, hb, depth + 1);
    hb.objects.push_back({id, "{\\"kind\\":\\"object\\",\\"cls\\":\\"ListNode\\",\\"fields\\":[[\\"val\\"," + v + "],[\\"next\\"," + nx + "]]}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_vector<D>::value || is_std_deque<D>::value || is_std_array<D>::value) {
    std::string id = hb.allocId();
    std::string itemsJson = "[";
    size_t count = 0;
    for (const auto& item : rawVal) {
      if (count > 0) itemsJson += ",";
      if (count >= 40) { itemsJson += encodePrim("str", "..."); count++; break; }
      itemsJson += encodeVal(item, hb, depth + 1);
      count++;
    }
    itemsJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"list\\",\\"items\\":" + itemsJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_stack<D>::value) {
    std::string id = hb.allocId();
    auto copy = rawVal;
    std::vector<typename D::value_type> rev;
    while (!copy.empty() && rev.size() < 40) { rev.push_back(copy.top()); copy.pop(); }
    std::string itemsJson = "[";
    for (size_t i = rev.size(); i > 0; --i) {
      if (i < rev.size()) itemsJson += ",";
      itemsJson += encodeVal(rev[i - 1], hb, depth + 1);
    }
    itemsJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"deque\\",\\"items\\":" + itemsJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_queue<D>::value) {
    std::string id = hb.allocId();
    auto copy = rawVal;
    std::string itemsJson = "[";
    size_t count = 0;
    while (!copy.empty() && count < 40) {
      if (count > 0) itemsJson += ",";
      itemsJson += encodeVal(copy.front(), hb, depth + 1);
      copy.pop();
      count++;
    }
    itemsJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"deque\\",\\"items\\":" + itemsJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_pq<D>::value) {
    std::string id = hb.allocId();
    auto copy = rawVal;
    std::string itemsJson = "[";
    size_t count = 0;
    while (!copy.empty() && count < 40) {
      if (count > 0) itemsJson += ",";
      itemsJson += encodeVal(copy.top(), hb, depth + 1);
      copy.pop();
      count++;
    }
    itemsJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"deque\\",\\"items\\":" + itemsJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_map<D>::value) {
    std::string id = hb.allocId();
    std::string entriesJson = "[";
    size_t count = 0;
    for (const auto& kv : rawVal) {
      if (count > 0) entriesJson += ",";
      if (count >= 30) break;
      entriesJson += "[" + encodeVal(kv.first, hb, depth + 1) + "," + encodeVal(kv.second, hb, depth + 1) + "]";
      count++;
    }
    entriesJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"dict\\",\\"entries\\":" + entriesJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_set<D>::value) {
    std::string id = hb.allocId();
    std::string itemsJson = "[";
    size_t count = 0;
    for (const auto& item : rawVal) {
      if (count > 0) itemsJson += ",";
      if (count >= 40) break;
      itemsJson += encodeVal(item, hb, depth + 1);
      count++;
    }
    itemsJson += "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"set\\",\\"items\\":" + itemsJson + ",\\"len\\":" + std::to_string(rawVal.size()) + "}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else if constexpr (is_std_pair<D>::value) {
    std::string id = hb.allocId();
    std::string itemsJson = "[" + encodeVal(rawVal.first, hb, depth + 1) + "," + encodeVal(rawVal.second, hb, depth + 1) + "]";
    hb.objects.push_back({id, "{\\"kind\\":\\"list\\",\\"items\\":" + itemsJson + ",\\"len\\":2}"});
    return "{\\"t\\":\\"r\\",\\"id\\":" + jsonEscape(id) + "}";
  } else {
    return encodePrim("object", "<value>");
  }
}

inline void collectPairs(std::vector<std::pair<std::string, std::string>>&, HeapBuilder&) {}

template <typename V, typename... Rest>
inline void collectPairs(
  std::vector<std::pair<std::string, std::string>>& out,
  HeapBuilder& hb,
  const char* name,
  const V& val,
  Rest&&... rest
) {
  out.push_back({std::string(name), encodeVal(val, hb, 0)});
  collectPairs(out, hb, std::forward<Rest>(rest)...);
}

template <typename... Args>
inline void step(int line, Args&&... args) {
  Runtime& r = rt();
  if (r.stepJsons.size() >= Runtime::MAX_STEPS) {
    r.truncated = true;
    return;
  }
  HeapBuilder hb;
  std::vector<std::pair<std::string, std::string>> currentVars;
  collectPairs(currentVars, hb, std::forward<Args>(args)...);
  if (!r.frames.empty()) {
    r.frames.back().line = line;
    r.frames.back().vars = currentVars;
  }

  std::string stackJson = "[";
  for (size_t fi = 0; fi < r.frames.size(); ++fi) {
    if (fi > 0) stackJson += ",";
    const auto& fr = r.frames[fi];
    stackJson += "{\\"name\\":" + jsonEscape(fr.name) + ",\\"line\\":" + std::to_string(fr.line) + ",\\"vars\\":[";
    for (size_t vi = 0; vi < fr.vars.size(); ++vi) {
      if (vi > 0) stackJson += ",";
      stackJson += "[" + jsonEscape(fr.vars[vi].first) + "," + fr.vars[vi].second + "]";
    }
    stackJson += "]}";
  }
  stackJson += "]";

  std::string heapJson = "{";
  for (size_t hi = 0; hi < hb.objects.size(); ++hi) {
    if (hi > 0) heapJson += ",";
    heapJson += jsonEscape(hb.objects[hi].first) + ":" + hb.objects[hi].second;
  }
  heapJson += "}";

  r.stepJsons.push_back(
    "{\\"line\\":" + std::to_string(line) +
    ",\\"event\\":\\"line\\",\\"stack\\":" + stackJson +
    ",\\"heap\\":" + heapJson +
    ",\\"stdout\\":" + jsonEscape(r.tee.captured) + "}"
  );
}

struct FrameGuard {
  template <typename... Args>
  FrameGuard(const char* fnName, int line, Args&&... args) {
    Runtime& r = rt();
    FrameInfo info;
    info.name = fnName ? fnName : "fn";
    info.line = line;
    HeapBuilder hb;
    collectPairs(info.vars, hb, std::forward<Args>(args)...);
    r.frames.push_back(std::move(info));
  }
  ~FrameGuard() {
    Runtime& r = rt();
    if (!r.frames.empty()) r.frames.pop_back();
  }
};

} // namespace __spura
`;

export function instrumentCppForTrace(sourceCode: string): string {
  const instrumentedBody = instrumentCFamilySource(sourceCode, "cpp", {
    onEnterFunction: (fnName, line, params) => {
      const safeName = JSON.stringify(fnName);
      const args = params.flatMap((p) => [JSON.stringify(p), p]).join(", ");
      const sep = args ? `, ${args}` : "";
      return ` __spura::FrameGuard __spura_fg(${safeName}, ${line}${sep}); __spura::step(${line}${sep});`;
    },
    onStep: (line, vars) => {
      const args = vars.flatMap((v) => [JSON.stringify(v), v]).join(", ");
      const sep = args ? `, ${args}` : "";
      return ` __spura::step(${line}${sep});`;
    },
  });

  return `${CPP_TRACE_RUNTIME}\n#line 1 "user.cpp"\n${instrumentedBody}\n`;
}

export function extractSpuraTraceFromStderr(stderr: string): {
  steps: TraceStep[];
  truncated: boolean;
  cleanStderr: string;
} {
  const startIdx = stderr.indexOf(TRACE_START);
  const endIdx = stderr.indexOf(TRACE_END);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    return { steps: [], truncated: false, cleanStderr: stderr };
  }

  const jsonBody = stderr.slice(startIdx + TRACE_START.length, endIdx).trim();
  const cleanStderr = (stderr.slice(0, startIdx) + stderr.slice(endIdx + TRACE_END.length)).trim();
  try {
    const parsed = JSON.parse(jsonBody) as { steps?: TraceStep[]; truncated?: boolean };
    return {
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      truncated: Boolean(parsed.truncated),
      cleanStderr,
    };
  } catch {
    return { steps: [], truncated: false, cleanStderr };
  }
}
