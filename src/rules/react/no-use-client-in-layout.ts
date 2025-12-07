import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { getFilename } from "../utils/common";

export const RULE_NAME = "no-use-client-in-layout";

type MessageIds = "useClientInLayout";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent usage of 'use client' in Next.js layout files to protect performance",
    },
    schema: [],
    messages: {
      useClientInLayout:
        "Root and nested layouts should be Server Components to avoid de-optimizing the entire subtree. Move interactive logic to specific leaf components instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = getFilename(context);

    // Only check layout files
    if (!/layout\.(tsx|jsx|js|ts)$/.test(filename)) {
      return {};
    }

    return {
      Program(node) {
        // Check for "use client" directive
        if (node.body.length > 0) {
          const firstStatement = node.body[0];
          if (
            firstStatement &&
            firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
            firstStatement.expression.type === AST_NODE_TYPES.Literal &&
            firstStatement.expression.value === "use client"
          ) {
            context.report({
              node: firstStatement,
              messageId: "useClientInLayout",
            });
          }
        }
      },
    };
  },
});
