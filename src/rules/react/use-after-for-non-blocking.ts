import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "use-after-for-non-blocking";

type MessageIds = "useAfterForNonBlocking";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use Next.js after() for non-blocking operations like logging and analytics to prevent blocking the response",
    },
    schema: [],
    messages: {
      useAfterForNonBlocking:
        "Consider using Next.js `after()` for non-blocking operations like logging, analytics, or cleanup tasks to prevent blocking the response.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    if (!isServerCode(filename)) {
      return {};
    }

    const functionStack: (
      | TSESTree.FunctionDeclaration
      | TSESTree.ArrowFunctionExpression
      | TSESTree.FunctionExpression
    )[] = [];
    let insideAfterCall = false;

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.async) {
          functionStack.push(node);
        }
      },
      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();
        }
      },
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
        }
      },
      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();
        }
      },
      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
        }
      },
      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (node.async && functionStack.at(-1) === node) {
          functionStack.pop();
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (
          functionStack.length > 0 &&
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "after"
        ) {
          const prev = insideAfterCall;
          insideAfterCall = true;
          insideAfterCall = prev;
        }
      },

      AwaitExpression(node: TSESTree.AwaitExpression): void {
        if (functionStack.length > 0 && !insideAfterCall) {
          if (isSideEffectCall(node.argument)) {
            context.report({ node, messageId: "useAfterForNonBlocking" });
          }
        }
      },
    };
  },
});

function isServerCode(filename: string): boolean {
  return (
    filename.includes("/api/") ||
    filename.includes("/route.") ||
    filename.includes("action") ||
    filename.includes("Action") ||
    (filename.includes("/app/") && !filename.includes("/components/"))
  );
}

function isSideEffectCall(node: TSESTree.Expression): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const callee = node.callee;
  if (
    callee.type === AST_NODE_TYPES.Identifier &&
    isSideEffectFunctionName(callee.name.toLowerCase())
  ) {
    return true;
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    isSideEffectMethodName(callee.property.name.toLowerCase())
  ) {
    return true;
  }
  return false;
}

function isSideEffectFunctionName(name: string): boolean {
  const effects = [
    "log",
    "logger",
    "logging",
    "audit",
    "track",
    "analytics",
    "metric",
    "sendnotification",
    "sendemail",
    "sendmail",
    "webhook",
    "invalidatecache",
    "cleanup",
    "purge",
  ];
  return effects.some((e) => name.includes(e.replace(/[^a-z]/g, "")));
}

function isSideEffectMethodName(name: string): boolean {
  const methods = [
    "log",
    "info",
    "warn",
    "error",
    "debug",
    "track",
    "event",
    "metric",
    "send",
    "notify",
    "email",
    "invalidate",
    "cleanup",
    "purge",
  ];
  return methods.includes(name);
}
