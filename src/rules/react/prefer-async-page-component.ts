import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

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
    fixable: "code",
    schema: [],
    messages: {
      preferAsyncPage:
        "Next.js Pages are Server Components by default and should be 'async' to support data fetching and future API changes (e.g. params as Promises).",
    },
  },
  defaultOptions: [],
  create(context) {
    // Only check page files
    if (!/page\.(tsx|jsx|js|ts)$/.test(context.filename)) {
      return {};
    }

    // Check if it's a Client Component
    const isClientComponent = hasUseClientDirective(context.sourceCode);

    return {
      ExportDefaultDeclaration(node): void {
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
            fix(fixer) {
              return fixer.insertTextBefore(decl, "async ");
            },
          });
        } else if (
          decl.type === AST_NODE_TYPES.ArrowFunctionExpression &&
          !decl.async
        ) {
          context.report({
            node: decl,
            messageId: "preferAsyncPage",
            fix(fixer) {
              return fixer.insertTextBefore(decl, "async ");
            },
          });
        }
      },
    };
  },
});
