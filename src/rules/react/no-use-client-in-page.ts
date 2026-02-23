import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { getFilename } from "../utils/common";
import {
  hasUseClientDirective,
  normalizePath,
} from "../utils/component-type-utils";

export const RULE_NAME = "no-use-client-in-page";

type MessageIds = "useClientInPage";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: "Prevent usage of 'use client' in Next.js page files",
    },
    schema: [],
    messages: {
      useClientInPage:
        "Next.js Page components should be Server Components to ensure proper data fetching and SEO. Move interactive logic to a separate Client Component.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = getFilename(context);

    // Only check page files in app directory
    if (
      !(
        /page\.(tsx|jsx|js|ts)$/.test(filename) &&
        normalizePath(filename).includes("/app/")
      )
    ) {
      return {};
    }

    return {
      Program(node): void {
        if (!hasUseClientDirective(context.getSourceCode())) {
          return;
        }
        // Report on the "use client" directive statement if found
        const firstStatement = node.body[0];
        if (
          firstStatement &&
          firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
          firstStatement.expression.type === AST_NODE_TYPES.Literal &&
          firstStatement.expression.value === "use client"
        ) {
          context.report({
            node: firstStatement,
            messageId: "useClientInPage",
          });
        } else {
          // Detected via comment or first line — report on the program node
          context.report({
            node,
            messageId: "useClientInPage",
          });
        }
      },
    };
  },
});
