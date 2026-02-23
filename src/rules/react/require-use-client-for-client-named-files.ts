import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  hasDirective,
  hasUseClientDirective,
  isClientComponent,
  normalizePath,
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
    const normalizedPath = normalizePath(filename);

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
        const hasUseServer = hasDirective(sourceCode, "use server");

        context.report({
          node,
          messageId: "missingUseClientDirective",
          fix: hasUseServer
            ? null
            : (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                fixer.insertTextBeforeRange([0, 0], `"use client";\n\n`),
        });
      },
    };
  },
});
