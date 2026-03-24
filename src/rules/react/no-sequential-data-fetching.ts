import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-sequential-data-fetching";

type MessageIds = "sequentialAwait";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn about sequential data fetching in Server Components which causes waterfalls",
    },
    fixable: "code",
    schema: [],
    messages: {
      sequentialAwait:
        "Sequential data fetching detected. If these requests don't depend on each other, use Promise.all() for parallel execution.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      FunctionDeclaration(node): void {
        checkAsyncFunction(node, context);
      },
      ArrowFunctionExpression(node): void {
        checkAsyncFunction(node, context);
      },
      FunctionExpression(node): void {
        checkAsyncFunction(node, context);
      },
    };
  },
});

function checkAsyncFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>
): void {
  if (!node.async || node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return;
  }

  const awaitStatements: TSESTree.Node[] = [];
  const body = node.body.body;

  // Scan top-level statements in the function body
  for (const statement of body) {
    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      for (const decl of statement.declarations) {
        if (decl.init && decl.init.type === AST_NODE_TYPES.AwaitExpression) {
          awaitStatements.push(statement);
        }
      }
    } else if (
      statement.type === AST_NODE_TYPES.ExpressionStatement &&
      statement.expression.type === AST_NODE_TYPES.AwaitExpression
    ) {
      awaitStatements.push(statement);
    }
  }

  if (awaitStatements.length > 1) {
    // Report on the second await onwards
    for (let i = 1; i < awaitStatements.length; i++) {
      const awaitNode = awaitStatements[i];
      if (awaitNode) {
        context.report({
          node: awaitNode,
          messageId: "sequentialAwait",
        });
      }
    }
  }
}
