import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-use-state-in-async-component";

// Constants for regex patterns
const COMPONENT_NAME_REGEX = /^[A-Z]/;

type MessageIds = "noUseStateInAsyncComponent";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow useState in async React components (Server Components)",
    },
    schema: [],
    messages: {
      noUseStateInAsyncComponent:
        "useState is not allowed in async React components. Server Components cannot use client-side state hooks.",
    },
  },
  defaultOptions: [],
  create(context) {
    let currentAsyncComponent:
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression
      | null = null;

    return {
      // Track when we enter async functions that look like components
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(
        node:
          | TSESTree.FunctionDeclaration
          | TSESTree.FunctionExpression
          | TSESTree.ArrowFunctionExpression
      ) {
        // Check if function is async
        if (!node.async) {
          return;
        }

        // Check if this looks like a React component (starts with uppercase)
        const functionName = getFunctionName(node);
        if (!(functionName && isComponentName(functionName))) {
          return;
        }

        currentAsyncComponent = node;
      },

      // Check for useState calls within async components
      CallExpression(node: TSESTree.CallExpression) {
        if (!currentAsyncComponent) {
          return;
        }

        // Check for useState calls
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "useState"
        ) {
          context.report({
            node,
            messageId: "noUseStateInAsyncComponent" as const,
          });
        }

        // Check for React.useState calls
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "React" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "useState"
        ) {
          context.report({
            node,
            messageId: "noUseStateInAsyncComponent" as const,
          });
        }
      },

      // Clear the current component when we exit
      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration) {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
      "FunctionExpression:exit"(node: TSESTree.FunctionExpression) {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
      "ArrowFunctionExpression:exit"(node: TSESTree.ArrowFunctionExpression) {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
    };
  },
});

function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): string | null {
  if (node.type === "FunctionDeclaration" && node.id) {
    return node.id.name;
  }

  // For function expressions and arrow functions, check if they're assigned to a variable
  const parent = node.parent;
  if (
    parent?.type === "VariableDeclarator" &&
    parent.id.type === "Identifier"
  ) {
    return parent.id.name;
  }

  // Check if it's an export default
  if (parent?.type === "ExportDefaultDeclaration") {
    return "DefaultExport"; // Treat as component
  }

  return null;
}

function isComponentName(name: string): boolean {
  // React components should start with uppercase letter
  return COMPONENT_NAME_REGEX.test(name) || name === "DefaultExport";
}
