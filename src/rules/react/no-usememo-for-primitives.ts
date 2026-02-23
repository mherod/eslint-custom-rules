import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-usememo-for-primitives";

type MessageIds = "noUseMemoForPrimitive";
type Options = [];

/**
 * Checks if a node statically produces a primitive value.
 * Uses a conservative set of node types where the result is always a primitive.
 */
function producesPrimitiveValue(node: TSESTree.Node): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.Literal:
      // string, number, boolean, null — always primitive
      return true;

    case AST_NODE_TYPES.TemplateLiteral:
      // Template literals always produce strings (primitives)
      return true;

    case AST_NODE_TYPES.UnaryExpression:
      // !x, -x, +x, typeof x, void x — always produce primitives
      return true;

    case AST_NODE_TYPES.BinaryExpression:
      // Arithmetic (+, -, *, /, %), comparison (===, !==, <, >, etc.),
      // bitwise (&, |, ^, <<, >>), in, instanceof — all produce primitives
      return true;

    case AST_NODE_TYPES.LogicalExpression:
      // a && b, a || b, a ?? b — result type depends on operands;
      // treat as primitive only when both operands are statically primitive
      return (
        producesPrimitiveValue(node.left) && producesPrimitiveValue(node.right)
      );

    case AST_NODE_TYPES.ConditionalExpression:
      // ternary: primitive when both branches are primitive
      return (
        producesPrimitiveValue(node.consequent) &&
        producesPrimitiveValue(node.alternate)
      );

    case AST_NODE_TYPES.Identifier:
      // Only `undefined` is always a primitive identifier
      return node.name === "undefined";

    default:
      return false;
  }
}

/**
 * Given a useMemo call, extracts the body of the callback.
 * Handles: useMemo(() => expr, deps) and useMemo(() => { return expr; }, deps)
 */
function getMemoCallbackBody(
  node: TSESTree.CallExpression
): TSESTree.Node | null {
  const callback = node.arguments[0];
  if (!callback) {
    return null;
  }

  if (
    callback.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    callback.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return null;
  }

  const body = callback.body;

  // Arrow function with expression body: () => expr
  if (body.type !== AST_NODE_TYPES.BlockStatement) {
    return body;
  }

  // Block body with single return: () => { return expr; }
  const stmts = body.body;
  if (stmts.length === 1) {
    const stmt = stmts[0];
    if (stmt && stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument) {
      return stmt.argument;
    }
  }

  return null;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Do not wrap a simple expression with a primitive result type in useMemo. The overhead of useMemo exceeds any gains when the result is a primitive value.",
    },
    schema: [],
    messages: {
      noUseMemoForPrimitive:
        "Avoid wrapping a primitive expression in useMemo — the memoization overhead outweighs the benefit. Compute the value directly instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node): void {
        // Must be useMemo(...)
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "useMemo"
        ) {
          return;
        }

        // Must have at least the callback argument
        if (node.arguments.length === 0) {
          return;
        }

        const body = getMemoCallbackBody(node);
        if (!body) {
          return;
        }

        if (producesPrimitiveValue(body)) {
          context.report({
            node,
            messageId: "noUseMemoForPrimitive",
          });
        }
      },
    };
  },
});
