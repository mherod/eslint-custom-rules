import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

type MessageIds = "requireRateLimit";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require rate limiting in public API endpoints to prevent abuse",
    },
    schema: [],
    messages: {
      requireRateLimit:
        "Public API endpoint should implement rate limiting to prevent abuse.",
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
          isPublicApiRoute(filename) &&
          !hasRateLimit(node, sourceCode)
        ) {
          context.report({
            node,
            messageId: "requireRateLimit",
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

function isPublicApiRoute(filename: string): boolean {
  return filename.includes("/api/") && !isProtectedRoute(filename);
}

function hasRateLimit(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  const bodyText = sourceCode.getText(node.body);
  return (
    bodyText.includes("rateLimit") ||
    bodyText.includes("throttle") ||
    bodyText.includes("limit")
  );
}
