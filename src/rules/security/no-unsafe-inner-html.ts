import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noUnsafeInnerHTML";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of dangerouslySetInnerHTML without proper sanitization",
    },
    schema: [],
    messages: {
      noUnsafeInnerHTML:
        "Avoid using dangerouslySetInnerHTML without proper sanitization. Use DOMPurify or similar.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node: TSESTree.JSXAttribute): void {
        if (
          node.name.type === AST_NODE_TYPES.JSXIdentifier &&
          node.name.name === "dangerouslySetInnerHTML"
        ) {
          context.report({
            node,
            messageId: "noUnsafeInnerHTML",
          });
        }
      },
    };
  },
});
