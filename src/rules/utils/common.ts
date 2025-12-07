import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/**
 * Regular expressions for common naming patterns
 */
export const NAMING_PATTERNS = {
  COMPONENT: /^[A-Z][a-zA-Z0-9]*$/,
  HOOK: /^use[A-Z][a-zA-Z0-9]*$/,
  CAMEL_CASE: /^[a-z][a-zA-Z0-9]*$/,
  PASCAL_CASE: /^[A-Z][a-zA-Z0-9]*$/,
  KEBAB_CASE: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
  SNAKE_CASE: /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/,
} as const;

/**
 * Common file path patterns for different types of files
 */
export const FILE_PATTERNS = {
  COMPONENT: ["/components/", "/pages/", "/app/"],
  HOOK: ["/hooks/"],
  API: ["/api/", "/route.ts", "/route.js"],
  UTIL: ["/utils/", "/lib/", "/helpers/"],
  TEST: ["__tests__", ".test.", ".spec."],
  STYLE: [".css", ".scss", ".sass", ".less"],
} as const;

/**
 * HTTP method names
 */
export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
] as const;

/**
 * Database-related object names
 */
export const DATABASE_OBJECTS = [
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
] as const;

/**
 * Protected route patterns that typically require authentication
 */
export const PROTECTED_ROUTE_PATTERNS = [
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
] as const;

/**
 * Check if a name follows the component naming convention (PascalCase)
 */
export function isComponentName(name: string): boolean {
  return NAMING_PATTERNS.COMPONENT.test(name);
}

/**
 * Check if a name follows the hook naming convention (use + PascalCase)
 */
export function isHookName(name: string): boolean {
  return NAMING_PATTERNS.HOOK.test(name);
}

/**
 * Check if a file path is likely a component file
 */
export function isComponentPath(filename: string): boolean {
  return (
    FILE_PATTERNS.COMPONENT.some((pattern) => filename.includes(pattern)) ||
    (filename.endsWith(".tsx") && !filename.includes("/hooks/"))
  );
}

/**
 * Check if a file path is likely a hook file
 */
export function isHookPath(filename: string): boolean {
  return (
    FILE_PATTERNS.HOOK.some((pattern) => filename.includes(pattern)) ||
    filename.includes("use")
  );
}

/**
 * Check if a file path is likely an API route
 */
export function isApiRoute(filename: string): boolean {
  return FILE_PATTERNS.API.some((pattern) => filename.includes(pattern));
}

/**
 * Check if a file path is likely a utility/library file
 */
export function isUtilityFile(filename: string): boolean {
  return FILE_PATTERNS.UTIL.some((pattern) => filename.includes(pattern));
}

/**
 * Check if a file path is a test file
 */
export function isTestFile(filename: string): boolean {
  return FILE_PATTERNS.TEST.some((pattern) => filename.includes(pattern));
}

/**
 * Check if a function name is an HTTP method
 */
export function isHttpMethod(functionName: string | undefined): boolean {
  if (!functionName) {
    return false;
  }
  return HTTP_METHODS.includes(
    functionName.toUpperCase() as (typeof HTTP_METHODS)[number]
  );
}

/**
 * Check if an object name is database-related
 */
export function isDatabaseObject(objectName: string): boolean {
  return DATABASE_OBJECTS.some((dbObj) =>
    objectName.toLowerCase().includes(dbObj)
  );
}

/**
 * Check if a route is likely protected (requires authentication)
 */
export function isProtectedRoute(routeName: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some((pattern) =>
    routeName.toLowerCase().includes(pattern)
  );
}

/**
 * Check if a function declaration is exported
 */
export function isExportedFunction(
  node: TSESTree.FunctionDeclaration
): boolean {
  const parent = node.parent;
  return (
    parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  );
}

/**
 * Check if a variable declarator is exported
 */
export function isExportedVariable(node: TSESTree.VariableDeclarator): boolean {
  const parent = node.parent?.parent;
  return (
    parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  );
}

/**
 * Check if a type alias is exported
 */
export function isExportedType(node: TSESTree.TSTypeAliasDeclaration): boolean {
  const parent = node.parent;
  return parent?.type === AST_NODE_TYPES.ExportNamedDeclaration;
}

/**
 * Check if an interface is exported
 */
export function isExportedInterface(
  node: TSESTree.TSInterfaceDeclaration
): boolean {
  const parent = node.parent;
  return parent?.type === AST_NODE_TYPES.ExportNamedDeclaration;
}

/**
 * Check if a type annotation is complex (union, intersection, etc.)
 */
export function isComplexType(typeAnnotation: TSESTree.TypeNode): boolean {
  return (
    typeAnnotation.type === AST_NODE_TYPES.TSUnionType ||
    typeAnnotation.type === AST_NODE_TYPES.TSIntersectionType ||
    typeAnnotation.type === AST_NODE_TYPES.TSMappedType ||
    typeAnnotation.type === AST_NODE_TYPES.TSConditionalType ||
    (typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral &&
      typeAnnotation.members.length > 2)
  );
}

/**
 * Check if a return type is complex
 */
export function isComplexReturnType(
  returnType: TSESTree.TSTypeAnnotation
): boolean {
  return isComplexType(returnType.typeAnnotation);
}

/**
 * Get JSDoc comment for a node
 */
export function getJsDocComment(
  node: TSESTree.Node,
  sourceCode: {
    getCommentsBefore: (
      node: TSESTree.Node
    ) => Array<{ type: string; value: string }>;
  }
): string | null {
  const comments = sourceCode.getCommentsBefore(node) as Array<{
    type: string;
    value: string;
  }>;
  const jsDocComment = comments.find(
    (comment) => comment.type === "Block" && comment.value.startsWith("*")
  );

  return jsDocComment ? jsDocComment.value : null;
}

/**
 * Check if a function is async
 */
export function isAsyncFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): boolean {
  return node.async === true;
}

/**
 * Extract route name from a filename
 */
export function getRouteName(filename: string): string {
  const parts = filename.split("/");
  const apiIndex = parts.indexOf("api");

  if (apiIndex !== -1) {
    return `/${parts
      .slice(apiIndex + 1)
      .join("/")
      .replace(/\.(ts|js)$/, "")}`;
  }

  const basename = parts.at(-1) ?? "";
  return basename.replace(/\.(ts|js)$/, "");
}

/**
 * Get the filename from the context
 */
// Using any for context type to avoid complex type inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function getFilename(context: any): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return context.getFilename?.() ?? context.filename ?? "";
}
