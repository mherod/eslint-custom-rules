import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

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
    const filename = context.getFilename();
    const isApiFile = filename.includes("/api/");
    const sourceCode = context.getSourceCode();

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

function isProtectedRoute(filename: string): boolean {
  const protectedPatterns = [
    "/admin/",
    "/dashboard/",
    "/profile/",
    "/settings/",
    "/account/",
    "/user/",
    "/private/",
    "/protected/",
  ];

  return protectedPatterns.some((pattern) => filename.includes(pattern));
}

function hasAuthValidation(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  const bodyText = sourceCode.getText(node.body);
  return (
    bodyText.includes("auth") ||
    bodyText.includes("verify") ||
    bodyText.includes("authenticate") ||
    bodyText.includes("authorize")
  );
}
