import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isExported, isHttpMethod } from "../utils/common";
import { getFileFacts } from "../utils/file-facts";
import { hasRateLimit } from "./route-policy-detectors";

type MessageIds = "requireRateLimit";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require rate limiting in public API endpoints to prevent abuse",
    },
    fixable: "code",
    schema: [],
    messages: {
      requireRateLimit:
        "Public API endpoint should implement rate limiting to prevent abuse.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const facts = getFileFacts(context.filename, sourceCode);
    const middleware = facts.isMiddleware;

    if (
      !(middleware || facts.isAppRouterApiRoute || facts.isPagesRouterApiRoute)
    ) {
      return {};
    }

    if (!middleware && facts.isProtectedRoute) {
      return {};
    }

    const pagesRouter = facts.isPagesRouterApiRoute;

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (!isExported(node)) {
          return;
        }

        let isTargetHandler: boolean;

        if (middleware) {
          // Middleware: exported function named "middleware"
          isTargetHandler = node.id?.name === "middleware";
        } else if (pagesRouter) {
          // Pages Router: default-exported handler function
          isTargetHandler =
            node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration;
        } else {
          // App Router: exported HTTP method handlers (GET, POST, etc.)
          isTargetHandler = isHttpMethod(node.id?.name);
        }

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
