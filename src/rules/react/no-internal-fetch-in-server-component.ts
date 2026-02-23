import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { isServerComponent } from "../utils/component-type-utils";

export const RULE_NAME = "no-internal-fetch-in-server-component";

type MessageIds = "noInternalFetch";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: "Prevent fetching internal APIs in Server Components",
    },
    schema: [],
    messages: {
      noInternalFetch:
        "Avoid making HTTP requests to internal API routes in Server Components. Import the logic directly to improve performance.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Only apply this rule to files that are actually Server Components.
    // Files without "use client" are NOT necessarily server components —
    // they could be utility files, hook files, test files, or non-Next.js code.
    if (!isServerComponent(filename, sourceCode)) {
      return {};
    }

    return {
      CallExpression(node): void {
        // Check for fetch()
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "fetch"
        ) {
          const firstArg = node.arguments[0];
          if (firstArg) {
            // Check if it's a string literal starting with /api
            if (
              firstArg.type === AST_NODE_TYPES.Literal &&
              typeof firstArg.value === "string" &&
              firstArg.value.startsWith("/api")
            ) {
              context.report({
                node,
                messageId: "noInternalFetch",
              });
            }
            // Check for template literals calling internal APIs too?
            // e.g. `/api/${id}`
            else if (firstArg.type === AST_NODE_TYPES.TemplateLiteral) {
              const firstQuasi = firstArg.quasis[0];
              if (firstQuasi?.value.raw.startsWith("/api")) {
                context.report({
                  node,
                  messageId: "noInternalFetch",
                });
              }
            }
          }
        }
      },
    };
  },
});
