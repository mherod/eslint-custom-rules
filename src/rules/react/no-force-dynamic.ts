import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-force-dynamic";

type MessageIds = "noForceDynamic";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: 'Prevent usage of export const dynamic = "force-dynamic"',
    },
    schema: [],
    messages: {
      noForceDynamic:
        'export const dynamic = "force-dynamic" is not allowed. Use proper Next.js caching patterns instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclaration(node: TSESTree.VariableDeclaration): void {
        // Check if this is an export declaration
        if (
          !node.parent ||
          node.parent.type !== AST_NODE_TYPES.ExportNamedDeclaration
        ) {
          return;
        }

        // Check each declaration in the variable declaration
        for (const declaration of node.declarations) {
          // Check if it's a const declaration
          if (node.kind !== "const") {
            continue;
          }

          // Check if the variable name is "dynamic"
          if (
            declaration.id.type === AST_NODE_TYPES.Identifier &&
            declaration.id.name === "dynamic"
          ) {
            // Check if the initializer is a string literal with value "force-dynamic"
            if (
              declaration.init &&
              declaration.init.type === AST_NODE_TYPES.Literal &&
              typeof declaration.init.value === "string" &&
              declaration.init.value === "force-dynamic"
            ) {
              context.report({
                node: declaration,
                messageId: "noForceDynamic",
              });
            }
          }
        }
      },
    };
  },
});
