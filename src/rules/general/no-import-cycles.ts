import type { TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import { detectImportCyclesSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-import-cycles";

type MessageIds = "importCycle";

type Options = [];

interface CollectedImport {
  node: TSESTree.ImportDeclaration;
  specifier: string;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow static imports that participate in a project dependency cycle",
    },
    schema: [],
    messages: {
      importCycle:
        "Import '{{specifier}}' participates in a dependency cycle: {{cycle}}.",
    },
  },
  defaultOptions: [],
  create(context) {
    const imports: CollectedImport[] = [];

    return {
      ImportDeclaration(node): void {
        imports.push({ node, specifier: node.source.value });
      },
      "Program:exit"(): void {
        if (imports.length === 0) {
          return;
        }

        const diagnostics = detectImportCyclesSync({
          filePath: context.filename,
        });
        if (!diagnostics || diagnostics.length === 0) {
          return;
        }

        const diagnosticsBySpecifier = new Map<string, typeof diagnostics>();
        for (const diagnostic of diagnostics) {
          const matching =
            diagnosticsBySpecifier.get(diagnostic.specifier) ?? [];
          matching.push(diagnostic);
          diagnosticsBySpecifier.set(diagnostic.specifier, matching);
        }

        for (const collectedImport of imports) {
          const matching = diagnosticsBySpecifier.get(
            collectedImport.specifier
          );
          if (!matching) {
            continue;
          }

          for (const diagnostic of matching) {
            context.report({
              data: {
                cycle: diagnostic.cycle.join(" -> "),
                specifier: diagnostic.specifier,
              },
              node: collectedImport.node,
              messageId: "importCycle",
            });
          }
        }
      },
    };
  },
});
