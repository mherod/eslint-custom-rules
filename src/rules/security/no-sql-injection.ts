import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noSqlInjection";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect potential SQL injection vulnerabilities from string concatenation in query functions",
    },
    schema: [],
    messages: {
      noSqlInjection:
        "Potential SQL injection vulnerability. Use parameterized queries or ORM methods.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (
            isSqlFunction(functionName) &&
            hasStringConcatenation(node.arguments)
          ) {
            context.report({
              node,
              messageId: "noSqlInjection",
            });
          }
        }
      },
    };
  },
});

function isSqlFunction(functionName: string): boolean {
  const sqlFunctions = ["query", "execute", "raw", "sql", "exec"];
  return sqlFunctions.includes(functionName.toLowerCase());
}

function hasStringConcatenation(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some(
    (arg) =>
      arg.type === AST_NODE_TYPES.BinaryExpression &&
      arg.operator === "+" &&
      (arg.left.type === AST_NODE_TYPES.Literal ||
        arg.right.type === AST_NODE_TYPES.Literal)
  );
}
