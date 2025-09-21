import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isAsyncFunction } from "../utils/common";

export const RULE_NAME = "no-use-state-in-async-component";

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
      ): void {
        // Check if function is async using helper
        if (!isAsyncFunction(node)) {
          return;
        }

        // Check if this looks like a React component
        const functionName = getFunctionName(node);
        if (!(functionName && isComponentName(functionName))) {
          return;
        }

        currentAsyncComponent = node;
      },

      // Check for useState calls within async components
      CallExpression(node: TSESTree.CallExpression): void {
        if (!currentAsyncComponent) {
          return;
        }

        // Check for useState calls (both direct and React.useState)
        if (
          (node.callee.type === AST_NODE_TYPES.Identifier &&
            node.callee.name === "useState") ||
          (node.callee.type === AST_NODE_TYPES.MemberExpression &&
            node.callee.object.type === AST_NODE_TYPES.Identifier &&
            node.callee.object.name === "React" &&
            node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.property.name === "useState")
        ) {
          context.report({
            node,
            messageId: "noUseStateInAsyncComponent" as const,
          });
        }
      },

      // Clear the current component when we exit
      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (currentAsyncComponent === node) {
          currentAsyncComponent = null;
        }
      },
    };
  },
});

// Local helper function for getting function name
function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): string | null {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
    return node.id.name;
  }

  // For function expressions and arrow functions, check if they're assigned to a variable
  const parent = node.parent;
  if (
    parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }

  // Check if it's an export default
  if (parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
    return "DefaultExport"; // Treat as component
  }

  return null;
}

// Local helper for component name checking with special case
function isComponentName(name: string): boolean {
  // React components should start with uppercase letter
  return /^[A-Z]/.test(name) || name === "DefaultExport";
}
