import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-boolean-coercion";

export default ESLintUtils.RuleCreator.withoutDocs<[], "preferShorter">({
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer !!x to calls to the built-in Boolean function",
    },
    schema: [],
    fixable: "code",
    messages: {
      preferShorter: "Use the shorter boolean coercion: {{replacement}}.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      CallExpression(node): void {
        if (
          node.optional ||
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "Boolean" ||
          node.arguments.length !== 1
        ) {
          return;
        }
        const argument = node.arguments[0];
        if (!argument || argument.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        // A locally defined or reassigned Boolean need not perform coercion.
        for (
          let scope: ReturnType<typeof sourceCode.getScope> | null =
            sourceCode.getScope(node);
          scope;
          scope = scope.upper
        ) {
          const variable = scope.set.get("Boolean");
          if (!variable) {
            continue;
          }
          if (
            variable.defs.length ||
            variable.references.some((reference) => reference.isWrite())
          ) {
            return;
          }
          break;
        }

        const text = sourceCode.getText(argument);
        const atomic = [
          AST_NODE_TYPES.Identifier,
          AST_NODE_TYPES.Literal,
          AST_NODE_TYPES.MemberExpression,
          AST_NODE_TYPES.CallExpression,
          AST_NODE_TYPES.NewExpression,
          AST_NODE_TYPES.ChainExpression,
          AST_NODE_TYPES.UnaryExpression,
          AST_NODE_TYPES.UpdateExpression,
          AST_NODE_TYPES.ArrayExpression,
          AST_NODE_TYPES.ObjectExpression,
          AST_NODE_TYPES.TemplateLiteral,
        ].some((type) => type === argument.type);
        let replacement =
          argument.type === AST_NODE_TYPES.UnaryExpression &&
          argument.operator === "!"
            ? text
            : `!!${atomic ? text : `(${text})`}`;
        const parent = node.parent;
        if (
          parent.type === AST_NODE_TYPES.TSNonNullExpression ||
          parent.type === AST_NODE_TYPES.TSInstantiationExpression ||
          (parent.type === AST_NODE_TYPES.MemberExpression &&
            parent.object === node) ||
          ((parent.type === AST_NODE_TYPES.CallExpression ||
            parent.type === AST_NODE_TYPES.NewExpression) &&
            parent.callee === node) ||
          (parent.type === AST_NODE_TYPES.TaggedTemplateExpression &&
            parent.tag === node) ||
          (parent.type === AST_NODE_TYPES.BinaryExpression &&
            parent.operator === "**" &&
            parent.left === node)
        ) {
          replacement = `(${replacement})`;
        }

        const losesComments = sourceCode
          .getCommentsInside(node)
          .some(
            (comment) =>
              comment.range[0] < argument.range[0] ||
              comment.range[1] > argument.range[1]
          );
        context.report({
          node,
          messageId: "preferShorter",
          data: { replacement },
          fix: losesComments
            ? null
            : (fixer): TSESLint.RuleFix => fixer.replaceText(node, replacement),
        });
      },
    };
  },
});
