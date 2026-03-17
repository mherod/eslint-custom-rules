import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  _hasUnsanitizedInput,
  _isRiskyTemplateContext,
  hasDangerousTemplateUsage,
  hasZodImport,
} from "./security-utils";

type MessageIds = "requireInputSanitization" | "noDirectProcessEnvInClient";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect unsafe template literal usage with unsanitized input and direct process.env access in client code",
    },
    fixable: "code",
    schema: [],
    messages: {
      requireInputSanitization:
        "User input '{{input}}' should be sanitized before use. Use validation libraries like Zod.",
      noDirectProcessEnvInClient:
        "Avoid accessing process.env directly in client code. Use public environment variables or server actions.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const isClientFile =
      filename.includes("components/") || filename.includes("pages/");

    // If file contains Zod, skip template literal security checks entirely
    const sourceCode = context.sourceCode;
    const skipTemplateCheck = hasZodImport(sourceCode);

    return {
      // Check for direct process.env access in client code
      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          isClientFile &&
          node.object.type === AST_NODE_TYPES.MemberExpression &&
          node.object.object.type === AST_NODE_TYPES.Identifier &&
          node.object.object.name === "process" &&
          node.object.property.type === AST_NODE_TYPES.Identifier &&
          node.object.property.name === "env"
        ) {
          context.report({
            node,
            messageId: "noDirectProcessEnvInClient",
          });
        }
      },

      // Check for template literals with user input
      TemplateLiteral(node: TSESTree.TemplateLiteral): void {
        // Skip if Zod is present in the file
        if (skipTemplateCheck) {
          return;
        }

        // Only flag truly dangerous template literals
        if (
          hasDangerousTemplateUsage(node) ||
          (_hasUnsanitizedInput(node) && _isRiskyTemplateContext(node))
        ) {
          context.report({
            node,
            messageId: "requireInputSanitization",
            data: { input: "template literal" },
          });
        }
      },
    };
  },
});
