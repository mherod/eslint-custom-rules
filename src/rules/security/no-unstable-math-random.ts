import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-unstable-math-random";

type MessageIds =
  | "avoidMathRandomInRender"
  | "avoidMathRandomInUseMemo"
  | "avoidMathRandomInUseCallback"
  | "avoidMathRandomInJSX";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent usage of Math.random() in React components that can cause state instability and unwanted re-renders",
    },
    schema: [],
    messages: {
      avoidMathRandomInRender:
        "Math.random() in component render will generate different values on each render, causing instability. Use useMemo with stable dependencies or generate the value outside the component.",
      avoidMathRandomInUseMemo:
        "Math.random() in useMemo without stable dependencies defeats memoization. Consider using a stable seed or moving the randomization outside the component.",
      avoidMathRandomInUseCallback:
        "Math.random() in useCallback can cause the callback to change unexpectedly. Consider using a stable value or ref.",
      avoidMathRandomInJSX:
        "Math.random() in JSX expressions will generate different values on each render. Use a stable value from state or useMemo instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    // Track if we're in a React component
    const componentStack: string[] = [];
    const hookStack: string[] = [];

    // Helper to check if we're in a React component
    function isInReactComponent(): boolean {
      return componentStack.length > 0;
    }

    // Helper to check if we're in a specific hook
    function isInHook(hookName: string): boolean {
      return hookStack.includes(hookName);
    }

    // Helper to check if a function is a React component (PascalCase or explicit display name)
    function isReactComponent(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ): boolean {
      // Check for PascalCase function name
      if (node.type === "FunctionDeclaration" && node.id) {
        return /^[A-Z]/.test(node.id.name);
      }

      // Check for variable declaration with PascalCase
      if (
        node.parent?.type === "VariableDeclarator" &&
        node.parent.id.type === "Identifier"
      ) {
        return /^[A-Z]/.test(node.parent.id.name);
      }

      // Check for export default
      if (node.parent?.type === "ExportDefaultDeclaration") {
        return true;
      }

      return false;
    }

    // Helper to check if Math.random is being called
    function isMathRandomCall(node: TSESTree.Node): boolean {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "Math" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "random"
      );
    }

    return {
      // Track entering/exiting React components
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (isReactComponent(node)) {
          componentStack.push(node.id?.name || "AnonymousComponent");
        }
      },
      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration) {
        if (isReactComponent(node)) {
          componentStack.pop();
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression) {
        if (isReactComponent(node)) {
          const name =
            node.parent?.type === "VariableDeclarator" &&
            node.parent.id.type === "Identifier"
              ? node.parent.id.name
              : "AnonymousComponent";
          componentStack.push(name);
        }
      },
      "FunctionExpression:exit"(node: TSESTree.FunctionExpression) {
        if (isReactComponent(node)) {
          componentStack.pop();
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        if (isReactComponent(node)) {
          const name =
            node.parent?.type === "VariableDeclarator" &&
            node.parent.id.type === "Identifier"
              ? node.parent.id.name
              : "AnonymousComponent";
          componentStack.push(name);
        }
      },
      "ArrowFunctionExpression:exit"(node: TSESTree.ArrowFunctionExpression) {
        if (isReactComponent(node)) {
          componentStack.pop();
        }
      },

      // Track entering/exiting React hooks
      CallExpression(node: TSESTree.CallExpression) {
        // Track hook calls first
        if (node.callee.type === "Identifier") {
          const hookName = node.callee.name;
          if (hookName.startsWith("use")) {
            hookStack.push(hookName);

            // Check if Math.random is used in this hook's callback
            if (hookName === "useMemo" && node.arguments[0]) {
              // Walk the first argument (the callback) to find Math.random
              const callback = node.arguments[0];
              const hasMathRandom = sourceCode
                .getText(callback)
                .includes("Math.random()");

              if (hasMathRandom) {
                // Check if it has empty dependencies
                const hasEmptyDeps =
                  node.arguments[1]?.type === "ArrayExpression" &&
                  node.arguments[1].elements.length === 0;

                // Only report if it doesn't have empty deps (empty deps = stable)
                if (!hasEmptyDeps) {
                  // We'll report when we actually encounter the Math.random call
                }
              }
            }
          }
        }

        // Check if this is Math.random()
        if (isMathRandomCall(node) && isInReactComponent()) {
          // Check context
          if (isInHook("useMemo")) {
            // Check if the parent useMemo has empty dependencies
            let parent: TSESTree.Node | undefined = node.parent;
            let useMemoNode: TSESTree.CallExpression | null = null;

            // Find the useMemo call in the parent chain
            while (parent) {
              if (
                parent.type === "CallExpression" &&
                parent.callee.type === "Identifier" &&
                parent.callee.name === "useMemo"
              ) {
                useMemoNode = parent;
                break;
              }
              parent = parent.parent;
            }

            if (useMemoNode) {
              const hasEmptyDeps =
                useMemoNode.arguments[1]?.type === "ArrayExpression" &&
                useMemoNode.arguments[1].elements.length === 0;

              if (!hasEmptyDeps) {
                context.report({
                  node,
                  messageId: "avoidMathRandomInUseMemo",
                });
              }
            }
          } else if (isInHook("useCallback")) {
            context.report({
              node,
              messageId: "avoidMathRandomInUseCallback",
            });
          } else {
            // Check if we're in JSX
            let inJsx = false;
            let parent: TSESTree.Node | undefined = node.parent;
            while (parent) {
              if (
                parent.type === "JSXElement" ||
                parent.type === "JSXFragment" ||
                parent.type === "JSXExpressionContainer"
              ) {
                inJsx = true;
                break;
              }
              parent = parent.parent;
            }

            if (inJsx) {
              context.report({
                node,
                messageId: "avoidMathRandomInJSX",
              });
            } else {
              context.report({
                node,
                messageId: "avoidMathRandomInRender",
              });
            }
          }
        }
      },
      "CallExpression:exit"(node: TSESTree.CallExpression) {
        if (node.callee.type === "Identifier") {
          const hookName = node.callee.name;
          if (hookName.startsWith("use")) {
            const index = hookStack.lastIndexOf(hookName);
            if (index !== -1) {
              hookStack.splice(index, 1);
            }
          }
        }
      },
    };
  },
});
