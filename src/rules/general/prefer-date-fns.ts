import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-date-fns";

type MessageIds =
  | "preferDateFnsFormat"
  | "preferDateFnsParse"
  | "preferDateFnsFormatISO";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce using date-fns for date formatting and manipulation instead of native Date methods",
    },
    schema: [],
    messages: {
      preferDateFnsFormat:
        "Prefer `format` from date-fns over native `{{method}}` for consistent formatting.",
      preferDateFnsFormatISO:
        "Prefer `formatISO` from date-fns over native `toISOString`.",
      preferDateFnsParse:
        "Prefer `parseISO` from date-fns over `Date.parse` for safer parsing.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check for instance methods: date.toLocaleDateString(), etc.
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const property = node.callee.property;

          if (property.type === AST_NODE_TYPES.Identifier) {
            const methodName = property.name;

            // Formatting methods
            if (
              [
                "toLocaleDateString",
                "toLocaleTimeString",
                "toLocaleString",
                "toDateString",
                "toTimeString",
              ].includes(methodName)
            ) {
              context.report({
                node: property,
                messageId: "preferDateFnsFormat",
                data: { method: methodName },
              });
            }

            // ISO String
            if (methodName === "toISOString") {
              context.report({
                node: property,
                messageId: "preferDateFnsFormatISO",
              });
            }
          }
        }

        // Check for static methods: Date.parse()
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "Date" &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "parse"
        ) {
          context.report({
            node,
            messageId: "preferDateFnsParse",
          });
        }
      },
    };
  },
});
