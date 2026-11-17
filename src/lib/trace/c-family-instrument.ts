/**
 * Shared C++ and Java source-level statement & scope instrumentor.
 * Produces clean source text insertions only — never breaks string literals,
 * comments, preprocessor directives, brace initializers (`= {1, 2, 3}`),
 * or single-statement control branches.
 */

export type CFamilyLanguage = "cpp" | "java";

export interface Token {
  type: "ws" | "comment" | "preproc" | "string" | "char" | "word" | "number" | "punct";
  text: string;
  start: number;
  end: number;
  line: number; // 1-based line of token start
}

export interface InstrumentHooks {
  onEnterFunction: (fnName: string, line: number, params: string[]) => string;
  onExitFunction?: (fnName: string) => string;
  onStep: (line: number, vars: string[]) => string;
}

const NON_DECL_KEYWORDS = new Set([
  "return", "break", "continue", "throw", "goto", "delete", "new", "sizeof", "alignof",
  "decltype", "typedef", "using", "namespace", "cout", "cin", "cerr", "endl", "printf",
  "if", "else", "for", "while", "do", "switch", "case", "default", "try", "catch", "finally",
  "public", "private", "protected", "class", "struct", "enum", "interface", "import", "package",
  "true", "false", "null", "nullptr", "this", "super", "throws", "assert", "static_assert",
]);

const MODIFIER_WORDS = new Set([
  "const", "constexpr", "volatile", "mutable", "static", "inline", "register", "extern",
  "final", "transient", "unsigned", "signed", "long", "short", "virtual", "override",
]);

const PRIMITIVE_OR_CONTAINER_STARTERS = new Set([
  "int", "long", "short", "char", "bool", "boolean", "byte", "float", "double", "void",
  "auto", "var", "size_t", "ssize_t", "uint", "int8_t", "int16_t", "int32_t", "int64_t",
  "uint8_t", "uint16_t", "uint32_t", "uint64_t", "string", "String", "StringBuilder",
  "vector", "deque", "stack", "queue", "priority_queue", "map", "unordered_map",
  "set", "unordered_set", "pair", "array", "list", "List", "ArrayList", "LinkedList",
  "Stack", "Queue", "Deque", "ArrayDeque", "PriorityQueue", "Map", "HashMap", "TreeMap",
  "LinkedHashMap", "Set", "HashSet", "TreeSet", "LinkedHashSet", "Integer", "Long",
  "Double", "Boolean", "Character", "Object", "ListNode", "TreeNode", "Node",
]);

export function tokenizeCFamily(src: string, lang: CFamilyLanguage): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;

  const advanceLine = (s: string) => {
    for (let k = 0; k < s.length; k++) if (s[k] === "\n") line++;
  };

  while (i < n) {
    const ch = src[i];

    // Whitespace
    if (/\s/.test(ch)) {
      const start = i;
      const startLine = line;
      while (i < n && /\s/.test(src[i])) {
        if (src[i] === "\n") line++;
        i++;
      }
      tokens.push({ type: "ws", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Preprocessor directive in C++ (# at line start / after ws)
    if (lang === "cpp" && ch === "#") {
      const start = i;
      const startLine = line;
      while (i < n) {
        if (src[i] === "\\" && src[i + 1] === "\n") {
          line++;
          i += 2;
        } else if (src[i] === "\n") {
          break;
        } else {
          i++;
        }
      }
      tokens.push({ type: "preproc", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Line comment //
    if (ch === "/" && src[i + 1] === "/") {
      const start = i;
      const startLine = line;
      while (i < n && src[i] !== "\n") i++;
      tokens.push({ type: "comment", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Block comment /* ... */
    if (ch === "/" && src[i + 1] === "*") {
      const start = i;
      const startLine = line;
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line++;
        i++;
      }
      if (i < n) i += 2;
      tokens.push({ type: "comment", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // C++ Raw String Literal R"delim(...)delim"
    if (lang === "cpp" && ch === "R" && src[i + 1] === '"') {
      const start = i;
      const startLine = line;
      i += 2;
      let delim = "";
      while (i < n && src[i] !== "(" && src[i] !== "\n") {
        delim += src[i++];
      }
      if (src[i] === "(") {
        i++;
        const endSeq = `)${delim}"`;
        const idx = src.indexOf(endSeq, i);
        const endPos = idx >= 0 ? idx + endSeq.length : n;
        advanceLine(src.slice(i, endPos));
        i = endPos;
        tokens.push({ type: "string", text: src.slice(start, i), start, end: i, line: startLine });
        continue;
      }
      i = start + 1;
    }

    // String literal "..." (and Java text blocks """...""")
    if (ch === '"') {
      const start = i;
      const startLine = line;
      if (lang === "java" && src.slice(i, i + 3) === '"""') {
        i += 3;
        while (i < n && src.slice(i, i + 3) !== '"""') {
          if (src[i] === "\n") line++;
          i++;
        }
        if (i < n) i += 3;
      } else {
        i++;
        while (i < n && src[i] !== '"') {
          if (src[i] === "\\") {
            if (src[i + 1] === "\n") line++;
            i += 2;
          } else {
            if (src[i] === "\n") line++;
            i++;
          }
        }
        if (i < n) i++;
      }
      tokens.push({ type: "string", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Char literal '...'
    if (ch === "'") {
      const start = i;
      const startLine = line;
      i++;
      while (i < n && src[i] !== "'") {
        if (src[i] === "\\") i += 2;
        else {
          if (src[i] === "\n") line++;
          i++;
        }
      }
      if (i < n) i++;
      tokens.push({ type: "char", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Word / identifier
    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      const startLine = line;
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
      tokens.push({ type: "word", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch)) {
      const start = i;
      const startLine = line;
      while (i < n && /[0-9A-Za-z_.'xXbB]/.test(src[i])) i++;
      tokens.push({ type: "number", text: src.slice(start, i), start, end: i, line: startLine });
      continue;
    }

    // Single punctuation
    tokens.push({ type: "punct", text: ch, start: i, end: i + 1, line });
    i++;
  }

  return tokens;
}

type CodeTokens = Token[];

function filterSignificant(tokens: Token[]): CodeTokens {
  return tokens.filter((t) => t.type !== "ws" && t.type !== "comment" && t.type !== "preproc");
}

function findMatching(sig: CodeTokens, openIdx: number, openChar: string, closeChar: string): number {
  let depth = 0;
  for (let i = openIdx; i < sig.length; i++) {
    if (sig[i].text === openChar) depth++;
    else if (sig[i].text === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Skip template `< ... >` if balanced at `<` */
function skipAngleBrackets(sig: CodeTokens, idx: number): number {
  if (sig[idx]?.text !== "<") return idx;
  let depth = 0;
  for (let i = idx; i < sig.length && i < idx + 60; i++) {
    const t = sig[i].text;
    if (t === "<") depth++;
    else if (t === ">") {
      depth--;
      if (depth === 0) return i + 1;
    } else if (t === ";" || t === "{" || t === "}") {
      return idx;
    }
  }
  return idx;
}

interface ParsedDecl {
  name: string;
  initialized: boolean;
}

const CPP_DEFAULT_CONSTRUCTED_CONTAINERS = new Set([
  "string", "vector", "deque", "stack", "queue", "priority_queue",
  "map", "unordered_map", "set", "unordered_set", "pair", "array", "list",
]);

/**
 * Extracts declared variable names & initialization status from a simple statement
 * or for-loop init clause (`sig[start..end)` excluding trailing `;`).
 */
function parseDeclarations(sig: CodeTokens, start: number, end: number, lang: CFamilyLanguage): ParsedDecl[] {
  if (start >= end) return [];
  const first = sig[start];
  if (!first || first.type !== "word" || NON_DECL_KEYWORDS.has(first.text)) return [];

  let i = start;
  while (i < end && sig[i].type === "word" && MODIFIER_WORDS.has(sig[i].text)) {
    i++;
  }
  if (i >= end || sig[i].type !== "word" || NON_DECL_KEYWORDS.has(sig[i].text)) return [];

  // Consume base type (e.g. `std::vector<int>`, `unsigned long long`, `Map<Integer, Integer>`, `ListNode`)
  let typeTokensCount = 0;
  let baseTypeWord = "";
  while (i < end) {
    const cur = sig[i];
    if (cur.type === "word" && (MODIFIER_WORDS.has(cur.text) || cur.text === "struct" || cur.text === "class" || cur.text === "typename")) {
      i++;
      continue;
    }
    if (cur.type === "word") {
      typeTokensCount++;
      baseTypeWord = cur.text;
      i++;
      // namespace `::` or `.`
      if (sig[i]?.text === ":" && sig[i + 1]?.text === ":") {
        i += 2;
        continue;
      }
      if (sig[i]?.text === "." && sig[i + 1]?.type === "word") {
        // Only continue dotted type if it looks like a type package prefix (`java.util.List`)
        if (/^[a-z]/.test(cur.text) && !PRIMITIVE_OR_CONTAINER_STARTERS.has(cur.text)) {
          i++;
          continue;
        }
      }
      if (sig[i]?.text === "<") {
        const afterAngle = skipAngleBrackets(sig, i);
        if (afterAngle > i) i = afterAngle;
      }
      // Look ahead: if next token is also `word` or pointer/ref before `word` or `[]` before `word`, wait
      if (sig[i]?.text === "[" && sig[i + 1]?.text === "]") {
        while (i + 1 < end && sig[i]?.text === "[" && sig[i + 1]?.text === "]") i += 2;
      }
      break;
    }
    return [];
  }

  // C++ `long long x` / `unsigned int x`: allow multiple primitive type keywords in a row
  while (i < end && sig[i].type === "word" && sig[i + 1]?.type === "word" && MODIFIER_WORDS.has(sig[i - 1]?.text ?? "")) {
    i++;
  }
  if (typeTokensCount === 0) return [];

  // Skip pointer / ref qualifiers after type: `*`, `&`, `&&`
  while (i < end && (sig[i].text === "*" || sig[i].text === "&")) i++;

  // Heuristic check: next must be identifier (or structured binding `[k, v]`)
  if (sig[i]?.text === "[" && sig[i + 1]?.type === "word") {
    // C++ structured binding `auto [a, b] = ...`
    const closeBracket = findMatching(sig, i, "[", "]");
    if (closeBracket > i && closeBracket < end) {
      const names: ParsedDecl[] = [];
      for (let k = i + 1; k < closeBracket; k++) {
        if (sig[k].type === "word") names.push({ name: sig[k].text, initialized: true });
      }
      return names;
    }
  }

  const varTok = sig[i];
  if (!varTok || varTok.type !== "word" || NON_DECL_KEYWORDS.has(varTok.text)) return [];
  const afterVar = sig[i + 1]?.text;
  if (
    i + 1 < end &&
    afterVar !== "=" &&
    afterVar !== "," &&
    afterVar !== "[" &&
    afterVar !== "(" &&
    afterVar !== "{" &&
    afterVar !== ":" &&
    afterVar !== ";"
  ) {
    // Likely an assignment/expression like `seen[nums[i]] = i` or `foo.bar()`
    return [];
  }

  // If next is `(`, make sure it's not a function call like `solve()` at statement start (which wouldn't have TWO words before `(` unless `return foo()`)
  // Two words before `(` at block start e.g. `vector<int> res(n, 0)` IS a C++ ctor variable declaration!
  // Watch out for C++ `using Foo = ...` already filtered by NON_DECL_KEYWORDS.
  // Watch out for `case Foo:` or labels `loop:`: already filtered or check `:` only if `=` doesn't apply.
  if (i + 1 < end && afterVar === ":" && sig[i + 2]?.text === undefined) return [];

  const isCppDefaultContainer =
    lang === "cpp" &&
    CPP_DEFAULT_CONSTRUCTED_CONTAINERS.has(baseTypeWord) &&
    sig[i - 1]?.text !== "*";

  const result: ParsedDecl[] = [];
  let curIdx = i;
  while (curIdx < end) {
    let isPointer = false;
    while (curIdx < end && (sig[curIdx].text === "*" || sig[curIdx].text === "&")) {
      if (sig[curIdx].text === "*") isPointer = true;
      curIdx++;
    }
    const nameTok = sig[curIdx];
    if (!nameTok || nameTok.type !== "word" || NON_DECL_KEYWORDS.has(nameTok.text)) break;

    // Scan initializer / suffix until top-level `,` or end
    let pDepth = 0;
    let bDepth = 0;
    let brDepth = 0;
    let hasInit = isCppDefaultContainer && !isPointer;
    let scan = curIdx + 1;
    while (scan < end) {
      const t = sig[scan].text;
      if (t === "(") {
        if (pDepth === 0 && bDepth === 0 && brDepth === 0 && scan === curIdx + 1) hasInit = true; // C++ direct ctor `vector<int> v(n, 0)`
        pDepth++;
      } else if (t === ")") pDepth--;
      else if (t === "{") {
        if (pDepth === 0 && bDepth === 0 && brDepth === 0 && scan === curIdx + 1) hasInit = true; // C++ brace init `vector<int> v{1,2}`
        bDepth++;
      } else if (t === "}") bDepth--;
      else if (t === "[") brDepth++;
      else if (t === "]") brDepth--;
      else if (t === "=" && pDepth === 0 && bDepth === 0 && brDepth === 0) hasInit = true;
      else if (t === ":" && pDepth === 0 && bDepth === 0 && brDepth === 0) hasInit = true;
      else if (t === "," && pDepth === 0 && bDepth === 0 && brDepth === 0) {
        scan++;
        break;
      }
      scan++;
    }

    result.push({ name: nameTok.text, initialized: hasInit });
    curIdx = scan;
  }

  return result;
}

/**
 * Extracts parameter names from `sig[openParenIdx .. closeParenIdx]`
 */
function parseFunctionParams(sig: CodeTokens, openParenIdx: number, closeParenIdx: number): string[] {
  const params: string[] = [];
  if (closeParenIdx <= openParenIdx + 1) return params;

  let curStart = openParenIdx + 1;
  let angleDepth = 0;
  let parenDepth = 0;
  let braceDepth = 0;

  const extractLastIdentBeforeDefault = (from: number, to: number) => {
    // Stop at `=` default arg if any
    let limit = to;
    for (let k = from; k < to; k++) {
      if (sig[k].text === "=") {
        limit = k;
        break;
      }
    }
    // Strip trailing `[]`
    while (limit >= from + 2 && sig[limit - 1].text === "]" && sig[limit - 2].text === "[") {
      limit -= 2;
    }
    const candidate = sig[limit - 1];
    if (candidate && candidate.type === "word" && candidate.text !== "void" && !MODIFIER_WORDS.has(candidate.text)) {
      // Ensure there is at least one type token before candidate (`int x` -> length >= 2), except nothing needed else
      if (limit - 1 > from) {
        params.push(candidate.text);
      }
    }
  };

  for (let i = openParenIdx + 1; i < closeParenIdx; i++) {
    const t = sig[i].text;
    if (t === "<") angleDepth++;
    else if (t === ">" && angleDepth > 0) angleDepth--;
    else if (t === "(") parenDepth++;
    else if (t === ")") parenDepth--;
    else if (t === "{") braceDepth++;
    else if (t === "}") braceDepth--;
    else if (t === "," && angleDepth === 0 && parenDepth === 0 && braceDepth === 0) {
      extractLastIdentBeforeDefault(curStart, i);
      curStart = i + 1;
    }
  }
  extractLastIdentBeforeDefault(curStart, closeParenIdx);
  return params;
}

interface ScopeFrame {
  vars: string[]; // initialized variables declared in this block
}

export function instrumentCFamilySource(
  source: string,
  lang: CFamilyLanguage,
  hooks: InstrumentHooks
): string {
  const rawTokens = tokenizeCFamily(source, lang);
  const sig = filterSignificant(rawTokens);

  const edits: Array<{ pos: number; text: string; seq: number }> = [];
  let seq = 0;
  const insert = (pos: number, text: string) => {
    if (!text) return;
    edits.push({ pos, text, seq: seq++ });
  };

  const activeVars = (scopes: ScopeFrame[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of scopes) {
      for (const v of s.vars) {
        if (!seen.has(v)) {
          seen.add(v);
          out.push(v);
        }
      }
    }
    return out;
  };

  const trackSimpleStatement = (stmtStart: number, stmtEndExclSemi: number, scopes: ScopeFrame[]) => {
    const current = scopes[scopes.length - 1];
    if (!current) return;

    // 1. New declarations with initializers
    const decls = parseDeclarations(sig, stmtStart, stmtEndExclSemi, lang);
    if (decls.length > 0) {
      for (const d of decls) {
        if (d.initialized && !current.vars.includes(d.name)) {
          current.vars.push(d.name);
        }
      }
      return;
    }

    // 2. Assignment to an existing uninitialized or already tracked variable isn't needed for already tracked,
    //    unless user declared `int ans;` earlier without `=` — handle `ans = ...;` at top level
    if (
      sig[stmtStart]?.type === "word" &&
      sig[stmtStart + 1]?.text === "=" &&
      !NON_DECL_KEYWORDS.has(sig[stmtStart].text)
    ) {
      const name = sig[stmtStart].text;
      // Only add if NOT declared with a `=` yet and declared in function body? Wait: checking class fields vs local:
      // Safer NOT to add arbitrary globals, or only add names declared earlier in `allDeclaredInFn`!
      void name;
    }
  };

  /**
   * Instruments a function/block `{ ... }` starting at `openBraceIdx` and returns the matching `}`.
   */
  const instrumentBlock = (openBraceIdx: number, scopes: ScopeFrame[], isFnRoot: boolean): number => {
    const closeBraceIdx = findMatching(sig, openBraceIdx, "{", "}");
    if (closeBraceIdx < 0) return sig.length - 1;

    let i = openBraceIdx + 1;

    // Helper: instrument single statement or `{ ... }` block after `if (...)` / `else` / `for (...)` / `while (...)`
    const instrumentSubBody = (headerLine: number, extraVars: string[] = []): number => {
      if (i >= closeBraceIdx) return i;
      if (sig[i].text === "{") {
        const subScope: ScopeFrame = { vars: [...extraVars] };
        scopes.push(subScope);
        // Step right at block entry!
        insert(sig[i].end, hooks.onStep(headerLine, activeVars(scopes)));
        const subEnd = instrumentBlock(i, scopes, false);
        scopes.pop();
        return subEnd + 1;
      }

      // Single statement (wrap into `{ ... }`) unless it's `else if` (caller skips `else`)
      const stmtStart = i;
      // Find end of this single statement (handling nested `if`/`for`/`while`? Only wrap simple statements ending in `;`)
      const kw = sig[stmtStart]?.text;
      if (kw === "if" || kw === "for" || kw === "while") {
        // Rare nested unbraced control flow — advance past its `;` cleanly without corrupting syntax
        let pD = 0;
        let bD = 0;
        let k = stmtStart;
        while (k < closeBraceIdx) {
          if (sig[k].text === "(") pD++;
          else if (sig[k].text === ")") pD--;
          else if (sig[k].text === "{") bD++;
          else if (sig[k].text === "}") {
            bD--;
            if (bD === 0 && pD === 0) {
              k++;
              break;
            }
          } else if (sig[k].text === ";" && pD === 0 && bD === 0) {
            k++;
            break;
          }
          k++;
        }
        return k;
      }

      // Simple single statement ending at `;`
      let pD = 0;
      let bD = 0;
      let k = stmtStart;
      while (k < closeBraceIdx) {
        if (sig[k].text === "(") pD++;
        else if (sig[k].text === ")") pD--;
        else if (sig[k].text === "{") bD++;
        else if (sig[k].text === "}") bD--;
        else if (sig[k].text === ";" && pD === 0 && bD === 0) break;
        k++;
      }
      if (k < closeBraceIdx && sig[k].text === ";") {
        const subScope: ScopeFrame = { vars: [...extraVars] };
        scopes.push(subScope);
        const stmtLine = sig[stmtStart].line;
        const isJump = kw === "return" || kw === "break" || kw === "continue" || kw === "throw";
        insert(sig[stmtStart].start, "{ ");
        if (isJump) {
          insert(sig[stmtStart].start, hooks.onStep(stmtLine, activeVars(scopes)));
          insert(sig[k].end, " }");
        } else {
          trackSimpleStatement(stmtStart, k, scopes);
          insert(sig[k].end, `${hooks.onStep(stmtLine, activeVars(scopes))} }`);
        }
        scopes.pop();
        return k + 1;
      }
      return closeBraceIdx;
    };

    while (i < closeBraceIdx) {
      const tok = sig[i];

      // Nested standalone block `{ ... }`
      if (tok.text === "{") {
        scopes.push({ vars: [] });
        const endB = instrumentBlock(i, scopes, false);
        scopes.pop();
        i = endB + 1;
        continue;
      }

      // Skip empty `;`
      if (tok.text === ";") {
        i++;
        continue;
      }

      // `case X:` or `default:` inside switch
      if (tok.text === "case" || tok.text === "default") {
        while (i < closeBraceIdx && sig[i].text !== ":") i++;
        if (i < closeBraceIdx) i++;
        continue;
      }

      // `if (...)`
      if (tok.text === "if" && sig[i + 1]?.text === "(") {
        const closeP = findMatching(sig, i + 1, "(", ")");
        if (closeP > 0) {
          const line = tok.line;
          // Trace right before evaluating `if` condition too? Wait: tracing inside branch / after header shows line clearly!
          insert(tok.start, hooks.onStep(line, activeVars(scopes)));
          i = closeP + 1;
          i = instrumentSubBody(line);
          continue;
        }
      }

      // `else`
      if (tok.text === "else") {
        const line = tok.line;
        i++;
        if (sig[i]?.text === "if" && sig[i + 1]?.text === "(") {
          const closeP = findMatching(sig, i + 1, "(", ")");
          if (closeP > 0) {
            const ifLine = sig[i].line;
            i = closeP + 1;
            i = instrumentSubBody(ifLine);
            continue;
          }
        }
        i = instrumentSubBody(line);
        continue;
      }

      // `while (...)`
      if (tok.text === "while" && sig[i + 1]?.text === "(") {
        const closeP = findMatching(sig, i + 1, "(", ")");
        if (closeP > 0) {
          const line = tok.line;
          i = closeP + 1;
          i = instrumentSubBody(line);
          continue;
        }
      }

      // `for (...)`
      if (tok.text === "for" && sig[i + 1]?.text === "(") {
        const closeP = findMatching(sig, i + 1, "(", ")");
        if (closeP > 0) {
          const line = tok.line;
          // Extract loop header variable names (supports `for (int i = 0; ...)` and `for (int x : arr)`)
          let semiIdx = -1;
          let colonIdx = -1;
          let pD = 0;
          for (let k = i + 2; k < closeP; k++) {
            if (sig[k].text === "(") pD++;
            else if (sig[k].text === ")") pD--;
            else if (sig[k].text === ";" && pD === 0 && semiIdx < 0) semiIdx = k;
            else if (sig[k].text === ":" && sig[k + 1]?.text !== ":" && sig[k - 1]?.text !== ":" && pD === 0 && colonIdx < 0) {
              colonIdx = k;
            }
          }
          const headerEnd = colonIdx > 0 ? colonIdx : semiIdx > 0 ? semiIdx : closeP;
          const loopVars = parseDeclarations(sig, i + 2, headerEnd, lang)
            .filter((d) => d.initialized || colonIdx > 0)
            .map((d) => d.name);

          i = closeP + 1;
          i = instrumentSubBody(line, loopVars);
          continue;
        }
      }

      // `do { ... } while (...);`
      if (tok.text === "do" && sig[i + 1]?.text === "{") {
        const line = tok.line;
        scopes.push({ vars: [] });
        insert(sig[i + 1].end, hooks.onStep(line, activeVars(scopes)));
        const endDo = instrumentBlock(i + 1, scopes, false);
        scopes.pop();
        i = endDo + 1;
        if (sig[i]?.text === "while" && sig[i + 1]?.text === "(") {
          const closeP = findMatching(sig, i + 1, "(", ")");
          if (closeP > 0 && sig[closeP + 1]?.text === ";") {
            i = closeP + 2;
            continue;
          }
        }
        continue;
      }

      // `try` / `catch` / `finally`
      if ((tok.text === "try" || tok.text === "finally") && sig[i + 1]?.text === "{") {
        scopes.push({ vars: [] });
        const endB = instrumentBlock(i + 1, scopes, false);
        scopes.pop();
        i = endB + 1;
        continue;
      }
      if (tok.text === "catch" && sig[i + 1]?.text === "(") {
        const closeP = findMatching(sig, i + 1, "(", ")");
        if (closeP > 0 && sig[closeP + 1]?.text === "{") {
          const catchParams = parseFunctionParams(sig, i + 1, closeP);
          scopes.push({ vars: catchParams });
          const endB = instrumentBlock(closeP + 1, scopes, false);
          scopes.pop();
          i = endB + 1;
          continue;
        }
      }

      // Normal statement up to top-level `;` (skipping inner `{...}` initializers & `(...)` calls)
      const stmtStart = i;
      let pD = 0;
      let bD = 0;
      while (i < closeBraceIdx) {
        const t = sig[i].text;
        if (t === "(") pD++;
        else if (t === ")") pD--;
        else if (t === "{") bD++;
        else if (t === "}") {
          bD--;
          if (bD < 0) break;
        } else if (t === ";" && pD === 0 && bD === 0) {
          break;
        }
        i++;
      }

      if (i < closeBraceIdx && sig[i].text === ";") {
        const stmtLine = tok.line;
        const kw = tok.text;
        if (kw === "return" || kw === "break" || kw === "continue" || kw === "throw") {
          insert(tok.start, hooks.onStep(stmtLine, activeVars(scopes)));
        } else {
          trackSimpleStatement(stmtStart, i, scopes);
          if (kw !== "using" && kw !== "typedef") {
            insert(sig[i].end, hooks.onStep(stmtLine, activeVars(scopes)));
          }
        }
        i++;
      } else {
        i++;
      }
    }

    if (isFnRoot && closeBraceIdx < sig.length && hooks.onExitFunction) {
      // Nothing inserted unless caller wraps try/finally via onExitFunction — keep block clean; handled at fn root below
      void isFnRoot;
    }

    return closeBraceIdx;
  };

  /**
   * Walks class/namespace/global level to discover function & method definitions and instrument their bodies.
   */
  const walkDeclarations = (startIdx: number, endIdx: number) => {
    let i = startIdx;
    while (i < endIdx) {
      const tok = sig[i];

      // Class / struct / interface / namespace / enum container: step INSIDE its `{ ... }` to instrument methods!
      if (
        tok.type === "word" &&
        (tok.text === "class" || tok.text === "struct" || tok.text === "interface" || tok.text === "namespace")
      ) {
        // Scan forward to `{` before `;`
        let k = i + 1;
        while (k < endIdx && sig[k].text !== "{" && sig[k].text !== ";") k++;
        if (k < endIdx && sig[k].text === "{") {
          const endContainer = findMatching(sig, k, "{", "}");
          if (endContainer > k) {
            walkDeclarations(k + 1, endContainer);
            i = endContainer + 1;
            if (sig[i]?.text === ";") i++;
            continue;
          }
        }
        if (k < endIdx && sig[k].text === ";") {
          i = k + 1;
          continue;
        }
      }

      // Skip enum { ... }
      if (tok.type === "word" && tok.text === "enum") {
        let k = i + 1;
        while (k < endIdx && sig[k].text !== "{" && sig[k].text !== ";") k++;
        if (k < endIdx && sig[k].text === "{") {
          const endEnum = findMatching(sig, k, "{", "}");
          if (endEnum > k) {
            i = endEnum + 1;
            continue;
          }
        }
      }

      // Detect function/method definition: `[...type...] fnName ( params ) [const/noexcept/throws/member-init...] {`
      if (tok.type === "word" && sig[i + 1]?.text === "(" && !NON_DECL_KEYWORDS.has(tok.text)) {
        const fnName = tok.text;
        const fnLine = tok.line;
        const closeP = findMatching(sig, i + 1, "(", ")");
        if (closeP > 0) {
          // Scan trailing qualifiers (`const`, `noexcept`, `override`, `throws Foo, Bar`, C++ ctor `: a(x), b(y)`) until `{` or `;`
          let k = closeP + 1;
          let pD = 0;
          let seenAssign = false;
          while (k < endIdx) {
            const t = sig[k].text;
            if (t === "(") pD++;
            else if (t === ")") pD--;
            else if (t === "=" && pD === 0) seenAssign = true;
            else if ((t === "{" || t === ";") && pD === 0) break;
            k++;
          }
          if (k < endIdx && sig[k].text === "{" && !seenAssign) {
            const params = parseFunctionParams(sig, i + 1, closeP);
            const firstBodyTok = sig[k + 1]?.text;
            const startsWithCtorCall = firstBodyTok === "super" || firstBodyTok === "this";
            const enterText = hooks.onEnterFunction(fnName, fnLine, params);
            const wrapFinally = Boolean(hooks.onExitFunction && !startsWithCtorCall);
            insert(sig[k].end, wrapFinally ? `${enterText} try {` : enterText);
            const scopes: ScopeFrame[] = [{ vars: [...params] }, { vars: [] }];
            const endFn = instrumentBlock(k, scopes, true);
            if (wrapFinally && hooks.onExitFunction && endFn < sig.length && sig[endFn].text === "}") {
              insert(sig[endFn].start, ` } finally { ${hooks.onExitFunction(fnName)} } `);
            }
            i = endFn + 1;
            continue;
          }
        }
      }

      i++;
    }
  };

  walkDeclarations(0, sig.length);

  // Apply edits in descending position order (preserving sequence order at equal pos)
  edits.sort((a, b) => (b.pos !== a.pos ? b.pos - a.pos : b.seq - a.seq));
  let out = source;
  for (const e of edits) {
    out = out.slice(0, e.pos) + e.text + out.slice(e.pos);
  }
  return out;
}
