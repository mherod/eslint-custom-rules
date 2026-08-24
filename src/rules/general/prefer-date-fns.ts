import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  getStaticMemberName,
  isBuiltInDateConstructor,
  isDateLikeExpression,
} from "../utils/date-expression-utils";

export const RULE_NAME = "prefer-date-fns";

type MessageIds =
  | "preferDateFnsFormat"
  | "preferDateFnsParse"
  | "preferDateFnsFormatISO";

type Options = [];

const DATE_FORMATTING_METHODS = new Set([
  "toLocaleDateString",
  "toLocaleTimeString",
  "toLocaleString",
  "toDateString",
  "toTimeString",
]);

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
        "Prefer explicit date-fns formatting over native `{{method}}`, preserving locale and output semantics.",
      preferDateFnsFormatISO:
        "Prefer an appropriate date-fns formatter over native `toISOString`, preserving UTC and precision semantics.",
      preferDateFnsParse:
        "Prefer a date-fns parser that matches the input format over `Date.parse`, preserving timestamp semantics.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check for instance methods: date.toLocaleDateString(), etc.
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const property = node.callee.property;
          const methodName = getStaticMemberName(node.callee, sourceCode);

          if (
            methodName &&
            DATE_FORMATTING_METHODS.has(methodName) &&
            isDateLikeExpression(node.callee.object, sourceCode)
          ) {
            context.report({
              node: property,
              messageId: "preferDateFnsFormat",
              data: { method: methodName },
            });
          }

          if (
            methodName === "toISOString" &&
            isDateLikeExpression(node.callee.object, sourceCode)
          ) {
            context.report({
              node: property,
              messageId: "preferDateFnsFormatISO",
            });
          }
        }

        // Check for the built-in static method: Date.parse()
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          getStaticMemberName(node.callee, sourceCode) === "parse" &&
          isBuiltInDateConstructor(node.callee.object, sourceCode)
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
