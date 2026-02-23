import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noHardcodedSecrets" | "noClientSideSecrets";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect hardcoded secrets, API keys, and tokens that should use environment variables",
    },
    schema: [],
    messages: {
      noHardcodedSecrets:
        "Hardcoded secret detected: '{{secret}}'. Use environment variables instead.",
      noClientSideSecrets:
        "Client-side code should not contain API keys or secrets.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isClientFile =
      filename.includes("components/") || filename.includes("pages/");

    return {
      // Check for hardcoded secrets in string literals
      Literal(node: TSESTree.Literal): void {
        if (typeof node.value === "string" && isHardcodedSecret(node.value)) {
          context.report({
            node,
            messageId: "noHardcodedSecrets",
            data: { secret: `${node.value.substring(0, 10)}...` },
          });
        }
      },

      // Check for client-side secrets in variable declarations
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          isClientFile &&
          node.init &&
          node.init.type === AST_NODE_TYPES.Literal
        ) {
          const value = node.init.value;
          if (typeof value === "string" && isApiKeyOrSecret(value)) {
            context.report({
              node,
              messageId: "noClientSideSecrets",
            });
          }
        }
      },
    };
  },
});

function isHardcodedSecret(value: string): boolean {
  const secretPatterns = [
    /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
    /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
    /^[0-9a-f]{32,}$/, // Hex encoded secrets
    /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
  ];

  return (
    secretPatterns.some((pattern) => pattern.test(value)) && value.length > 20
  ); // Avoid false positives on short strings
}

function isApiKeyOrSecret(value: string): boolean {
  const apiKeyPatterns = [
    /^sk_/, // Stripe
    /^pk_/, // Public keys (less sensitive but still shouldn't be hardcoded)
    /^AIza/, // Google API keys
    /^ya29/, // Google OAuth tokens
    /^ghp_/, // GitHub tokens
    /^xoxb/, // Slack tokens
    /^[0-9a-f]{32}$/, // 32 character hex
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded
  ];

  return apiKeyPatterns.some((pattern) => pattern.test(value));
}
