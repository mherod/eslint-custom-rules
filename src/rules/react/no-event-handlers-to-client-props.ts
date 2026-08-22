import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import type {
  Scope,
  SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";

export const RULE_NAME = "no-event-handlers-to-client-props";

type MessageIds = "eventHandlerToClientProp";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent passing event handlers to Client Component props in Next.js applications",
    },
    fixable: "code",
    schema: [],
    messages: {
      eventHandlerToClientProp:
        "Event handlers cannot be passed to Client Component props. {{propName}}={{handlerName}} detected. If you need interactivity, consider converting part of this to a Client Component.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    // Check if current file is a server component
    let isServerComponent = false;
    let hasUseClientDirective = false;

    // Check for "use client" and "use server" directives
    let hasUseServerDirective = false;
    const firstToken = sourceCode.getFirstToken(sourceCode.ast);
    const comments = sourceCode.getCommentsBefore(firstToken || sourceCode.ast);
    const allComments = [...comments, ...sourceCode.getAllComments()];

    for (const comment of allComments) {
      if (
        (comment.type as string) === "Line" &&
        comment.value.trim() === "use client"
      ) {
        hasUseClientDirective = true;
      }
    }

    // Also check for string literals
    const program = sourceCode.ast;
    for (const statement of program.body) {
      if (
        statement.type === AST_NODE_TYPES.ExpressionStatement &&
        "expression" in statement &&
        statement.expression.type === AST_NODE_TYPES.Literal &&
        typeof statement.expression.value === "string"
      ) {
        if (statement.expression.value === "use client") {
          hasUseClientDirective = true;
        }
        if (statement.expression.value === "use server") {
          hasUseServerDirective = true;
        }
        // Continue checking other string literals (like "use strict")
      } else {
        // Stop checking once we hit a non-directive statement
        break;
      }
    }

    // Determine if this is a server component by checking file location and lack of "use client"
    isServerComponent =
      !hasUseClientDirective &&
      (filename.includes("/app/") ||
        filename.includes("/pages/") ||
        filename.includes("/components/")) &&
      !filename.includes("/api/");

    // Server-action status memoized per definition node. The cache lives for
    // one rule context only, so there is no cross-file invalidation concern.
    const serverActionByDefinition = new WeakMap<TSESTree.Node, boolean>();

    function isDefinitionServerAction(definitionNode: TSESTree.Node): boolean {
      const cached = serverActionByDefinition.get(definitionNode);
      if (cached !== undefined) {
        return cached;
      }

      let result = false;
      if (
        definitionNode.type === AST_NODE_TYPES.FunctionDeclaration &&
        definitionNode.body.type === AST_NODE_TYPES.BlockStatement
      ) {
        result = hasUseServerInBody(definitionNode.body);
      } else if (
        definitionNode.type === AST_NODE_TYPES.VariableDeclarator &&
        definitionNode.init &&
        (definitionNode.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          definitionNode.init.type === AST_NODE_TYPES.FunctionExpression) &&
        definitionNode.init.body.type === AST_NODE_TYPES.BlockStatement
      ) {
        result = hasUseServerInBody(definitionNode.init.body);
      }

      serverActionByDefinition.set(definitionNode, result);
      return result;
    }

    // Resolve an identifier-valued handler through the ESLint scope chain.
    // Nearest scope wins, so shadowed handler names resolve to the innermost
    // binding instead of whatever the enclosing block happens to declare.
    function isIdentifierServerAction(
      identifier: TSESTree.Identifier
    ): boolean {
      let scope: Scope.Scope | null = sourceCode.getScope(identifier);
      let variable: Scope.Variable | undefined;

      while (scope) {
        variable = scope.set.get(identifier.name);
        if (variable) {
          break;
        }
        scope = scope.upper;
      }

      if (!variable) {
        return false;
      }

      return variable.defs.some((definition) =>
        isDefinitionServerAction(definition.node)
      );
    }

    return {
      JSXElement(node: TSESTree.JSXElement): void {
        // Only check in server components
        if (!isServerComponent) {
          return;
        }

        const openingElement = node.openingElement;
        if (!openingElement.attributes) {
          return;
        }

        // Check each attribute/prop
        for (const attribute of openingElement.attributes) {
          if (
            attribute.type === AST_NODE_TYPES.JSXAttribute &&
            attribute.name.type === AST_NODE_TYPES.JSXIdentifier &&
            attribute.value?.type === AST_NODE_TYPES.JSXExpressionContainer
          ) {
            const propName = attribute.name.name;
            const expression = attribute.value.expression;

            // Check if prop name suggests it's an event handler
            if (isEventHandlerPropName(propName)) {
              // Check if the expression is a function (various forms)
              // Skip JSXEmptyExpression (e.g., onClick={})
              if (
                expression.type !== AST_NODE_TYPES.JSXEmptyExpression &&
                isFunction(expression)
              ) {
                // Skip Server Actions - they are legitimate to pass as props
                if (
                  isServerAction(
                    expression,
                    sourceCode,
                    hasUseServerDirective,
                    isIdentifierServerAction
                  )
                ) {
                  continue; // Allow Server Actions, check remaining attributes
                }

                const handlerName = getFunctionName(expression);

                context.report({
                  node: attribute,
                  messageId: "eventHandlerToClientProp",
                  data: {
                    propName,
                    handlerName: handlerName || "function",
                  },
                });
              }
            }
          }
        }
      },
    };
  },
});

/**
 * Check if a prop name suggests it's an event handler
 */
function isEventHandlerPropName(propName: string): boolean {
  const eventHandlerPatterns = [
    /^on[A-Z]/, // onClick, onChange, onSubmit, etc.
    /.*Click$/, // actionClick, handleClick, etc.
    /.*Press$/, // onPress, handlePress, etc.
    /.*Change$/, // onChange, handleChange, etc.
    /.*Submit$/, // onSubmit, handleSubmit, etc.
    /.*Focus$/, // onFocus, handleFocus, etc.
    /.*Blur$/, // onBlur, handleBlur, etc.
    /.*Load$/, // onLoad, handleLoad, etc.
    /.*Error$/, // onError, handleError, etc.
    /.*Select$/, // onSelect, handleSelect, etc.
    /.*Toggle$/, // onToggle, handleToggle, etc.
    /.*Action$/, // onAction, handleAction, etc.
    /.*Handler$/, // clickHandler, changeHandler, etc.
    /^handle[A-Z]/, // handleClick, handleChange, etc.
  ];

  return eventHandlerPatterns.some((pattern) => pattern.test(propName));
}

/**
 * Check if an expression represents a function
 */
function isFunction(
  expression: TSESTree.Expression | TSESTree.JSXEmptyExpression
): boolean {
  if (expression.type === AST_NODE_TYPES.JSXEmptyExpression) {
    return false;
  }
  switch (expression.type) {
    case AST_NODE_TYPES.FunctionExpression:
    case AST_NODE_TYPES.ArrowFunctionExpression:
      return true;
    case AST_NODE_TYPES.Identifier:
      // Could be a function variable - we'll assume it is if it follows naming patterns
      return isFunctionIdentifier(expression.name);
    case AST_NODE_TYPES.CallExpression:
      // Could be useCallback, useMemo returning a function, etc.
      if (expression.callee.type === AST_NODE_TYPES.Identifier) {
        const calleeName = expression.callee.name;
        return ["useCallback", "useMemo"].includes(calleeName);
      }
      return false;
    case AST_NODE_TYPES.MemberExpression:
      // Could be object.method
      return true;
    default:
      return false;
  }
}

/**
 * Check if an identifier name suggests it's a function
 */
function isFunctionIdentifier(name: string): boolean {
  const functionPatterns = [
    /^on[A-Z]/, // onClick, onChange, etc.
    /^handle[A-Z]/, // handleClick, handleChange, etc.
    /.*Handler$/, // clickHandler, changeHandler, etc.
    /.*Callback$/, // clickCallback, changeCallback, etc.
    /.*Function$/, // clickFunction, changeFunction, etc.
    /.*Fn$/, // clickFn, changeFn, etc.
  ];

  return functionPatterns.some((pattern) => pattern.test(name));
}

/**
 * Extract function name for error reporting
 */
function getFunctionName(
  expression: TSESTree.Expression | TSESTree.JSXEmptyExpression
): string | null {
  if (expression.type === AST_NODE_TYPES.JSXEmptyExpression) {
    return null;
  }
  switch (expression.type) {
    case AST_NODE_TYPES.FunctionExpression:
      return expression.id?.name || "function";
    case AST_NODE_TYPES.ArrowFunctionExpression:
      return "function";
    case AST_NODE_TYPES.Identifier:
      return expression.name;
    case AST_NODE_TYPES.CallExpression:
      if (expression.callee.type === AST_NODE_TYPES.Identifier) {
        return expression.callee.name;
      }
      return "function";
    case AST_NODE_TYPES.MemberExpression:
      if (expression.property.type === AST_NODE_TYPES.Identifier) {
        return expression.property.name;
      }
      return "method";
    default:
      return null;
  }
}

/**
 * Check if an expression represents a Server Action
 */
function isServerAction(
  expression: TSESTree.Expression | TSESTree.JSXEmptyExpression,
  sourceCode: SourceCode,
  hasUseServerDirective: boolean,
  resolveIdentifierServerAction: (identifier: TSESTree.Identifier) => boolean
): boolean {
  if (expression.type === AST_NODE_TYPES.JSXEmptyExpression) {
    return false;
  }

  // If the entire file has "use server" directive, all exported functions are server actions
  if (hasUseServerDirective) {
    return true;
  }

  switch (expression.type) {
    case AST_NODE_TYPES.ArrowFunctionExpression:
    case AST_NODE_TYPES.FunctionExpression:
      // Check if the function contains "use server" directive
      return containsUseServerDirective(expression, sourceCode);

    case AST_NODE_TYPES.Identifier:
      // For function references, resolve through the scope chain and check
      // the definition for a "use server" directive
      return resolveIdentifierServerAction(expression);

    default:
      return false;
  }
}

/**
 * Check if a function contains "use server" directive
 */
function containsUseServerDirective(
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  _sourceCode: SourceCode
): boolean {
  if (
    !functionNode.body ||
    functionNode.body.type !== AST_NODE_TYPES.BlockStatement
  ) {
    return false;
  }

  const body = functionNode.body.body;
  if (body.length === 0) {
    return false;
  }

  // Check first statement for "use server" directive
  const firstStatement = body[0];
  if (
    firstStatement &&
    firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
    firstStatement.expression.type === AST_NODE_TYPES.Literal &&
    firstStatement.expression.value === "use server"
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a block statement starts with "use server" directive
 */
function hasUseServerInBody(body: TSESTree.BlockStatement): boolean {
  const firstStatement = body.body[0];
  return (
    firstStatement !== undefined &&
    firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
    firstStatement.expression.type === AST_NODE_TYPES.Literal &&
    firstStatement.expression.value === "use server"
  );
}
