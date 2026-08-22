import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { getRouteName, isApiRoute, isHttpMethod } from "../utils/common";

export const RULE_NAME = "enforce-route-shape";

type MessageIds =
  | "missingErrorHandling"
  | "improperStatusCode"
  | "missingRequestMethodCheck"
  | "missingResponseType"
  | "improperErrorResponse";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce API route handler shape: error handling, status codes, method checks, and response types",
    },
    schema: [],
    messages: {
      missingErrorHandling:
        "API route '{{route}}' should have proper error handling with try-catch blocks",
      improperStatusCode:
        "API route '{{route}}' should return appropriate HTTP status codes",
      missingRequestMethodCheck:
        "API route '{{route}}' should check request method (GET, POST, etc.)",
      missingResponseType:
        "API route '{{route}}' should have proper response type annotation",
      improperErrorResponse:
        "API route '{{route}}' should return consistent error response format",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    if (!isApiRoute(filename)) {
      return {};
    }

    const routeName = getRouteName(filename);
    let hasErrorHandling = false;
    let hasMethodCheck = false;
    let hasStatusCodeHandling = false;
    let hasProperErrorResponse = false;

    function validateApiHandler(node: TSESTree.FunctionDeclaration): void {
      if (node.params.length < 1) {
        context.report({
          node,
          messageId: "missingResponseType",
          data: { route: routeName },
        });
      }

      if (!node.returnType) {
        context.report({
          node,
          messageId: "missingResponseType",
          data: { route: routeName },
        });
      }
    }

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (node.declaration?.type === AST_NODE_TYPES.FunctionDeclaration) {
          const functionName = node.declaration.id?.name;
          if (isHttpMethod(functionName)) {
            validateApiHandler(node.declaration);
          }
        }
      },

      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration): void {
        if (node.declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
          validateApiHandler(node.declaration);
        }
      },

      TryStatement(_node: TSESTree.TryStatement): void {
        hasErrorHandling = true;
      },

      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === "request" &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === "method"
        ) {
          hasMethodCheck = true;
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "status"
        ) {
          hasStatusCodeHandling = true;
        }
      },

      NewExpression(node: TSESTree.NewExpression): void {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "NextResponse"
        ) {
          hasProperErrorResponse = true;
        }
      },

      "Program:exit"(): void {
        if (!hasErrorHandling) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingErrorHandling",
            data: { route: routeName },
          });
        }

        if (!hasMethodCheck) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingRequestMethodCheck",
            data: { route: routeName },
          });
        }

        if (!hasStatusCodeHandling) {
          context.report({
            node: sourceCode.ast,
            messageId: "improperStatusCode",
            data: { route: routeName },
          });
        }

        if (hasErrorHandling && !hasProperErrorResponse) {
          context.report({
            node: sourceCode.ast,
            messageId: "improperErrorResponse",
            data: { route: routeName },
          });
        }
      },
    };
  },
});
