import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/**
 * Check if a node is a React hook call (useState, useEffect, etc.)
 */
export function isReactHookCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name.startsWith("use")
  );
}

/**
 * Check if a call expression is calling a specific function
 */
export function isCallingFunction(
  node: TSESTree.CallExpression,
  functionName: string
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === functionName
  );
}

/**
 * Check if a call expression is calling a method on an object
 */
export function isMethodCall(
  node: TSESTree.CallExpression,
  objectName: string,
  methodName: string
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === objectName &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === methodName
  );
}

/**
 * Check if a node is accessing a property on an object
 */
export function isPropertyAccess(
  node: TSESTree.MemberExpression,
  objectName: string,
  propertyName: string
): boolean {
  return (
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === objectName &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === propertyName
  );
}

/**
 * Get the name of a function (handles various declaration types)
 */
export function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.VariableDeclarator
): string | undefined {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return node.id?.name;
  }
  if (node.type === AST_NODE_TYPES.FunctionExpression) {
    return node.id?.name;
  }
  if (node.type === AST_NODE_TYPES.VariableDeclarator) {
    if (node.id.type === AST_NODE_TYPES.Identifier) {
      return node.id.name;
    }
  }
  return;
}

/**
 * Check if a node has a specific decorator
 */
export function hasDecorator(
  node: TSESTree.Node & { decorators?: TSESTree.Decorator[] },
  decoratorName: string
): boolean {
  if (!node.decorators) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (
      decorator.expression.type === AST_NODE_TYPES.Identifier &&
      decorator.expression.name === decoratorName
    ) {
      return true;
    }
    if (
      decorator.expression.type === AST_NODE_TYPES.CallExpression &&
      decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
      decorator.expression.callee.name === decoratorName
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Get the string value from a literal node
 */
export function getLiteralValue(
  node: TSESTree.Node
): string | number | boolean | null | undefined {
  if (node.type === AST_NODE_TYPES.Literal) {
    // Filter out bigint and RegExp values
    const value = node.value;
    if (typeof value === "bigint" || value instanceof RegExp) {
      return;
    }
    return value;
  }
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.quasis.length === 1
  ) {
    const firstQuasi = node.quasis[0];
    return firstQuasi ? (firstQuasi.value.cooked ?? undefined) : undefined;
  }
  return;
}

/**
 * Check if a function has a return statement
 */
export function hasReturnStatement(node: TSESTree.BlockStatement): boolean {
  for (const statement of node.body) {
    if (statement.type === AST_NODE_TYPES.ReturnStatement) {
      return true;
    }
    if (
      statement.type === AST_NODE_TYPES.IfStatement ||
      statement.type === AST_NODE_TYPES.SwitchStatement
    ) {
      // Check nested blocks
      if (
        statement.type === AST_NODE_TYPES.IfStatement &&
        statement.consequent.type === AST_NODE_TYPES.BlockStatement
      ) {
        if (hasReturnStatement(statement.consequent)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Get all variable declarations in a scope
 */
export function getVariableDeclarations(
  node: TSESTree.BlockStatement | TSESTree.Program
): TSESTree.VariableDeclarator[] {
  const declarations: TSESTree.VariableDeclarator[] = [];

  for (const statement of node.body) {
    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      declarations.push(...statement.declarations);
    }
  }

  return declarations;
}

/**
 * Check if a node is inside a specific type of parent node
 */
export function isInsideNode(
  node: TSESTree.Node,
  parentType: AST_NODE_TYPES,
  maxDepth = 10
): boolean {
  let current = node.parent;
  let depth = 0;

  while (current && depth < maxDepth) {
    if (current.type === parentType) {
      return true;
    }
    current = current.parent;
    depth++;
  }

  return false;
}

/**
 * Get the closest parent node of a specific type
 */
export function getParentOfType(
  node: TSESTree.Node,
  parentType: AST_NODE_TYPES,
  maxDepth = 10
): TSESTree.Node | null {
  let current = node.parent;
  let depth = 0;

  while (current && depth < maxDepth) {
    if (current.type === parentType) {
      return current;
    }
    current = current.parent;
    depth++;
  }

  return null;
}

/**
 * Check if an import is from a specific module
 */
export function isImportFrom(
  node: TSESTree.ImportDeclaration,
  moduleName: string
): boolean {
  return node.source.value === moduleName;
}

/**
 * Get imported names from an import declaration
 */
export function getImportedNames(node: TSESTree.ImportDeclaration): string[] {
  const names: string[] = [];

  for (const specifier of node.specifiers) {
    if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
      // Handle both Identifier and StringLiteral
      if (specifier.imported.type === AST_NODE_TYPES.Identifier) {
        names.push(specifier.imported.name);
      } else {
        // For StringLiteral case (module imports)
        const stringLiteral = specifier.imported as TSESTree.StringLiteral;
        names.push(stringLiteral.value);
      }
    } else if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
      names.push(specifier.local.name);
    } else if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
      names.push(specifier.local.name);
    }
  }

  return names;
}

/**
 * Check if a node is a template literal with expressions
 */
export function isDynamicTemplateLiteral(
  node: TSESTree.TemplateLiteral
): boolean {
  return node.expressions.length > 0;
}

/**
 * Get all identifiers used in an expression
 */
export function getIdentifiers(node: TSESTree.Node): string[] {
  const identifiers: string[] = [];

  function traverse(n: TSESTree.Node): void {
    if (n.type === AST_NODE_TYPES.Identifier) {
      identifiers.push(n.name);
    }

    // Traverse child nodes safely without using any
    const nodeKeys = Object.keys(n) as (keyof typeof n)[];
    for (const key of nodeKeys) {
      const value = n[key];
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ("type" in value) {
          traverse(value as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);
  return identifiers;
}

/**
 * Check if a function is empty (no statements in body)
 */
export function isFunctionEmpty(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): boolean {
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
      // Expression body
      return false;
    }
    return node.body.body.length === 0;
  }

  if (!node.body) {
    return true;
  }

  return node.body.body.length === 0;
}
