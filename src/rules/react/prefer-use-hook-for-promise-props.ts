import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

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
    fixable: "code",
    schema: [],
    messages: {
      preferUseHook:
        "Prop '{{name}}' appears to be a Promise. Unwrap it with `const value = use({{name}})` to enable Suspense/Streaming.",
    },
  },
  defaultOptions: [],
  create(context) {
    // Rule only applies to Client Components. Skip the visitor set entirely
    // (vs. early-returning inside each visitor) so non-client files pay only
    // the directive check and avoid every per-function callback.
    if (!hasUseClientDirective(context.sourceCode)) {
      return {};
    }

    // Fast path: the only reportable name pattern ends in "Promise". If the
    // file never contains that token, no path can fire.
    if (!context.sourceCode.text.includes("Promise")) {
      return {};
    }

    return {
      FunctionDeclaration(node): void {
        checkComponentProps(node, context);
      },
      ArrowFunctionExpression(node): void {
        checkComponentProps(node, context);
      },
      FunctionExpression(node): void {
        checkComponentProps(node, context);
      },
    };
  },
});

function checkComponentProps(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>
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
