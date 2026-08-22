import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { resolveSpecifiersSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-unresolvable-imports";

type MessageIds = "unresolvableImport";

type Options = [];

type ReferenceType =
  | "export-from"
  | "import"
  | "import-dynamic"
  | "jest-mock"
  | "require"
  | "require-resolve";

interface ModuleReference {
  node: TSESTree.Node;
  specifier: string;
  type: ReferenceType;
}

const MOCK_OBJECT_NAMES = new Set(["jest", "vi", "vitest"]);
const MOCK_METHOD_NAMES = new Set(["mock", "doMock", "unmock"]);

function getStringArgument(
  node: TSESTree.CallExpression | TSESTree.ImportExpression
): string | null {
  const firstArgument =
    node.type === AST_NODE_TYPES.ImportExpression
      ? node.source
      : node.arguments[0];

  if (
    firstArgument &&
    firstArgument.type === AST_NODE_TYPES.Literal &&
    typeof firstArgument.value === "string"
  ) {
    return firstArgument.value;
  }

  return null;
}

function classifyCallExpression(
  node: TSESTree.CallExpression
): ReferenceType | null {
  const callee = node.callee;

  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === "require") {
    return "require";
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    if (
      callee.object.name === "require" &&
      callee.property.name === "resolve"
    ) {
      return "require-resolve";
    }

    if (
      MOCK_OBJECT_NAMES.has(callee.object.name) &&
      MOCK_METHOD_NAMES.has(callee.property.name)
    ) {
      return "jest-mock";
    }
  }

  return null;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports and module references that TypeScript cannot resolve with the active project configuration",
    },
    schema: [],
    messages: {
      unresolvableImport:
        "Cannot resolve {{type}} '{{specifier}}': {{diagnostic}}",
    },
  },
  defaultOptions: [],
  create(context) {
    const references: ModuleReference[] = [];

    function collect(
      node: TSESTree.Node,
      specifier: string,
      type: ReferenceType
    ): void {
      references.push({ node, specifier, type });
    }

    return {
      ImportDeclaration(node): void {
        collect(node, node.source.value, "import");
      },
      ExportNamedDeclaration(node): void {
        if (node.source) {
          collect(node, node.source.value, "export-from");
        }
      },
      ExportAllDeclaration(node): void {
        collect(node, node.source.value, "export-from");
      },
      ImportExpression(node): void {
        const specifier = getStringArgument(node);
        if (specifier !== null) {
          collect(node, specifier, "import-dynamic");
        }
      },
      CallExpression(node): void {
        const type = classifyCallExpression(node);
        if (!type) {
          return;
        }

        const specifier = getStringArgument(node);
        if (specifier !== null) {
          collect(node, specifier, type);
        }
      },
      "Program:exit"(): void {
        if (references.length === 0) {
          return;
        }

        const uniqueSpecifiers = [
          ...new Set(references.map((reference) => reference.specifier)),
        ];
        const diagnostics = resolveSpecifiersSync({
          filePath: context.filename,
          specifiers: uniqueSpecifiers,
        });

        if (!diagnostics || diagnostics.length === 0) {
          return;
        }

        const diagnosticBySpecifier = new Map(
          diagnostics.map((diagnostic) => [diagnostic.specifier, diagnostic])
        );

        for (const reference of references) {
          const diagnostic = diagnosticBySpecifier.get(reference.specifier);
          if (!diagnostic) {
            continue;
          }

          const start = reference.node.loc.start;
          context.report({
            data: {
              diagnostic: diagnostic.diagnostic,
              specifier: reference.specifier,
              type: reference.type,
            },
            loc: {
              end: {
                column: start.column + 1,
                line: start.line,
              },
              start,
            },
            messageId: "unresolvableImport",
          });
        }
      },
    };
  },
});
