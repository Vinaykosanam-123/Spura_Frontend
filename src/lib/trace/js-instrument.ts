import { parse } from "acorn";

/**
 * Instruments JavaScript source so it reports every executed statement.
 *
 * Inserted runtime hooks (provided by the trace worker):
 *   __T(line, getLocals, getGlobals?)  before each statement
 *   __E(name, line) / __X()            on function entry / exit (try/finally)
 *   __R(line, value)                   wraps return values
 *   __v(getter)                        reads a variable, swallowing TDZ/ReferenceErrors
 *
 * Only text insertions are performed (never replacements), so nested edits
 * compose safely.
 */

type AnyNode = {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number } };
  name?: string;
  value?: unknown;
  directive?: string;
  params?: AnyNode[];
  id?: AnyNode | null;
  declarations?: Array<{ id: AnyNode }>;
  properties?: AnyNode[];
  elements?: Array<AnyNode | null>;
  argument?: AnyNode | null;
  left?: AnyNode;
  key?: AnyNode;
  property?: AnyNode;
  param?: AnyNode | null;
  body?: AnyNode | AnyNode[];
  consequent?: AnyNode | AnyNode[];
  alternate?: AnyNode | null;
  [key: string]: unknown;
};

type Scope = {
  node: AnyNode;
  names: Set<string>;
  isProgram: boolean;
  isMethod: boolean;
  parent: Scope | null;
};

type Insertion = { pos: number; text: string; close: boolean; depth: number; seq: number };

const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);
const LOOP_TYPES = new Set(["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"]);
const IDENT = /^[A-Za-z_$][\w$]*$/;

function isAstNode(item: unknown): item is AnyNode {
  return Boolean(
    item &&
      typeof item === "object" &&
      "type" in item &&
      typeof (item as { type?: unknown }).type === "string"
  );
}

function children(node: AnyNode): AnyNode[] {
  const out: AnyNode[] = [];
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "type") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) if (isAstNode(item)) out.push(item);
    } else if (isAstNode(value)) {
      out.push(value);
    }
  }
  return out;
}

function patternNames(pattern: AnyNode | null | undefined, into: Set<string>) {
  if (!pattern) return;
  switch (pattern.type) {
    case "Identifier":
      if (pattern.name) into.add(pattern.name);
      break;
    case "ObjectPattern":
      for (const prop of pattern.properties ?? []) {
        patternNames(prop.type === "RestElement" ? prop.argument : (prop.value as AnyNode | undefined), into);
      }
      break;
    case "ArrayPattern":
      for (const el of pattern.elements ?? []) patternNames(el, into);
      break;
    case "RestElement":
      patternNames(pattern.argument, into);
      break;
    case "AssignmentPattern":
      patternNames(pattern.left, into);
      break;
  }
}

/** Collect every binding declared directly in a function (not in nested functions). */
function collectScopeNames(fn: AnyNode, names: Set<string>) {
  if (fn.type !== "Program") for (const param of fn.params ?? []) patternNames(param, names);
  if (fn.type === "FunctionExpression" && fn.id?.name) names.add(fn.id.name);
  const visit = (node: AnyNode) => {
    for (const child of children(node)) {
      if (FUNCTION_TYPES.has(child.type)) {
        if (child.type === "FunctionDeclaration" && child.id?.name) names.add(child.id.name);
        continue;
      }
      if (child.type === "VariableDeclaration") {
        for (const d of child.declarations ?? []) patternNames(d.id, names);
      }
      if (child.type === "ClassDeclaration" && child.id?.name) names.add(child.id.name);
      if (child.type === "CatchClause" && child.param) patternNames(child.param, names);
      if (child.type === "ClassExpression" || child.type === "ClassDeclaration") {
        // Class bodies contain methods (functions) – handled by the FUNCTION_TYPES skip.
      }
      visit(child);
    }
  };
  if (fn.type === "Program") visit(fn);
  else if (fn.body && !Array.isArray(fn.body)) visit(fn.body);
}

function functionName(fn: AnyNode, parent: AnyNode | null): string {
  if (fn.id?.name) return fn.id.name;
  if (!parent) return "anonymous";
  if (parent.type === "VariableDeclarator" && parent.id?.type === "Identifier" && parent.id.name) {
    return parent.id.name;
  }
  if ((parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") && parent.key) {
    return parent.key.name ?? String(parent.key.value ?? "anonymous");
  }
  if (parent.type === "AssignmentExpression" && parent.left?.type === "Identifier" && parent.left.name) {
    return parent.left.name;
  }
  if (parent.type === "AssignmentExpression" && parent.left?.type === "MemberExpression" && parent.left.property?.name) {
    return parent.left.property.name;
  }
  return "anonymous";
}

export class InstrumentError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
  }
}

function rewriteModuleSyntax(src: string): string {
  return src
    .replace(
      /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?/gm,
      "const $1 = require($2);"
    )
    .replace(
      /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?/gm,
      "const $1 = require($2);"
    )
    .replace(
      /^\s*import\s+\{([^}\n]+)\}\s+from\s+(['"][^'"]+['"])\s*;?/gm,
      (_m, bindings: string, mod: string) =>
        `const {${bindings.replace(/\s+as\s+/g, ": ")}} = require(${mod});`
    );
}

export function instrumentJavaScript(rawSource: string): string {
  const source = rewriteModuleSyntax(rawSource);
  let program: AnyNode;
  try {
    program = parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
      preserveParens: true,
      allowReturnOutsideFunction: false,
      allowHashBang: true
    }) as unknown as AnyNode;
  } catch (error) {
    const err = error as { message: string; loc?: { line: number } };
    throw new InstrumentError(`SyntaxError: ${err.message.replace(/\s*\(\d+:\d+\)$/, "")}`, err.loc?.line);
  }

  const insertions: Insertion[] = [];
  let seq = 0;
  const insert = (pos: number, text: string, close: boolean, depth: number) => {
    insertions.push({ pos, text, close, depth, seq: seq++ });
  };

  const scopeFor = (node: AnyNode, parent: Scope | null, isMethod: boolean): Scope => {
    const names = new Set<string>();
    collectScopeNames(node, names);
    return { node, names, isProgram: node.type === "Program", isMethod, parent };
  };

  const programScope = scopeFor(program, null, false);

  const getterFor = (names: Iterable<string>, withThis: boolean) => {
    const parts: string[] = [];
    if (withThis) parts.push(`"this":__v(()=>this)`);
    for (const name of names) {
      if (!IDENT.test(name) || name.startsWith("__")) continue;
      parts.push(`${JSON.stringify(name)}:__v(()=>${name})`);
    }
    return `()=>({${parts.join(",")}})`;
  };

  const traceCall = (line: number, scope: Scope) => {
    if (scope.isProgram) return `__T(${line},${getterFor(scope.names, false)});`;
    // Globals not shadowed by any enclosing function scope can be refreshed from here too.
    const shadowed = new Set<string>();
    for (let s: Scope | null = scope; s && !s.isProgram; s = s.parent) for (const n of s.names) shadowed.add(n);
    const globals = [...programScope.names].filter((n) => !shadowed.has(n));
    return `__T(${line},${getterFor(scope.names, scope.isMethod)},${getterFor(globals, false)});`;
  };

  const lineOf = (node: AnyNode) => node.loc?.start.line ?? 0;

  const instrumentList = (list: AnyNode[], scope: Scope, depth: number) => {
    for (const statement of list) {
      if (statement.type === "FunctionDeclaration" || statement.type === "EmptyStatement") continue;
      // Skip directive prologues like "use strict".
      if (statement.type === "ExpressionStatement" && typeof statement.directive === "string") continue;
      insert(statement.start, traceCall(lineOf(statement), scope), false, depth);
    }
  };

  const wrapStatement = (statement: AnyNode, scope: Scope, depth: number) => {
    if (statement.type === "BlockStatement") return;
    insert(statement.start, `{${traceCall(lineOf(statement), scope)}`, false, depth);
    insert(statement.end, `}`, true, depth);
  };

  const visit = (node: AnyNode, parent: AnyNode | null, scope: Scope, depth: number) => {
    let currentScope = scope;

    if (FUNCTION_TYPES.has(node.type)) {
      const isMethod = parent?.type === "MethodDefinition" && node.type === "FunctionExpression";
      currentScope = scopeFor(node, scope, isMethod);
      const name = JSON.stringify(functionName(node, parent));
      const line = lineOf(node);
      if (node.body && !Array.isArray(node.body)) {
        if (node.body.type === "BlockStatement") {
          insert(node.body.start + 1, `__E(${name},${line});try{`, false, depth);
          insert(node.body.end - 1, `}finally{__X();}`, true, depth);
        } else {
          // Arrow function with an expression body.
          insert(node.body.start, `{__E(${name},${line});try{${traceCall(lineOf(node.body), currentScope)}return __R(${lineOf(node.body)},(`, false, depth);
          insert(node.body.end, `));}finally{__X();}}`, true, depth);
        }
      }
    }

    if (node.type === "Program" || node.type === "BlockStatement" || node.type === "StaticBlock") {
      if (Array.isArray(node.body)) instrumentList(node.body, currentScope, depth + 1);
    } else if (node.type === "SwitchCase") {
      if (Array.isArray(node.consequent)) instrumentList(node.consequent, currentScope, depth + 1);
    } else if (node.type === "IfStatement") {
      if (node.consequent && !Array.isArray(node.consequent)) wrapStatement(node.consequent, currentScope, depth + 1);
      if (node.alternate && node.alternate.type !== "IfStatement") wrapStatement(node.alternate, currentScope, depth + 1);
    } else if (LOOP_TYPES.has(node.type)) {
      if (node.body && !Array.isArray(node.body)) wrapStatement(node.body, currentScope, depth + 1);
    } else if (node.type === "ReturnStatement" && node.argument) {
      insert(node.argument.start, `__R(${lineOf(node)},(`, false, depth + 1);
      insert(node.argument.end, `))`, true, depth + 1);
    }

    for (const child of children(node)) visit(child, node, currentScope, depth + 2);
  };

  visit(program, null, programScope, 0);

  // Apply from the end of the file backwards. Insertions applied later at the
  // same position land *before* earlier ones, so the application order is the
  // reverse of the desired text order. Desired text order at one position:
  // closing text first (innermost first), then opening text (outermost first).
  insertions.sort((a, b) => {
    if (a.pos !== b.pos) return b.pos - a.pos;
    if (a.close !== b.close) return a.close ? 1 : -1;
    if (a.close) return a.depth - b.depth || a.seq - b.seq;
    return b.depth - a.depth || b.seq - a.seq;
  });

  let output = source;
  for (const ins of insertions) {
    output = output.slice(0, ins.pos) + ins.text + output.slice(ins.pos);
  }
  return output;
}
