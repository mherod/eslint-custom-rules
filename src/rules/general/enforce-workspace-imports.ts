import { dirname, normalize, resolve } from "node:path";
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

// Single source of truth for workspace packages
const WORKSPACE_PACKAGES = [
  "shared-utils",
  "shared-web-ui",
  "shared-web-hooks",
  "shared-schemas",
  "shared-auth",
  "shared-next-config",
  "server-data",
  "server-utils",
  "server-crm",
  "server-schemas",
  "customerio-pipelines",
  "customerio-app-api",
  "eslint-custom-rules",
  "eslint-plugin-custom",
] as const;

// Single source of truth for package dependencies
const PACKAGE_DEPENDENCIES = {
  "main-web": [
    "shared-utils",
    "shared-web-ui",
    "shared-web-hooks",
    "shared-schemas",
    "shared-auth",
    "shared-next-config",
    "server-data",
    "eslint-plugin-custom",
  ],
  "identity-web": [
    "shared-utils",
    "shared-web-ui",
    "shared-web-hooks",
    "shared-schemas",
    "shared-auth",
    "shared-next-config",
    "server-data",
    "eslint-plugin-custom",
  ],
  functions: [
    "shared-utils",
    "shared-schemas",
    "server-data",
    "server-utils",
    "server-crm",
    "server-schemas",
    "customerio-pipelines",
    "customerio-app-api",
    "eslint-plugin-custom",
  ],
  "shared-web-ui": ["shared-utils"],
  "shared-web-hooks": ["shared-utils"],
  "shared-schemas": ["shared-utils"],
  "shared-auth": ["shared-utils", "shared-schemas"],
  "shared-next-config": ["shared-utils"],
  "server-data": ["shared-utils", "shared-schemas"],
  "server-utils": ["shared-utils", "shared-schemas"],
  "server-crm": [
    "shared-utils",
    "shared-schemas",
    "server-data",
    "customerio-pipelines",
    "customerio-app-api",
  ],
  "server-schemas": ["shared-utils"],
  "customerio-pipelines": ["shared-schemas"],
  "customerio-app-api": ["shared-schemas"],
  "eslint-custom-rules": [],
  "eslint-plugin-custom": [],
} as const;

export const RULE_NAME = "enforce-workspace-imports";

// Constants for regex patterns
const APPS_PATH_REGEX = /\/apps\/([^/]+)/;
const PACKAGES_PATH_REGEX = /\/packages\/([^/]+)/;

type MessageIds =
  | "useWorkspaceImport"
  | "invalidWorkspaceImport"
  | "circularWorkspaceDependency"
  | "unauthorizedWorkspaceImport"
  | "preferWorkspaceProtocol"
  | "missingWorkspacePrefix";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce proper workspace package imports and prevent unauthorized access",
    },
    fixable: "code",
    schema: [],
    messages: {
      useWorkspaceImport:
        "Use workspace import '@mherod/{{package}}' instead of relative path '{{path}}'",
      invalidWorkspaceImport:
        "Invalid workspace import '{{import}}'. Available packages: {{packages}}",
      circularWorkspaceDependency:
        "Circular dependency detected: package '{{from}}' cannot import from '{{to}}'",
      unauthorizedWorkspaceImport:
        "Package '{{from}}' is not authorized to import from '{{to}}'. Check workspace dependencies.",
      preferWorkspaceProtocol:
        "Use 'workspace:*' protocol in package.json for workspace dependencies",
      missingWorkspacePrefix: "Workspace imports must use '@mherod/' prefix",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const currentPackage = getCurrentPackage(filename);

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importSource = node.source.value;

        if (typeof importSource !== "string") {
          return;
        }

        // Check for relative imports to workspace packages
        if (
          importSource.startsWith("../") ||
          importSource.startsWith("../../")
        ) {
          const resolvedPath = resolve(dirname(filename), importSource);
          const targetPackage = getPackageFromPath(resolvedPath);

          if (targetPackage && targetPackage !== currentPackage) {
            context.report({
              node,
              messageId: "useWorkspaceImport",
              data: {
                package: targetPackage,
                path: importSource,
              },
              fix(fixer) {
                return fixer.replaceText(
                  node.source,
                  `"@mherod/${targetPackage}"`
                );
              },
            });
          }
        }

        // Check workspace imports
        if (importSource.startsWith("@mherod/")) {
          const packageName = importSource.replace("@mherod/", "");

          // Validate package exists
          if (!isValidWorkspacePackage(packageName)) {
            context.report({
              node,
              messageId: "invalidWorkspaceImport",
              data: {
                import: importSource,
                packages: getAvailablePackages().join(", "),
              },
            });
          }

          // Check for circular dependencies
          if (hasCircularDependency(currentPackage, packageName)) {
            context.report({
              node,
              messageId: "circularWorkspaceDependency",
              data: {
                from: currentPackage,
                to: packageName,
              },
            });
          }

          // Check if import is authorized
          if (!isAuthorizedImport(currentPackage, packageName)) {
            context.report({
              node,
              messageId: "unauthorizedWorkspaceImport",
              data: {
                from: currentPackage,
                to: packageName,
              },
            });
          }
        }

        // Check for imports without workspace prefix
        if (
          isWorkspacePackageName(importSource) &&
          !importSource.startsWith("@mherod/")
        ) {
          context.report({
            node,
            messageId: "missingWorkspacePrefix",
            fix(fixer) {
              return fixer.replaceText(
                node.source,
                `"@mherod/${importSource}"`
              );
            },
          });
        }
      },
    };
  },
});

function getCurrentPackage(filename: string): string | null {
  const normalizedPath = normalize(filename);

  // Check if it's in apps directory
  const appsMatch = normalizedPath.match(APPS_PATH_REGEX);
  if (appsMatch?.[1]) {
    return appsMatch[1];
  }

  // Check if it's in packages directory
  const packagesMatch = normalizedPath.match(PACKAGES_PATH_REGEX);
  if (packagesMatch?.[1]) {
    return packagesMatch[1];
  }

  return null;
}

function getPackageFromPath(filePath: string): string | null {
  const normalizedPath = normalize(filePath);

  // Check if path points to a workspace package
  const appsMatch = normalizedPath.match(APPS_PATH_REGEX);
  if (appsMatch?.[1]) {
    return appsMatch[1];
  }

  const packagesMatch = normalizedPath.match(PACKAGES_PATH_REGEX);
  if (packagesMatch?.[1]) {
    return packagesMatch[1];
  }

  return null;
}

function isValidWorkspacePackage(packageName: string): boolean {
  return (WORKSPACE_PACKAGES as string[]).includes(packageName);
}

function getAvailablePackages(): string[] {
  return [...WORKSPACE_PACKAGES];
}

function hasCircularDependency(
  fromPackage: string | null,
  toPackage: string
): boolean {
  if (!fromPackage) {
    return false;
  }

  // Check if toPackage depends on fromPackage (would create cycle)
  const toDependencies =
    PACKAGE_DEPENDENCIES[toPackage as keyof typeof PACKAGE_DEPENDENCIES] || [];
  return (toDependencies as readonly string[]).includes(fromPackage);
}

function isAuthorizedImport(
  fromPackage: string | null,
  toPackage: string
): boolean {
  if (!fromPackage) {
    return true;
  }

  const allowedImports =
    PACKAGE_DEPENDENCIES[fromPackage as keyof typeof PACKAGE_DEPENDENCIES] ||
    [];
  return (allowedImports as readonly string[]).includes(toPackage);
}

function isWorkspacePackageName(importSource: string): boolean {
  return (WORKSPACE_PACKAGES as string[]).includes(importSource);
}
