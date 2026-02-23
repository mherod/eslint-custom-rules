import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-link-over-router-push";

type MessageIds =
  | "preferLinkOverRouterPush"
  | "preferLinkOverRouterPushInHandler";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer using <Link> component over router.push() for navigation in click handlers",
    },
    schema: [],
    messages: {
      preferLinkOverRouterPush:
        "Prefer using <Link> component over router.push() for navigation. Consider wrapping this in a <Link> component instead.",
      preferLinkOverRouterPushInHandler:
        'Avoid using router.push() directly in click handlers. Wrap the button in a <Link> component: <Link href="/path"><Button>Button Text</Button></Link> for better accessibility and SEO. Only use router.push() in click handlers when additional logic (analytics, conditions, etc.) is required.',
    },
  },
  defaultOptions: [],
  create(context) {
    function getClosestClickHandler(
      node: TSESTree.CallExpression
    ):
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression
      | undefined {
      let current: TSESTree.Node | undefined = node;

      while (current) {
        if (
          (current.type === AST_NODE_TYPES.FunctionExpression ||
            current.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
          current.parent
        ) {
          // Check if parent is a JSX attribute with onClick, onPress, etc.
          if (
            current.parent.type === AST_NODE_TYPES.JSXExpressionContainer &&
            current.parent.parent?.type === AST_NODE_TYPES.JSXAttribute &&
            current.parent.parent.name.type === AST_NODE_TYPES.JSXIdentifier
          ) {
            const attrName = current.parent.parent.name.name;
            if (
              attrName === "onClick" ||
              attrName === "onPress" ||
              attrName.startsWith("on")
            ) {
              return current as
                | TSESTree.FunctionExpression
                | TSESTree.ArrowFunctionExpression;
            }
          }

          // Check if parent is a property with onClick, onPress, etc.
          if (
            current.parent.type === AST_NODE_TYPES.Property &&
            current.parent.key.type === AST_NODE_TYPES.Identifier
          ) {
            const propName = current.parent.key.name;
            if (
              propName === "onClick" ||
              propName === "onPress" ||
              propName.startsWith("on")
            ) {
              return current as
                | TSESTree.FunctionExpression
                | TSESTree.ArrowFunctionExpression;
            }
          }
        }

        current = current.parent;
      }

      return undefined;
    }

    return {
      // Check for router.push() calls
      CallExpression(node: TSESTree.CallExpression): void {
        // Check for router.push() or useRouter().push()
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "push"
        ) {
          // Check if the object is a router (common patterns)
          const isRouterCall =
            (node.callee.object.type === AST_NODE_TYPES.Identifier &&
              (node.callee.object.name === "router" ||
                node.callee.object.name === "navigation")) ||
            (node.callee.object.type === AST_NODE_TYPES.CallExpression &&
              node.callee.object.callee.type === AST_NODE_TYPES.Identifier &&
              node.callee.object.callee.name === "useRouter");

          if (isRouterCall) {
            const handler = getClosestClickHandler(node);
            if (handler) {
              // Only report when router.push is the sole statement —
              // if there is additional logic, it's likely justified.
              let isSoleStatement = false;

              if (handler.body.type === AST_NODE_TYPES.CallExpression) {
                // implicit return: () => router.push(...)
                if (handler.body === node) {
                  isSoleStatement = true;
                }
              } else if (handler.body.type === AST_NODE_TYPES.BlockStatement) {
                if (handler.body.body.length === 1) {
                  const statement = handler.body.body[0];
                  if (
                    statement &&
                    statement.type === AST_NODE_TYPES.ExpressionStatement
                  ) {
                    if (statement.expression === node) {
                      isSoleStatement = true;
                    }
                  } else if (
                    statement &&
                    statement.type === AST_NODE_TYPES.ReturnStatement
                  ) {
                    if (statement.argument === node) {
                      isSoleStatement = true;
                    }
                  }
                }
              }

              if (isSoleStatement) {
                context.report({
                  node,
                  messageId: "preferLinkOverRouterPushInHandler",
                });
              }
            }
          }
        }
      },
    };
  },
});
