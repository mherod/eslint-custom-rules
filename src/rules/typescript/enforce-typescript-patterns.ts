import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isComplexType, isPascalCase } from "../utils/common";
import {
  createUnknownKeywordAssessor,
  hasAllowedTypeSuffix,
  isUnnecessaryTypeAssertion,
  shouldBeInterface,
  shouldBeTypeAlias,
  shouldUseConstAssertion,
  UNKNOWN_EXPLANATION_PLACEHOLDER,
} from "./type-pattern-checks";

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
  | "addUnknownExplanationComment"
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
    deprecated: true,
    replacedBy: [
      "enforce-type-naming",
      "no-undocumented-unknown",
      "enforce-assertion-policies",
    ],
    docs: {
      description:
        "Enforce consistent TypeScript patterns and naming conventions",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      typeAliasMustBePascalCase:
        "Type alias '{{name}}' must use PascalCase naming convention",
      interfaceMustBePascalCase:
        "Interface '{{name}}' must use PascalCase naming convention",
      enumMustBePascalCase:
        "Enum '{{name}}' must use PascalCase naming convention",
      typeAliasShouldEndWithType:
        "Type alias '{{name}}' should end with a descriptive suffix such as 'Type', 'Props', 'Return', 'State', 'Config', 'Options', 'Params', 'Payload', 'Context', 'Result', 'Error', 'Response', or 'Request'",
      interfaceShouldEndWithInterface:
        "Interface '{{name}}' should end with 'Interface' suffix for clarity",
      enumShouldEndWithEnum:
        "Enum '{{name}}' should end with 'Enum' suffix for clarity",
      avoidAnyType:
        "Avoid using 'any' type. Use 'unknown' or create a specific type instead",
      avoidUnknownWithoutComment:
        "Using 'unknown' type should include a comment explaining why",
      addUnknownExplanationComment:
        "Add a comment explaining the use of 'unknown'",
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
    const assessUnknownKeyword = createUnknownKeywordAssessor(sourceCode);

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

        // Check if complex types should end with a recognised role suffix
        if (
          isComplexType(node.typeAnnotation) &&
          !hasAllowedTypeSuffix(typeName)
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
        if (!assessUnknownKeyword(node).needsExplanation) {
          return;
        }

        context.report({
          node,
          messageId: "avoidUnknownWithoutComment",
          suggest: [
            {
              messageId: "addUnknownExplanationComment",
              fix(fixer): TSESLint.RuleFix {
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
                  `${UNKNOWN_EXPLANATION_PLACEHOLDER}\n${indentation}`
                );
              },
            },
          ],
        });
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
