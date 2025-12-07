import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const RULE_NAME = "no-context-provider-in-server-component";

type MessageIds = "contextInServerComponent";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: "Prevent usage of React Context in Server Components",
    },
    schema: [],
    messages: {
      contextInServerComponent:
        "React Context (`createContext`, `<Provider>`) is not supported in Server Components. Move this logic to a Client Component.",
    },
  },
  defaultOptions: [],
  create(context) {
    let isClientComponent = false;

    return {
      Program(node) {
        if (node.body.length > 0) {
          const firstStatement = node.body[0];
          if (
            firstStatement &&
            firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
            firstStatement.expression.type === AST_NODE_TYPES.Literal &&
            firstStatement.expression.value === "use client"
          ) {
            isClientComponent = true;
          }
        }
      },
      CallExpression(node) {
        if (isClientComponent) {
          return;
        }

        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "createContext"
        ) {
          context.report({
            node,
            messageId: "contextInServerComponent",
          });
        }
      },
      JSXOpeningElement(node) {
        if (isClientComponent) {
          return;
        }

        // Check for <Something.Provider>
        if (node.name.type === AST_NODE_TYPES.JSXMemberExpression) {
          if (node.name.property.name === "Provider") {
            context.report({
              node,
              messageId: "contextInServerComponent",
            });
          }
        }
      },
    };
  },
});
