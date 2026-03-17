import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasSecretInArguments, isLoggingFunction } from "./security-utils";

type MessageIds = "noLogSecrets";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect logging of sensitive data such as secrets, keys, tokens, and passwords",
    },
    fixable: "code",
    schema: [],
    messages: {
      noLogSecrets:
        "Potential secret logging detected. Avoid logging sensitive data.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (isLoggingFunction(node) && hasSecretInArguments(node.arguments)) {
          context.report({
            node,
            messageId: "noLogSecrets",
            fix(fixer) {
              const parent = node.parent;
              if (
                parent &&
                parent.type === AST_NODE_TYPES.ExpressionStatement
              ) {
                const src = context.sourceCode.getText();
                const end = parent.range[1];
                const removeEnd =
                  end < src.length && src[end] === "\n" ? end + 1 : end;
                return fixer.removeRange([parent.range[0], removeEnd]);
              }
              return null;
            },
          });
        }
      },
    };
  },
});
