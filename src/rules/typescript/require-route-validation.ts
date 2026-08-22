import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { getRouteName, isApiRoute } from "../utils/common";

export const RULE_NAME = "require-route-validation";

type MessageIds = "missingInputValidation";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require input validation via a schema parse/validate call in API routes",
    },
    schema: [],
    messages: {
      missingInputValidation:
        "API route '{{route}}' should validate request body/parameters using validation schema",
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
    let hasInputValidation = false;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          (node.callee.property.name === "parse" ||
            node.callee.property.name === "validate")
        ) {
          hasInputValidation = true;
        }
      },

      "Program:exit"(): void {
        if (!hasInputValidation) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingInputValidation",
            data: { route: routeName },
          });
        }
      },
    };
  },
});
