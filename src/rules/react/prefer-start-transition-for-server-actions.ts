import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";
import {
  getActionName,
  isServerActionCall,
} from "../utils/server-action-utils";

export const RULE_NAME = "prefer-start-transition-for-server-actions";

type MessageIds = "serverActionNeedsStartTransition";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Server Action calls should be wrapped in startTransition to synchronize UI updates with server action completion and data revalidation.",
    },
    schema: [],
    messages: {
      serverActionNeedsStartTransition:
        "Server Action '{{actionName}}' called without startTransition. Wrap in startTransition to ensure UI updates (dialog closing, state reset) are synchronized with server action completion and data revalidation. Without this, UI might reset before new data is available or useOptimistic states might not function correctly.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const isClientComponent = hasUseClientDirective(sourceCode);

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isClientComponent) {
          return;
        }
        if (isInsideStartTransition(node)) {
          return;
        }
        if (isServerActionCall(node, sourceCode)) {
          context.report({
            node,
            messageId: "serverActionNeedsStartTransition",
            data: { actionName: getActionName(node) },
          });
        }
      },
    };
  },
});

function isInsideStartTransition(node: TSESTree.CallExpression): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier &&
      current.callee.name === "startTransition"
    ) {
      return true;
    }
    if (
      (current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        current.type === AST_NODE_TYPES.FunctionExpression) &&
      current.parent?.type === AST_NODE_TYPES.CallExpression &&
      current.parent.callee.type === AST_NODE_TYPES.Identifier &&
      current.parent.callee.name === "startTransition"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
