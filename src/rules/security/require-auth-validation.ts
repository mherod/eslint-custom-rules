import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import { hasAuthValidation, isProtectedRoute } from "./security-utils";

type MessageIds = "requireAuthValidation";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require authentication and authorization validation in protected API routes",
    },
    schema: [],
    messages: {
      requireAuthValidation:
        "Protected route should validate authentication and authorization.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const isApiFile = filename.includes("/api/");
    const sourceCode = context.sourceCode;

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (
          isApiFile &&
          node.id &&
          isProtectedRoute(filename) &&
          !hasAuthValidation(node, sourceCode)
        ) {
          context.report({
            node,
            messageId: "requireAuthValidation",
          });
        }
      },
    };
  },
});
