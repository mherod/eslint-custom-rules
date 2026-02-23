import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-parenthesized-use-cache";

type MessageIds = "noParenthesizedUseCache";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: 'Prevent parenthesized "use cache" directive syntax',
    },
    schema: [],
    messages: {
      noParenthesizedUseCache:
        '"use cache" directive should not be wrapped in parentheses. Use "use cache"; instead of ("use cache");',
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const parenthesizedDirectivePattern =
      /^\s*\(+\s*(['"])use cache\1\s*\)+\s*;?\s*$/;

    return {
      ExpressionStatement(node: TSESTree.ExpressionStatement): void {
        if (
          node.expression.type === AST_NODE_TYPES.Literal &&
          node.expression.value === "use cache" &&
          parenthesizedDirectivePattern.test(sourceCode.getText(node))
        ) {
          context.report({
            node,
            messageId: "noParenthesizedUseCache",
            fix(fixer) {
              // Replace the parenthesized directive statement with the literal directive
              return fixer.replaceText(node, '"use cache";');
            },
          });
        }
      },
    };
  },
});
