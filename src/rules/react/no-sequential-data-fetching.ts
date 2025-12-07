import {
  AST_NODE_TYPES,
  ESLintUtils,
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

// Using any for context type to avoid complex type inference issues
function checkAsyncFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
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
      // We report on the note, ideally we'd check dependency but that's hard.
      // This is a "suggestion" rule so it's okay to have false positives to prompt review.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      context.report({
        node: awaitStatements[i],
        messageId: "sequentialAwait",
      });
    }
  }
}
