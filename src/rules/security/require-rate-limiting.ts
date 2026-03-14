import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isExportedFunction, isHttpMethod } from "../utils/common";
import { normalizePath } from "../utils/component-type-utils";

type MessageIds = "requireRateLimit";
type Options = [];

// Next.js App Router API route files: app/api/.../route.ts
const APP_ROUTER_API_ROUTE_PATTERN = /\/app\/api\/.*\/route\.(ts|js|tsx|jsx)$/;

// Next.js Pages Router API route files: pages/api/.../*.ts
const PAGES_ROUTER_API_ROUTE_PATTERN = /\/pages\/api\/.+\.(ts|js|tsx|jsx)$/;

function isApiRouteFile(filename: string): boolean {
  const normalized = normalizePath(filename);
  return (
    APP_ROUTER_API_ROUTE_PATTERN.test(normalized) ||
    PAGES_ROUTER_API_ROUTE_PATTERN.test(normalized)
  );
}

function isPagesRouterApiRoute(filename: string): boolean {
  return PAGES_ROUTER_API_ROUTE_PATTERN.test(normalizePath(filename));
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

    if (!isApiRouteFile(filename)) {
      return {};
    }

    if (isProtectedRoute(filename)) {
      return {};
    }

    const pagesRouter = isPagesRouterApiRoute(filename);

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (!isExportedFunction(node)) {
          return;
        }

        // App Router: exported HTTP method handlers (GET, POST, etc.)
        // Pages Router: default-exported handler function
        const isTargetHandler = pagesRouter
          ? node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
          : isHttpMethod(node.id?.name);

        if (isTargetHandler && !hasRateLimit(node, sourceCode)) {
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
