import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import { isComplexType, isPascalCase } from "../utils/common";
import {
  hasAllowedTypeSuffix,
  shouldBeInterface,
  shouldBeTypeAlias,
} from "./type-pattern-checks";

export const RULE_NAME = "enforce-type-naming";

type MessageIds =
  | "typeAliasMustBePascalCase"
  | "interfaceMustBePascalCase"
  | "enumMustBePascalCase"
  | "typeAliasShouldEndWithType"
  | "enumShouldEndWithEnum"
  | "preferTypeOverInterface"
  | "preferInterfaceOverType";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce naming, suffix, and alias-vs-interface conventions for TypeScript type declarations",
    },
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
      enumShouldEndWithEnum:
        "Enum '{{name}}' should end with 'Enum' suffix for clarity",
      preferTypeOverInterface:
        "Prefer type aliases over interfaces for simple object types",
      preferInterfaceOverType:
        "Prefer interfaces over type aliases for extensible object types",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        const typeName = node.id.name;

        if (!isPascalCase(typeName)) {
          context.report({
            node,
            messageId: "typeAliasMustBePascalCase",
            data: { name: typeName },
          });
        }

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

        if (shouldBeInterface(node.typeAnnotation)) {
          context.report({
            node,
            messageId: "preferInterfaceOverType",
          });
        }
      },

      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        const interfaceName = node.id.name;

        if (!isPascalCase(interfaceName)) {
          context.report({
            node,
            messageId: "interfaceMustBePascalCase",
            data: { name: interfaceName },
          });
        }

        if (shouldBeTypeAlias(node)) {
          context.report({
            node,
            messageId: "preferTypeOverInterface",
          });
        }
      },

      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        const enumName = node.id.name;

        if (!isPascalCase(enumName)) {
          context.report({
            node,
            messageId: "enumMustBePascalCase",
            data: { name: enumName },
          });
        }

        if (!enumName.endsWith("Enum")) {
          context.report({
            node,
            messageId: "enumShouldEndWithEnum",
            data: { name: enumName },
          });
        }
      },
    };
  },
});
