import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-jsx-logical-and";

type MessageIds = "noJsxLogicalAnd";

type Options = [];

/**
 * Checks if a node is a JSX element or JSX fragment
 */
function isJSXElement(
  node: TSESTree.Node
): node is TSESTree.JSXElement | TSESTree.JSXFragment {
  return (
    node.type === AST_NODE_TYPES.JSXElement ||
    node.type === AST_NODE_TYPES.JSXFragment
  );
}

/**
 * Checks if the logical AND expression is inside a JSX expression container
 * and the right side is a JSX element
 */
function isJSXConditionalRendering(node: TSESTree.LogicalExpression): boolean {
  // The right side must be a JSX element
  if (!isJSXElement(node.right)) {
    return false;
  }

  // Walk up the tree to find if we're inside a JSXExpressionContainer
  let parent: TSESTree.Node | undefined = node.parent;
  while (parent) {
    if (parent.type === AST_NODE_TYPES.JSXExpressionContainer) {
      return true;
    }
    // If we hit a function or program, stop looking
    if (
      parent.type === AST_NODE_TYPES.FunctionDeclaration ||
      parent.type === AST_NODE_TYPES.FunctionExpression ||
      parent.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      parent.type === AST_NODE_TYPES.Program
    ) {
      return false;
    }
    parent = parent.parent;
  }

  return false;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use explicit conditional rendering with ternary operators instead of logical AND to prevent rendering falsy values like 0 or NaN",
    },
    schema: [],
    messages: {
      noJsxLogicalAnd:
        "Use explicit ternary operator (`condition ? <element> : null`) instead of logical AND (`&&`) for conditional rendering to prevent accidental rendering of falsy values like 0 or NaN.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node): void {
        // Only check logical AND (&&) expressions
        if (node.operator !== "&&") {
          return;
        }

        // Check if this is JSX conditional rendering
        if (!isJSXConditionalRendering(node)) {
          return;
        }

        // Report the issue
        context.report({
          node,
          messageId: "noJsxLogicalAnd",
          fix(fixer) {
            const sourceCode = context.sourceCode;

            // Get the left side (condition) text
            const leftText = sourceCode.getText(node.left);
            // Get the right side (JSX element) text
            const rightText = sourceCode.getText(node.right);

            // Convert `condition && <Element />` to `condition ? <Element /> : null`
            return fixer.replaceText(node, `${leftText} ? ${rightText} : null`);
          },
        });
      },
    };
  },
});
