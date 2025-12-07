import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const RULE_NAME = "no-use-params-in-client-component";

type MessageIds = "noUseParamsInClient";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent usage of useParams and useSearchParams in Client Components",
    },
    schema: [],
    messages: {
      noUseParamsInClient:
        "Avoid using '{{hook}}' in Client Components. Params should be extracted in the Server Component Page and passed as props.",
    },
  },
  defaultOptions: [],
  create(context) {
    let isClientComponent = false;

    return {
      Program(node) {
        if (node.body.length > 0) {
          const firstStatement = node.body[0];
          if (
            firstStatement &&
            firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
            firstStatement.expression.type === AST_NODE_TYPES.Literal &&
            firstStatement.expression.value === "use client"
          ) {
            isClientComponent = true;
          }
        }
      },
      CallExpression(node) {
        if (!isClientComponent) {
          return;
        }

        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (["useParams", "useSearchParams"].includes(node.callee.name)) {
            context.report({
              node,
              messageId: "noUseParamsInClient",
              data: { hook: node.callee.name },
            });
          }
        }
      },
    };
  },
});
