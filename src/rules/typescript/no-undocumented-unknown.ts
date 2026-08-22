import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  createUnknownKeywordAssessor,
  UNKNOWN_EXPLANATION_PLACEHOLDER,
} from "./type-pattern-checks";

export const RULE_NAME = "no-undocumented-unknown";

type MessageIds =
  | "avoidAnyType"
  | "avoidUnknownWithoutComment"
  | "addUnknownExplanationComment";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow 'any' and require an explanation for undocumented 'unknown' types",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      avoidAnyType:
        "Avoid using 'any' type. Use 'unknown' or create a specific type instead",
      avoidUnknownWithoutComment:
        "Using 'unknown' type should include a comment explaining why",
      addUnknownExplanationComment:
        "Add a comment explaining the use of 'unknown'",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const assessUnknownKeyword = createUnknownKeywordAssessor(sourceCode);

    return {
      TSAnyKeyword(node: TSESTree.TSAnyKeyword): void {
        context.report({
          node,
          messageId: "avoidAnyType",
        });
      },

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
    };
  },
});
