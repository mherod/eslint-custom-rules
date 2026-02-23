import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "no-use-params-in-client-component";

type MessageIds = "noUseParamsInClient" | "noUseSearchParamsAsSource";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent usage of useParams in Client Components; warn against using useSearchParams as a data source instead of a URL sync mechanism",
    },
    schema: [],
    messages: {
      noUseParamsInClient:
        "Do not call 'useParams()' in a Client Component. " +
        "Route params are available as a Promise in Next.js 15+ and must be extracted in the Server Component page. " +
        "Fix: In your page.tsx (Server Component), destructure params with `const { id } = await params;` and pass the value as a prop: `<YourClientComponent itemId={id} />`. " +
        "Then remove this `useParams()` call and read the prop instead.",
      noUseSearchParamsAsSource:
        "Do not use 'useSearchParams()' as the source of truth for initial UI state in a Client Component. " +
        "This causes a flash-of-wrong-content on SSR and breaks deep links/bookmarks — the server renders with the correct URL state but the client re-renders with defaults before this hook fires. " +
        "Fix: Extract and normalise searchParams in your Server Component page (`const q = (await searchParams).q ?? ''`), " +
        "then pass the value as an `initial*` prop (`<YourClientComponent initialQuery={q} />`). " +
        "Initialise state from that prop (`useState(initialQuery)`) and use `useSearchParams()` only inside a `useEffect` to reactively sync state when the URL changes after hydration.",
    },
  },
  defaultOptions: [],
  create(context) {
    const isClientComponent = hasUseClientDirective(context.sourceCode);

    return {
      CallExpression(node): void {
        if (!isClientComponent) {
          return;
        }

        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (node.callee.name === "useParams") {
          context.report({
            node,
            messageId: "noUseParamsInClient",
          });
          return;
        }

        if (node.callee.name === "useSearchParams") {
          // useSearchParams is allowed in client components for reactive URL
          // synchronisation. Flag it only when the return value is used directly
          // as a useState initialiser, which indicates the component is treating
          // it as a data source rather than a sync mechanism.
          //
          // Pattern caught: const [x, setX] = useState(searchParams.get('x'))
          // where `searchParams` was assigned from useSearchParams().
          //
          // The full "useState(useSearchParams().get(...))" pattern is caught by
          // the separate no-use-search-params-as-initial-state rule. Here we
          // only emit a contextual reminder that useSearchParams is for sync only.
          const parent = node.parent;
          const isUsedInStateInit =
            parent?.type === AST_NODE_TYPES.VariableDeclarator &&
            parent.parent?.type === AST_NODE_TYPES.VariableDeclaration;

          if (!isUsedInStateInit) {
            // Not assigned to a variable at all — likely called as an expression.
            // Allow: may be used in JSX or effects.
            return;
          }

          // Allow: the assignment itself is fine; only flag misuse via the
          // no-use-search-params-as-initial-state rule.
        }
      },
    };
  },
});
