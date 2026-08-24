import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  getStaticMemberName,
  isDateLikeExpression,
  isDateTimestampExpression,
} from "../utils/date-expression-utils";

export const RULE_NAME = "prefer-date-fns-over-date-operations";

type MessageIds =
  | "preferDateFnsSort"
  | "preferDateFnsComparison"
  | "preferDateFnsSubtraction"
  | "preferDateFnsArithmetic";

type Options = [];

const RELATIONAL_COMPARISON_OPS = new Set(["<", ">", "<=", ">="]);
const EQUALITY_COMPARISON_OPS = new Set(["==", "===", "!=", "!=="]);
const SORT_METHODS = new Set(["sort", "toSorted"]);

function isSortCallback(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  sourceCode: TSESLint.SourceCode
): boolean {
  const parent = node.parent;
  if (!parent || parent.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  if (parent.arguments[0] !== node) {
    return false;
  }
  const callee = parent.callee;
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    SORT_METHODS.has(getStaticMemberName(callee, sourceCode) ?? "")
  );
}

function getReturnedBinaryExpression(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): TSESTree.BinaryExpression | null {
  const body = node.body;
  if (body.type === AST_NODE_TYPES.BinaryExpression) {
    return body;
  }

  if (body.type !== AST_NODE_TYPES.BlockStatement) {
    return null;
  }

  const returnedExpressions = body.body.flatMap((statement) => {
    if (
      statement.type === AST_NODE_TYPES.ReturnStatement &&
      statement.argument?.type === AST_NODE_TYPES.BinaryExpression
    ) {
      return [statement.argument];
    }
    return [];
  });

  if (returnedExpressions.length !== 1) {
    return null;
  }

  return returnedExpressions[0] ?? null;
}

function isDateComparableExpression(
  node: TSESTree.BinaryExpression["left"],
  sourceCode: TSESLint.SourceCode
): boolean {
  if (node.type === AST_NODE_TYPES.PrivateIdentifier) {
    return false;
  }

  return (
    isDateLikeExpression(node, sourceCode) ||
    isDateTimestampExpression(node, sourceCode)
  );
}

function isDateTimestampOperand(
  node: TSESTree.BinaryExpression["left"],
  sourceCode: TSESLint.SourceCode
): boolean {
  return (
    node.type !== AST_NODE_TYPES.PrivateIdentifier &&
    isDateTimestampExpression(node, sourceCode)
  );
}

function isDateSubtractionSort(
  node: TSESTree.BinaryExpression,
  sourceCode: TSESLint.SourceCode
): boolean {
  return (
    node.operator === "-" &&
    isDateComparableExpression(node.left, sourceCode) &&
    isDateComparableExpression(node.right, sourceCode)
  );
}

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
        "Prefer explicit date-fns arithmetic for Date-derived timestamps, preserving whether the result is a Date or number.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const reportedSortExpressions = new WeakSet<TSESTree.BinaryExpression>();

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          !SORT_METHODS.has(getStaticMemberName(callee, sourceCode) ?? "") ||
          node.arguments.length === 0
        ) {
          return;
        }
        const sortFn = node.arguments[0];
        if (
          !sortFn ||
          (sortFn.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            sortFn.type !== AST_NODE_TYPES.FunctionExpression)
        ) {
          return;
        }

        if (!isSortCallback(sortFn, sourceCode)) {
          return;
        }

        const comparison = getReturnedBinaryExpression(sortFn);
        if (comparison && isDateSubtractionSort(comparison, sourceCode)) {
          reportedSortExpressions.add(comparison);
          context.report({ node: sortFn, messageId: "preferDateFnsSort" });
        }
      },

      BinaryExpression(node: TSESTree.BinaryExpression): void {
        if (reportedSortExpressions.has(node)) {
          return;
        }

        const op = node.operator;
        let messageId: MessageIds | null = null;
        if (op === "-") {
          if (
            !(
              isDateComparableExpression(node.left, sourceCode) ||
              isDateComparableExpression(node.right, sourceCode)
            )
          ) {
            return;
          }
          messageId = "preferDateFnsSubtraction";
        } else if (op === "+") {
          if (
            !(
              isDateTimestampOperand(node.left, sourceCode) ||
              isDateTimestampOperand(node.right, sourceCode)
            )
          ) {
            return;
          }
          messageId = "preferDateFnsArithmetic";
        } else if (RELATIONAL_COMPARISON_OPS.has(op)) {
          if (
            !(
              isDateComparableExpression(node.left, sourceCode) ||
              isDateComparableExpression(node.right, sourceCode)
            )
          ) {
            return;
          }
          messageId = "preferDateFnsComparison";
        } else if (EQUALITY_COMPARISON_OPS.has(op)) {
          if (
            !(
              isDateTimestampOperand(node.left, sourceCode) &&
              isDateTimestampOperand(node.right, sourceCode)
            )
          ) {
            return;
          }
          messageId = "preferDateFnsComparison";
        } else {
          return;
        }

        context.report({ node, messageId });
      },
    };
  },
});
