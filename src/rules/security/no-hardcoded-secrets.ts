import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isApiKeyOrSecret, isHardcodedSecret } from "./security-utils";

type MessageIds = "noHardcodedSecrets" | "noClientSideSecrets";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect hardcoded secrets, API keys, and tokens that should use environment variables",
    },
    fixable: "code",
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
    const filename = context.filename;
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
            fix(fixer) {
              return fixer.replaceText(node, "process.env.SECRET_KEY");
            },
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
              fix(fixer) {
                if (!node.init) {
                  return null;
                }
                if (node.id.type === AST_NODE_TYPES.Identifier) {
                  const envVarName = node.id.name
                    .replace(/([A-Z])/g, "_$1")
                    .toUpperCase()
                    .replace(/^_/, "");
                  return fixer.replaceText(
                    node.init,
                    `process.env.${envVarName}`
                  );
                }
                return fixer.replaceText(node.init, "process.env.SECRET_KEY");
              },
            });
          }
        }
      },
    };
  },
});
