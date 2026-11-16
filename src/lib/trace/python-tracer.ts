/**
 * Python source executed inside Pyodide. Defines `_el_run(code, stdin, trace)`,
 * which returns a JSON string matching `TraceResult` (see ./types.ts).
 *
 * Tracing uses sys.settrace and records one step per executed line / return /
 * exception in user code. Every step carries the full call stack and a heap
 * snapshot keyed by id(obj), so lists, dicts and user objects (ListNode,
 * TreeNode, ...) can be drawn with arrows like Python Tutor.
 */
export const PYTHON_TRACER = String.raw`
import sys, io, json, types, builtins, traceback, collections

_EL_MAX_STEPS = 1500
_EL_MAX_ITEMS = 64
_EL_FILE = "<solution>"


class _ElStepLimit(BaseException):
    pass


def _el_run(code, stdin_text, trace):
    steps = []
    out = io.StringIO()
    inp = io.StringIO(stdin_text)
    old_out, old_err, old_in = sys.stdout, sys.stderr, sys.stdin
    truncated = False
    error = None

    def _input(prompt=""):
        if prompt:
            out.write(str(prompt))
        line = inp.readline()
        if line == "":
            raise EOFError("EOF when reading a line")
        return line.rstrip("\n")

    user_globals = {"__name__": "__main__", "__builtins__": builtins, "input": _input}
    hidden = {"input"}

    def prim(value):
        r = {"t": "p", "r": repr(value), "k": type(value).__name__}
        if isinstance(value, int) and not isinstance(value, bool):
            r["n"] = value
        return r

    def enc(value, heap, depth):
        if value is None or isinstance(value, (bool, int, float, complex)):
            return prim(value)
        if isinstance(value, str):
            text = repr(value) if len(value) <= 120 else repr(value[:120]) + "…"
            return {"t": "p", "r": text, "k": "str"}
        if isinstance(value, (types.FunctionType, types.BuiltinFunctionType, types.MethodType)):
            return {"t": "p", "r": "function " + getattr(value, "__name__", "?"), "k": "function"}
        if isinstance(value, type):
            return {"t": "p", "r": "class " + value.__name__, "k": "class"}
        if isinstance(value, types.ModuleType):
            return {"t": "p", "r": "module " + value.__name__, "k": "module"}

        oid = str(id(value))
        if oid in heap:
            return {"t": "r", "id": oid}
        if depth > 40:
            return {"t": "p", "r": "…", "k": "deep"}
        heap[oid] = None  # placeholder so cycles become references

        if isinstance(value, (list, tuple, set, frozenset, collections.deque)):
            items = list(value)
            if isinstance(value, (set, frozenset)):
                try:
                    items = sorted(items)
                except Exception:
                    pass
            if isinstance(value, collections.deque):
                kind = "deque"
            elif isinstance(value, tuple):
                kind = "tuple"
            elif isinstance(value, frozenset):
                kind = "frozenset"
            elif isinstance(value, set):
                kind = "set"
            else:
                kind = "list"
            heap[oid] = {
                "kind": kind,
                "items": [enc(x, heap, depth + 1) for x in items[:_EL_MAX_ITEMS]],
                "len": len(items),
            }
        elif isinstance(value, dict):
            entries = list(value.items())[:_EL_MAX_ITEMS]
            obj = {
                "kind": "dict",
                "entries": [[enc(k, heap, depth + 1), enc(v, heap, depth + 1)] for k, v in entries],
                "len": len(value),
            }
            if type(value) is not dict:
                obj["cls"] = type(value).__name__
            heap[oid] = obj
        else:
            fields = []
            attrs = getattr(value, "__dict__", None)
            if isinstance(attrs, dict):
                for k, v in list(attrs.items())[:_EL_MAX_ITEMS]:
                    if not k.startswith("__"):
                        fields.append([k, enc(v, heap, depth + 1)])
            for slot in getattr(type(value), "__slots__", ()) or ():
                if isinstance(slot, str) and hasattr(value, slot):
                    fields.append([slot, enc(getattr(value, slot), heap, depth + 1)])
            if fields or isinstance(attrs, dict):
                heap[oid] = {"kind": "object", "cls": type(value).__name__, "fields": fields}
            else:
                del heap[oid]
                text = repr(value)
                return {"t": "p", "r": text if len(text) <= 120 else text[:120] + "…", "k": type(value).__name__}
        return {"t": "r", "id": oid}

    def snapshot(frame, event, arg):
        frames = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == _EL_FILE:
                frames.append(f)
            f = f.f_back
        frames.reverse()
        heap = {}
        stack = []
        for fr in frames:
            is_global = fr.f_code.co_name == "<module>"
            source = fr.f_globals if is_global else fr.f_locals
            variables = []
            for name, value in list(source.items()):
                if name.startswith("__") or (is_global and name in hidden):
                    continue
                if isinstance(value, types.ModuleType):
                    continue
                variables.append([name, enc(value, heap, 0)])
            entry = {"name": "Global frame" if is_global else fr.f_code.co_name, "line": fr.f_lineno, "vars": variables}
            if fr is frame and event == "return" and not is_global:
                entry["ret"] = enc(arg, heap, 0)
            stack.append(entry)
        step = {"line": frame.f_lineno, "event": event, "stack": stack, "heap": heap, "stdout": out.getvalue()}
        if event == "exception":
            step["error"] = arg[0].__name__ + ": " + str(arg[1])
        return step

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != _EL_FILE:
            return None
        if event == "call":
            return tracer
        if event == "return" and frame.f_code.co_name == "<module>":
            return tracer
        if event in ("line", "return", "exception"):
            if len(steps) >= _EL_MAX_STEPS:
                raise _ElStepLimit()
            steps.append(snapshot(frame, event, arg))
        return tracer

    sys.stdout, sys.stderr, sys.stdin = out, out, inp
    try:
        compiled = compile(code, _EL_FILE, "exec")
        if trace:
            sys.settrace(tracer)
        try:
            exec(compiled, user_globals)
        finally:
            sys.settrace(None)
    except _ElStepLimit:
        truncated = True
    except SyntaxError as e:
        error = {"message": "SyntaxError: " + str(e.msg), "line": e.lineno}
    except BaseException as e:
        line = None
        tb = e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == _EL_FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(e, RecursionError):
            message = "RecursionError: maximum recursion depth exceeded"
        else:
            message = "".join(traceback.format_exception_only(type(e), e)).strip()
        error = {"message": message, "line": line}
    finally:
        sys.stdout, sys.stderr, sys.stdin = old_out, old_err, old_in

    return json.dumps({"steps": steps, "stdout": out.getvalue(), "error": error, "truncated": truncated})
`;
