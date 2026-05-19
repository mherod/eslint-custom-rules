import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noUnsafeInnerHTML" | "wrapWithSanitize";
type Options = [];

const SAFE_WRAPPER_NAMES = new Set([
  "sanitize",
  "purify",
  "escapeHtml",
  "escapeHTML",
  "encodeHTML",
  "encodeHtml",
]);

function getCalleeWrapperName(node: TSESTree.Expression): string | null {
  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return null;
  }
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return callee.property.name;
  }
  return null;
}

function isAlreadySanitized(node: TSESTree.Expression): boolean {
  const name = getCalleeWrapperName(node);
  return name !== null && SAFE_WRAPPER_NAMES.has(name);
}

function isJsonStringifyCall(node: TSESTree.Expression): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === "JSON" &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "stringify"
  );
}

function isJsonLdScript(jsxAttr: TSESTree.JSXAttribute): boolean {
  const opening = jsxAttr.parent;
  if (!opening || opening.type !== AST_NODE_TYPES.JSXOpeningElement) {
    return false;
  }
  if (
    opening.name.type !== AST_NODE_TYPES.JSXIdentifier ||
    opening.name.name !== "script"
  ) {
    return false;
  }
  for (const attr of opening.attributes) {
    if (
      attr.type !== AST_NODE_TYPES.JSXAttribute ||
      attr.name.type !== AST_NODE_TYPES.JSXIdentifier ||
      attr.name.name !== "type"
    ) {
      continue;
    }
    if (
      attr.value &&
      attr.value.type === AST_NODE_TYPES.Literal &&
      typeof attr.value.value === "string" &&
      attr.value.value.includes("ld+json")
    ) {
      return true;
    }
  }
  return false;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of dangerouslySetInnerHTML without proper sanitization",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      noUnsafeInnerHTML:
        "Avoid using dangerouslySetInnerHTML without proper sanitization. Use DOMPurify or similar.",
      wrapWithSanitize: "Wrap value with DOMPurify.sanitize(...)",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node: TSESTree.JSXAttribute): void {
        if (
          node.name.type !== AST_NODE_TYPES.JSXIdentifier ||
          node.name.name !== "dangerouslySetInnerHTML"
        ) {
          return;
        }
        const value = node.value;
        if (!value || value.type !== AST_NODE_TYPES.JSXExpressionContainer) {
          return;
        }
        const expr = value.expression;
        if (expr.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }
        const htmlProp = expr.properties.find(
          (p) =>
            p.type === AST_NODE_TYPES.Property &&
            p.key.type === AST_NODE_TYPES.Identifier &&
            (p.key as TSESTree.Identifier).name === "__html"
        );
        if (!htmlProp || htmlProp.type !== AST_NODE_TYPES.Property) {
          return;
        }
        const htmlValue = htmlProp.value as TSESTree.Expression;

        if (isAlreadySanitized(htmlValue)) {
          return;
        }

        if (isJsonStringifyCall(htmlValue) && isJsonLdScript(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noUnsafeInnerHTML",
          suggest: [
            {
              messageId: "wrapWithSanitize",
              fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix => {
                const htmlText = context.sourceCode.getText(htmlValue);
                return fixer.replaceText(
                  htmlValue,
                  `DOMPurify.sanitize(${htmlText})`
                );
              },
            },
          ],
        });
      },
    };
  },
});
