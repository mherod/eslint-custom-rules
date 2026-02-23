import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-zod-url";

type MessageIds = "preferZodUrl";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer z.url() over z.string() for properties ending with 'Url'",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferZodUrl:
        "Properties ending with 'Url' should use z.url() instead of z.string()",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node: TSESTree.Property): void {
        // Check if property key is an identifier ending with 'Url'
        if (
          node.key.type !== AST_NODE_TYPES.Identifier ||
          !node.key.name.endsWith("Url")
        ) {
          return;
        }

        const value = node.value;
        if (value.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        // We need to find the root Zod call in the chain
        // Examples:
        // z.string() -> MemberExpression(z, string)
        // z.string().optional() -> MemberExpression(CallExpression(z.string), optional)

        let targetCall: TSESTree.CallExpression | null = null;
        let hasUrlInChain = false;

        // Helper to check if a node is z.string()
        const isZodString = (node: TSESTree.CallExpression): boolean => {
          return (
            node.callee.type === AST_NODE_TYPES.MemberExpression &&
            node.callee.object.type === AST_NODE_TYPES.Identifier &&
            node.callee.object.name === "z" &&
            node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.property.name === "string"
          );
        };

        // Helper to check if a node is z.url()
        const isZodUrl = (node: TSESTree.CallExpression): boolean => {
          return (
            node.callee.type === AST_NODE_TYPES.MemberExpression &&
            node.callee.object.type === AST_NODE_TYPES.Identifier &&
            node.callee.object.name === "z" &&
            node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.property.name === "url"
          );
        };

        // Recursive search down the chain
        let currentNode: TSESTree.Node = value;

        while (currentNode.type === AST_NODE_TYPES.CallExpression) {
          if (isZodUrl(currentNode)) {
            hasUrlInChain = true;
            break;
          }

          // Check for .url() method call in chain e.g. z.string().url()
          if (
            currentNode.callee.type === AST_NODE_TYPES.MemberExpression &&
            currentNode.callee.property.type === AST_NODE_TYPES.Identifier &&
            currentNode.callee.property.name === "url"
          ) {
            hasUrlInChain = true;
            break;
          }

          if (isZodString(currentNode)) {
            targetCall = currentNode;
          }

          if (currentNode.callee.type === AST_NODE_TYPES.MemberExpression) {
            currentNode = currentNode.callee.object;
          } else {
            break;
          }
        }

        // If we found z.string() and NO .url() usage in the chain
        if (targetCall && !hasUrlInChain) {
          context.report({
            node: targetCall,
            messageId: "preferZodUrl",
            fix(fixer) {
              // targetCall is z.string()
              // targetCall.callee is z.string (MemberExpression)
              // targetCall.callee.property is 'string'
              if (
                targetCall &&
                targetCall.callee.type === AST_NODE_TYPES.MemberExpression
              ) {
                return fixer.replaceText(targetCall.callee.property, "url");
              }
              return null;
            },
          });
        }
      },
    };
  },
});
