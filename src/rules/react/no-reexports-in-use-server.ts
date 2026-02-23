import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-reexports-in-use-server";

type MessageIds = "reexportInUseServer" | "nonFunctionExportInUseServer";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow re-exports in files with 'use server' directive. " +
        "Next.js/Turbopack requires that 'use server' files only export locally-defined async functions.",
    },
    schema: [],
    messages: {
      reexportInUseServer:
        "Re-exports are not allowed in files with 'use server' directive. " +
        "Next.js requires 'use server' files to only export async functions defined locally in that file. " +
        "Either: (1) Remove 'use server' from this barrel file, or (2) Remove this re-export and have consumers import directly from '{{ source }}'.",
      nonFunctionExportInUseServer:
        "Non-function exports are not allowed in files with 'use server' directive. " +
        "Only async functions can be exported from Server Action files. " +
        "Move this export to a separate file without 'use server', or convert it to an async function.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    let hasUseServerDirective = false;

    const program = sourceCode.ast;
    for (let i = 0; i < Math.min(5, program.body.length); i++) {
      const statement = program.body[i];
      if (!statement) {
        continue;
      }
      if (
        statement.type === AST_NODE_TYPES.ExpressionStatement &&
        statement.expression.type === AST_NODE_TYPES.Literal &&
        statement.expression.value === "use server"
      ) {
        hasUseServerDirective = true;
        break;
      }
      if (
        statement.type === AST_NODE_TYPES.ImportDeclaration ||
        (statement.type === AST_NODE_TYPES.ExpressionStatement &&
          statement.expression.type !== AST_NODE_TYPES.Literal)
      ) {
        break;
      }
    }

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (!hasUseServerDirective) {
          return;
        }

        if (node.source) {
          context.report({
            node,
            messageId: "reexportInUseServer",
            data: {
              source:
                node.source.type === AST_NODE_TYPES.Literal
                  ? String(node.source.value)
                  : "",
            },
          });
          return;
        }

        if (node.declaration) {
          const decl = node.declaration;

          if (decl.type === AST_NODE_TYPES.FunctionDeclaration) {
            if (!decl.async) {
              context.report({
                node,
                messageId: "nonFunctionExportInUseServer",
              });
            }
            return;
          }

          if (
            decl.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
            decl.type === AST_NODE_TYPES.TSInterfaceDeclaration
          ) {
            return;
          }

          if (
            decl.type === AST_NODE_TYPES.TSEnumDeclaration ||
            decl.type === AST_NODE_TYPES.ClassDeclaration
          ) {
            context.report({ node, messageId: "nonFunctionExportInUseServer" });
            return;
          }

          if (decl.type === AST_NODE_TYPES.VariableDeclaration) {
            for (const declarator of decl.declarations) {
              if (
                declarator.init &&
                (declarator.init.type ===
                  AST_NODE_TYPES.ArrowFunctionExpression ||
                  declarator.init.type === AST_NODE_TYPES.FunctionExpression) &&
                declarator.init.async
              ) {
                continue;
              }
              if (declarator.init) {
                context.report({
                  node: declarator,
                  messageId: "nonFunctionExportInUseServer",
                });
              }
            }
          }
        }
      },

      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration): void {
        if (!hasUseServerDirective) {
          return;
        }
        context.report({
          node,
          messageId: "reexportInUseServer",
          data: {
            source:
              node.source.type === AST_NODE_TYPES.Literal
                ? String(node.source.value)
                : "",
          },
        });
      },
    };
  },
});
