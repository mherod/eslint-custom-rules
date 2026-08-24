import {
  AST_NODE_TYPES,
  ASTUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

type DefinitionNamespace = "type" | "value";

function isUnshadowedGlobalIdentifier(
  node: TSESTree.Identifier,
  name: string,
  sourceCode: TSESLint.SourceCode,
  namespace: DefinitionNamespace
): boolean {
  if (node.name !== name) {
    return false;
  }

  const variable = ASTUtils.findVariable(sourceCode.getScope(node), node);
  if (!variable) {
    return true;
  }

  return variable.defs.every((definition) =>
    namespace === "value"
      ? !definition.isVariableDefinition
      : !definition.isTypeDefinition
  );
}

function isBuiltInDateTypeReference(
  node: TSESTree.TypeNode | TSESTree.TSTypeAnnotation | null | undefined,
  sourceCode: TSESLint.SourceCode
): boolean {
  if (!node) {
    return false;
  }

  if (node.type === AST_NODE_TYPES.TSTypeAnnotation) {
    return isBuiltInDateTypeReference(node.typeAnnotation, sourceCode);
  }

  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return (
      node.typeName.type === AST_NODE_TYPES.Identifier &&
      isUnshadowedGlobalIdentifier(node.typeName, "Date", sourceCode, "type")
    );
  }

  if (node.type === AST_NODE_TYPES.TSUnionType) {
    const nonNullishTypes = node.types.filter(
      (type) =>
        type.type !== AST_NODE_TYPES.TSNullKeyword &&
        type.type !== AST_NODE_TYPES.TSUndefinedKeyword
    );
    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((type) =>
        isBuiltInDateTypeReference(type, sourceCode)
      )
    );
  }

  if (node.type === AST_NODE_TYPES.TSIntersectionType) {
    return node.types.some((type) =>
      isBuiltInDateTypeReference(type, sourceCode)
    );
  }

  return false;
}

function hasStableInitializer(variable: TSESLint.Scope.Variable): boolean {
  return variable.references.every(
    (reference) => !reference.isWrite() || reference.init === true
  );
}

export function getStaticMemberName(
  node: TSESTree.MemberExpression,
  sourceCode: TSESLint.SourceCode
): string | null {
  return ASTUtils.getPropertyName(node, sourceCode.getScope(node));
}

export function isBuiltInDateConstructor(
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
): boolean {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return isUnshadowedGlobalIdentifier(node, "Date", sourceCode, "value");
  }

  if (
    node.type !== AST_NODE_TYPES.MemberExpression ||
    getStaticMemberName(node, sourceCode) !== "Date" ||
    node.object.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  return isUnshadowedGlobalIdentifier(
    node.object,
    "globalThis",
    sourceCode,
    "value"
  );
}

export function isDateLikeExpression(
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode,
  seenVariables: Set<TSESLint.Scope.Variable> = new Set()
): boolean {
  if (node.type === AST_NODE_TYPES.NewExpression) {
    return isBuiltInDateConstructor(node.callee, sourceCode);
  }

  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression
  ) {
    return (
      isBuiltInDateTypeReference(node.typeAnnotation, sourceCode) ||
      isDateLikeExpression(node.expression, sourceCode, seenVariables)
    );
  }

  if (
    node.type === AST_NODE_TYPES.TSNonNullExpression ||
    node.type === AST_NODE_TYPES.TSInstantiationExpression
  ) {
    return isDateLikeExpression(node.expression, sourceCode, seenVariables);
  }

  if (node.type === AST_NODE_TYPES.ConditionalExpression) {
    return (
      isDateLikeExpression(
        node.consequent,
        sourceCode,
        new Set(seenVariables)
      ) &&
      isDateLikeExpression(node.alternate, sourceCode, new Set(seenVariables))
    );
  }

  if (node.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const variable = ASTUtils.findVariable(sourceCode.getScope(node), node);
  if (!variable || seenVariables.has(variable)) {
    return false;
  }

  seenVariables.add(variable);
  return variable.defs.some((definition) => {
    if (
      definition.name.type === AST_NODE_TYPES.Identifier &&
      isBuiltInDateTypeReference(definition.name.typeAnnotation, sourceCode)
    ) {
      return true;
    }

    if (
      definition.node.type === AST_NODE_TYPES.VariableDeclarator &&
      definition.node.init &&
      hasStableInitializer(variable)
    ) {
      return isDateLikeExpression(
        definition.node.init,
        sourceCode,
        seenVariables
      );
    }

    return false;
  });
}

export function isDateTimestampExpression(
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
): boolean {
  if (
    node.type !== AST_NODE_TYPES.CallExpression ||
    node.callee.type !== AST_NODE_TYPES.MemberExpression ||
    getStaticMemberName(node.callee, sourceCode) !== "getTime"
  ) {
    return false;
  }

  return isDateLikeExpression(node.callee.object, sourceCode);
}
