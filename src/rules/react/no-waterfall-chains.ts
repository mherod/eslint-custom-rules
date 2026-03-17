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
    fixable: "code",
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
    interface AwaitInfo {
      /** Variable name assigned from this await (if any) */
      assignedTo: string | null;
      node: TSESTree.AwaitExpression;
    }
    interface FunctionScope {
      awaits: AwaitInfo[];
      hasPromiseAll: boolean;
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression;
    }
    const scopeStack: FunctionScope[] = [];

    /** Collect all Identifier names referenced in a subtree. */
    function collectReferencedIdentifiers(node: TSESTree.Node): Set<string> {
      const refs = new Set<string>();
      function walk(n: TSESTree.Node): void {
        if (n.type === AST_NODE_TYPES.Identifier) {
          refs.add(n.name);
        }
        for (const key of Object.keys(n)) {
          if (key === "parent") {
            continue;
          }
          const child = (n as unknown as Record<string, unknown>)[key];
          if (
            child &&
            typeof child === "object" &&
            "type" in (child as Record<string, unknown>)
          ) {
            walk(child as TSESTree.Node);
          } else if (Array.isArray(child)) {
            for (const item of child) {
              if (
                item &&
                typeof item === "object" &&
                "type" in (item as Record<string, unknown>)
              ) {
                walk(item as TSESTree.Node);
              }
            }
          }
        }
      }
      walk(node);
      return refs;
    }

    /** Get the variable name assigned from an await expression, if any. */
    function getAssignedVariable(
      awaitNode: TSESTree.AwaitExpression
    ): string | null {
      const parent = awaitNode.parent;
      if (
        parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        parent.id.type === AST_NODE_TYPES.Identifier
      ) {
        return parent.id.name;
      }
      return null;
    }

    /**
     * Check if the await chain is a linear dependency chain.
     * A chain is linear if each await (after the first) references
     * the variable assigned by its immediate predecessor. This means
     * no two awaits could be parallelized because each step requires
     * the output of the previous step.
     *
     * Example of a linear chain (no warning):
     *   const headers = await getAuth();
     *   const response = await fetch(url, { headers });
     *   await handleError(response);
     *
     * Example of a parallelizable chain (should warn):
     *   const user = await getUser();
     *   const stats = await getStats(user.id);   // depends on user
     *   const posts = await getPosts(user.id);   // depends on user, NOT stats
     *   → stats and posts are independent of each other
     */
    function isLinearDependencyChain(awaits: AwaitInfo[]): boolean {
      for (let i = 1; i < awaits.length; i++) {
        const current = awaits[i];
        const predecessor = awaits[i - 1];
        if (current === undefined || predecessor === undefined) {
          continue;
        }

        // If the predecessor didn't assign a variable, the chain can't
        // be proven dependent — treat as potentially parallelizable.
        if (predecessor.assignedTo === null) {
          return false;
        }

        // Check if this await references its immediate predecessor's variable
        const refs = collectReferencedIdentifiers(current.node.argument);
        if (!refs.has(predecessor.assignedTo)) {
          return false;
        }
      }
      return true;
    }

    function pushScope(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression
    ): void {
      scopeStack.push({ node, awaits: [], hasPromiseAll: false });
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
      if (top.awaits.length >= 3 && !top.hasPromiseAll) {
        // Skip if the chain is sequentially dependent (each await uses
        // the result of a prior await — cannot be parallelized).
        if (isLinearDependencyChain(top.awaits)) {
          return;
        }
        const thirdAwait = top.awaits[2];
        if (thirdAwait !== undefined) {
          context.report({
            node: thirdAwait.node,
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
          top.awaits.push({
            node,
            assignedTo: getAssignedVariable(node),
          });
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
