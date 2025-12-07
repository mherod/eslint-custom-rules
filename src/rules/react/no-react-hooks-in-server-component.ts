import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

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
    let isClientComponent = false;

    return {
      Program(node) {
        if (node.body.length > 0) {
          const firstStatement = node.body[0];
          if (
            firstStatement &&
            firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
            firstStatement.expression.type === AST_NODE_TYPES.Literal &&
            firstStatement.expression.value === "use client"
          ) {
            isClientComponent = true;
          }
        }
      },
      CallExpression(node) {
        if (isClientComponent) {
          return;
        }

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
