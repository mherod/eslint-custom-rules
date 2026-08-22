import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { getRouteName, isApiRoute, isDatabaseObject } from "../utils/common";

export const RULE_NAME = "no-direct-db-in-route";

type MessageIds = "unsafeDirectDbAccess";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow direct database access in API routes in favour of the repository pattern",
    },
    schema: [],
    messages: {
      unsafeDirectDbAccess:
        "API route '{{route}}' should not directly access database - use repository pattern",
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
    let hasDbAccess = false;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          isDatabaseObject(node.callee.object.name)
        ) {
          hasDbAccess = true;
        }
      },

      "Program:exit"(): void {
        if (hasDbAccess) {
          context.report({
            node: sourceCode.ast,
            messageId: "unsafeDirectDbAccess",
            data: { route: routeName },
          });
        }
      },
    };
  },
});
