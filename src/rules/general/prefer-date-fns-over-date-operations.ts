import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-date-fns-over-date-operations";

type MessageIds =
  | "preferDateFnsSort"
  | "preferDateFnsComparison"
  | "preferDateFnsSubtraction"
  | "preferDateFnsArithmetic";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer date-fns functions over direct Date operations for better readability and reliability",
    },
    schema: [],
    messages: {
      preferDateFnsSort:
        "Prefer date-fns functions for date sorting. Consider using compareAsc, compareDesc, or other date-fns comparison utilities.",
      preferDateFnsComparison:
        "Prefer date-fns functions for date comparison. Consider using isAfter, isBefore, isEqual, or compareAsc/compareDesc from date-fns.",
      preferDateFnsSubtraction:
        "Prefer date-fns functions for date arithmetic. Consider using differenceInMilliseconds, differenceInDays, or other date-fns utilities.",
      preferDateFnsArithmetic:
        "Prefer date-fns functions for date arithmetic. Consider using add, sub, addDays, subDays, or other date-fns utilities.",
    },
    // No auto-fix as it requires understanding the context
  },
  defaultOptions: [],
  create(context) {
    // Track if date-fns is imported
    let hasDateFnsImport = false;

    // Helper function to check if a node represents a new Date() call
    function isNewDateCall(node: TSESTree.Node): boolean {
      return (
        node.type === "NewExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "Date"
      );
    }

    // Helper function to check if a node represents .getTime() call
    function isGetTimeCall(node: TSESTree.Node): boolean {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "getTime"
      );
    }

    // Helper function to check if this is a date operation pattern
    function isDateOperationInSort(
      node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
    ): boolean {
      if (!node.body || node.body.type !== "BinaryExpression") {
        return false;
      }

      const body = node.body as TSESTree.BinaryExpression;

      // Check for patterns like: new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      if (body.operator === "-") {
        const leftIsDateOperation =
          isGetTimeCall(body.left) &&
          body.left.type === "CallExpression" &&
          body.left.callee.type === "MemberExpression" &&
          isNewDateCall(body.left.callee.object);

        const rightIsDateOperation =
          isGetTimeCall(body.right) &&
          body.right.type === "CallExpression" &&
          body.right.callee.type === "MemberExpression" &&
          isNewDateCall(body.right.callee.object);

        return leftIsDateOperation && rightIsDateOperation;
      }

      return false;
    }

    return {
      // Track date-fns imports
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (
          node.source.value === "date-fns" ||
          (typeof node.source.value === "string" &&
            node.source.value.startsWith("date-fns/"))
        ) {
          hasDateFnsImport = true;
        }
      },

      // Check for sort functions with date operations
      CallExpression(node: TSESTree.CallExpression) {
        // Look for .sort() calls
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "sort" &&
          node.arguments.length > 0
        ) {
          const sortFunction = node.arguments[0];

          if (
            sortFunction &&
            (sortFunction.type === "ArrowFunctionExpression" ||
              sortFunction.type === "FunctionExpression") &&
            isDateOperationInSort(sortFunction) &&
            !hasDateFnsImport // Only warn if date-fns is not already imported
          ) {
            context.report({
              node: sortFunction,
              messageId: "preferDateFnsSort",
            });
          }
        }
      },

      // Check for binary expressions with date operations
      BinaryExpression(node: TSESTree.BinaryExpression) {
        // Skip if this is already inside a sort function (handled above)
        let parent: TSESTree.Node | undefined = node.parent;
        while (parent) {
          if (
            (parent.type === "ArrowFunctionExpression" ||
              parent.type === "FunctionExpression") &&
            parent.parent?.type === "CallExpression" &&
            parent.parent.callee.type === "MemberExpression" &&
            parent.parent.callee.property.type === "Identifier" &&
            parent.parent.callee.property.name === "sort"
          ) {
            return; // Skip, already handled by sort check
          }
          parent = parent.parent;
        }

        const { left, right, operator } = node;

        // Check for date comparison operations (>, <, >=, <=, ==, ===, !=, !==)
        if (
          ["<", ">", "<=", ">=", "==", "===", "!=", "!=="].includes(operator)
        ) {
          const leftIsDateOp = isGetTimeCall(left) || isNewDateCall(left);
          const rightIsDateOp = isGetTimeCall(right) || isNewDateCall(right);

          if ((leftIsDateOp || rightIsDateOp) && !hasDateFnsImport) {
            context.report({
              node,
              messageId: "preferDateFnsComparison",
            });
          }
        }

        // Check for date arithmetic operations (-, +)
        if (["-", "+"].includes(operator)) {
          const leftIsDateOp = isGetTimeCall(left) || isNewDateCall(left);
          const rightIsDateOp = isGetTimeCall(right) || isNewDateCall(right);

          if ((leftIsDateOp || rightIsDateOp) && !hasDateFnsImport) {
            const messageId =
              operator === "-"
                ? "preferDateFnsSubtraction"
                : "preferDateFnsArithmetic";
            context.report({
              node,
              messageId,
            });
          }
        }
      },
    };
  },
});
