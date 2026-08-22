import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { findUnusedExportsSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-unused-exports";

type MessageIds = "unnecessaryExport" | "unusedExport";

type Options = [];

interface CollectedExport {
  line: number;
  name: string;
  node: TSESTree.Node;
}

function exportedName(
  node: TSESTree.Identifier | TSESTree.StringLiteral
): string {
  return node.type === AST_NODE_TYPES.Identifier ? node.name : node.value;
}

function collectNamedDeclaration(
  node: TSESTree.ExportNamedDeclaration,
  collectedExports: CollectedExport[]
): void {
  const { declaration } = node;
  if (!declaration) {
    for (const specifier of node.specifiers) {
      collectedExports.push({
        line: specifier.loc.start.line,
        name: exportedName(specifier.exported),
        node: specifier,
      });
    }
    return;
  }

  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    for (const variable of declaration.declarations) {
      if (variable.id.type === AST_NODE_TYPES.Identifier) {
        collectedExports.push({
          line: node.loc.start.line,
          name: variable.id.name,
          node: variable.id,
        });
      }
    }
    return;
  }

  if (
    declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
    declaration.type === AST_NODE_TYPES.ClassDeclaration ||
    declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
    declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
    declaration.type === AST_NODE_TYPES.TSEnumDeclaration
  ) {
    const identifier = declaration.id;
    if (identifier) {
      collectedExports.push({
        line: node.loc.start.line,
        name: identifier.name,
        node: identifier,
      });
    }
  }
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect statically unused exports in projects that opt in and exclude custom convention entrypoints with ESLint overrides",
    },
    schema: [],
    messages: {
      unnecessaryExport:
        "Export '{{name}}' is used only within this file; remove its export modifier.",
      unusedExport:
        "Export '{{name}}' is never imported by another project file.",
    },
  },
  defaultOptions: [],
  create(context) {
    const collectedExports: CollectedExport[] = [];

    return {
      ExportAllDeclaration(node): void {
        if (node.exported) {
          collectedExports.push({
            line: node.exported.loc.start.line,
            name: exportedName(node.exported),
            node: node.exported,
          });
        }
      },
      ExportDefaultDeclaration(node): void {
        const declaration = node.declaration;
        if (
          (declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
            declaration.type === AST_NODE_TYPES.ClassDeclaration) &&
          declaration.id
        ) {
          collectedExports.push({
            line: node.loc.start.line,
            name: declaration.id.name,
            node: declaration.id,
          });
          return;
        }

        collectedExports.push({
          line: node.loc.start.line,
          name: "default",
          node,
        });
      },
      ExportNamedDeclaration(node): void {
        collectNamedDeclaration(node, collectedExports);
      },
      "Program:exit"(): void {
        if (collectedExports.length === 0) {
          return;
        }

        const diagnostics = findUnusedExportsSync({
          filePath: context.filename,
        });
        if (!diagnostics || diagnostics.length === 0) {
          return;
        }

        for (const diagnostic of diagnostics) {
          const collectedExport =
            collectedExports.find(
              (candidate) =>
                candidate.line === diagnostic.line &&
                candidate.name === diagnostic.name
            ) ??
            collectedExports.find(
              (candidate) => candidate.line === diagnostic.line
            );
          if (!collectedExport) {
            continue;
          }

          context.report({
            data: { name: diagnostic.name },
            messageId: diagnostic.internalUsage
              ? "unnecessaryExport"
              : "unusedExport",
            node: collectedExport.node,
          });
        }
      },
    };
  },
});
