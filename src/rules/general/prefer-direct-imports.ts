import * as fs from "node:fs";
import * as path from "node:path";
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-direct-imports";

type MessageIds = "preferDirectImport";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description:
        "Prefer importing components directly from their files instead of barrel/index files to improve tree-shaking, avoid side effects, and prevent Turbopack eager evaluation crashes.",
    },
    schema: [],
    messages: {
      preferDirectImport:
        "Import '{{name}}' directly from its file (e.g. '{{source}}/{{kebabName}}') instead of the barrel file '{{source}}'. Barrel imports can trigger eager evaluation of all exported modules in Turbopack, causing 'createContext' errors in Server Components.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    // Folders that are allowed to act as barrels
    const whitelistedBarrelFolders = ["hooks"];

    // Cache project root for this file
    let projectRoot: string | null = null;

    const findProjectRoot = (startDir: string): string | null => {
      let current = startDir;
      while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, "tsconfig.json"))) {
          return current;
        }
        current = path.dirname(current);
      }
      return null;
    };

    const hasExport = (filePath: string, name: string): boolean => {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        // Basic regex check for named exports
        // Matches:
        // export const Name
        // export function Name
        // export class Name
        // export type Name
        // export interface Name
        // export async function Name
        // export { Name }
        // export { x as Name }
        // export default Name
        const namedExportRegex = new RegExp(
          `export\\s+(const|let|var|function|class|type|interface|async\\s+function)\\s+${name}\\b|export\\s+{[^}]*?\\b${name}\\b[^}]*?}|export\\s+default\\s+${name}\\b`,
          "m"
        );
        return namedExportRegex.test(content);
      } catch {
        return false;
      }
    };

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        // Skip type-only imports
        if (node.importKind === "type") {
          return;
        }

        const source = node.source.value;

        // Only check internal imports
        if (!source.startsWith("@/")) {
          return;
        }

        const pathSegments = source.split("/").filter(Boolean);
        const lastSegment = pathSegments.at(-1) ?? "";

        // Skip whitelisted barrel folders (e.g. @/hooks)
        if (
          whitelistedBarrelFolders.includes(lastSegment) ||
          source === `@/${lastSegment}` || // handle @/hooks directly
          whitelistedBarrelFolders.some((folder) =>
            source.endsWith(`/${folder}`)
          )
        ) {
          return;
        }

        // Get ALL specifiers, including types
        const specifiers = node.specifiers.filter(
          (s): s is TSESTree.ImportSpecifier =>
            s.type === AST_NODE_TYPES.ImportSpecifier
        );

        if (specifiers.length === 0) {
          return;
        }

        // Helper to check if a name matches the file segment (lenient check for acronyms)
        const isMatch = (name: string, segment: string): boolean => {
          if (segment === name) {
            return true;
          }
          const kebabName = name
            .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
            .toLowerCase();
          if (segment === kebabName) {
            return true;
          }

          // Lenient match for acronyms: TikTok -> tik-tok (kebab) vs tiktok (file)
          // We remove hyphens from both and compare
          return kebabName.replace(/-/g, "") === segment.replace(/-/g, "");
        };

        // Only check "value" imports for direct file import check
        const isDirectFileImport = specifiers.some((specifier) => {
          if (specifier.importKind === "type") {
            return false;
          }
          const name =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : specifier.imported.value;
          return isMatch(name, lastSegment);
        });

        if (isDirectFileImport) {
          return;
        }

        const movableSpecifiers: {
          specifier: TSESTree.ImportSpecifier;
          foundName: string;
          importedName: string;
          targetPath: string;
        }[] = [];

        // Track found anchor files to check for other exports (like types)
        const anchorFiles = new Map<string, string>(); // foundName -> targetPath

        // First pass: Find direct file matches for value imports
        specifiers.forEach((specifier) => {
          if (specifier.importKind === "type") {
            return;
          }

          const importedName =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : specifier.imported.value;

          // SPECIAL EXEMPTION: Server Actions
          if (lastSegment === "actions" && importedName.endsWith("Action")) {
            return;
          }

          const isPascalCase = /^[A-Z]/.test(importedName);

          const genericNames = [
            "index",
            "common",
            "shared",
            "ui",
            "buttons",
            "forms",
            "components",
            "utils",
            "lib",
            "types",
            "actions",
            "helpers",
            "constants",
            "services",
            "providers",
            "context",
          ];

          const isGenericBarrel = genericNames.includes(lastSegment);

          if (isPascalCase || isGenericBarrel) {
            // Verify if the direct file actually exists before reporting
            if (source.startsWith("@/")) {
              if (!projectRoot) {
                projectRoot = findProjectRoot(path.dirname(filename));
              }

              if (projectRoot) {
                const extensions = [".tsx", ".ts", ".jsx", ".js"];
                const targetDir = path.join(projectRoot, source.slice(2));

                let foundName: string | null = null;
                let foundPath: string | null = null;

                if (
                  fs.existsSync(targetDir) &&
                  fs.lstatSync(targetDir).isDirectory()
                ) {
                  const files = fs.readdirSync(targetDir);
                  for (const file of files) {
                    const ext = path.extname(file);
                    if (extensions.includes(ext)) {
                      const baseName = path.basename(file, ext);
                      if (isMatch(importedName, baseName)) {
                        const targetPath = path.join(targetDir, file);
                        if (hasExport(targetPath, importedName)) {
                          foundName = baseName;
                          foundPath = targetPath;
                          break;
                        }
                      }
                    }
                  }
                }

                if (foundName && foundPath) {
                  movableSpecifiers.push({
                    specifier,
                    foundName,
                    importedName,
                    targetPath: foundPath,
                  });
                  anchorFiles.set(foundName, foundPath);
                }
              }
            }
          }
        });

        // Second pass: Check if remaining specifiers (including types) are in anchor files
        specifiers.forEach((specifier) => {
          // Skip type-only specifiers as they don't affect runtime bundle
          if (specifier.importKind === "type") {
            return;
          }

          // Already handled in first pass
          if (movableSpecifiers.some((m) => m.specifier === specifier)) {
            return;
          }

          const importedName =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : specifier.imported.value;

          for (const [foundName, targetPath] of anchorFiles.entries()) {
            if (hasExport(targetPath, importedName)) {
              movableSpecifiers.push({
                specifier,
                foundName,
                importedName,
                targetPath,
              });
              break;
            }
          }
        });

        if (movableSpecifiers.length === 0) {
          return;
        }

        // Group movable specifiers by target file for better fixing
        const groupedMovable = new Map<
          string,
          {
            foundName: string;
            specifiers: { specifier: TSESTree.ImportSpecifier; name: string }[];
          }
        >();

        movableSpecifiers.forEach(({ specifier, foundName, importedName }) => {
          const group = groupedMovable.get(foundName) || {
            foundName,
            specifiers: [],
          };
          group.specifiers.push({ specifier, name: importedName });
          groupedMovable.set(foundName, group);
        });

        // Report each movable specifier
        movableSpecifiers.forEach(({ specifier, foundName, importedName }) => {
          context.report({
            node: specifier,
            messageId: "preferDirectImport",
            data: {
              name: importedName,
              source,
              kebabName: foundName,
            },
            fix(fixer) {
              const rawSource = sourceCode.getText(node.source);
              const quote = rawSource.startsWith("'") ? "'" : '"';

              // Case 1: All specifiers are movable
              const allMovable = node.specifiers.every((s) =>
                movableSpecifiers.some((m) => m.specifier === s)
              );

              if (allMovable && movableSpecifiers.length > 0) {
                // If they all go to the same file, just update the source
                const firstMovable = movableSpecifiers[0];
                if (!firstMovable) {
                  return null;
                }
                const firstFoundName = firstMovable.foundName;
                const allSameFile = movableSpecifiers.every(
                  (m) => m.foundName === firstFoundName
                );

                if (allSameFile) {
                  return fixer.replaceText(
                    node.source,
                    `${quote}${source}/${firstFoundName}${quote}`
                  );
                }

                // Otherwise split into multiple imports
                const newImports = Array.from(groupedMovable.values()).map(
                  (group) => {
                    const specs = group.specifiers
                      .map((s) => sourceCode.getText(s.specifier))
                      .join(", ");
                    return `import { ${specs} } from ${quote}${source}/${group.foundName}${quote};`;
                  }
                );
                return fixer.replaceText(node, newImports.join("\n"));
              }

              // Case 2: Partial move
              // This is more complex because we need to remove specifiers from the current node
              // and add new ones. To avoid conflict with other reports, we only fix if this is the
              // first movable specifier in its group, or we fix just this specifier.

              // For simplicity and safety, if it's a partial move, we remove the specifier
              // and insert a new import.

              const specifierText = sourceCode.getText(specifier);
              const newImport = `import { ${specifierText} } from ${quote}${source}/${foundName}${quote};`;

              const fixes: ReturnType<typeof fixer.insertTextAfter>[] = [];
              fixes.push(fixer.insertTextAfter(node, `\n${newImport}`));

              // Remove the specifier from the current list
              if (node.specifiers.length > 1) {
                const specifierIndex = node.specifiers.indexOf(specifier);
                if (specifierIndex === 0) {
                  // First specifier - remove it and the following comma
                  const nextSpecifier = node.specifiers[1];
                  if (nextSpecifier) {
                    fixes.push(
                      fixer.removeRange([
                        specifier.range[0],
                        nextSpecifier.range[0],
                      ])
                    );
                  }
                } else {
                  // Not first - remove it and the preceding comma
                  const prevSpecifier = node.specifiers[specifierIndex - 1];
                  if (prevSpecifier) {
                    fixes.push(
                      fixer.removeRange([
                        prevSpecifier.range[1],
                        specifier.range[1],
                      ])
                    );
                  }
                }
              }

              return fixes;
            },
          });
        });
      },
    };
  },
});
