import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

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

function isLoggingFunction(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    const object = node.callee.object;
    const property = node.callee.property;

    if (
      object.type === AST_NODE_TYPES.Identifier &&
      object.name === "console" &&
      property.type === AST_NODE_TYPES.Identifier
    ) {
      return ["log", "info", "warn", "error", "debug"].includes(property.name);
    }
  }

  return false;
}

function hasSecretInArguments(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some((arg) => {
    if (arg.type === AST_NODE_TYPES.Identifier) {
      const varName = arg.name.toLowerCase();
      return (
        varName.includes("secret") ||
        varName.includes("key") ||
        varName.includes("token") ||
        varName.includes("password")
      );
    }
    return false;
  });
}
