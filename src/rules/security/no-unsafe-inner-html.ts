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
    fixable: "code",
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
            fix(fixer) {
              const value = node.value;
              if (
                !value ||
                value.type !== AST_NODE_TYPES.JSXExpressionContainer
              ) {
                return null;
              }
              const expr = value.expression;
              if (expr.type !== AST_NODE_TYPES.ObjectExpression) {
                return null;
              }
              const htmlProp = expr.properties.find(
                (p) =>
                  p.type === AST_NODE_TYPES.Property &&
                  p.key.type === AST_NODE_TYPES.Identifier &&
                  (p.key as TSESTree.Identifier).name === "__html"
              );
              if (!htmlProp || htmlProp.type !== AST_NODE_TYPES.Property) {
                return null;
              }
              const htmlValue = htmlProp.value as TSESTree.Expression;
              const htmlText = context.sourceCode.getText(htmlValue);
              return fixer.replaceText(
                htmlValue,
                `DOMPurify.sanitize(${htmlText})`
              );
            },
          });
        }
      },
    };
  },
});
