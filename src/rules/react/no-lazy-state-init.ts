import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-lazy-state-init";

type MessageIds = "useLazyStateInit";
type Options = [];

/**
 * Checks if a call expression is a useState() call
 */
function isUseStateCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "useState"
  );
}

/**
 * Checks if a node is an expensive call expression (i.e. a function call, not a literal/identifier)
 * that should be wrapped in a lazy initializer.
 */
function isCallExpression(
  node: TSESTree.Node
): node is TSESTree.CallExpression {
  return node.type === AST_NODE_TYPES.CallExpression;
}

/**
 * Checks if a node is a `new` expression
 */
function isNewExpression(node: TSESTree.Node): node is TSESTree.NewExpression {
  return node.type === AST_NODE_TYPES.NewExpression;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Use lazy state initialization in useState to avoid re-running expensive computations on every render. Pass a function `() => expr` instead of calling the expression directly.",
    },
    schema: [],
    messages: {
      useLazyStateInit:
        "Pass a function to useState instead of calling the expression directly. Use `useState(() => {{expr}})` to avoid re-running the computation on every render.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node): void {
        if (!isUseStateCall(node)) {
          return;
        }

        // useState with no args or with a non-call arg is fine
        const arg = node.arguments[0];
        if (!arg) {
          return;
        }

        // If the arg is already a function (arrow or function expression), it's already lazy
        if (
          arg.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          arg.type === AST_NODE_TYPES.FunctionExpression
        ) {
          return;
        }

        // Flag call expressions and new expressions as expensive
        if (!(isCallExpression(arg) || isNewExpression(arg))) {
          return;
        }

        const sourceCode = context.sourceCode;
        const argText = sourceCode.getText(arg);

        context.report({
          node: arg,
          messageId: "useLazyStateInit",
          data: { expr: argText },
          fix(fixer) {
            return fixer.replaceText(arg, `() => ${argText}`);
          },
        });
      },
    };
  },
});
