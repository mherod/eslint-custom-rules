import { ESLintUtils } from "@typescript-eslint/utils";
import { scanUnresolvableImportsSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-unresolvable-imports";

type MessageIds = "unresolvableImport";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports and module references that TypeScript cannot resolve with the active project configuration",
    },
    schema: [],
    messages: {
      unresolvableImport:
        "Cannot resolve {{type}} '{{specifier}}': {{diagnostic}}",
    },
  },
  defaultOptions: [],
  create(context) {
    const diagnostics = scanUnresolvableImportsSync({
      filePath: context.filename,
      sourceText: context.sourceCode.text,
    });

    if (!diagnostics || diagnostics.length === 0) {
      return {};
    }

    return {
      Program(): void {
        diagnostics.forEach((diagnostic) => {
          context.report({
            data: {
              diagnostic: diagnostic.diagnostic,
              specifier: diagnostic.specifier,
              type: diagnostic.type,
            },
            loc: {
              end: {
                column: diagnostic.column,
                line: diagnostic.line,
              },
              start: {
                column: Math.max(diagnostic.column - 1, 0),
                line: diagnostic.line,
              },
            },
            messageId: "unresolvableImport",
          });
        });
      },
    };
  },
});
