import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-long-relative-imports";

type MessageIds = "noLongRelativeImports";

type Options = [
  {
    maxDepth?: number;
  },
];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow overly long relative imports and prefer absolute imports using aliases",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: {
            type: "number",
            minimum: 1,
            default: 3,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noLongRelativeImports:
        "Avoid using long relative imports (depth > {{depth}}). Use path aliases (e.g. @/) instead.",
    },
  },
  defaultOptions: [
    {
      maxDepth: 3,
    },
  ],
  create(context) {
    const options = context.options[0] || {};
    const maxDepth = options.maxDepth || 3;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const importPath = node.source.value;

        if (typeof importPath !== "string") {
          return;
        }

        // Count occurrences of "../"
        // Note: this simple regex matches ../ at the start or after a /
        // It correctly handles ../../../
        const parentDirCount = (importPath.match(/\.\.\//g) || []).length;

        if (parentDirCount > maxDepth) {
          context.report({
            node: node.source,
            messageId: "noLongRelativeImports",
            data: {
              depth: maxDepth,
            },
          });
        }
      },
    };
  },
});
