import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-use-hook-for-promise-props";

type MessageIds = "preferUseHook";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest using the 'use' hook for Promise props in Client Components to support streaming",
    },
    schema: [],
    messages: {
      preferUseHook:
        "Prop '{{name}}' appears to be a Promise. Unwrap it with `const value = use({{name}})` to enable Suspense/Streaming.",
    },
  },
  defaultOptions: [],
  create(context) {
    let isClientComponent = false;

    return {
      Program(node): void {
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
      FunctionDeclaration(node): void {
        if (!isClientComponent) {
          return;
        }
        checkComponentProps(node, context);
      },
      ArrowFunctionExpression(node): void {
        if (!isClientComponent) {
          return;
        }
        checkComponentProps(node, context);
      },
      FunctionExpression(node): void {
        if (!isClientComponent) {
          return;
        }
        checkComponentProps(node, context);
      },
    };
  },
});

// Using any for context type to avoid complex type inference issues
function checkComponentProps(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
): void {
  if (node.params.length === 0) {
    return;
  }
  const propsParam = node.params[0];

  // Destructuring: ({ translationsPromise })
  if (propsParam && propsParam.type === AST_NODE_TYPES.ObjectPattern) {
    for (const prop of propsParam.properties) {
      if (
        prop.type === AST_NODE_TYPES.Property &&
        prop.key.type === AST_NODE_TYPES.Identifier
      ) {
        const propName = prop.key.name;
        // Check if name ends in Promise (heuristic convention mentioned in user example)
        if (propName.endsWith("Promise")) {
          // Check if 'use' is called with this variable in the body.
          if (
            !isUseCalledWith(
              node.body,
              prop.value.type === AST_NODE_TYPES.Identifier
                ? prop.value.name
                : propName
            )
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            context.report({
              node: prop,
              messageId: "preferUseHook",
              data: { name: propName },
            });
          }
        }
      }
    }
  }
}

function isUseCalledWith(body: TSESTree.Node, variableName: string): boolean {
  if (body.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }

  // Simple scan for use(variableName)
  // This is not exhaustive scope analysis but catches standard patterns
  for (const statement of body.body) {
    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      for (const decl of statement.declarations) {
        if (decl.init && decl.init.type === AST_NODE_TYPES.CallExpression) {
          if (
            decl.init.callee.type === AST_NODE_TYPES.Identifier &&
            decl.init.callee.name === "use"
          ) {
            const arg = decl.init.arguments[0];
            if (
              arg &&
              arg.type === AST_NODE_TYPES.Identifier &&
              arg.name === variableName
            ) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}
