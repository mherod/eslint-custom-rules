import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-request-access-in-use-cache";

type MessageIds =
  | "noRequestAccessInUseCache"
  | "noHeadersAccessInUseCache"
  | "noCookiesAccessInUseCache"
  | "extractRequestDataFirst";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent accessing Request object properties within 'use cache' functions",
    },
    schema: [],
    messages: {
      noRequestAccessInUseCache:
        "Cannot access Request property '{{property}}' within 'use cache' function. Extract request data before calling the cached function.",
      noHeadersAccessInUseCache:
        "Cannot access headers() within 'use cache' function. Extract header values before calling the cached function.",
      noCookiesAccessInUseCache:
        "Cannot access cookies() within 'use cache' function. Extract cookie values before calling the cached function.",
      extractRequestDataFirst:
        "Extract request data (url, headers, cookies, searchParams) before calling cached functions.",
    },
  },
  defaultOptions: [],
  create(context) {
    let currentUseCacheFunction:
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression
      | null = null;
    let requestParamNames: Set<string> = new Set();

    function hasUseCacheDirective(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ): boolean {
      if (!node.body || node.body.type !== AST_NODE_TYPES.BlockStatement) {
        return false;
      }
      const firstStatement = node.body.body[0];
      return (
        firstStatement?.type === AST_NODE_TYPES.ExpressionStatement &&
        firstStatement.expression.type === AST_NODE_TYPES.Literal &&
        firstStatement.expression.value === "use cache"
      );
    }

    function getRequestParamNames(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ): Set<string> {
      const names = new Set<string>();
      for (const param of node.params) {
        if (param.type === AST_NODE_TYPES.Identifier) {
          if (
            param.typeAnnotation?.typeAnnotation.type ===
            AST_NODE_TYPES.TSTypeReference
          ) {
            const typeName =
              param.typeAnnotation.typeAnnotation.typeName.type ===
              AST_NODE_TYPES.Identifier
                ? param.typeAnnotation.typeAnnotation.typeName.name
                : "";
            if (typeName === "NextRequest" || typeName === "Request") {
              names.add(param.name);
            }
          }
        }
      }
      return names;
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (hasUseCacheDirective(node)) {
          currentUseCacheFunction = node;
          requestParamNames = getRequestParamNames(node);
        }
      },
      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (hasUseCacheDirective(node)) {
          currentUseCacheFunction = node;
          requestParamNames = getRequestParamNames(node);
        }
      },
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        if (hasUseCacheDirective(node)) {
          currentUseCacheFunction = node;
          requestParamNames = getRequestParamNames(node);
        }
      },
      MemberExpression(node: TSESTree.MemberExpression): void {
        if (!currentUseCacheFunction || requestParamNames.size === 0) {
          return;
        }
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          requestParamNames.has(node.object.name) &&
          node.property.type === AST_NODE_TYPES.Identifier
        ) {
          const requestProperties = [
            "url",
            "headers",
            "method",
            "body",
            "json",
            "text",
            "formData",
            "arrayBuffer",
            "blob",
            "cookies",
            "nextUrl",
            "ip",
            "geo",
          ];
          if (requestProperties.includes(node.property.name)) {
            context.report({
              node,
              messageId: "noRequestAccessInUseCache",
              data: { property: `${node.object.name}.${node.property.name}` },
            });
          }
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        if (!currentUseCacheFunction) {
          return;
        }
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (node.callee.name === "headers") {
            context.report({ node, messageId: "noHeadersAccessInUseCache" });
          }
          if (node.callee.name === "cookies") {
            context.report({ node, messageId: "noCookiesAccessInUseCache" });
          }
        }
      },
      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (currentUseCacheFunction === node) {
          currentUseCacheFunction = null;
          requestParamNames.clear();
        }
      },
      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (currentUseCacheFunction === node) {
          currentUseCacheFunction = null;
          requestParamNames.clear();
        }
      },
      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (currentUseCacheFunction === node) {
          currentUseCacheFunction = null;
          requestParamNames.clear();
        }
      },
    };
  },
});
