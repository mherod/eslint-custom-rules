import * as path from "node:path";
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

// Using any for context type to avoid complex type inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RuleContext = any;

export const RULE_NAME = "enforce-api-patterns";

type MessageIds =
  | "missingErrorHandling"
  | "missingInputValidation"
  | "improperStatusCode"
  | "missingRequestMethodCheck"
  | "missingResponseType"
  | "unsafeDirectDbAccess"
  | "missingAuthCheck"
  | "missingRateLimit"
  | "improperErrorResponse"
  | "missingCorsHeaders";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce consistent API route patterns and best practices",
    },
    schema: [],
    messages: {
      missingErrorHandling:
        "API route '{{route}}' should have proper error handling with try-catch blocks",
      missingInputValidation:
        "API route '{{route}}' should validate request body/parameters using validation schema",
      improperStatusCode:
        "API route '{{route}}' should return appropriate HTTP status codes",
      missingRequestMethodCheck:
        "API route '{{route}}' should check request method (GET, POST, etc.)",
      missingResponseType:
        "API route '{{route}}' should have proper response type annotation",
      unsafeDirectDbAccess:
        "API route '{{route}}' should not directly access database - use repository pattern",
      missingAuthCheck:
        "API route '{{route}}' should implement authentication checks for protected endpoints",
      missingRateLimit:
        "API route '{{route}}' should implement rate limiting for public endpoints",
      improperErrorResponse:
        "API route '{{route}}' should return consistent error response format",
      missingCorsHeaders:
        "API route '{{route}}' should set proper CORS headers for cross-origin requests",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();

    if (!isApiRoute(filename)) {
      return {};
    }

    const routeName = getRouteName(filename);
    let hasErrorHandling = false;
    let hasInputValidation = false;
    let hasMethodCheck = false;
    let hasStatusCodeHandling = false;
    let hasAuthCheck = false;
    let hasDbAccess = false;
    let hasProperErrorResponse = false;

    return {
      // Check for exported handler functions
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (node.declaration?.type === AST_NODE_TYPES.FunctionDeclaration) {
          const functionName = node.declaration.id?.name;
          if (isHttpMethod(functionName)) {
            validateApiHandler(context, node.declaration, routeName);
          }
        }
      },

      // Check for default export functions
      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration): void {
        if (node.declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
          validateApiHandler(context, node.declaration, routeName);
        }
      },

      // Check for try-catch blocks
      TryStatement(_node: TSESTree.TryStatement): void {
        hasErrorHandling = true;
      },

      // Check for request method validation
      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === "request" &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === "method"
        ) {
          hasMethodCheck = true;
        }
      },

      // Check for status code usage
      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "status"
        ) {
          hasStatusCodeHandling = true;
        }

        // Check for input validation
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          (node.callee.property.name === "parse" ||
            node.callee.property.name === "validate")
        ) {
          hasInputValidation = true;
        }

        // Check for auth checks
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          (node.callee.name.includes("auth") ||
            node.callee.name.includes("verify") ||
            node.callee.name.includes("authenticate"))
        ) {
          hasAuthCheck = true;
        }

        // Check for direct database access
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          isDatabaseObject(node.callee.object.name)
        ) {
          hasDbAccess = true;
        }
      },

      // Check for NextResponse usage
      NewExpression(node: TSESTree.NewExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "NextResponse"
        ) {
          hasProperErrorResponse = true;
        }
      },

      "Program:exit"(): void {
        // Validate API route patterns
        if (!hasErrorHandling) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "missingErrorHandling",
            data: { route: routeName },
          });
        }

        if (!hasInputValidation) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "missingInputValidation",
            data: { route: routeName },
          });
        }

        if (!hasMethodCheck) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "missingRequestMethodCheck",
            data: { route: routeName },
          });
        }

        if (!hasStatusCodeHandling) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "improperStatusCode",
            data: { route: routeName },
          });
        }

        // Check if error responses are properly formed with NextResponse
        if (hasErrorHandling && !hasProperErrorResponse) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "improperStatusCode",
            data: { route: routeName },
          });
        }

        if (hasDbAccess) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "unsafeDirectDbAccess",
            data: { route: routeName },
          });
        }

        if (!hasAuthCheck && isProtectedRoute(routeName)) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: "missingAuthCheck",
            data: { route: routeName },
          });
        }
      },
    };
  },
});

function isApiRoute(filename: string): boolean {
  return (
    filename.includes("/api/") ||
    filename.includes("/route.ts") ||
    filename.includes("/route.js")
  );
}

function getRouteName(filename: string): string {
  const normalizedPath = path.normalize(filename);
  const parts = normalizedPath.split("/");
  const apiIndex = parts.indexOf("api");

  if (apiIndex !== -1) {
    return `/${parts
      .slice(apiIndex + 1)
      .join("/")
      .replace(/\.(ts|js)$/, "")}`;
  }

  return path.basename(filename, path.extname(filename));
}

function isHttpMethod(functionName: string | undefined): boolean {
  if (!functionName) {
    return false;
  }

  const httpMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
    "HEAD",
  ];
  return httpMethods.includes(functionName.toUpperCase());
}

function isDatabaseObject(objectName: string): boolean {
  const dbObjects = [
    "db",
    "database",
    "collection",
    "model",
    "prisma",
    "mongoose",
    "sequelize",
    "knex",
    "firebase",
    "firestore",
    "mongo",
    "client",
    "connection",
  ];

  return dbObjects.some((dbObj) => objectName.toLowerCase().includes(dbObj));
}

function isProtectedRoute(routeName: string): boolean {
  // Routes that typically require authentication
  const protectedPatterns = [
    "/admin",
    "/dashboard",
    "/profile",
    "/settings",
    "/account",
    "/user",
    "/auth",
    "/private",
    "/protected",
    "/secure",
    "/management",
    "/upload",
    "/delete",
    "/update",
    "/create",
  ];

  return protectedPatterns.some((pattern) =>
    routeName.toLowerCase().includes(pattern)
  );
}

function validateApiHandler(
  context: Readonly<RuleContext<MessageIds, Options>>,
  node: TSESTree.FunctionDeclaration,
  routeName: string
): void {
  // Check if function has proper parameters
  if (node.params.length < 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (context as any).report({
      node,
      messageId: "missingResponseType",
      data: { route: routeName },
    });
  }

  // Check if function has return type annotation
  if (!node.returnType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (context as any).report({
      node,
      messageId: "missingResponseType",
      data: { route: routeName },
    });
  }
}
