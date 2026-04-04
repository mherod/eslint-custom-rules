import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  type DirectImportResolution,
  resolveDirectImportsSync,
} from "../utils/resect-sync-bridge";

export const RULE_NAME = "prefer-direct-imports";

type MessageIds = "preferDirectImport";

type Options = [];

const WHITELISTED_BARREL_FOLDERS = new Set(["hooks"]);

interface DirectImportFixPlan {
  groupedMovedSpecifiers: Map<string, TSESTree.ImportSpecifier[]>;
  keptSpecifiers: TSESTree.ImportSpecifier[];
  originalSpecifier: string;
  quote: '"' | "'";
}

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

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (node.importKind === "type") {
          return;
        }

        const source = node.source.value;
        if (typeof source !== "string" || !source.startsWith("@/")) {
          return;
        }

        const lastSegment = source.split("/").filter(Boolean).at(-1) ?? "";
        if (
          WHITELISTED_BARREL_FOLDERS.has(lastSegment) ||
          source.endsWith("/hooks")
        ) {
          return;
        }

        if (
          node.specifiers.some(
            (specifier) => specifier.type !== AST_NODE_TYPES.ImportSpecifier
          )
        ) {
          return;
        }

        const valueSpecifiers = node.specifiers.filter(
          (specifier): specifier is TSESTree.ImportSpecifier =>
            specifier.type === AST_NODE_TYPES.ImportSpecifier
        );

        if (valueSpecifiers.length === 0) {
          return;
        }

        const directImportResolutions = resolveDirectImportsSync({
          bindings: valueSpecifiers
            .filter((specifier) => specifier.importKind !== "type")
            .map((specifier) => ({
              importedName:
                specifier.imported.type === AST_NODE_TYPES.Identifier
                  ? specifier.imported.name
                  : specifier.imported.value,
            })),
          filePath: filename,
          specifier: source,
        });

        if (!directImportResolutions || directImportResolutions.length === 0) {
          return;
        }

        const resolutionsByImportedName = new Map(
          directImportResolutions.map((resolution) => [
            resolution.importedName,
            resolution,
          ])
        );

        const movableSpecifiers = valueSpecifiers.filter((specifier) => {
          if (specifier.importKind === "type") {
            return false;
          }

          const importedName =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : specifier.imported.value;

          if (lastSegment === "actions" && importedName.endsWith("Action")) {
            return false;
          }

          return resolutionsByImportedName.has(importedName);
        });

        if (movableSpecifiers.length === 0) {
          return;
        }

        const fixPlan = buildFixPlan({
          movableSpecifiers,
          node,
          originalSpecifier: source,
          quote: getQuoteCharacter(sourceCode.getText(node.source)),
          resolutionsByImportedName,
        });

        movableSpecifiers.forEach((specifier, index) => {
          const importedName =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : specifier.imported.value;
          const resolution = resolutionsByImportedName.get(importedName);

          if (!resolution) {
            return;
          }

          context.report({
            node: specifier,
            messageId: "preferDirectImport",
            data: {
              kebabName: resolution.pathSegment,
              name: importedName,
              source,
            },
            fix:
              index === 0
                ? (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                    fixer.replaceText(
                      node,
                      buildReplacementText(fixPlan, sourceCode)
                    )
                : null,
          });
        });
      },
    };
  },
});

function getQuoteCharacter(rawSource: string): '"' | "'" {
  return rawSource.startsWith("'") ? "'" : '"';
}

function buildFixPlan(input: {
  movableSpecifiers: TSESTree.ImportSpecifier[];
  node: TSESTree.ImportDeclaration;
  originalSpecifier: string;
  quote: '"' | "'";
  resolutionsByImportedName: Map<string, DirectImportResolution>;
}): DirectImportFixPlan {
  const movedSpecifierSet = new Set(input.movableSpecifiers);
  const groupedMovedSpecifiers = new Map<string, TSESTree.ImportSpecifier[]>();

  for (const specifier of input.movableSpecifiers) {
    const importedName =
      specifier.imported.type === AST_NODE_TYPES.Identifier
        ? specifier.imported.name
        : specifier.imported.value;
    const resolution = input.resolutionsByImportedName.get(importedName);

    if (!resolution) {
      continue;
    }

    const existingGroup =
      groupedMovedSpecifiers.get(resolution.newSpecifier) ?? [];
    existingGroup.push(specifier);
    groupedMovedSpecifiers.set(resolution.newSpecifier, existingGroup);
  }

  const keptSpecifiers = input.node.specifiers.filter(
    (specifier): specifier is TSESTree.ImportSpecifier =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier &&
      !movedSpecifierSet.has(specifier)
  );

  return {
    groupedMovedSpecifiers,
    keptSpecifiers,
    originalSpecifier: input.originalSpecifier,
    quote: input.quote,
  };
}

function buildReplacementText(
  fixPlan: DirectImportFixPlan,
  sourceCode: Readonly<TSESLint.SourceCode>
): string {
  const nextImports: string[] = [];

  if (fixPlan.keptSpecifiers.length > 0) {
    const keptImportText = fixPlan.keptSpecifiers
      .map((specifier) => sourceCode.getText(specifier))
      .join(", ");
    nextImports.push(
      `import { ${keptImportText} } from ${fixPlan.quote}${fixPlan.originalSpecifier}${fixPlan.quote};`
    );
  }

  for (const [nextSpecifier, specifiers] of fixPlan.groupedMovedSpecifiers) {
    const movedImportText = specifiers
      .map((specifier) => sourceCode.getText(specifier))
      .join(", ");
    nextImports.push(
      `import { ${movedImportText} } from ${fixPlan.quote}${nextSpecifier}${fixPlan.quote};`
    );
  }

  return nextImports.join("\n");
}
