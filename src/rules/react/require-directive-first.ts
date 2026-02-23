import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "require-directive-first";

/**
 * This rule enforces that "use x" directives must be the first statement.
 *
 * JavaScript/ECMAScript only recognizes directives when they appear in the
 * "directive prologue" - the sequence of string literal expression statements
 * at the very beginning of a script or function body.
 *
 * If a directive appears after imports or other code, it becomes a regular
 * string expression and bundlers won't recognize it, causing subtle bugs.
 *
 * File-level directives: "use client", "use server", "use cache"
 * Function-level directives: "use server" (inline server actions)
 */

type MessageIds = "directiveNotFirst" | "directiveNotFirstInFunction";

type Options = [];

const DIRECTIVE_VALUES = ["use client", "use server", "use cache"];

function isDirective(
  node: TSESTree.Node
): node is TSESTree.ExpressionStatement {
  if (node.type !== AST_NODE_TYPES.ExpressionStatement) {
    return false;
  }

  // Check for directive property (standard parser behavior)
  if ("directive" in node && typeof node.directive === "string") {
    return DIRECTIVE_VALUES.includes(node.directive);
  }

  // Check for string literal expression
  if (
    node.expression.type === AST_NODE_TYPES.Literal &&
    typeof node.expression.value === "string"
  ) {
    return DIRECTIVE_VALUES.includes(node.expression.value);
  }

  return false;
}

function getDirectiveValue(node: TSESTree.ExpressionStatement): string | null {
  if ("directive" in node && typeof node.directive === "string") {
    return node.directive;
  }
  if (
    node.expression.type === AST_NODE_TYPES.Literal &&
    typeof node.expression.value === "string"
  ) {
    return node.expression.value;
  }
  return null;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        'Enforce that "use client", "use server", and "use cache" directives are the first statement',
    },
    schema: [],
    messages: {
      directiveNotFirst:
        '"{{directive}}" must be the first statement in the file. ' +
        "Directives placed after imports or other code are not recognized by bundlers.",
      directiveNotFirstInFunction:
        '"use server" must be the first statement in the function body. ' +
        "Directives placed after other statements are not recognized.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function checkFunctionBody(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ): void {
      // Only check block bodies (not expression bodies for arrow functions)
      if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
        return;
      }

      const body = node.body.body;
      if (body.length === 0) {
        return;
      }

      // Find all directives in the function body
      for (let i = 0; i < body.length; i++) {
        const statement = body[i];
        if (!(statement && isDirective(statement))) {
          continue;
        }

        const directiveValue = getDirectiveValue(statement);
        // Only "use server" is valid inside functions (inline server actions)
        if (directiveValue !== "use server") {
          continue;
        }

        // If directive is not at index 0, it's misplaced
        if (i !== 0) {
          context.report({
            node: statement,
            messageId: "directiveNotFirstInFunction",
            fix(fixer) {
              // Move directive to the first position
              const directiveText = sourceCode.getText(statement);
              const firstStatement = body[0];
              if (!firstStatement) {
                return null;
              }

              return [
                fixer.remove(statement),
                fixer.insertTextBefore(firstStatement, `${directiveText}\n`),
              ];
            },
          });
        }
      }
    }

    return {
      Program(node): void {
        const body = node.body;
        if (body.length === 0) {
          return;
        }

        // Find all file-level directives
        for (let i = 0; i < body.length; i++) {
          const statement = body[i];
          if (!(statement && isDirective(statement))) {
            continue;
          }

          const directiveValue = getDirectiveValue(statement);
          if (!directiveValue) {
            continue;
          }

          // If directive is not at index 0, it's misplaced
          if (i !== 0) {
            context.report({
              node: statement,
              messageId: "directiveNotFirst",
              data: {
                directive: directiveValue,
              },
              fix(fixer) {
                // Move directive to the very first position
                const directiveText = sourceCode.getText(statement);
                const firstStatement = body[0];
                if (!firstStatement) {
                  return null;
                }

                // Check if there are comments before the first statement
                const comments = sourceCode.getCommentsBefore(firstStatement);
                const insertTarget =
                  comments.length > 0 ? comments[0] : firstStatement;

                return [
                  fixer.remove(statement),
                  fixer.insertTextBefore(
                    insertTarget as TSESTree.Node,
                    `${directiveText}\n`
                  ),
                ];
              },
            });
          }
        }
      },

      FunctionDeclaration: checkFunctionBody,
      FunctionExpression: checkFunctionBody,
      ArrowFunctionExpression: checkFunctionBody,
    };
  },
});
