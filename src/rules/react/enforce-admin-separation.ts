import { dirname, normalize, resolve } from "node:path";
import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "enforce-admin-separation";

type MessageIds =
  | "publicImportingAdmin"
  | "adminImportingPublic"
  | "adminComponentInPublic"
  | "publicComponentInAdmin"
  | "adminUtilInPublic"
  | "sharedLibraryAllowed";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce separation between admin and public code to prevent unauthorized access",
    },
    schema: [],
    messages: {
      publicImportingAdmin:
        "Public component cannot import admin component '{{component}}'. Admin components should only be accessible within admin routes.",
      adminImportingPublic:
        "Admin component importing public component '{{component}}' - consider if this component should be in shared utilities instead.",
      adminComponentInPublic:
        "Admin component '{{component}}' is being used in public code. Move to admin directory or create public version.",
      publicComponentInAdmin:
        "Public component '{{component}}' in admin directory - consider if this should be an admin-specific component.",
      adminUtilInPublic:
        "Admin utility '{{utility}}' is being used in public code. Move to shared utilities or create public version.",
      sharedLibraryAllowed:
        "Shared library imports are allowed between admin and public code.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const normalizedPath = normalize(filename);

    const isAdminFile = isAdminPath(normalizedPath);
    const isPublicFile = isPublicPath(normalizedPath);
    const isSharedFile = isSharedPath(normalizedPath);

    // Skip if it's a shared file - these can be imported by both admin and public
    if (isSharedFile) {
      return {};
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importSource = node.source.value;

        if (typeof importSource !== "string") {
          return;
        }

        // Check if import is relative (local file)
        if (importSource.startsWith(".")) {
          validateLocalImport(
            context,
            node,
            importSource,
            filename,
            isAdminFile,
            isPublicFile
          );
        }

        // Check if import is from internal alias (@/)
        if (importSource.startsWith("@/")) {
          validateAliasImport(
            context,
            node,
            importSource,
            filename,
            isAdminFile,
            isPublicFile
          );
        }
      },

      // Check for JSX usage of admin components in public files
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (node.name.type === "JSXIdentifier") {
          const componentName = node.name.name;

          // Check if a public file is using an admin component
          if (isPublicFile && isAdminComponentName(componentName)) {
            context.report({
              node,
              messageId: "adminComponentInPublic",
              data: { component: componentName },
            });
          }
        }
      },

      // Check for admin utilities being called in public files
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type === "Identifier") {
          const functionName = node.callee.name;

          if (isPublicFile && isAdminUtilityName(functionName)) {
            context.report({
              node,
              messageId: "adminUtilInPublic",
              data: { utility: functionName },
            });
          }
        }
      },
    };
  },
});

function isAdminPath(filePath: string): boolean {
  return (
    filePath.includes("/admin/") ||
    filePath.includes("/dashboard/") ||
    filePath.includes("/management/")
  );
}

function isPublicPath(filePath: string): boolean {
  // Public paths are everything that's not admin, shared, or special directories
  return !(
    isAdminPath(filePath) ||
    isSharedPath(filePath) ||
    filePath.includes("/api/") ||
    filePath.includes("/server/") ||
    filePath.includes("/__tests__/") ||
    filePath.includes("/node_modules/")
  );
}

function isSharedPath(filePath: string): boolean {
  // Shared paths that can be imported by both admin and public
  return (
    filePath.includes("/lib/") ||
    filePath.includes("/utils/") ||
    filePath.includes("/shared/") ||
    filePath.includes("/common/") ||
    filePath.includes("/types/") ||
    filePath.includes("/constants/") ||
    filePath.includes("/config/") ||
    filePath.includes("/hooks/") ||
    filePath.includes("/providers/") ||
    filePath.includes("/context/") ||
    filePath.includes("/store/") ||
    filePath.includes("/validation/") ||
    filePath.includes("/schemas/")
  );
}

function validateLocalImport(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  node: TSESTree.ImportDeclaration,
  importSource: string,
  currentFile: string,
  isCurrentAdmin: boolean,
  isCurrentPublic: boolean
): void {
  // Resolve the imported file path
  const currentDir = dirname(currentFile);
  const importedPath = resolve(currentDir, importSource);

  const isImportedAdmin = isAdminPath(importedPath);
  const isImportedPublic = isPublicPath(importedPath);
  const isImportedShared = isSharedPath(importedPath);

  // Allow shared imports
  if (isImportedShared) {
    return;
  }

  // Public file importing admin file
  if (isCurrentPublic && isImportedAdmin) {
    context.report({
      node,
      messageId: "publicImportingAdmin",
      data: { component: importSource },
    });
  }

  // Admin file importing public file (warning, not error)
  if (isCurrentAdmin && isImportedPublic) {
    context.report({
      node,
      messageId: "adminImportingPublic",
      data: { component: importSource },
    });
  }
}

function validateAliasImport(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  node: TSESTree.ImportDeclaration,
  importSource: string,
  _currentFile: string,
  isCurrentAdmin: boolean,
  isCurrentPublic: boolean
): void {
  // Remove @/ prefix and check the path
  const cleanPath = importSource.replace("@/", "");

  const isImportedAdmin = isAdminPath(cleanPath);
  const isImportedPublic = isPublicPath(cleanPath);
  const isImportedShared = isSharedPath(cleanPath);

  // Allow shared imports
  if (isImportedShared) {
    return;
  }

  // Public file importing admin file
  if (isCurrentPublic && isImportedAdmin) {
    context.report({
      node,
      messageId: "publicImportingAdmin",
      data: { component: importSource },
    });
  }

  // Admin file importing public file (warning)
  if (isCurrentAdmin && isImportedPublic) {
    context.report({
      node,
      messageId: "adminImportingPublic",
      data: { component: importSource },
    });
  }
}

function isAdminComponentName(componentName: string): boolean {
  // Admin components typically have these prefixes/patterns
  const adminPrefixes = [
    "Admin",
    "Dashboard",
    "Management",
    "Manager",
    "Control",
    "Panel",
    "Console",
    "Settings",
    "Config",
    "Moderator",
    "Supervisor",
  ];

  const adminSuffixes = [
    "Admin",
    "Dashboard",
    "Panel",
    "Console",
    "Manager",
    "Control",
    "Settings",
  ];

  return (
    adminPrefixes.some((prefix) => componentName.startsWith(prefix)) ||
    adminSuffixes.some((suffix) => componentName.endsWith(suffix))
  );
}

function isAdminUtilityName(functionName: string): boolean {
  // Admin utilities typically have these patterns
  const adminUtilPatterns = [
    "admin",
    "manage",
    "moderate",
    "control",
    "supervise",
    "dashboard",
    "panel",
    "console",
    "settings",
    "config",
    "permission",
    "role",
    "grant",
    "revoke",
    "ban",
    "unban",
    "suspend",
    "activate",
    "deactivate",
    "approve",
    "reject",
    "delete",
    "purge",
    "cleanup",
    "migrate",
    "backup",
    "restore",
    "analytics",
    "metrics",
    "reports",
    "logs",
    "audit",
    "monitor",
  ];

  const lowerFunctionName = functionName.toLowerCase();
  return adminUtilPatterns.some((pattern) =>
    lowerFunctionName.includes(pattern)
  );
}
