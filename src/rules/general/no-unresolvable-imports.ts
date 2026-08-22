import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { resolveUnresolvableImportSpecifiersSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-unresolvable-imports";

type MessageIds = "unresolvableImport";

type Options = [];

type ImportReferenceType =
  | "export-from"
  | "import"
  | "import-dynamic"
  | "jest-mock"
  | "require"
  | "require-resolve";

interface ImportReference {
  node: TSESTree.Node;
  specifier: string;
  type: ImportReferenceType;
}

const MOCK_OBJECT_NAMES = new Set(["jest", "vi", "vitest"]);
const MOCK_METHOD_NAMES = new Set(["doMock", "mock", "unmock"]);

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
    const references: ImportReference[] = [];

    function collectReference(
      node: TSESTree.Node,
      specifier: string,
      type: ImportReferenceType
    ): void {
      references.push({ node, specifier, type });
    }

    function reportUnresolvableReferences(): void {
      if (references.length === 0) {
        return;
      }

      const specifiers = [
        ...new Set(references.map((reference) => reference.specifier)),
      ];
      const resolutions = resolveUnresolvableImportSpecifiersSync({
        filePath: context.filename,
        specifiers,
      });

      if (!resolutions || resolutions.length === 0) {
        return;
      }

      const diagnosticsBySpecifier = new Map<string, string>();
      for (const resolution of resolutions) {
        diagnosticsBySpecifier.set(
          resolution.specifier,
          resolution.diagnostic
        );
      }

      for (const reference of references) {
        const diagnostic = diagnosticsBySpecifier.get(reference.specifier);
        if (diagnostic === undefined) {
          continue;
        }

        context.report({
          data: {
            diagnostic,
            specifier: reference.specifier,
            type: reference.type,
          },
          messageId: "unresolvableImport",
          node: reference.node,
        });
      }
    }

    return {
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration): void {
        if (typeof node.source.value === "string") {
          collectReference(node, node.source.value, "export-from");
        }
      },

      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (typeof node.source?.value === "string") {
          collectReference(node, node.source.value, "export-from");
        }
      },

      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (typeof node.source.value === "string") {
          collectReference(node, node.source.value, "import");
        }
      },

      ImportExpression(node: TSESTree.ImportExpression): void {
        const specifier = getStringLiteralValue(node.source);
        if (specifier !== null) {
          collectReference(node, specifier, "import-dynamic");
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        const specifier = getStringLiteralValue(node.arguments[0]);
        if (specifier === null) {
          return;
        }

        const type = getCallReferenceType(node);
        if (type !== null) {
          collectReference(node, specifier, type);
        }
      },

      "Program:exit": reportUnresolvableReferences,
    };
  },
});

function getStringLiteralValue(node: TSESTree.Node | undefined): string | null {
  if (
    node?.type !== AST_NODE_TYPES.Literal ||
    typeof node.value !== "string"
  ) {
    return null;
  }

  return node.value;
}

function getCallReferenceType(
  node: TSESTree.CallExpression
): ImportReferenceType | null {
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "require"
  ) {
    return "require";
  }

  if (
    node.callee.type !== AST_NODE_TYPES.MemberExpression ||
    node.callee.computed ||
    node.callee.object.type !== AST_NODE_TYPES.Identifier ||
    node.callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return null;
  }

  const objectName = node.callee.object.name;
  const methodName = node.callee.property.name;

  if (objectName === "require" && methodName === "resolve") {
    return "require-resolve";
  }

  if (
    MOCK_OBJECT_NAMES.has(objectName) &&
    MOCK_METHOD_NAMES.has(methodName)
  ) {
    return "jest-mock";
  }

  return null;
}
