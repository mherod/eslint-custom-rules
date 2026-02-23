import type { TSESLint } from "@typescript-eslint/utils";
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-deprecated-declarations";

type Options = [];
type MessageIds = "deprecatedDeclaration";

const DEPRECATED_TAG_REGEX = /@deprecated\b/i;

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent exporting declarations that are marked as deprecated.",
    },
    schema: [],
    messages: {
      deprecatedDeclaration:
        "'@deprecated' declarations such as '{{name}}' must be removed before release.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const reportIfDeprecated = (node: TSESTree.Node, name: string): void => {
      if (!hasDeprecatedTag(node, sourceCode)) {
        return;
      }

      context.report({
        node,
        messageId: "deprecatedDeclaration",
        data: { name },
      });
    };

    return {
      FunctionDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id?.name ?? "default export function");
      },
      TSDeclareFunction(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id?.name ?? "declare function");
      },
      VariableDeclarator(node): void {
        if (!isExportedVariable(node)) {
          return;
        }
        if (node.id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        reportIfDeprecated(node, node.id.name);
      },
      ClassDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id?.name ?? "default export class");
      },
      TSTypeAliasDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id.name);
      },
      TSInterfaceDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id.name);
      },
      TSEnumDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        reportIfDeprecated(node, node.id.name);
      },
      TSModuleDeclaration(node): void {
        if (!isExported(node)) {
          return;
        }
        const name =
          node.id.type === AST_NODE_TYPES.Identifier
            ? node.id.name
            : node.id.type === AST_NODE_TYPES.Literal
              ? String(node.id.value)
              : "module";
        reportIfDeprecated(node, name);
      },
    };
  },
});

function hasDeprecatedTag(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode
): boolean {
  const candidates: (TSESTree.Node | undefined)[] = [
    node,
    node.parent,
    node.parent?.parent,
  ];

  return candidates.some((subject) =>
    subject ? getComments(subject, sourceCode) : false
  );

  function getComments(
    subject: TSESTree.Node,
    source: TSESLint.SourceCode
  ): boolean {
    const comments = source.getCommentsBefore(subject);
    return comments.some(
      (comment: TSESTree.Comment) =>
        (comment.type as string) === "Block" &&
        comment.value.trimStart().startsWith("*") &&
        DEPRECATED_TAG_REGEX.test(comment.value)
    );
  }
}

function isExported(node: TSESTree.Node): boolean {
  const parent = node.parent;
  return (
    parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  );
}

function isExportedVariable(node: TSESTree.VariableDeclarator): boolean {
  const parent = node.parent?.parent;
  return (
    parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  );
}
