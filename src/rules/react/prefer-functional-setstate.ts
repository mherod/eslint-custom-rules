import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-functional-setstate";

type MessageIds = "preferFunctionalSetState";

type Options = [];

/**
 * Returns true when a call expression is `useState(...)` or `React.useState(...)`.
 */
function isUseStateCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;
  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === "useState") {
    return true;
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === "React" &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === "useState"
  ) {
    return true;
  }
  return false;
}

/**
 * Collects all Identifier names referenced in an expression.
 * Used to detect whether the state variable appears in the setter argument.
 */
function collectIdentifierNames(
  node: TSESTree.Expression | TSESTree.SpreadElement
): Set<string> {
  const names = new Set<string>();
  visitExpr(node, names);
  return names;
}

function visitExprList(
  nodes: (TSESTree.Expression | TSESTree.SpreadElement | null)[],
  out: Set<string>
): void {
  for (const item of nodes) {
    if (item !== null) {
      visitExpr(item, out);
    }
  }
}

/**
 * Typed expression visitor — recurses into child expressions using specific
 * typed properties rather than generic Object.keys(), which yields `never`
 * on the TSESTree.Node discriminated union.
 */
function visitExpr(
  node: TSESTree.Expression | TSESTree.SpreadElement,
  out: Set<string>
): void {
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
      out.add(node.name);
      break;
    case AST_NODE_TYPES.SpreadElement:
      visitExpr(node.argument, out);
      break;
    case AST_NODE_TYPES.CallExpression:
      if (node.callee.type !== AST_NODE_TYPES.Super) {
        visitExpr(node.callee, out);
      }
      visitExprList(node.arguments, out);
      break;
    case AST_NODE_TYPES.NewExpression:
      if (node.callee.type !== AST_NODE_TYPES.Super) {
        visitExpr(node.callee, out);
      }
      visitExprList(node.arguments, out);
      break;
    case AST_NODE_TYPES.MemberExpression:
      visitExpr(node.object, out);
      if (node.computed) {
        // When computed, property is an Expression (not PrivateIdentifier)
        visitExpr(node.property as TSESTree.Expression, out);
      }
      break;
    case AST_NODE_TYPES.ArrayExpression:
      visitExprList(node.elements, out);
      break;
    case AST_NODE_TYPES.ObjectExpression:
      for (const prop of node.properties) {
        if (prop.type === AST_NODE_TYPES.SpreadElement) {
          visitExpr(prop.argument, out);
        } else if (prop.type === AST_NODE_TYPES.Property) {
          if (prop.computed) {
            visitExpr(prop.key as TSESTree.Expression, out);
          }
          visitExpr(prop.value as TSESTree.Expression, out);
        }
      }
      break;
    case AST_NODE_TYPES.BinaryExpression:
      if (node.left.type !== AST_NODE_TYPES.PrivateIdentifier) {
        visitExpr(node.left, out);
      }
      visitExpr(node.right, out);
      break;
    case AST_NODE_TYPES.LogicalExpression:
      visitExpr(node.left, out);
      visitExpr(node.right, out);
      break;
    case AST_NODE_TYPES.ConditionalExpression:
      visitExpr(node.test, out);
      visitExpr(node.consequent, out);
      visitExpr(node.alternate, out);
      break;
    case AST_NODE_TYPES.UnaryExpression:
      visitExpr(node.argument, out);
      break;
    case AST_NODE_TYPES.AwaitExpression:
      visitExpr(node.argument, out);
      break;
    case AST_NODE_TYPES.TemplateLiteral:
      visitExprList(node.expressions, out);
      break;
    case AST_NODE_TYPES.TaggedTemplateExpression:
      visitExpr(node.tag, out);
      visitExprList(node.quasi.expressions, out);
      break;
    case AST_NODE_TYPES.AssignmentExpression:
      visitExpr(node.right, out);
      break;
    case AST_NODE_TYPES.SequenceExpression:
      visitExprList(node.expressions, out);
      break;
    default:
      // Literals, this, super, etc. — no child expressions to traverse
      break;
  }
}

/**
 * Returns true when the setter argument is already a function (functional form).
 * e.g. `setCount(prev => prev + 1)` — already correct.
 */
function isAlreadyFunctional(
  arg: TSESTree.Expression | TSESTree.SpreadElement
): boolean {
  return (
    arg.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    arg.type === AST_NODE_TYPES.FunctionExpression
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer functional setState updates (setState(curr => ...)) when the new value depends on the current state to prevent stale closures",
    },
    schema: [],
    messages: {
      preferFunctionalSetState:
        "Use the functional form of setState when the new value depends on '{{stateVar}}'. " +
        "Directly referencing state in a setter creates stale closure bugs: " +
        "if the component re-renders between when the callback was created and when it runs, " +
        "the setter will use an outdated value of '{{stateVar}}'. " +
        "Fix: Replace `{{setter}}({{stateVar}} ...)` with `{{setter}}(curr => curr ...)`. " +
        "This also eliminates '{{stateVar}}' as a dependency of useCallback/useMemo, " +
        "making callbacks stable and preventing unnecessary child re-renders.",
    },
  },
  defaultOptions: [],
  create(context) {
    /**
     * Map from setter name → state variable name.
     * Populated when we visit `const [stateVar, setter] = useState(...)`.
     */
    const setterToStateVar = new Map<string, string>();

    return {
      /**
       * Detect `const [stateVar, setter] = useState(...)` and register the pair.
       */
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.init?.type !== AST_NODE_TYPES.CallExpression ||
          !isUseStateCall(node.init)
        ) {
          return;
        }

        // Must be array destructuring: [stateVar, setter]
        if (node.id.type !== AST_NODE_TYPES.ArrayPattern) {
          return;
        }

        const elements = node.id.elements;
        const stateEl = elements[0];
        const setterEl = elements[1];

        if (
          stateEl?.type !== AST_NODE_TYPES.Identifier ||
          setterEl?.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }

        setterToStateVar.set(setterEl.name, stateEl.name);
      },

      /**
       * Detect `setter(expr)` where `expr` references the state variable by name.
       */
      CallExpression(node: TSESTree.CallExpression): void {
        // Must be a direct identifier call: setter(...)
        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const setterName = node.callee.name;
        const stateVarName = setterToStateVar.get(setterName);

        if (stateVarName === undefined) {
          return;
        }

        const arg = node.arguments[0];
        if (arg === undefined || arg.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        // Already using functional form — fine
        if (isAlreadyFunctional(arg)) {
          return;
        }

        // Check whether the argument references the state variable
        const referencedNames = collectIdentifierNames(arg);
        if (!referencedNames.has(stateVarName)) {
          return;
        }

        context.report({
          node,
          messageId: "preferFunctionalSetState",
          data: {
            stateVar: stateVarName,
            setter: setterName,
          },
        });
      },
    };
  },
});
