import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const SQL_FUNCTIONS = new Set(["query", "execute", "raw", "sql", "exec"]);

export function isSqlFunction(functionName: string): boolean {
  return SQL_FUNCTIONS.has(functionName.toLowerCase());
}

export function hasStringConcatenation(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some(
    (arg) =>
      arg.type === AST_NODE_TYPES.BinaryExpression &&
      arg.operator === "+" &&
      (arg.left.type === AST_NODE_TYPES.Literal ||
        arg.right.type === AST_NODE_TYPES.Literal)
  );
}

export const CONSOLE_METHODS = new Set([
  "log",
  "info",
  "warn",
  "error",
  "debug",
]);

export function isLoggingFunction(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const object = node.callee.object;
  const property = node.callee.property;
  return (
    object.type === AST_NODE_TYPES.Identifier &&
    object.name === "console" &&
    property.type === AST_NODE_TYPES.Identifier &&
    CONSOLE_METHODS.has(property.name)
  );
}
