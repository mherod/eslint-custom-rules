import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { getFilename } from "../utils/common";

export const RULE_NAME = "prefer-async-page-component";

type MessageIds = "preferAsyncPage";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest using async functions for Pages to enable data fetching and prepare for Next.js 15+ params",
    },
    schema: [],
    messages: {
      preferAsyncPage:
        "Next.js Pages are Server Components by default and should be 'async' to support data fetching and future API changes (e.g. params as Promises).",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = getFilename(context);

    // Only check page files
    if (!/page\.(tsx|jsx|js|ts)$/.test(filename)) {
      return {};
    }

    // Check if it's a Client Component
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
      ExportDefaultDeclaration(node) {
        if (isClientComponent) {
          return;
        }

        const decl = node.declaration;
        if (!decl) {
          return;
        }

        if (
          (decl.type === AST_NODE_TYPES.FunctionDeclaration ||
            decl.type === AST_NODE_TYPES.FunctionExpression) &&
          !decl.async
        ) {
          context.report({
            node: decl,
            messageId: "preferAsyncPage",
          });
        } else if (
          decl.type === AST_NODE_TYPES.ArrowFunctionExpression &&
          !decl.async
        ) {
          context.report({
            node: decl,
            messageId: "preferAsyncPage",
          });
        }
      },
    };
  },
});
