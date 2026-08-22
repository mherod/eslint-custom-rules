import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/**
 * Shared checks for the TypeScript pattern policy family. Consumed by the
 * focused rules (enforce-type-naming, no-undocumented-unknown,
 * enforce-assertion-policies) and by the deprecated aggregate
 * enforce-typescript-patterns rule during its migration window.
 */

export const ALLOWED_TYPE_SUFFIXES: readonly string[] = [
  "Type",
  "Props",
  "Return",
  "State",
  "Config",
  "Options",
  "Params",
  "Payload",
  "Context",
  "Result",
  "Error",
  "Response",
  "Request",
];

export function hasAllowedTypeSuffix(name: string): boolean {
  for (const suffix of ALLOWED_TYPE_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return true;
    }
  }
  return false;
}

export function shouldBeInterface(typeAnnotation: TSESTree.TypeNode): boolean {
  // Object types with multiple properties should be interfaces
  return (
    typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral &&
    typeAnnotation.members.length > 2 &&
    typeAnnotation.members.every(
      (member) =>
        member.type === AST_NODE_TYPES.TSPropertySignature ||
        member.type === AST_NODE_TYPES.TSMethodSignature
    )
  );
}

export function shouldBeTypeAlias(
  node: TSESTree.TSInterfaceDeclaration
): boolean {
  // Simple interfaces with no extends and few properties should be type aliases
  return (
    node.extends === null &&
    node.body.body.length <= 3 &&
    node.body.body.every(
      (member) => member.type === AST_NODE_TYPES.TSPropertySignature
    )
  );
}

export function isUnnecessaryTypeAssertion(
  node: TSESTree.TSTypeAssertion
): boolean {
  // Check if the expression already has the asserted type
  // This is a simplified check - in practice, you'd need TypeScript's type checker
  return (
    node.expression.type === AST_NODE_TYPES.Literal &&
    node.typeAnnotation.type === AST_NODE_TYPES.TSLiteralType
  );
}

export function shouldUseConstAssertion(
  node: TSESTree.TSAsExpression
): boolean {
  // Check if asserting to a literal type when const assertion would be better
  return (
    node.expression.type === AST_NODE_TYPES.ArrayExpression ||
    node.expression.type === AST_NODE_TYPES.ObjectExpression ||
    (node.expression.type === AST_NODE_TYPES.Literal &&
      node.typeAnnotation.type === AST_NODE_TYPES.TSLiteralType)
  );
}

interface UnknownCheckSourceCode {
  getAllComments: () => TSESTree.Comment[];
  getCommentsAfter: (node: TSESTree.Node) => TSESTree.Comment[];
  getCommentsBefore: (node: TSESTree.Node) => TSESTree.Comment[];
  lines: string[];
}

export interface UnknownKeywordAssessment {
  needsExplanation: boolean;
}

/**
 * Create the per-file-context assessor for undocumented `unknown` usage.
 * Comment lines are indexed once on the first token and ancestor
 * adjacent-comment checks are memoized, so many `unknown` tokens in one
 * file never rescan the same comment data.
 */
export function createUnknownKeywordAssessor(
  sourceCode: UnknownCheckSourceCode
): (node: TSESTree.TSUnknownKeyword) => UnknownKeywordAssessment {
  let commentLineIndex: Set<number> | null = null;
  const documentedNodeCache = new WeakMap<TSESTree.Node, boolean>();

  function nodeHasAdjacentComments(target: TSESTree.Node): boolean {
    const cached = documentedNodeCache.get(target);
    if (cached !== undefined) {
      return cached;
    }
    const result =
      sourceCode.getCommentsBefore(target).length > 0 ||
      sourceCode.getCommentsAfter(target).length > 0;
    documentedNodeCache.set(target, result);
    return result;
  }

  return (node) => {
    // Be extremely permissive - if there are ANY comments anywhere in the
    // file within reasonable range, allow it
    const currentLine = node.loc.start.line;

    if (!commentLineIndex) {
      commentLineIndex = new Set<number>();
      for (const comment of sourceCode.getAllComments()) {
        commentLineIndex.add(comment.loc.start.line);
      }
    }

    // Look for comments in a very wide range: 5 lines before to 5 lines after
    let hasNearbyComments = false;
    for (let line = currentLine - 5; line <= currentLine + 5; line += 1) {
      if (commentLineIndex.has(line)) {
        hasNearbyComments = true;
        break;
      }
    }

    // Check if this is part of any documented context (JSDoc, regular comments)
    let parentNode: TSESTree.Node | undefined = node.parent;
    let hasAnyDocumentation = false;
    while (parentNode && !hasAnyDocumentation) {
      if (nodeHasAdjacentComments(parentNode)) {
        hasAnyDocumentation = true;
      }
      parentNode = parentNode.parent;
    }

    // Generic constraints are usually well-understood
    const isInGenericConstraint =
      node.parent?.type === AST_NODE_TYPES.TSTypeReference ||
      node.parent?.type === AST_NODE_TYPES.TSTypeLiteral ||
      node.parent?.parent?.type === AST_NODE_TYPES.TSTypeParameterInstantiation;

    // Descriptive names on the same line suggest intentional usage
    const currentLineText = sourceCode.lines[currentLine - 1] || "";
    const hasDescriptiveName =
      /\b(logContext|params|data|payload|options|config|meta)\b/i.test(
        currentLineText
      );

    const hasExplanatoryComment =
      hasNearbyComments ||
      hasAnyDocumentation ||
      isInGenericConstraint ||
      hasDescriptiveName;

    return { needsExplanation: !hasExplanatoryComment };
  };
}

/**
 * The suggestion text inserted before an undocumented `unknown` token.
 * A neutral placeholder for the developer to fill in — never a TODO/FIXME
 * marker (the project's no-debug-comments rule flags those).
 */
export const UNKNOWN_EXPLANATION_PLACEHOLDER =
  "// Explain why 'unknown' is used here, or replace it with a specific type";
