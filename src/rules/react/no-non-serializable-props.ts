import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const RULE_NAME = "no-non-serializable-props";

type MessageIds = "nonSerializableProp" | "functionProp" | "symbolProp";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent passing non-serializable props (Date, Map, Set) to components",
    },
    schema: [],
    messages: {
      nonSerializableProp:
        "Prop '{{name}}' appears to be non-serializable (Date/Map/Set). Server Components must serialize data (e.g. .toISOString()) before passing to Client Components.",
      functionProp:
        "Prop '{{name}}' is a function, which is not serializable across the server/client boundary. Use a Server Action or move to a Client Component.",
      symbolProp:
        "Prop '{{name}}' is a Symbol, which is not serializable across the server/client boundary.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node): void {
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier) {
          return;
        }

        const propName = node.name.name;

        if (node.value?.type !== AST_NODE_TYPES.JSXExpressionContainer) {
          return;
        }

        const expr = node.value.expression;

        // 1. Function expressions/arrow functions as props
        if (
          expr.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          expr.type === AST_NODE_TYPES.FunctionExpression
        ) {
          context.report({
            node,
            messageId: "functionProp",
            data: { name: propName },
          });
          return;
        }

        // 2. Symbol() or Symbol.for() as props
        if (
          expr.type === AST_NODE_TYPES.CallExpression &&
          ((expr.callee.type === AST_NODE_TYPES.Identifier &&
            expr.callee.name === "Symbol") ||
            (expr.callee.type === AST_NODE_TYPES.MemberExpression &&
              expr.callee.object.type === AST_NODE_TYPES.Identifier &&
              expr.callee.object.name === "Symbol"))
        ) {
          context.report({
            node,
            messageId: "symbolProp",
            data: { name: propName },
          });
          return;
        }

        // 3. new Date/Map/Set/RegExp and other non-serializable constructors
        if (
          expr.type === AST_NODE_TYPES.NewExpression &&
          expr.callee.type === AST_NODE_TYPES.Identifier
        ) {
          if (
            [
              "Date",
              "Map",
              "Set",
              "RegExp",
              "WeakMap",
              "WeakSet",
              "Error",
            ].includes(expr.callee.name)
          ) {
            context.report({
              node,
              messageId: "nonSerializableProp",
              data: { name: propName },
            });
            return;
          }
        }

        // 2. Heuristic check for potential Date objects based on prop naming
        // Common Date field names: createdAt, updatedAt, deletedAt, date, etc.
        // We use a regex that looks for "Date" or "Time" at a word boundary (start or after uppercase)
        // to avoid false positives like "candidate", "update", "estimate".
        const isPotentialDateProp =
          /(?:^|[a-z])(?:Date|Time)(?:$|[A-Z]|s$)/.test(propName);

        if (isPotentialDateProp) {
          // Safe if it's a known string conversion method
          if (
            expr.type === AST_NODE_TYPES.CallExpression &&
            expr.callee.type === AST_NODE_TYPES.MemberExpression &&
            expr.callee.property.type === AST_NODE_TYPES.Identifier
          ) {
            const methodName = expr.callee.property.name;
            if (
              [
                "toISOString",
                "toLocaleDateString",
                "toString",
                "toDateString",
                "format",
              ].includes(methodName)
            ) {
              return;
            }
            // date-fns/moment calls usually unsafe to assume return string unless analyzed, but generic functions likely return components or strings.
            // safe to warn if unsure.
          }

          // Safe if it's a string literal (template literal)
          if (expr.type === AST_NODE_TYPES.TemplateLiteral) {
            return;
          }

          // If it's a variable or member access (user.createdAt), likely a Date object coming from DB
          if (
            expr.type === AST_NODE_TYPES.Identifier ||
            expr.type === AST_NODE_TYPES.MemberExpression
          ) {
            context.report({
              node,
              messageId: "nonSerializableProp",
              data: { name: propName },
            });
          }
        }
      },
    };
  },
});
