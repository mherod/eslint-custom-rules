import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-zod-default-with-catch";

type MessageIds = "preferZodDefaultWithCatch";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest adding .catch(() => default) when a default is given but no catch error handling exists",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferZodDefaultWithCatch:
        "When .default() is used, you should also handle validation errors with .catch() to ensure robust fallback.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check if this is a .default() call
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          node.callee.property.name !== "default"
        ) {
          return;
        }

        // Verify it's likely a Zod chain
        if (!isLikelyZodChain(node)) {
          return;
        }

        // Check for .catch() in the chain
        if (hasCatchInChain(node)) {
          return;
        }

        // Get the default value argument
        const defaultArg = node.arguments[0];
        if (!defaultArg) {
          return;
        }

        const defaultText = sourceCode.getText(defaultArg);

        context.report({
          node: node.callee.property,
          messageId: "preferZodDefaultWithCatch",
          fix(fixer) {
            // Append .catch(() => defaultValue) after the .default() call
            return fixer.insertTextAfter(node, `.catch(() => ${defaultText})`);
          },
        });
      },
    };
  },
});

function isLikelyZodChain(node: TSESTree.CallExpression): boolean {
  // Traverse down to find the root
  let current: TSESTree.Node = node.callee;

  while (current.type === AST_NODE_TYPES.MemberExpression) {
    current = current.object;
    if (current.type === AST_NODE_TYPES.CallExpression) {
      current = current.callee;
    }
  }

  // Check if root is 'z' identifier or typical zod methods
  if (current.type === AST_NODE_TYPES.Identifier) {
    if (current.name === "z") {
      return true;
    }
    if (isZodMethod(current.name)) {
      return true;
    }
  }

  return false;
}

function hasCatchInChain(node: TSESTree.CallExpression): boolean {
  // 1. Check ancestors (subsequent calls in the chain)
  let current: TSESTree.Node = node;
  while (current.parent) {
    const parent: TSESTree.Node = current.parent;
    if (
      parent.type === AST_NODE_TYPES.MemberExpression &&
      parent.object === current
    ) {
      if (
        parent.property.type === AST_NODE_TYPES.Identifier &&
        parent.property.name === "catch"
      ) {
        return true;
      }
      current = parent; // Move up to MemberExpression
    } else if (
      parent.type === AST_NODE_TYPES.CallExpression &&
      parent.callee === current
    ) {
      current = parent; // Move up to CallExpression
    } else {
      break; // End of chain
    }
  }

  // 2. Check descendants (preceding calls in the chain)
  // node is the .default() call
  // node.callee is MemberExpression (.default)
  // node.callee.object is the previous link
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    let prev = node.callee.object;
    while (prev) {
      if (prev.type === AST_NODE_TYPES.CallExpression) {
        if (
          prev.callee.type === AST_NODE_TYPES.MemberExpression &&
          prev.callee.property.type === AST_NODE_TYPES.Identifier &&
          prev.callee.property.name === "catch"
        ) {
          return true;
        }
        if (prev.callee.type === AST_NODE_TYPES.MemberExpression) {
          prev = prev.callee.object;
        } else {
          break;
        }
      } else if (prev.type === AST_NODE_TYPES.MemberExpression) {
        prev = prev.object;
      } else {
        break;
      }
    }
  }

  return false;
}

function isZodMethod(name: string): boolean {
  const zodMethods = [
    "string",
    "number",
    "boolean",
    "array",
    "object",
    "union",
    "intersection",
    "enum",
    "nativeEnum",
    "date",
    "promise",
    "any",
    "unknown",
    "never",
    "void",
    "undefined",
    "null",
    "literal",
    "tuple",
    "record",
    "map",
    "set",
    "function",
    "lazy",
    "effect",
    "custom",
  ];
  return zodMethods.includes(name);
}
