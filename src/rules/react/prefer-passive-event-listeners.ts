import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-passive-event-listeners";

type MessageIds = "preferPassiveListener";

type Options = [];

/**
 * Event types where passive listeners eliminate scroll/touch delay.
 * Browsers normally wait for these handlers to finish before scrolling,
 * adding 50-200ms of latency. { passive: true } removes this wait.
 */
const PASSIVE_EVENT_TYPES: ReadonlySet<string> = new Set([
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  "wheel",
  "mousewheel",
  "scroll",
]);

/**
 * Returns true if an expression is a string literal matching a passive event type.
 */
function isPassiveEventType(node: TSESTree.Expression): boolean {
  return (
    node.type === AST_NODE_TYPES.Literal &&
    typeof node.value === "string" &&
    PASSIVE_EVENT_TYPES.has(node.value)
  );
}

/**
 * Returns true if an options argument already contains `passive: true`.
 */
function hasPassiveTrue(options: TSESTree.Expression): boolean {
  if (options.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }
  return options.properties.some((prop) => {
    if (prop.type !== AST_NODE_TYPES.Property) {
      return false;
    }
    const keyName =
      prop.key.type === AST_NODE_TYPES.Identifier
        ? prop.key.name
        : prop.key.type === AST_NODE_TYPES.Literal
          ? String(prop.key.value)
          : null;
    if (keyName !== "passive") {
      return false;
    }
    return (
      prop.value.type === AST_NODE_TYPES.Literal && prop.value.value === true
    );
  });
}

/**
 * Returns true if the handler function contains a call to preventDefault().
 * We check one level deep (the immediate function body) — nested callbacks
 * are ignored to avoid false negatives.
 */
function handlerCallsPreventDefault(
  handler: TSESTree.Expression | TSESTree.SpreadElement
): boolean {
  if (
    handler.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    handler.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    // Named function reference — we can't inspect it statically; be conservative
    return false;
  }

  const body = handler.body;
  const stmts: TSESTree.Statement[] =
    body.type === AST_NODE_TYPES.BlockStatement
      ? body.body
      : // Expression body (arrow function) — wrap as expression statement
        [];

  for (const stmt of stmts) {
    if (
      stmt.type === AST_NODE_TYPES.ExpressionStatement &&
      stmt.expression.type === AST_NODE_TYPES.CallExpression
    ) {
      const call = stmt.expression;
      const callee = call.callee;
      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        callee.property.name === "preventDefault"
      ) {
        return true;
      }
    }
  }
  return false;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer { passive: true } for scroll and touch event listeners to improve scrolling performance",
    },
    schema: [],
    messages: {
      preferPassiveListener:
        "Add { passive: true } to the '{{eventType}}' event listener. " +
        "Browsers wait for touch and scroll handlers to finish before scrolling, " +
        "adding 50-200ms of input latency. " +
        "{ passive: true } tells the browser the handler will never call preventDefault(), " +
        "allowing immediate scrolling without waiting. " +
        "Fix: `element.addEventListener('{{eventType}}', handler, { passive: true })`. " +
        "Only omit passive when your handler intentionally calls event.preventDefault() " +
        "to implement custom swipe gestures or zoom controls.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Match: <expr>.addEventListener(...)
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }
        const { property } = callee;
        if (
          property.type !== AST_NODE_TYPES.Identifier ||
          property.name !== "addEventListener"
        ) {
          return;
        }

        const args = node.arguments;
        // Must have at least (eventType, handler)
        if (args.length < 2) {
          return;
        }

        const eventTypeArg = args[0];
        const handlerArg = args[1];
        const optionsArg = args[2];

        if (
          eventTypeArg === undefined ||
          handlerArg === undefined ||
          eventTypeArg.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        // Only flag known passive-eligible event types
        if (!isPassiveEventType(eventTypeArg)) {
          return;
        }

        // If { passive: true } already set, we're done
        if (
          optionsArg !== undefined &&
          optionsArg.type !== AST_NODE_TYPES.SpreadElement &&
          hasPassiveTrue(optionsArg)
        ) {
          return;
        }

        // If the handler calls preventDefault(), it can't be passive — skip
        if (
          handlerArg.type !== AST_NODE_TYPES.SpreadElement &&
          handlerCallsPreventDefault(handlerArg)
        ) {
          return;
        }

        const eventType =
          eventTypeArg.type === AST_NODE_TYPES.Literal &&
          typeof eventTypeArg.value === "string"
            ? eventTypeArg.value
            : "unknown";

        context.report({
          node,
          messageId: "preferPassiveListener",
          data: { eventType },
        });
      },
    };
  },
});
