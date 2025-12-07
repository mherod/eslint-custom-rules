import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-ufo-with-query";

type MessageIds = "preferUfoWithQuery";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce using `withQuery` from `ufo` for URL query construction instead of `URLSearchParams` or string concatenation",
    },
    schema: [],
    messages: {
      preferUfoWithQuery:
        "Prefer `withQuery` from `ufo` for constructing URLs with query parameters. Example: `withQuery(pathname, { key: 'value' })`.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "URLSearchParams"
        ) {
          context.report({
            node,
            messageId: "preferUfoWithQuery",
          });
        }
      },
      // Detect simple string concatenation usage involving '?' which looks like query param construction
      // e.g. base + "?" + query
      BinaryExpression(node: TSESTree.BinaryExpression): void {
        if (node.operator === "+") {
          if (
            node.right.type === AST_NODE_TYPES.Literal &&
            typeof node.right.value === "string" &&
            node.right.value.startsWith("?")
          ) {
            context.report({
              node,
              messageId: "preferUfoWithQuery",
            });
          }
          // Check left side if it ends with ?
          if (
            node.left.type === AST_NODE_TYPES.Literal &&
            typeof node.left.value === "string" &&
            node.left.value.endsWith("?")
          ) {
            context.report({
              node,
              messageId: "preferUfoWithQuery",
            });
          }
        }
      },
      // Template literals
      TemplateLiteral(node: TSESTree.TemplateLiteral): void {
        // Check if any quasi ends with ? or contains ? followed by nothing/variable
        // e.g. `${base}?foo=${bar}`
        for (const quasi of node.quasis) {
          if (quasi.value.raw.includes("?")) {
            // This is very broad. Let's check if it fits the pattern `...?key=${val}`
            // Just detecting `?` inside a template literal that has expressions might be enough to warn.
            // But let's be slightly conservative.
            if (quasi.value.raw.trim().endsWith("?")) {
              context.report({
                node,
                messageId: "preferUfoWithQuery",
              });
            }
          }
        }
      },
    };
  },
});
