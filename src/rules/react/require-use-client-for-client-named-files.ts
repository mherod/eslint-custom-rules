import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  hasUseClientDirective,
  isClientComponent,
} from "../utils/component-type-utils";

export const RULE_NAME = "require-use-client-for-client-named-files";

type MessageIds = "missingUseClientDirective";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Require 'use client' in files that use client naming conventions.",
    },
    schema: [],
    messages: {
      missingUseClientDirective:
        "File name indicates a client component (e.g. '*-client.tsx'). " +
        'Add the "use client" directive or rename the file.',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const filename = context.filename;
    const normalizedPath = filename.replace(/\\/g, "/");

    if (!/\.(tsx|jsx)$/.test(normalizedPath)) {
      return {};
    }
    if (hasUseClientDirective(sourceCode)) {
      return {};
    }
    if (!isClientComponent(filename)) {
      return {};
    }

    return {
      Program(node: TSESTree.Program): void {
        const program = sourceCode.ast;
        const firstStatement = program.body[0];
        const hasUseServerDirective =
          firstStatement?.type === AST_NODE_TYPES.ExpressionStatement &&
          firstStatement.expression.type === AST_NODE_TYPES.Literal &&
          firstStatement.expression.value === "use server";

        context.report({
          node,
          messageId: "missingUseClientDirective",
          fix: hasUseServerDirective
            ? null
            : (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                fixer.insertTextBeforeRange([0, 0], `"use client";\n\n`),
        });
      },
    };
  },
});
