import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
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
          });
        }
      },
    };
  },
});
