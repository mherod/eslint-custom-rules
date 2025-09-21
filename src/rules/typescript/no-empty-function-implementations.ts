import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-empty-function-implementations";

type MessageIds = "emptyFunctionImplementation";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect empty function implementations that indicate incomplete code",
    },
    schema: [],
    messages: {
      emptyFunctionImplementation:
        "Empty function implementation detected: {{functionType}}. This indicates a serious incomplete implementation issue that must be addressed.",
    },
  },
  defaultOptions: [],
  create(context) {
    // Track reported nodes to avoid double reporting
    const reportedNodes = new Set<TSESTree.Node>();

    return {
      // Check arrow functions
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        if (isEmptyFunction(node)) {
          context.report({
            node,
            messageId: "emptyFunctionImplementation",
            data: {
              functionType: "arrow function",
            },
          });
        }
      },

      // Check function expressions
      FunctionExpression(node: TSESTree.FunctionExpression) {
        // Skip if already reported as method or property
        if (reportedNodes.has(node)) {
          return;
        }
        if (isEmptyFunction(node)) {
          context.report({
            node,
            messageId: "emptyFunctionImplementation",
            data: {
              functionType: "function expression",
            },
          });
        }
      },

      // Check function declarations
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (isEmptyFunction(node)) {
          context.report({
            node,
            messageId: "emptyFunctionImplementation",
            data: {
              functionType: "function declaration",
            },
          });
        }
      },

      // Check method definitions (class methods, object methods)
      MethodDefinition(node: TSESTree.MethodDefinition) {
        if (
          node.value &&
          node.value.type === "FunctionExpression" &&
          isEmptyFunction(node.value)
        ) {
          // Mark this function as already reported to avoid double reporting
          reportedNodes.add(node.value);
          context.report({
            node: node.value,
            messageId: "emptyFunctionImplementation",
            data: {
              functionType: "method",
            },
          });
        }
      },

      // Check object method shorthand
      Property(node: TSESTree.Property) {
        if (
          node.method &&
          node.value &&
          (node.value.type === "FunctionExpression" ||
            node.value.type === "ArrowFunctionExpression") &&
          isEmptyFunction(node.value)
        ) {
          // Mark this function as already reported to avoid double reporting
          reportedNodes.add(node.value);
          context.report({
            node: node.value,
            messageId: "emptyFunctionImplementation",
            data: {
              functionType: "object method",
            },
          });
        }
      },
    };
  },
});

/**
 * Check if a function is empty (no body content or only empty block statement)
 */
function isEmptyFunction(
  node:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
    | TSESTree.FunctionDeclaration
): boolean {
  // For arrow functions with expression body (e.g., () => expression)
  if (
    node.type === "ArrowFunctionExpression" &&
    node.body.type !== "BlockStatement"
  ) {
    return false; // Expression body is not empty
  }

  // For functions with block statement body
  if (node.body && node.body.type === "BlockStatement") {
    const statements = node.body.body;

    // Empty block: {}
    if (statements.length === 0) {
      return true;
    }

    // Check for only whitespace/comments (handled by ESLint's parser)
    // If we reach here with statements, it means there's actual code
    return false;
  }

  return false;
}
