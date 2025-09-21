import type { TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/mherod/eslint-custom-rules/blob/main/docs/rules/${name}.md`
);

export default createRule({
  name: "prefer-next-navigation",
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid navigation via window.location assignments, prefer Next.js router or Link components",
    },
    fixable: "code",
    schema: [],
    messages: {
      windowLocationAssignment:
        "Avoid using window.location assignments for navigation. Use Next.js router.push(), router.replace(), or <Link> components instead.",
      locationAssignment:
        "Avoid using location assignments for navigation. Use Next.js router.push(), router.replace(), or <Link> components instead.",
      windowHistoryMethod:
        "Avoid using window.history methods for navigation. Use Next.js router.push(), router.replace(), or <Link> components instead.",
      historyMethod:
        "Avoid using history methods for navigation. Use Next.js router.push(), router.replace(), or <Link> components instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // Check for window.location.href = "..."
      // Check for window.location.pathname = "..."
      // Check for window.location.search = "..."
      // Check for window.location.hash = "..."
      // Check for window.location = "..."
      AssignmentExpression(node: TSESTree.AssignmentExpression) {
        if (node.operator !== "=") {
          return;
        }

        const left = node.left;

        // Check for window.location assignments
        if (left.type === "MemberExpression") {
          const { object, property } = left;

          // window.location = "..."
          if (
            object.type === "Identifier" &&
            object.name === "window" &&
            property.type === "Identifier" &&
            property.name === "location"
          ) {
            context.report({
              node,
              messageId: "windowLocationAssignment",
            });
            return;
          }

          // window.location.href = "..."
          // window.location.pathname = "..."
          // window.location.search = "..."
          // window.location.hash = "..."
          if (
            object.type === "MemberExpression" &&
            object.object.type === "Identifier" &&
            object.object.name === "window" &&
            object.property.type === "Identifier" &&
            object.property.name === "location" &&
            property.type === "Identifier" &&
            ["href", "pathname", "search", "hash"].includes(property.name)
          ) {
            context.report({
              node,
              messageId: "windowLocationAssignment",
            });
            return;
          }

          // location.href = "..." (without window prefix)
          // location.pathname = "..."
          // location.search = "..."
          // location.hash = "..."
          if (
            object.type === "Identifier" &&
            object.name === "location" &&
            property.type === "Identifier" &&
            ["href", "pathname", "search", "hash"].includes(property.name)
          ) {
            context.report({
              node,
              messageId: "locationAssignment",
            });
            return;
          }
        }

        // location = "..." (direct assignment)
        if (left.type === "Identifier" && left.name === "location") {
          context.report({
            node,
            messageId: "locationAssignment",
          });
        }
      },

      // Note: History API methods are allowed as they might be needed for specific use cases
      // If you want to disallow them, uncomment the CallExpression visitor below
      /*
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type === "MemberExpression") {
          const { object, property } = node.callee;

          // window.history.pushState(), window.history.replaceState(), window.history.back(), window.history.forward(), window.history.go()
          if (
            object.type === "MemberExpression" &&
            object.object.type === "Identifier" &&
            object.object.name === "window" &&
            object.property.type === "Identifier" &&
            object.property.name === "history" &&
            property.type === "Identifier" &&
            ["pushState", "replaceState", "back", "forward", "go"].includes(
              property.name,
            )
          ) {
            context.report({
              node,
              messageId: "windowHistoryMethod",
            });
            return;
          }

          // history.pushState(), history.replaceState(), history.back(), history.forward(), history.go() (without window prefix)
          if (
            object.type === "Identifier" &&
            object.name === "history" &&
            property.type === "Identifier" &&
            ["pushState", "replaceState", "back", "forward", "go"].includes(
              property.name,
            )
          ) {
            context.report({
              node,
              messageId: "historyMethod",
            });
            return;
          }
        }
      },
      */
    };
  },
});
