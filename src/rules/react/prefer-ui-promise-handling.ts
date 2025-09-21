import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-ui-promise-handling";

type MessageIds = "preferUIPromiseHandling" | "suggestToastOrStatePattern";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer proper promise handling in UI components with error display in UI state or toast notifications instead of suppressing promise results",
    },
    schema: [],
    messages: {
      preferUIPromiseHandling:
        "Avoid suppressing promise results with void. Instead, handle errors by displaying them in UI state or showing a toast notification to provide user feedback.",
      suggestToastOrStatePattern:
        "This promise should be properly handled. Consider using try/catch with toast notifications or updating component state to show errors to the user.",
    },
  },
  defaultOptions: [],
  create(context) {
    let hasUseClientDirective = false;
    let isInReactComponent = false;

    // Check if we're in a file with "use client" directive
    function checkForUseClientDirective(node: TSESTree.Program): void {
      for (const statement of node.body.slice(0, 3)) {
        if (
          statement.type === AST_NODE_TYPES.ExpressionStatement &&
          statement.expression.type === AST_NODE_TYPES.Literal &&
          statement.expression.value === "use client"
        ) {
          hasUseClientDirective = true;
          return;
        }
      }
    }

    // Check if a function name looks like a React component
    function isReactComponent(name: string | undefined): boolean {
      return (
        name != null &&
        name.length > 0 &&
        name[0] === name[0]?.toUpperCase() &&
        !name.startsWith("use") // Exclude hooks
      );
    }

    // Check if we're in a UI component context where promise handling matters
    function shouldCheckPromiseHandling(): boolean {
      return hasUseClientDirective && isInReactComponent;
    }

    // Check if this is a void expression suppressing a promise
    function isVoidPromise(node: TSESTree.UnaryExpression): boolean {
      if (node.operator !== "void") {
        return false;
      }

      const argument = node.argument;

      // Check for direct promise-returning calls
      if (argument.type === AST_NODE_TYPES.CallExpression) {
        return isLikelyPromiseCall(argument);
      }

      // Check for await expressions
      if (argument.type === AST_NODE_TYPES.AwaitExpression) {
        return true;
      }

      return false;
    }

    // Check if a call expression likely returns a promise
    function isLikelyPromiseCall(node: TSESTree.CallExpression): boolean {
      // Server actions (functions ending with "Action")
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name.endsWith("Action")
      ) {
        return true;
      }

      // Method calls that commonly return promises
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        const property = node.callee.property;
        if (property.type === AST_NODE_TYPES.Identifier) {
          const promiseMethods = [
            "fetch",
            "post",
            "get",
            "put",
            "delete",
            "patch",
            "mutate",
            "trigger",
            "execute",
            "submit",
            "save",
            "update",
            "create",
            "remove",
            "then",
            "catch",
          ];
          return promiseMethods.includes(property.name);
        }
      }

      // Direct promise-returning functions
      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        const promiseFunctions = ["fetch", "axios", "request"];
        return promiseFunctions.includes(node.callee.name);
      }

      return false;
    }

    // Check if this appears to be in an event handler context
    function isInEventHandler(node: TSESTree.Node): boolean {
      let parent: TSESTree.Node | undefined = node.parent;

      while (parent) {
        // Check for common event handler patterns
        if (
          parent.type === AST_NODE_TYPES.Property &&
          parent.key.type === AST_NODE_TYPES.Identifier &&
          (parent.key.name.startsWith("on") || // onClick, onSubmit, etc.
            parent.key.name.includes("Handle") || // handleClick, handleSubmit
            parent.key.name.includes("handler")) // clickHandler, submitHandler
        ) {
          return true;
        }

        // Check for arrow functions assigned to event handler variables
        if (
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier &&
          (parent.id.name.startsWith("handle") ||
            parent.id.name.startsWith("on") ||
            parent.id.name.includes("Handler"))
        ) {
          return true;
        }

        parent = parent.parent;
      }

      return false;
    }

    return {
      Program(node: TSESTree.Program): void {
        checkForUseClientDirective(node);
      },

      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.id?.name && isReactComponent(node.id.name)) {
          isInReactComponent = true;
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.id?.name && isReactComponent(node.id.name)) {
          isInReactComponent = true;
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        const parent = node.parent;
        if (
          parent &&
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier &&
          isReactComponent(parent.id.name)
        ) {
          isInReactComponent = true;
        }
      },

      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (node.id?.name && isReactComponent(node.id.name)) {
          isInReactComponent = false;
        }
      },

      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (node.id?.name && isReactComponent(node.id.name)) {
          isInReactComponent = false;
        }
      },

      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        const parent = node.parent;
        if (
          parent &&
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier &&
          isReactComponent(parent.id.name)
        ) {
          isInReactComponent = false;
        }
      },

      UnaryExpression(node: TSESTree.UnaryExpression): void {
        if (!shouldCheckPromiseHandling()) {
          return;
        }

        if (isVoidPromise(node)) {
          const inEventHandler = isInEventHandler(node);

          context.report({
            node,
            messageId: inEventHandler
              ? "preferUIPromiseHandling"
              : "suggestToastOrStatePattern",
          });
        }
      },

      // Also check for promises in expression statements that might be ignored
      ExpressionStatement(node: TSESTree.ExpressionStatement): void {
        if (!shouldCheckPromiseHandling()) {
          return;
        }

        if (
          node.expression.type === AST_NODE_TYPES.CallExpression &&
          isLikelyPromiseCall(node.expression) &&
          isInEventHandler(node)
        ) {
          context.report({
            node: node.expression,
            messageId: "suggestToastOrStatePattern",
          });
        }
      },
    };
  },
});
