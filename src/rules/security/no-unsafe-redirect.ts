import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noUnsafeRedirect";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect unsafe redirect patterns that could lead to open redirect vulnerabilities",
    },
    schema: [],
    messages: {
      noUnsafeRedirect:
        "Unsafe redirect detected. Validate redirect URLs to prevent open redirects.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Match standalone redirect/permanentRedirect calls
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (
            functionName === "redirect" ||
            functionName === "permanentRedirect"
          ) {
            context.report({
              node,
              messageId: "noUnsafeRedirect",
            });
          }
        }

        // Match router.push() and router.replace() member expressions
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = node.callee;
          if (
            object.type === AST_NODE_TYPES.Identifier &&
            object.name === "router" &&
            property.type === AST_NODE_TYPES.Identifier &&
            (property.name === "push" || property.name === "replace")
          ) {
            context.report({
              node,
              messageId: "noUnsafeRedirect",
            });
          }
        }
      },
    };
  },
});
