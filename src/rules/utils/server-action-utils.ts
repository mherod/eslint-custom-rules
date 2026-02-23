import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/**
 * Utility functions for detecting and working with Next.js Server Actions.
 * Consolidates detection logic used across multiple ESLint rules.
 */

/**
 * Check if a module name represents a server action module that clients can import from.
 * These modules contain server actions that are callable from client components.
 */
export function isActionModule(moduleName: string): boolean {
  const normalizedName = moduleName.replace(/\\/g, "/").toLowerCase();

  return (
    // Files with .action. in the name
    normalizedName.includes(".action.") ||
    // Files in /actions/ directories
    normalizedName.includes("/actions/") ||
    // Files in /lib/actions/ directories
    normalizedName.includes("/lib/actions/")
  );
}

/**
 * Check if a filename represents a server action file that should contain 'use server' directive.
 * These files typically export server actions that can be called from client components.
 */
export function isActionFile(filename: string): boolean {
  const normalizedPath = filename.replace(/\\/g, "/").toLowerCase();

  return (
    // Files in /actions/ directories
    normalizedPath.includes("/actions/") ||
    // Files with .action. extensions
    normalizedPath.endsWith(".action.ts") ||
    normalizedPath.endsWith(".action.tsx") ||
    normalizedPath.endsWith(".action.js") ||
    normalizedPath.endsWith(".action.jsx") ||
    // Files named exactly actions.ts (server action convention)
    normalizedPath.endsWith("/actions.ts") ||
    normalizedPath.endsWith("/actions.tsx") ||
    normalizedPath.endsWith("/actions.js") ||
    normalizedPath.endsWith("/actions.jsx") ||
    // Files in /lib/actions/ directories
    normalizedPath.includes("/lib/actions/") ||
    // Files in /app/actions/ directories
    normalizedPath.includes("/app/actions/")
  );
}

/**
 * Check if a filename represents a data/utility file that should use 'server-only' import.
 * These files contain sensitive server-side code that should never be imported by clients.
 */
export function isDataFile(filename: string): boolean {
  const normalizedPath = filename.replace(/\\/g, "/").toLowerCase();

  // Action files should never be considered data files
  if (isActionFile(filename)) {
    return false;
  }

  return (
    // API route handlers
    normalizedPath.includes("/api/") ||
    // Server directories (but not actions)
    (normalizedPath.includes("/server/") &&
      !normalizedPath.includes("/actions/")) ||
    // Library server directories
    normalizedPath.includes("/lib/server/") ||
    // Library data/database directories
    normalizedPath.includes("/lib/data/") ||
    normalizedPath.includes("/lib/db/") ||
    normalizedPath.includes("/lib/database/") ||
    // Data directories
    normalizedPath.includes("/data/") ||
    // Repositories
    normalizedPath.includes("/repositories/") ||
    // Models and services
    normalizedPath.includes("/models/") ||
    normalizedPath.includes("/services/")
  );
}

/**
 * Check if a function call is a server action call that should be wrapped in startTransition.
 */
export function isServerActionCall(
  node: TSESTree.CallExpression,
  sourceCode: { ast: TSESTree.Program }
): boolean {
  // Must have arguments to be a potential server action
  if (node.arguments.length === 0) {
    return false;
  }

  // Check if the function being called is imported from a server action module
  if (isImportedFromActionModule(node, sourceCode)) {
    return true;
  }

  // Check if any argument is FormData, Request, or NextRequest (direct construction)
  return node.arguments.some((arg) => {
    if (
      arg.type === AST_NODE_TYPES.NewExpression &&
      arg.callee.type === AST_NODE_TYPES.Identifier
    ) {
      // new FormData(), new Request(), etc.
      return ["FormData", "Request", "NextRequest"].includes(arg.callee.name);
    }
    return false;
  });
}

/**
 * Check if a called function is imported from a server action module.
 */
export function isImportedFromActionModule(
  node: TSESTree.CallExpression,
  sourceCode: { ast: TSESTree.Program }
): boolean {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const functionName = node.callee.name;

  // Look through import declarations to see if this function is imported
  const program = sourceCode.ast;
  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
      const importSource = statement.source.value;
      if (typeof importSource === "string") {
        // Check if imported from a server action file or actions directory
        if (isActionModule(importSource)) {
          // Check if the function is imported from this module
          const hasFunctionImport = statement.specifiers.some((spec) => {
            if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
              const importedName =
                spec.imported.type === AST_NODE_TYPES.Identifier
                  ? spec.imported.name
                  : spec.imported.value;
              return importedName === functionName;
            }
            // Default imports would need more complex checking
            return false;
          });

          if (hasFunctionImport) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Get the name of a server action being called.
 */
export function getActionName(node: TSESTree.CallExpression): string {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name;
  }

  return "unknown action";
}

/**
 * Check if a function declaration/expression represents a server action pattern.
 * Looks for async functions with FormData, Request, or NextRequest parameters.
 *
 * Detects two patterns:
 * 1. Standard: async function(formData: FormData)
 * 2. useActionState: async function(prevState: State, formData: FormData)
 */
export function isServerActionFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  params: TSESTree.Parameter[]
): boolean {
  // Must be async
  if (!node.async) {
    return false;
  }

  // Must have parameters
  if (params.length === 0) {
    return false;
  }

  // Helper to check if a parameter is FormData/Request/NextRequest
  const isActionParam = (param: TSESTree.Parameter): boolean => {
    if (param.type === AST_NODE_TYPES.Identifier) {
      const typeAnnotation = param.typeAnnotation;
      if (
        typeAnnotation?.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference
      ) {
        const typeName =
          typeAnnotation.typeAnnotation.typeName.type ===
          AST_NODE_TYPES.Identifier
            ? typeAnnotation.typeAnnotation.typeName.name
            : "";

        return ["FormData", "Request", "NextRequest"].includes(typeName);
      }
    }
    return false;
  };

  // Check first parameter (standard Server Action)
  if (params[0] && isActionParam(params[0])) {
    return true;
  }

  // Check second parameter (useActionState pattern)
  if (params.length >= 2 && params[1] && isActionParam(params[1])) {
    return true;
  }

  return false;
}

/**
 * Check if a function is an async exported function (RPC-style server function).
 * These are async functions callable from clients via 'use server' but don't
 * follow the traditional Server Action pattern (no FormData/Request params).
 *
 * Examples:
 * - export async function getEmailDraftsAction(): Promise<EmailDraft[]>
 * - export async function updateUserProfile(userId: string, data: ProfileData)
 */
export function isAsyncExportedFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
): boolean {
  // Must be async
  return node.async === true;
}
