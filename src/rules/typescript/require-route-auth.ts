import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { getRouteName, isApiRoute, isProtectedRoute } from "../utils/common";

export const RULE_NAME = "require-route-auth";

type MessageIds = "missingAuthCheck";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require authentication checks in protected API route handlers",
    },
    schema: [],
    messages: {
      missingAuthCheck:
        "API route '{{route}}' should implement authentication checks for protected endpoints",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    if (!isApiRoute(filename)) {
      return {};
    }

    const routeName = getRouteName(filename);
    if (!isProtectedRoute(routeName)) {
      return {};
    }

    let hasAuthCheck = false;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          (node.callee.name.includes("auth") ||
            node.callee.name.includes("verify") ||
            node.callee.name.includes("authenticate"))
        ) {
          hasAuthCheck = true;
        }
      },

      "Program:exit"(): void {
        if (!hasAuthCheck) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingAuthCheck",
            data: { route: routeName },
          });
        }
      },
    };
  },
});
