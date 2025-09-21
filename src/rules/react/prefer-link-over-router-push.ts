import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

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
    function isInClickHandler(node: TSESTree.CallExpression): boolean {
      // Walk up the AST to find if we're inside a click handler
      let current: TSESTree.Node | undefined = node;

      while (current) {
        // Check if we're inside a function that's used as a click handler
        if (
          (current.type === "FunctionExpression" ||
            current.type === "ArrowFunctionExpression") &&
          current.parent
        ) {
          // Check if parent is a JSX attribute with onClick, onPress, etc.
          if (
            current.parent.type === "JSXExpressionContainer" &&
            current.parent.parent?.type === "JSXAttribute" &&
            current.parent.parent.name.type === "JSXIdentifier"
          ) {
            const attrName = current.parent.parent.name.name;
            if (
              attrName === "onClick" ||
              attrName === "onPress" ||
              attrName.startsWith("on")
            ) {
              return true;
            }
          }

          // Check if parent is a property with onClick, onPress, etc.
          if (
            current.parent.type === "Property" &&
            current.parent.key.type === "Identifier"
          ) {
            const propName = current.parent.key.name;
            if (
              propName === "onClick" ||
              propName === "onPress" ||
              propName.startsWith("on")
            ) {
              return true;
            }
          }
        }

        current = current.parent;
      }

      return false;
    }

    return {
      // Check for router.push() calls
      CallExpression(node: TSESTree.CallExpression) {
        // Check for router.push() or useRouter().push()
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "push"
        ) {
          // Check if the object is a router (common patterns)
          const isRouterCall =
            (node.callee.object.type === "Identifier" &&
              (node.callee.object.name === "router" ||
                node.callee.object.name === "navigation")) ||
            (node.callee.object.type === "CallExpression" &&
              node.callee.object.callee.type === "Identifier" &&
              node.callee.object.callee.name === "useRouter");

          if (isRouterCall && isInClickHandler(node)) {
            // We're inside a click handler
            context.report({
              node,
              messageId: "preferLinkOverRouterPushInHandler",
            });
          }
        }
      },
    };
  },
});
