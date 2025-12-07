import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-lodash-es-imports";

type MessageIds = "preferLodashEs" | "preferNamedImports" | "noFullImport";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce using lodash-es and named imports for better tree-shaking",
    },
    schema: [],
    messages: {
      preferLodashEs:
        "Prefer 'lodash-es' over 'lodash' for better tree-shaking and ES module support.",
      preferNamedImports:
        "Use named imports (e.g., `import { merge } from 'lodash-es'`) instead of default or namespace imports.",
      noFullImport:
        "Do not import the full lodash library. Use named imports from 'lodash-es'.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const sourceValue = node.source.value;

        // 1. Check for 'lodash' import
        if (sourceValue === "lodash") {
          context.report({
            node,
            messageId: "preferLodashEs",
            fix(fixer) {
              return fixer.replaceText(node.source, "'lodash-es'");
            },
          });
        }

        // 2. Check for 'lodash-es' checks
        if (sourceValue === "lodash-es" || sourceValue === "lodash") {
          // Check for default import: import _ from 'lodash-es'
          const defaultSpecifier = node.specifiers.find(
            (s) => s.type === AST_NODE_TYPES.ImportDefaultSpecifier
          );
          if (defaultSpecifier) {
            context.report({
              node: defaultSpecifier,
              messageId: "preferNamedImports",
            });
          }

          // Check for namespace import: import * as _ from 'lodash-es'
          const namespaceSpecifier = node.specifiers.find(
            (s) => s.type === AST_NODE_TYPES.ImportNamespaceSpecifier
          );
          if (namespaceSpecifier) {
            context.report({
              node: namespaceSpecifier,
              messageId: "noFullImport",
            });
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "require" &&
          node.arguments.length === 1
        ) {
          const arg = node.arguments[0];
          if (
            arg &&
            arg.type === AST_NODE_TYPES.Literal &&
            arg.value === "lodash"
          ) {
            context.report({
              node,
              messageId: "preferLodashEs",
              fix(fixer) {
                return fixer.replaceText(arg, "'lodash-es'");
              },
            });
          }
        }
      },
    };
  },
});
