import type { TSESLint } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "no-non-serializable-props";

type MessageIds =
  | "nonSerializableProp"
  | "dateProp"
  | "datePropSuggestIso"
  | "datePropSuggestTime"
  | "functionProp"
  | "symbolProp"
  | "bigintProp"
  | "regexProp";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent passing non-serializable props (Date, Map, Set) to components",
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      nonSerializableProp:
        "Prop '{{name}}' appears to be non-serializable (Map/Set/etc). Server Components must serialize data before passing to Client Components.",
      dateProp:
        "Prop '{{name}}' is a Date, which is not serializable across the server/client boundary. Convert to a string with .toISOString() or a number with .getTime().",
      datePropSuggestIso: "Convert to ISO string with .toISOString()",
      datePropSuggestTime: "Convert to timestamp number with .getTime()",
      functionProp:
        "Prop '{{name}}' is a function, which is not serializable across the server/client boundary. Use a Server Action or move to a Client Component.",
      symbolProp:
        "Prop '{{name}}' is a Symbol, which is not serializable across the server/client boundary.",
      bigintProp:
        "Prop '{{name}}' is a BigInt literal, which is not JSON-serializable. Convert to string or number before passing across the server/client boundary.",
      regexProp:
        "Prop '{{name}}' is a RegExp literal, which is not JSON-serializable. Convert to string before passing across the server/client boundary.",
    },
  },
  defaultOptions: [],
  create(context) {
    // Skip files with "use client" directive — all prop types are valid
    // between Client Components (no RSC serialization boundary).
    if (hasUseClientDirective(context.sourceCode)) {
      return {};
    }

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

        // 3. BigInt literals (42n) and regex literals (/pattern/)
        if (expr.type === AST_NODE_TYPES.Literal) {
          if ("bigint" in expr && expr.bigint !== undefined) {
            context.report({
              node,
              messageId: "bigintProp",
              data: { name: propName },
            });
            return;
          }
          if ("regex" in expr && expr.regex !== undefined) {
            context.report({
              node,
              messageId: "regexProp",
              data: { name: propName },
            });
            return;
          }
        }

        // 4. new Date() — auto-fixable to .toISOString()
        if (
          expr.type === AST_NODE_TYPES.NewExpression &&
          expr.callee.type === AST_NODE_TYPES.Identifier &&
          expr.callee.name === "Date"
        ) {
          const sourceCode = context.sourceCode;
          const exprText = sourceCode.getText(expr);
          context.report({
            node,
            messageId: "dateProp",
            data: { name: propName },
            fix(fixer) {
              return fixer.replaceText(expr, `${exprText}.toISOString()`);
            },
            suggest: [
              {
                messageId: "datePropSuggestIso" as const,
                fix(fixer): TSESLint.RuleFix {
                  return fixer.replaceText(expr, `${exprText}.toISOString()`);
                },
              },
              {
                messageId: "datePropSuggestTime" as const,
                fix(fixer): TSESLint.RuleFix {
                  return fixer.replaceText(expr, `${exprText}.getTime()`);
                },
              },
            ],
          });
          return;
        }

        // 5. new Map/Set/RegExp and other non-serializable constructors
        if (
          expr.type === AST_NODE_TYPES.NewExpression &&
          expr.callee.type === AST_NODE_TYPES.Identifier
        ) {
          if (
            [
              "Map",
              "Set",
              "RegExp",
              "WeakMap",
              "WeakSet",
              "WeakRef",
              "Error",
              "ArrayBuffer",
              "SharedArrayBuffer",
              "DataView",
              "Promise",
              "Blob",
              "File",
              "FormData",
              "URLSearchParams",
              "ReadableStream",
              "WritableStream",
              "MessageChannel",
              "Worker",
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
            const sourceCode = context.sourceCode;
            const exprText = sourceCode.getText(expr);
            context.report({
              node,
              messageId: "dateProp",
              data: { name: propName },
              suggest: [
                {
                  messageId: "datePropSuggestIso" as const,
                  fix(fixer): TSESLint.RuleFix {
                    return fixer.replaceText(expr, `${exprText}.toISOString()`);
                  },
                },
                {
                  messageId: "datePropSuggestTime" as const,
                  fix(fixer): TSESLint.RuleFix {
                    return fixer.replaceText(expr, `${exprText}.getTime()`);
                  },
                },
              ],
            });
          }
        }
      },
    };
  },
});
