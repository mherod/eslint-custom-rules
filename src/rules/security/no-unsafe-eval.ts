import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noUnsafeEval";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of eval() and Function constructor which can execute arbitrary code",
    },
    schema: [],
    messages: {
      noUnsafeEval:
        "Avoid using eval() or Function constructor. Use safer alternatives like JSON.parse().",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (functionName === "eval" || functionName === "Function") {
            context.report({
              node,
              messageId: "noUnsafeEval",
            });
          }
        }
      },
    };
  },
});
