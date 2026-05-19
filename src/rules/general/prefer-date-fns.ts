import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-date-fns";

type MessageIds =
  | "preferDateFnsFormat"
  | "preferDateFnsParse"
  | "preferDateFnsFormatISO";

type Options = [];

const DATE_FORMATTING_METHODS = new Set([
  "toLocaleDateString",
  "toLocaleTimeString",
  "toLocaleString",
  "toDateString",
  "toTimeString",
]);

function isDateConstructor(node: TSESTree.Expression): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === "Date";
}

function isDateTypeReference(
  node: TSESTree.TypeNode | TSESTree.TSTypeAnnotation | null | undefined
): boolean {
  if (!node) {
    return false;
  }

  if (node.type === AST_NODE_TYPES.TSTypeAnnotation) {
    return isDateTypeReference(node.typeAnnotation);
  }

  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return (
      node.typeName.type === AST_NODE_TYPES.Identifier &&
      node.typeName.name === "Date"
    );
  }

  if (node.type === AST_NODE_TYPES.TSUnionType) {
    return node.types.some(isDateTypeReference);
  }

  return false;
}

function isDateLikeExpression(
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode,
  seenVariables = new Set<TSESLint.Scope.Variable>()
): boolean {
  if (node.type === AST_NODE_TYPES.NewExpression) {
    return isDateConstructor(node.callee);
  }

  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    return (
      isDateTypeReference(node.typeAnnotation) ||
      isDateLikeExpression(node.expression, sourceCode, seenVariables)
    );
  }

  if (node.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const variable = ASTUtils.findVariable(sourceCode.getScope(node), node);
  if (!variable || seenVariables.has(variable)) {
    return false;
  }

  seenVariables.add(variable);
  return variable.defs.some((definition) => {
    if (
      definition.name.type === AST_NODE_TYPES.Identifier &&
      isDateTypeReference(definition.name.typeAnnotation)
    ) {
      return true;
    }

    if (
      definition.node.type === AST_NODE_TYPES.VariableDeclarator &&
      definition.node.init
    ) {
      return isDateLikeExpression(
        definition.node.init,
        sourceCode,
        seenVariables
      );
    }

    return false;
  });
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce using date-fns for date formatting and manipulation instead of native Date methods",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferDateFnsFormat:
        "Prefer `format` from date-fns over native `{{method}}` for consistent formatting.",
      preferDateFnsFormatISO:
        "Prefer `formatISO` from date-fns over native `toISOString`.",
      preferDateFnsParse:
        "Prefer `parseISO` from date-fns over `Date.parse` for safer parsing.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check for instance methods: date.toLocaleDateString(), etc.
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const property = node.callee.property;

          if (property.type === AST_NODE_TYPES.Identifier) {
            const methodName = property.name;

            // Formatting methods
            if (DATE_FORMATTING_METHODS.has(methodName)) {
              const memberExpr = node.callee as TSESTree.MemberExpression;
              if (!isDateLikeExpression(memberExpr.object, sourceCode)) {
                return;
              }

              context.report({
                node: property,
                messageId: "preferDateFnsFormat",
                data: { method: methodName },
                fix(fixer) {
                  const objText = sourceCode.getText(memberExpr.object);
                  return fixer.replaceText(node, `format(${objText}, 'PP')`);
                },
              });
            }

            // ISO String
            if (methodName === "toISOString") {
              const memberExpr = node.callee as TSESTree.MemberExpression;
              if (!isDateLikeExpression(memberExpr.object, sourceCode)) {
                return;
              }

              context.report({
                node: property,
                messageId: "preferDateFnsFormatISO",
                fix(fixer) {
                  const objText = sourceCode.getText(memberExpr.object);
                  return fixer.replaceText(node, `formatISO(${objText})`);
                },
              });
            }
          }
        }

        // Check for static methods: Date.parse()
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "Date" &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "parse"
        ) {
          context.report({
            node,
            messageId: "preferDateFnsParse",
            fix(fixer) {
              if (node.arguments.length === 0) {
                return null;
              }
              const argText = sourceCode.getText(
                node.arguments[0] as TSESTree.Expression
              );
              return fixer.replaceText(node, `parseISO(${argText})`);
            },
          });
        }
      },
    };
  },
});
