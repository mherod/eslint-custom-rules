import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isWeakCryptoFunction } from "./credential-detectors";

type MessageIds = "noWeakCrypto" | "replaceWithStrongerAlgorithm";
type Options = [];

const WEAK_TO_STRONG: Record<string, string> = {
  md5: "sha256",
  sha1: "sha256",
  des: "aes256",
  rc4: "aes256",
  crc32: "sha256",
};

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of weak cryptographic functions like md5, sha1, des, rc4, and crc32",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      noWeakCrypto:
        "Weak cryptographic function '{{function}}' detected. Use stronger alternatives.",
      replaceWithStrongerAlgorithm: "Replace '{{weak}}' with '{{strong}}'",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (isWeakCryptoFunction(functionName)) {
            const strongAlternative =
              WEAK_TO_STRONG[functionName.toLowerCase()] ?? "sha256";
            context.report({
              node,
              messageId: "noWeakCrypto",
              data: { function: functionName },
              suggest: [
                {
                  messageId: "replaceWithStrongerAlgorithm",
                  data: { weak: functionName, strong: strongAlternative },
                  fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                    fixer.replaceText(
                      node.callee as TSESTree.Identifier,
                      strongAlternative
                    ),
                },
              ],
            });
          }
        }
      },
    };
  },
});
