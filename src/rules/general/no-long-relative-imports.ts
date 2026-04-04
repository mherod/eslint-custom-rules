import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import { canonicalizeImportSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-long-relative-imports";

type MessageIds = "noLongRelativeImports";

type Options = [
  {
    maxDepth?: number;
    prefer?: "alias" | "shortest";
  },
];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow overly long relative imports and prefer canonical imports using aliases or stable workspace specifiers",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: {
            default: 3,
            minimum: 1,
            type: "number",
          },
          prefer: {
            default: "alias",
            enum: ["alias", "shortest"],
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noLongRelativeImports:
        "Avoid using long relative imports (depth > {{depth}}). Use a canonical {{strategy}} import instead.",
    },
  },
  defaultOptions: [
    {
      maxDepth: 3,
      prefer: "alias",
    },
  ],
  create(context) {
    const { maxDepth = 3, prefer = "alias" } = context.options[0] ?? {};
    const filePath = context.filename;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const importPath = node.source.value;

        if (typeof importPath !== "string" || !importPath.startsWith(".")) {
          return;
        }

        const parentDirCount = (importPath.match(/\.\.\//gu) || []).length;
        if (parentDirCount <= maxDepth) {
          return;
        }

        const rawSource = context.sourceCode.getText(node.source);
        const quote = rawSource.startsWith("'") ? "'" : '"';

        const canonicalResolution = canonicalizeImportSync({
          filePath,
          prefer,
          specifier: importPath,
        });

        context.report({
          node: node.source,
          messageId: "noLongRelativeImports",
          data: {
            depth: maxDepth,
            strategy: canonicalResolution?.strategy ?? prefer,
          },
          fix:
            canonicalResolution &&
            canonicalResolution.nextSpecifier !== importPath
              ? (fixer): TSESLint.RuleFix =>
                  fixer.replaceText(
                    node.source,
                    `${quote}${canonicalResolution.nextSpecifier}${quote}`
                  )
              : null,
        });
      },
    };
  },
});
