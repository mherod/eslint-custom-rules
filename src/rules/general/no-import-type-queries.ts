import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-import-type-queries";

type MessageIds = "noImportTypeQueries";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow import() type queries and require top-level type imports.",
    },
    schema: [],
    messages: {
      noImportTypeQueries:
        "Avoid import() type queries{{moduleHint}}. Use a top-level `import type` instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const getModuleName = (node: TSESTree.TSImportType): string | null => {
      const { source } = node;
      if (typeof source.value === "string") {
        return source.value;
      }
      return null;
    };

    return {
      TSImportType(node: TSESTree.TSImportType): void {
        const moduleName = getModuleName(node);
        const moduleHint = moduleName ? ` from "${moduleName}"` : "";

        context.report({
          node,
          messageId: "noImportTypeQueries",
          data: { moduleHint },
        });
      },
    };
  },
});
