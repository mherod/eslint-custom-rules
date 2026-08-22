import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import {
  isUnnecessaryTypeAssertion,
  shouldUseConstAssertion,
} from "./type-pattern-checks";

export const RULE_NAME = "enforce-assertion-policies";

type MessageIds =
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
        "Enforce generic constraint, type assertion, and non-null assertion policies",
    },
    schema: [],
    messages: {
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
    return {
      TSTypeParameter(node: TSESTree.TSTypeParameter): void {
        if (!node.constraint && node.name.name.length === 1) {
          context.report({
            node,
            messageId: "missingGenericConstraint",
            data: { name: node.name.name },
          });
        }
      },

      TSTypeAssertion(node: TSESTree.TSTypeAssertion): void {
        if (isUnnecessaryTypeAssertion(node)) {
          context.report({
            node,
            messageId: "unnecessaryTypeAssertion",
          });
        }
      },

      TSAsExpression(node: TSESTree.TSAsExpression): void {
        if (shouldUseConstAssertion(node)) {
          context.report({
            node,
            messageId: "preferConstAssertion",
          });
        }
      },

      TSNonNullExpression(node: TSESTree.TSNonNullExpression): void {
        context.report({
          node,
          messageId: "avoidNonNullAssertion",
        });
      },
    };
  },
});
