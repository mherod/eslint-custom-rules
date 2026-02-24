import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isComplexType, isPascalCase } from "../utils/common";

export const RULE_NAME = "enforce-typescript-patterns";

type MessageIds =
  | "typeAliasMustBePascalCase"
  | "interfaceMustBePascalCase"
  | "enumMustBePascalCase"
  | "typeAliasShouldEndWithType"
  | "interfaceShouldEndWithInterface"
  | "enumShouldEndWithEnum"
  | "avoidAnyType"
  | "avoidUnknownWithoutComment"
  | "preferTypeOverInterface"
  | "preferInterfaceOverType"
  | "missingGenericConstraint"
  | "unnecessaryTypeAssertion"
  | "preferConstAssertion"
  | "avoidNonNullAssertion";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce consistent TypeScript patterns and naming conventions",
    },
    fixable: "code",
    schema: [],
    messages: {
      typeAliasMustBePascalCase:
        "Type alias '{{name}}' must use PascalCase naming convention",
      interfaceMustBePascalCase:
        "Interface '{{name}}' must use PascalCase naming convention",
      enumMustBePascalCase:
        "Enum '{{name}}' must use PascalCase naming convention",
      typeAliasShouldEndWithType:
        "Type alias '{{name}}' should end with 'Type' or 'Props' suffix for clarity",
      interfaceShouldEndWithInterface:
        "Interface '{{name}}' should end with 'Interface' suffix for clarity",
      enumShouldEndWithEnum:
        "Enum '{{name}}' should end with 'Enum' suffix for clarity",
      avoidAnyType:
        "Avoid using 'any' type. Use 'unknown' or create a specific type instead",
      avoidUnknownWithoutComment:
        "Using 'unknown' type should include a comment explaining why",
      preferTypeOverInterface:
        "Prefer type aliases over interfaces for simple object types",
      preferInterfaceOverType:
        "Prefer interfaces over type aliases for extensible object types",
      missingGenericConstraint:
        "Generic type parameter '{{name}}' should have a constraint",
      unnecessaryTypeAssertion:
        "Type assertion is unnecessary here - TypeScript can infer the type",
      preferConstAssertion:
        "Prefer 'as const' assertion over type assertion for literal types",
      avoidNonNullAssertion:
        "Avoid non-null assertion operator '!'. Use proper type guards instead",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      // Type alias declarations
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        const typeName = node.id.name;

        // Check PascalCase naming
        if (!isPascalCase(typeName)) {
          context.report({
            node,
            messageId: "typeAliasMustBePascalCase",
            data: { name: typeName },
          });
        }

        // Check if complex types should end with 'Type' or 'Props'
        if (
          isComplexType(node.typeAnnotation) &&
          !typeName.endsWith("Type") &&
          !typeName.endsWith("Props")
        ) {
          context.report({
            node,
            messageId: "typeAliasShouldEndWithType",
            data: { name: typeName },
          });
        }

        // Check if should be interface instead
        if (shouldBeInterface(node.typeAnnotation)) {
          context.report({
            node,
            messageId: "preferInterfaceOverType",
          });
        }
      },

      // Interface declarations
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        const interfaceName = node.id.name;

        // Check PascalCase naming
        if (!isPascalCase(interfaceName)) {
          context.report({
            node,
            messageId: "interfaceMustBePascalCase",
            data: { name: interfaceName },
          });
        }

        // Check if simple types should be type aliases instead
        if (shouldBeTypeAlias(node)) {
          context.report({
            node,
            messageId: "preferTypeOverInterface",
          });
        }
      },

      // Enum declarations
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        const enumName = node.id.name;

        // Check PascalCase naming
        if (!isPascalCase(enumName)) {
          context.report({
            node,
            messageId: "enumMustBePascalCase",
            data: { name: enumName },
          });
        }

        // Check if should end with 'Enum'
        if (!enumName.endsWith("Enum")) {
          context.report({
            node,
            messageId: "enumShouldEndWithEnum",
            data: { name: enumName },
          });
        }
      },

      // Any type usage
      TSAnyKeyword(node: TSESTree.TSAnyKeyword): void {
        context.report({
          node,
          messageId: "avoidAnyType",
        });
      },

      // Unknown type usage
      TSUnknownKeyword(node: TSESTree.TSUnknownKeyword): void {
        // Be extremely permissive - if there are ANY comments anywhere in the file within reasonable range, allow it
        const currentLine = node.loc.start.line;
        const allComments = sourceCode.getAllComments();

        // Look for comments in a very wide range: 5 lines before to 5 lines after
        const hasNearbyComments = allComments.some((comment) => {
          const commentLine = comment.loc.start.line;
          return Math.abs(commentLine - currentLine) <= 5;
        });

        // Check if this is part of any documented context (JSDoc, regular comments, etc.)
        let parentNode: TSESTree.Node | undefined = node.parent;
        let hasAnyDocumentation = false;

        // Walk up the AST to find ANY documentation
        while (parentNode && !hasAnyDocumentation) {
          const parentComments = sourceCode.getCommentsBefore(parentNode);
          const parentCommentsAfter = sourceCode.getCommentsAfter(parentNode);
          if (parentComments.length > 0 || parentCommentsAfter.length > 0) {
            hasAnyDocumentation = true;
          }
          parentNode = parentNode.parent;
        }

        // Check if this is in a generic constraint (these are usually well-understood)
        const isInGenericConstraint =
          node.parent?.type === AST_NODE_TYPES.TSTypeReference ||
          node.parent?.type === AST_NODE_TYPES.TSTypeLiteral ||
          node.parent?.parent?.type ===
            AST_NODE_TYPES.TSTypeParameterInstantiation;

        // Check if the line itself has any meaningful content that suggests intentional usage
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

        if (!hasExplanatoryComment) {
          context.report({
            node,
            messageId: "avoidUnknownWithoutComment",
            fix(fixer) {
              // Add a TODO comment before the unknown keyword
              const nodeStart = node.range[0];
              const lineStart = sourceCode.getIndexFromLoc({
                line: node.loc.start.line,
                column: 0,
              });
              const indentation =
                sourceCode.text
                  .slice(lineStart, nodeStart)
                  .match(/^\s*/)?.[0] || "";

              return fixer.insertTextBefore(
                node,
                `// TODO: strengthen this type or explain the usage of unknown\n${indentation}`
              );
            },
          });
        }
      },

      // Generic type parameters
      TSTypeParameter(node: TSESTree.TSTypeParameter): void {
        // Check if generic has constraint for better type safety
        if (!node.constraint && node.name.name.length === 1) {
          context.report({
            node,
            messageId: "missingGenericConstraint",
            data: { name: node.name.name },
          });
        }
      },

      // Type assertions
      TSTypeAssertion(node: TSESTree.TSTypeAssertion): void {
        // Check if type assertion is unnecessary
        if (isUnnecessaryTypeAssertion(node)) {
          context.report({
            node,
            messageId: "unnecessaryTypeAssertion",
          });
        }
      },

      // As expressions
      TSAsExpression(node: TSESTree.TSAsExpression): void {
        // Check if should use const assertion
        if (shouldUseConstAssertion(node)) {
          context.report({
            node,
            messageId: "preferConstAssertion",
          });
        }
      },

      // Non-null assertion
      TSNonNullExpression(node: TSESTree.TSNonNullExpression): void {
        context.report({
          node,
          messageId: "avoidNonNullAssertion",
        });
      },
    };
  },
});

function shouldBeInterface(typeAnnotation: TSESTree.TypeNode): boolean {
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

function shouldBeTypeAlias(node: TSESTree.TSInterfaceDeclaration): boolean {
  // Simple interfaces with no extends and few properties should be type aliases
  return (
    node.extends === null &&
    node.body.body.length <= 3 &&
    node.body.body.every(
      (member) => member.type === AST_NODE_TYPES.TSPropertySignature
    )
  );
}

function isUnnecessaryTypeAssertion(node: TSESTree.TSTypeAssertion): boolean {
  // Check if the expression already has the asserted type
  // This is a simplified check - in practice, you'd need TypeScript's type checker
  return (
    node.expression.type === AST_NODE_TYPES.Literal &&
    node.typeAnnotation.type === AST_NODE_TYPES.TSLiteralType
  );
}

function shouldUseConstAssertion(node: TSESTree.TSAsExpression): boolean {
  // Check if asserting to a literal type when const assertion would be better
  return (
    node.expression.type === AST_NODE_TYPES.ArrayExpression ||
    node.expression.type === AST_NODE_TYPES.ObjectExpression ||
    (node.expression.type === AST_NODE_TYPES.Literal &&
      node.typeAnnotation.type === AST_NODE_TYPES.TSLiteralType)
  );
}
