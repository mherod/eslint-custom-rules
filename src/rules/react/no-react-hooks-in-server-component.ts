import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { isServerComponent } from "../utils/component-type-utils";

export const RULE_NAME = "no-react-hooks-in-server-component";

type MessageIds = "hookInServerComponent";

type Options = [];

const CLIENT_HOOKS = new Set([
  "useState",
  "useEffect",
  "useContext",
  "useReducer",
  "useRef",
  "useLayoutEffect",
  "useImperativeHandle",
  "useCallback",
  "useMemo",
  "useDeferredValue",
  "useTransition",
  "useSyncExternalStore",
  "useInsertionEffect",
  "useOptimistic",
  "useFormStatus",
  "useFormState",
]);

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: "Prevent usage of standard React Hooks in Server Components",
    },
    schema: [],
    messages: {
      hookInServerComponent:
        "React Hook '{{name}}' is not supported in Server Components. Add 'use client' directive to the top of the file or move this logic to a Client Component.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Only apply this rule to files that are actually Server Components.
    // Files without "use client" are NOT necessarily server components —
    // they could be utility files, hook files, test files, or non-Next.js code.
    if (!isServerComponent(filename, sourceCode)) {
      return {};
    }

    return {
      CallExpression(node): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (CLIENT_HOOKS.has(node.callee.name)) {
            context.report({
              node,
              messageId: "hookInServerComponent",
              data: { name: node.callee.name },
            });
          }
        }
      },
    };
  },
});
