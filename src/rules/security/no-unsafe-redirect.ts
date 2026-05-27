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
 * Response objects whose `.redirect()` can perform a real open redirect
 * when handed an attacker-controlled URL (`Response.redirect(userInput)`,
 * Next.js `NextResponse.redirect(userInput)`).
 */
const REDIRECT_RESPONSE_OBJECTS = new Set(["Response", "NextResponse"]);

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

/**
 * A redirect URL argument is unsafe to pass through unchecked when it is
 * missing entirely or is not a statically safe value (i.e. it could be
 * attacker-controlled). Mirrors the original rule's "report unless static"
 * semantics so existing call-site behavior is preserved.
 */
function shouldReport(urlArg: TSESTree.Node | undefined): boolean {
  return urlArg === undefined || !isStaticOrSafeUrl(urlArg);
}

/**
 * Detects assignment targets that navigate the browser, which become open
 * redirects when assigned an attacker-controlled URL:
 * - `location.href = ...`
 * - `window.location.href = ...`
 * - `window.location = ...`
 */
function isLocationAssignmentSink(target: TSESTree.Node): boolean {
  if (target.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const { object, property } = target;
  if (property.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  // location.href = ... | window.location.href = ...
  if (property.name === "href") {
    if (
      object.type === AST_NODE_TYPES.Identifier &&
      object.name === "location"
    ) {
      return true;
    }
    if (
      object.type === AST_NODE_TYPES.MemberExpression &&
      object.object.type === AST_NODE_TYPES.Identifier &&
      object.object.name === "window" &&
      object.property.type === AST_NODE_TYPES.Identifier &&
      object.property.name === "location"
    ) {
      return true;
    }
  }

  // window.location = ...
  return (
    property.name === "location" &&
    object.type === AST_NODE_TYPES.Identifier &&
    object.name === "window"
  );
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
    const report = (node: TSESTree.Node): void => {
      context.report({ node, messageId: "noUnsafeRedirect" });
    };

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Match standalone redirect/permanentRedirect calls
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (
            (functionName === "redirect" ||
              functionName === "permanentRedirect") &&
            shouldReport(node.arguments[0])
          ) {
            report(node);
          }
          return;
        }

        // Match member-expression redirect sinks
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = node.callee;
          if (
            object.type !== AST_NODE_TYPES.Identifier ||
            property.type !== AST_NODE_TYPES.Identifier
          ) {
            return;
          }

          // router.push() / router.replace()
          const isRouterNav =
            object.name === "router" &&
            (property.name === "push" || property.name === "replace");

          // Response.redirect() / NextResponse.redirect()
          const isResponseRedirect =
            REDIRECT_RESPONSE_OBJECTS.has(object.name) &&
            property.name === "redirect";

          if (
            (isRouterNav || isResponseRedirect) &&
            shouldReport(node.arguments[0])
          ) {
            report(node);
          }
        }
      },

      // window.location.href = userInput / location.href = userInput
      AssignmentExpression(node: TSESTree.AssignmentExpression): void {
        if (
          node.operator === "=" &&
          isLocationAssignmentSink(node.left) &&
          shouldReport(node.right)
        ) {
          report(node);
        }
      },
    };
  },
});
