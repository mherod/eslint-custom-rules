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
        "Waterfall chain detected: this is the 3rd sequential await in a function where earlier awaits are independent. " +
        "Each sequential await blocks the next, adding all wait times together. " +
        "Fix: wrap independent fetches in Promise.all() — " +
        "`const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);` — " +
        "or assign promises to variables before awaiting them together. " +
        "If each await depends on the result of the previous one, the sequential order is intentional and this warning does not apply.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    // Only apply to API routes, server actions, and other async handlers
    if (!isAsyncHandler(filename)) {
      return {};
    }

    // Each entry tracks state for one async function scope.
    // Using a stack correctly handles nested async functions: the inner
    // function's awaits don't bleed into the outer function's count.
    interface FunctionScope {
      awaitExpressions: TSESTree.AwaitExpression[];
      hasPromiseAll: boolean;
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression;
    }
    const scopeStack: FunctionScope[] = [];

    function pushScope(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression
    ): void {
      scopeStack.push({ node, awaitExpressions: [], hasPromiseAll: false });
    }

    function popScope(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression
    ): void {
      const top = scopeStack.at(-1);
      if (top?.node !== node) {
        return;
      }
      scopeStack.pop();

      // Report on the third await — the first one that makes it a waterfall.
      // Targeting the await node (not the function declaration) means inline
      // suppression comments on that line take effect correctly.
      if (top.awaitExpressions.length >= 3 && !top.hasPromiseAll) {
        const thirdAwait = top.awaitExpressions[2];
        if (thirdAwait !== undefined) {
          context.report({
            node: thirdAwait,
            messageId: "noWaterfallChains",
          });
        }
      }
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.async) {
          pushScope(node);
        }
      },

      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (node.async) {
          popScope(node);
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        if (node.async) {
          pushScope(node);
        }
      },

      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (node.async) {
          popScope(node);
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.async) {
          pushScope(node);
        }
      },

      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (node.async) {
          popScope(node);
        }
      },

      AwaitExpression(node: TSESTree.AwaitExpression): void {
        const top = scopeStack.at(-1);
        if (top !== undefined) {
          top.awaitExpressions.push(node);
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        const top = scopeStack.at(-1);
        if (top === undefined) {
          return;
        }
        // Check for Promise.all / Promise.allSettled usage in this scope
        const { callee } = node;
        if (callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = callee;
          if (
            object.type === AST_NODE_TYPES.Identifier &&
            object.name === "Promise" &&
            property.type === AST_NODE_TYPES.Identifier &&
            (property.name === "all" || property.name === "allSettled")
          ) {
            top.hasPromiseAll = true;
          }
        }
      },
    };
  },
});

function isAsyncHandler(filename: string): boolean {
  const normalized = filename.replace(/\\/g, "/");

  // API routes: /api/ directory segment or route handler files
  if (
    normalized.includes("/api/") ||
    /\/route\.[cm]?[jt]sx?$/.test(normalized)
  ) {
    return true;
  }

  // Server action files: must be in an /actions/ directory segment, or named
  // with an explicit -action. / .action. boundary to avoid false positives on
  // files like "activities.ts", "transactions.ts", "interactions.ts", etc.
  if (
    /\/actions\//.test(normalized) ||
    /[.-]action[s]?\.[cm]?[jt]sx?$/.test(normalized) ||
    /[.-]actions?\.[cm]?[jt]sx?$/.test(normalized)
  ) {
    return true;
  }

  return false;
}
