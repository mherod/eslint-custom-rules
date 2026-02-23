import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noWeakCrypto";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of weak cryptographic functions like md5, sha1, des, rc4, and crc32",
    },
    schema: [],
    messages: {
      noWeakCrypto:
        "Weak cryptographic function '{{function}}' detected. Use stronger alternatives.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (isWeakCryptoFunction(functionName)) {
            context.report({
              node,
              messageId: "noWeakCrypto",
              data: { function: functionName },
            });
          }
        }
      },
    };
  },
});

function isWeakCryptoFunction(functionName: string): boolean {
  const weakFunctions = ["md5", "sha1", "des", "rc4", "crc32"];
  return weakFunctions.includes(functionName.toLowerCase());
}
