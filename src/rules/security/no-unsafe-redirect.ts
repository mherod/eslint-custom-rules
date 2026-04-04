import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "noUnsafeRedirect";
type Options = [];

/**
 * Known-safe URL builder functions whose return value is not
 * attacker-controlled (they construct URLs from static path + params).
 */
const SAFE_URL_BUILDERS = new Set(["withQuery", "withTrailingSlash"]);

/**
 * Checks whether a call argument is statically safe — i.e. not
 * attacker-controlled. Safe patterns include:
 * - String literals: "/dashboard"
 * - Template literals with no expressions: `/dashboard`
 * - Calls to known URL builders with a string-literal first arg: withQuery("/search", params)
 */
function isStaticOrSafeUrl(node: TSESTree.Node): boolean {
  // String literal: "/path"
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return true;
  }

  // Template literal with zero expressions: `/path`
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  ) {
    return true;
  }

  // Call to a known safe URL builder with a static first arg:
  // withQuery("/search", params)
  if (node.type === AST_NODE_TYPES.CallExpression) {
    if (
      node.callee.type === AST_NODE_TYPES.Identifier &&
      SAFE_URL_BUILDERS.has(node.callee.name) &&
      node.arguments.length > 0 &&
      node.arguments[0] !== undefined &&
      isStaticOrSafeUrl(node.arguments[0])
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
        "Detect unsafe redirect patterns that could lead to open redirect vulnerabilities",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      noUnsafeRedirect:
        "Unsafe redirect detected. Validate redirect URLs to prevent open redirects.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Match standalone redirect/permanentRedirect calls
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (
            functionName === "redirect" ||
            functionName === "permanentRedirect"
          ) {
            // Skip if the URL argument is a static string or safe builder
            const urlArg = node.arguments[0];
            if (urlArg && isStaticOrSafeUrl(urlArg)) {
              return;
            }

            context.report({
              node,
              messageId: "noUnsafeRedirect",
            });
          }
        }

        // Match router.push() and router.replace() member expressions
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = node.callee;
          if (
            object.type === AST_NODE_TYPES.Identifier &&
            object.name === "router" &&
            property.type === AST_NODE_TYPES.Identifier &&
            (property.name === "push" || property.name === "replace")
          ) {
            // Skip if the URL argument is a static string or safe builder
            const urlArg = node.arguments[0];
            if (urlArg && isStaticOrSafeUrl(urlArg)) {
              return;
            }

            context.report({
              node,
              messageId: "noUnsafeRedirect",
            });
          }
        }
      },
    };
  },
});
