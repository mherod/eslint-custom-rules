import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  isPascalCaseWithSchemaSuffix,
  isZodMethod,
  toPascalCaseWithSchemaSuffix,
} from "../utils/zod-utils";

export const RULE_NAME = "enforce-zod-schema-naming";

type MessageIds = "zodSchemaMustBePascalCaseWithSuffix";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that Zod schemas are named with PascalCase and always suffixed with 'Schema'",
    },
    fixable: "code",
    schema: [],
    messages: {
      zodSchemaMustBePascalCaseWithSuffix:
        "Zod schema '{{name}}' must use PascalCase and end with 'Schema' suffix (e.g., FormSchema, FeaturedDealSchema)",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        // Check if this is a Zod schema variable declaration
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.init &&
          isZodSchemaCall(node.init)
        ) {
          const schemaName = node.id.name;

          // Check if the name follows PascalCase and ends with 'Schema'
          if (!isPascalCaseWithSchemaSuffix(schemaName)) {
            const nextName = toPascalCaseWithSchemaSuffix(schemaName);

            context.report({
              node: node.id,
              messageId: "zodSchemaMustBePascalCaseWithSuffix",
              data: { name: schemaName },
              fix:
                nextName === null
                  ? null
                  : (fixer): TSESLint.RuleFix =>
                      fixer.replaceText(node.id, nextName),
            });
          }
        }
      },
    };
  },
});

function isZodSchemaCall(node: TSESTree.Node): boolean {
  // Check for direct z.object(), z.string(), etc.
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === "z"
  ) {
    return true;
  }

  // Check for chained Zod methods like z.object().required()
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    isZodSchemaCall(node.callee.object)
  ) {
    return true;
  }

  // Check for imported Zod functions (e.g., object(), string())
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    isZodMethod(node.callee.name)
  ) {
    return true;
  }

  return false;
}
