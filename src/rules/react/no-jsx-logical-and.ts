import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import ts from "typescript";

// Keep the published name for existing configurations.
export const RULE_NAME = "no-jsx-logical-and";

type Safety = "safe" | "numeric" | "unknown";
type MessageIds = "numericCondition" | "preferShortCircuit";

function isElement(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.JSXElement ||
    node.type === AST_NODE_TYPES.JSXFragment
  );
}

/** Only expressions whose values become children, never props or conditions. */
function isRenderedChild(node: TSESTree.Node): boolean {
  const parent = node.parent;
  if (parent?.type === AST_NODE_TYPES.JSXExpressionContainer) {
    return (
      parent.parent.type === AST_NODE_TYPES.JSXElement ||
      parent.parent.type === AST_NODE_TYPES.JSXFragment
    );
  }
  if (
    parent?.type === AST_NODE_TYPES.LogicalExpression &&
    parent.right === node
  ) {
    return isRenderedChild(parent);
  }
  if (
    parent?.type === AST_NODE_TYPES.ConditionalExpression &&
    parent.test !== node
  ) {
    return isRenderedChild(parent);
  }
  return false;
}

function typeSafety(type: ts.Type, checker: ts.TypeChecker): Safety {
  if (type.isUnion()) {
    const parts = type.types.map((part) => typeSafety(part, checker));
    if (parts.includes("numeric")) {
      return "numeric";
    }
    return parts.includes("unknown") ? "unknown" : "safe";
  }
  if (type.isNumberLiteral()) {
    return type.value === 0 ? "numeric" : "safe";
  }
  if (type.flags === ts.TypeFlags.Number) {
    return "numeric";
  }
  if (type.flags === ts.TypeFlags.BigIntLiteral) {
    return (type as ts.BigIntLiteralType).value.base10Value === "0"
      ? "numeric"
      : "safe";
  }
  if (type.flags === ts.TypeFlags.BigInt) {
    return "numeric";
  }
  if (
    type.flags === ts.TypeFlags.Any ||
    type.flags === ts.TypeFlags.Unknown ||
    type.isTypeParameter()
  ) {
    const constraint = checker.getBaseConstraintOfType(type);
    return constraint && constraint !== type
      ? typeSafety(constraint, checker)
      : "unknown";
  }
  if (type.isIntersection()) {
    const parts = type.types.map((part) => typeSafety(part, checker));
    return parts.includes("numeric") ? "numeric" : "unknown";
  }
  return "safe";
}

export default ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer succinct JSX conditionals without leaking falsy numbers into rendered children",
    },
    schema: [],
    messages: {
      numericCondition:
        "This numeric condition can render 0 or NaN. Coerce the condition to boolean and keep &&.",
      preferShortCircuit:
        "Use the shorter {{condition}} && JSX form for conditional rendering.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const source = context.sourceCode;
    const services = source.parserServices;
    const program = services?.program;
    const checker = program?.getTypeChecker();

    function safety(
      node: TSESTree.Node,
      seen = new Set<TSESTree.Node>()
    ): Safety {
      if (seen.has(node)) {
        return "unknown";
      }
      seen.add(node);
      if (node.type === AST_NODE_TYPES.UnaryExpression) {
        if (
          node.operator === "!" ||
          node.operator === "typeof" ||
          node.operator === "void" ||
          node.operator === "delete"
        ) {
          return "safe";
        }
        if (
          node.argument.type === AST_NODE_TYPES.Literal &&
          typeof node.argument.value === "number"
        ) {
          const value =
            node.operator === "-"
              ? -node.argument.value
              : node.operator === "~"
                ? -(new Int32Array([node.argument.value])[0] ?? 0) - 1
                : node.argument.value;
          return value === 0 || Number.isNaN(value) ? "numeric" : "safe";
        }
        return "numeric";
      }
      if (node.type === AST_NODE_TYPES.LogicalExpression) {
        const left = safety(node.left, new Set(seen));
        const right = safety(node.right, new Set(seen));
        if (node.operator === "||") {
          return right;
        }
        if (left === "numeric" || right === "numeric") {
          return "numeric";
        }
        return left === "safe" && right === "safe" ? "safe" : "unknown";
      }
      if (
        node.type === AST_NODE_TYPES.BinaryExpression &&
        [
          "===",
          "!==",
          "==",
          "!=",
          "<",
          ">",
          "<=",
          ">=",
          "in",
          "instanceof",
        ].includes(node.operator)
      ) {
        return "safe";
      }
      if (checker && services?.esTreeNodeToTSNodeMap) {
        return typeSafety(
          checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node)),
          checker
        );
      }
      if (node.type === AST_NODE_TYPES.Literal) {
        return node.value === 0 || node.value === 0n ? "numeric" : "safe";
      }
      if (
        node.type === AST_NODE_TYPES.ArrayExpression ||
        node.type === AST_NODE_TYPES.ObjectExpression ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.TemplateLiteral
      ) {
        return "safe";
      }
      if (
        node.type === AST_NODE_TYPES.BinaryExpression &&
        ["-", "*", "/", "%", "**", "|", "&", "^", "<<", ">>", ">>>"].includes(
          node.operator
        )
      ) {
        return "numeric";
      }
      if (node.type === AST_NODE_TYPES.Identifier) {
        let scope: ReturnType<typeof source.getScope> | null =
          source.getScope(node);
        while (scope) {
          const variable = scope.set.get(node.name);
          if (variable) {
            const definition = variable.defs[0];
            if (!definition && node.name === "NaN") {
              return "numeric";
            }
            const annotation =
              definition?.name.type === AST_NODE_TYPES.Identifier
                ? definition.name.typeAnnotation?.typeAnnotation
                : undefined;
            if (
              annotation?.type === AST_NODE_TYPES.TSNumberKeyword ||
              annotation?.type === AST_NODE_TYPES.TSBigIntKeyword
            ) {
              return "numeric";
            }
            if (
              annotation?.type === AST_NODE_TYPES.TSBooleanKeyword ||
              annotation?.type === AST_NODE_TYPES.TSStringKeyword ||
              annotation?.type === AST_NODE_TYPES.TSArrayType ||
              annotation?.type === AST_NODE_TYPES.TSTypeLiteral
            ) {
              return "safe";
            }
            if (
              definition?.node.type === AST_NODE_TYPES.VariableDeclarator &&
              definition.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
              definition.parent.kind === "const" &&
              definition.node.init
            ) {
              return safety(definition.node.init, seen);
            }
            return "unknown";
          }
          scope = scope.upper;
        }
        if (node.name === "NaN") {
          return "numeric";
        }
      }
      return "unknown";
    }

    function conditionText(node: TSESTree.Expression, negate: boolean): string {
      const hasComments = source.getCommentsInside(node).length > 0;
      if (
        !hasComments &&
        negate &&
        node.type === AST_NODE_TYPES.UnaryExpression &&
        node.operator === "!"
      ) {
        return conditionText(node.argument, false);
      }
      if (
        !hasComments &&
        node.type === AST_NODE_TYPES.UnaryExpression &&
        node.operator === "!" &&
        node.argument.type === AST_NODE_TYPES.UnaryExpression &&
        node.argument.operator === "!"
      ) {
        return conditionText(node.argument.argument, negate);
      }
      if (
        !hasComments &&
        node.type === AST_NODE_TYPES.CallExpression &&
        !node.optional &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === "Boolean" &&
        node.arguments.length === 1 &&
        node.arguments[0]?.type !== AST_NODE_TYPES.SpreadElement
      ) {
        let scope: ReturnType<typeof source.getScope> | null =
          source.getScope(node);
        let shadowed = false;
        while (scope) {
          const variable = scope.set.get("Boolean");
          if (variable) {
            shadowed =
              variable.defs.length > 0 ||
              variable.references.some((reference) => reference.isWrite());
            break;
          }
          scope = scope.upper;
        }
        if (!shadowed && node.arguments[0]) {
          return conditionText(node.arguments[0], negate);
        }
      }
      const text = source.getText(node);
      const atomic =
        node.type === AST_NODE_TYPES.Identifier ||
        node.type === AST_NODE_TYPES.MemberExpression ||
        node.type === AST_NODE_TYPES.CallExpression ||
        node.type === AST_NODE_TYPES.ChainExpression ||
        node.type === AST_NODE_TYPES.Literal;
      if (negate) {
        return `!${atomic ? text : `(${text})`}`;
      }
      if (safety(node) !== "safe") {
        return `!!${atomic ? text : `(${text})`}`;
      }
      const simple =
        atomic ||
        node.type === AST_NODE_TYPES.UnaryExpression ||
        node.type === AST_NODE_TYPES.BinaryExpression ||
        (node.type === AST_NODE_TYPES.LogicalExpression &&
          node.operator === "&&");
      return simple ? text : `(${text})`;
    }

    return {
      LogicalExpression(node): void {
        if (
          node.operator !== "&&" ||
          !isElement(node.right) ||
          !isRenderedChild(node) ||
          safety(node.left) !== "numeric"
        ) {
          return;
        }
        context.report({
          node: node.left,
          messageId: "numericCondition",
          fix: (fixer) =>
            fixer.replaceText(node.left, conditionText(node.left, false)),
        });
      },
      ConditionalExpression(node): void {
        if (!isRenderedChild(node)) {
          return;
        }
        const emptyConsequent =
          node.consequent.type === AST_NODE_TYPES.Literal &&
          node.consequent.value === null;
        const emptyAlternate =
          node.alternate.type === AST_NODE_TYPES.Literal &&
          node.alternate.value === null;
        const element =
          emptyAlternate && isElement(node.consequent)
            ? node.consequent
            : emptyConsequent && isElement(node.alternate)
              ? node.alternate
              : undefined;
        if (!element) {
          return;
        }
        const condition = conditionText(node.test, emptyConsequent);
        const hasDetachedComments = source
          .getCommentsInside(node)
          .some(
            (comment) =>
              ![node.test, element].some(
                (part) =>
                  comment.range[0] >= part.range[0] &&
                  comment.range[1] <= part.range[1]
              )
          );
        context.report({
          node,
          messageId: "preferShortCircuit",
          data: { condition },
          fix: (fixer) =>
            hasDetachedComments
              ? null
              : fixer.replaceText(
                  node,
                  `${condition} && ${source.getText(element)}`
                ),
        });
      },
    };
  },
});
