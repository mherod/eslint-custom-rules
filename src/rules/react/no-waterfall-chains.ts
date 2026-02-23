import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-waterfall-chains";

type MessageIds = "noWaterfallChains";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent waterfall chains in API routes and server actions by starting independent operations immediately",
    },
    schema: [],
    messages: {
      noWaterfallChains:
        "Avoid waterfall chains by starting independent async operations immediately. Use Promise.all() for parallel operations or assign promises to variables to start them early.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    // Only apply to API routes, server actions, and other async handlers
    if (!isAsyncHandler(filename)) {
      return {};
    }

    let awaitExpressions: TSESTree.AwaitExpression[] = [];
    const functionStack: (
      | TSESTree.FunctionDeclaration
      | TSESTree.ArrowFunctionExpression
      | TSESTree.FunctionExpression
    )[] = [];
    let hasPromiseAll = false;

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.async) {
          functionStack.push(node);
          awaitExpressions = [];
          hasPromiseAll = false;
        }
      },

      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();

          // Check for potential waterfalls (3+ awaits without Promise.all)
          if (awaitExpressions.length >= 3 && !hasPromiseAll) {
            context.report({
              node,
              messageId: "noWaterfallChains",
            });
          }

          awaitExpressions = [];
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
          awaitExpressions = [];
          hasPromiseAll = false;
        }
      },

      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();

          // Check for potential waterfalls (3+ awaits without Promise.all)
          if (awaitExpressions.length >= 3 && !hasPromiseAll) {
            context.report({
              node,
              messageId: "noWaterfallChains",
            });
          }

          awaitExpressions = [];
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
          awaitExpressions = [];
          hasPromiseAll = false;
        }
      },

      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();

          // Check for potential waterfalls (3+ awaits without Promise.all)
          if (awaitExpressions.length >= 3 && !hasPromiseAll) {
            context.report({
              node,
              messageId: "noWaterfallChains",
            });
          }

          awaitExpressions = [];
        }
      },

      AwaitExpression(node: TSESTree.AwaitExpression): void {
        if (functionStack.length > 0) {
          awaitExpressions.push(node);
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (functionStack.length > 0) {
          // Check for Promise.all usage
          const { callee } = node;
          if (callee.type === AST_NODE_TYPES.MemberExpression) {
            const { object, property } = callee;
            if (
              object.type === AST_NODE_TYPES.Identifier &&
              object.name === "Promise" &&
              property.type === AST_NODE_TYPES.Identifier &&
              (property.name === "all" || property.name === "allSettled")
            ) {
              hasPromiseAll = true;
            }
          }
        }
      },
    };
  },
});

function isAsyncHandler(filename: string): boolean {
  // API routes
  if (filename.includes("/api/") || filename.includes("/route.")) {
    return true;
  }

  // Server actions (functions ending with Action)
  if (filename.includes("action") || filename.includes("Action")) {
    return true;
  }

  return false;
}
