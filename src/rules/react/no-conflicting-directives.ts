import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-conflicting-directives";

type MessageIds = "conflictingDirectives";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow conflicting 'use client' and 'use server' directives in the same file.",
    },
    fixable: "code",
    messages: {
      conflictingDirectives:
        "It's not possible to have both 'use client' and 'use server' directives in the same file. " +
        "'use client' marks a client component, while 'use server' marks a server action or server component file. " +
        "They are mutually exclusive at the file level.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node: TSESTree.Program): void {
        let hasUseClient = false;
        let hasUseServer = false;
        let useServerNode: TSESTree.ExpressionStatement | null = null;

        for (const statement of node.body) {
          if (
            statement.type === AST_NODE_TYPES.ExpressionStatement &&
            "directive" in statement &&
            statement.directive
          ) {
            if (statement.directive === "use client") {
              hasUseClient = true;
            } else if (statement.directive === "use server") {
              hasUseServer = true;
              useServerNode = statement as TSESTree.ExpressionStatement;
            }
          } else if (
            statement.type === AST_NODE_TYPES.ExpressionStatement &&
            statement.expression.type === AST_NODE_TYPES.Literal &&
            typeof statement.expression.value === "string"
          ) {
            if (statement.expression.value === "use client") {
              hasUseClient = true;
            } else if (statement.expression.value === "use server") {
              hasUseServer = true;
              useServerNode = statement;
            }
          }
        }

        if (hasUseClient && hasUseServer) {
          context.report({
            node,
            messageId: "conflictingDirectives",
            fix: useServerNode
              ? (fixer) => {
                  const src = context.sourceCode.getText();
                  const end = (useServerNode as TSESTree.ExpressionStatement)
                    .range[1];
                  const removeEnd =
                    end < src.length && src[end] === "\n" ? end + 1 : end;
                  return fixer.removeRange([
                    (useServerNode as TSESTree.ExpressionStatement).range[0],
                    removeEnd,
                  ]);
                }
              : null,
          });
        }
      },
    };
  },
});
