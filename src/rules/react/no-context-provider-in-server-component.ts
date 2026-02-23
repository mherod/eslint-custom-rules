import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { isServerComponent } from "../utils/component-type-utils";

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
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Only apply this rule to files that are actually Server Components.
    // Files without "use client" are NOT necessarily server components —
    // they could be utility files, hook files, test files, or non-Next.js code.
    if (!isServerComponent(filename, sourceCode)) {
      return {};
    }

    return {
      CallExpression(node): void {
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
      JSXOpeningElement(node): void {
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
