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

type MessageIds =
  | "zodSchemaMustBePascalCaseWithSuffix"
  | "renameToPascalCaseWithSchemaSuffix";

type Options = [];

const PARSE_METHODS = new Set([
  "parse",
  "parseAsync",
  "safeParse",
  "safeParseAsync",
]);

function isParseResult(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    PARSE_METHODS.has(node.callee.property.name)
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that Zod schemas are named with PascalCase and always suffixed with 'Schema'",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      zodSchemaMustBePascalCaseWithSuffix:
        "Zod schema '{{name}}' must use PascalCase and end with 'Schema' suffix (e.g., FormSchema, FeaturedDealSchema)",
      renameToPascalCaseWithSchemaSuffix:
        "Rename '{{name}}' to '{{nextName}}' (note: does not update references)",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          !isZodSchemaCall(node.init) ||
          isParseResult(node.init)
        ) {
          return;
        }

        const schemaName = node.id.name;
        if (isPascalCaseWithSchemaSuffix(schemaName)) {
          return;
        }

        const nextName = toPascalCaseWithSchemaSuffix(schemaName);
        const id = node.id;

        context.report({
          node: id,
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: schemaName },
          suggest:
            nextName === null
              ? []
              : [
                  {
                    messageId: "renameToPascalCaseWithSchemaSuffix",
                    data: { name: schemaName, nextName },
                    fix: (fixer): TSESLint.RuleFix =>
                      fixer.replaceText(id, nextName),
                  },
                ],
        });
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
