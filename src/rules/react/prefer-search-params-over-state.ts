import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-search-params-over-state";

type MessageIds = "preferSearchParams";
type Options = [];

/**
 * Returns true when a variable name looks like it holds a search/query string
 * that the user types into a search box.
 *
 * Matches patterns such as:
 *   searchQuery, query, searchTerm, search, filterQuery, q
 */
function isSearchQueryName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "q" ||
    lower === "query" ||
    lower === "search" ||
    lower.includes("search") ||
    lower.includes("query") ||
    lower.includes("searchterm") ||
    lower.includes("filter")
  );
}

/**
 * Given the destructured id of a useState call, return the state variable name
 * when the pattern is `const [value, setValue] = useState(...)`.
 */
function getStateVariableName(
  declarator: TSESTree.VariableDeclarator
): string | null {
  if (declarator.id.type !== AST_NODE_TYPES.ArrayPattern) {
    return null;
  }
  const elements = declarator.id.elements;
  if (elements.length < 1) {
    return null;
  }
  const first = elements[0];
  if (!first || first.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }
  return first.name;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer URL search params (useSearchParams / nuqs) over useState for search/query strings",
    },
    schema: [],
    messages: {
      preferSearchParams:
        "'{{name}}' looks like a search or filter query. Prefer URL search params (useSearchParams or nuqs) so the query is shareable, bookmarkable, and survives page refreshes. Replace `useState` with `useSearchParams` or `useQueryState`.",
    },
  },
  defaultOptions: [],
  create(context): {
    VariableDeclarator(node: TSESTree.VariableDeclarator): void;
  } {
    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        // Must be: const [x, setX] = useState(...)
        if (!node.init) {
          return;
        }
        if (node.init.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        const callee = node.init.callee;

        // Match `useState(...)` and `React.useState(...)`
        const isUseStateCall =
          (callee.type === AST_NODE_TYPES.Identifier &&
            callee.name === "useState") ||
          (callee.type === AST_NODE_TYPES.MemberExpression &&
            callee.object.type === AST_NODE_TYPES.Identifier &&
            callee.object.name === "React" &&
            callee.property.type === AST_NODE_TYPES.Identifier &&
            callee.property.name === "useState");

        if (!isUseStateCall) {
          return;
        }

        const name = getStateVariableName(node);
        if (!name) {
          return;
        }

        if (isSearchQueryName(name)) {
          context.report({
            node,
            messageId: "preferSearchParams",
            data: { name },
          });
        }
      },
    };
  },
});
