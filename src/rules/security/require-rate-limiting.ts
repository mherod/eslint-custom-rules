import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import { isExportedFunction, isHttpMethod } from "../utils/common";
import { normalizePath } from "../utils/component-type-utils";

type MessageIds = "requireRateLimit";
type Options = [];

/**
 * Pattern matching Next.js App Router API route files.
 * Matches paths like `/app/api/users/route.ts` but NOT `/lib/api/exports.ts`.
 */
const APP_ROUTER_API_ROUTE_PATTERN = /\/app\/api\/.*\/route\.(ts|js|tsx|jsx)$/;

function isAppRouterApiRoute(filename: string): boolean {
  const normalized = normalizePath(filename);
  return APP_ROUTER_API_ROUTE_PATTERN.test(normalized);
}

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
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    if (!isAppRouterApiRoute(filename)) {
      return {};
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (
          isExportedFunction(node) &&
          isHttpMethod(node.id?.name) &&
          !isProtectedRoute(filename) &&
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
