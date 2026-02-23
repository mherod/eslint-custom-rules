import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "no-use-search-params-as-initial-state";

type MessageIds = "noSearchParamsAsInitialState";

type Options = [];

/**
 * Returns true when a CallExpression is a call to `useSearchParams()`.
 */
function isUseSearchParamsCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "useSearchParams"
  );
}

/**
 * Returns true when an expression is a `useState(...)` or `React.useState(...)` call.
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
 * Returns true when the expression references a member of a known
 * useSearchParams variable (e.g. `sp.get('q')`, `sp.getAll('filter')`).
 */
function referencesSearchParamsVar(
  expr: TSESTree.Expression | TSESTree.SpreadElement,
  searchParamsVars: Set<string>
): boolean {
  if (expr.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const call = expr;
  if (call.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const { object } = call.callee;
  return (
    object.type === AST_NODE_TYPES.Identifier &&
    searchParamsVars.has(object.name)
  );
}

/**
 * Returns true when an expression is an inline `useSearchParams().get(...)` call.
 */
function isInlineSearchParamsAccess(
  expr: TSESTree.Expression | TSESTree.SpreadElement
): boolean {
  if (expr.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const call = expr;
  if (call.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const { object } = call.callee;
  return (
    object.type === AST_NODE_TYPES.CallExpression &&
    isUseSearchParamsCall(object)
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent using useSearchParams() as the source of useState initial values in Client Components",
    },
    schema: [],
    messages: {
      noSearchParamsAsInitialState:
        "Do not initialise useState() with a value read from useSearchParams(). " +
        "This causes a flash-of-wrong-content on SSR and breaks deep links: the server renders with the correct URL state, " +
        "but the client re-renders with a default value before this hook fires during hydration. " +
        "Fix: Extract and normalise the search param in your Server Component page — " +
        "`const q = (await searchParams).q ?? ''` — then pass it as an `initial*` prop: " +
        "`<YourComponent initialQuery={q} />`. " +
        "In your Client Component, initialise state from that prop — `const [query, setQuery] = useState(initialQuery)` — " +
        "and use useSearchParams() only inside a useEffect to reactively sync state when the URL changes after hydration.",
    },
  },
  defaultOptions: [],
  create(context) {
    // This pattern only applies to Client Components
    if (!hasUseClientDirective(context.sourceCode)) {
      return {};
    }

    // Track variable names that hold the return value of useSearchParams()
    // e.g. `const searchParams = useSearchParams();`
    //      `const [sp] = useSearchParams();`  (unlikely but handle ArrayPattern)
    const searchParamsVars = new Set<string>();

    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.init?.type === AST_NODE_TYPES.CallExpression &&
          isUseSearchParamsCall(node.init)
        ) {
          if (node.id.type === AST_NODE_TYPES.Identifier) {
            searchParamsVars.add(node.id.name);
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (!isUseStateCall(node)) {
          return;
        }

        const arg = node.arguments[0];
        if (arg === undefined) {
          return;
        }

        // Pattern 1: useState(searchParams.get('x'))
        if (referencesSearchParamsVar(arg, searchParamsVars)) {
          context.report({ node, messageId: "noSearchParamsAsInitialState" });
          return;
        }

        // Pattern 2: useState(useSearchParams().get('x'))
        if (isInlineSearchParamsAccess(arg)) {
          context.report({ node, messageId: "noSearchParamsAsInitialState" });
        }
      },
    };
  },
});
