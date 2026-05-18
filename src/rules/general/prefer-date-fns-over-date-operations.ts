import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-date-fns-over-date-operations";

type MessageIds =
  | "preferDateFnsSort"
  | "preferDateFnsComparison"
  | "preferDateFnsSubtraction"
  | "preferDateFnsArithmetic";

type Options = [];

const COMPARISON_OPS = new Set([
  "<",
  ">",
  "<=",
  ">=",
  "==",
  "===",
  "!=",
  "!==",
]);

function isNewDateCall(node: TSESTree.Node | null | undefined): boolean {
  return (
    !!node &&
    node.type === AST_NODE_TYPES.NewExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "Date"
  );
}

function isGetTimeCall(node: TSESTree.Node | null | undefined): boolean {
  return (
    !!node &&
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "getTime"
  );
}

function isDateOp(node: TSESTree.Node | null | undefined): boolean {
  return isGetTimeCall(node) || isNewDateCall(node);
}

function isSortCallback(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
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
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === "sort"
  );
}

function isDateSubtractionSort(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): boolean {
  const body = node.body;
  if (!body || body.type !== AST_NODE_TYPES.BinaryExpression) {
    return false;
  }
  if (body.operator !== "-") {
    return false;
  }

  const left = body.left;
  const right = body.right;
  const leftOk =
    left.type === AST_NODE_TYPES.CallExpression &&
    left.callee.type === AST_NODE_TYPES.MemberExpression &&
    isGetTimeCall(left) &&
    isNewDateCall(left.callee.object);
  if (!leftOk) {
    return false;
  }
  const rightOk =
    right.type === AST_NODE_TYPES.CallExpression &&
    right.callee.type === AST_NODE_TYPES.MemberExpression &&
    isGetTimeCall(right) &&
    isNewDateCall(right.callee.object);
  return rightOk;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer date-fns functions over direct Date operations for better readability and reliability",
    },
    fixable: "code",
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
  },
  defaultOptions: [],
  create(context) {
    let hasDateFnsImport = false;
    // Tracks nesting inside .sort() callbacks so we can skip the parent-walk
    // on every BinaryExpression (a very hot AST node).
    let sortCallbackDepth = 0;

    function enterCallback(
      node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
    ): void {
      if (isSortCallback(node)) {
        sortCallbackDepth++;
      }
    }
    function exitCallback(
      node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
    ): void {
      if (isSortCallback(node)) {
        sortCallbackDepth--;
      }
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (hasDateFnsImport) {
          return;
        }
        const value = node.source.value;
        if (
          typeof value === "string" &&
          (value === "date-fns" || value.startsWith("date-fns/"))
        ) {
          hasDateFnsImport = true;
        }
      },

      ArrowFunctionExpression: enterCallback,
      "ArrowFunctionExpression:exit": exitCallback,
      FunctionExpression: enterCallback,
      "FunctionExpression:exit": exitCallback,

      CallExpression(node: TSESTree.CallExpression): void {
        if (hasDateFnsImport) {
          return;
        }
        const callee = node.callee;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          callee.property.type !== AST_NODE_TYPES.Identifier ||
          callee.property.name !== "sort" ||
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
        if (isDateSubtractionSort(sortFn)) {
          context.report({ node: sortFn, messageId: "preferDateFnsSort" });
        }
      },

      BinaryExpression(node: TSESTree.BinaryExpression): void {
        if (hasDateFnsImport) {
          return;
        }
        if (sortCallbackDepth > 0) {
          return;
        }

        const op = node.operator;
        let messageId: MessageIds | null = null;
        if (op === "-") {
          messageId = "preferDateFnsSubtraction";
        } else if (op === "+") {
          messageId = "preferDateFnsArithmetic";
        } else if (COMPARISON_OPS.has(op)) {
          messageId = "preferDateFnsComparison";
        } else {
          return;
        }

        if (!(isDateOp(node.left) || isDateOp(node.right))) {
          return;
        }
        context.report({ node, messageId });
      },
    };
  },
});
