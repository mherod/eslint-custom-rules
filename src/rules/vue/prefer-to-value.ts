import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-to-value";

type MessageIds = "preferToValue" | "preferToValueOverUnref";

type Options = [
  {
    /** Whether to auto-import toValue when fixing (default: false) */
    autoImport?: boolean;
  }?,
];

/**
 * ESLint rule to enforce using `toValue()` for unwrapping Vue refs.
 *
 * The `toValue()` utility is more flexible than `.value` or `unref()` as it:
 * - Works with refs, computed refs, getters, and plain values
 * - Provides better type inference
 * - Is more explicit about the unwrapping operation
 *
 * @example
 * ```js
 * // ❌ Bad
 * const val1 = myRef.value;
 * const val2 = unref(myRef);
 * const val3 = isRef(something) ? something.value : something;
 *
 * // ✅ Good
 * const val1 = toValue(myRef);
 * const val2 = toValue(something);
 * ```
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#tovalue}
 */
export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer toValue() for unwrapping refs instead of .value or unref()",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          autoImport: {
            type: "boolean",
            description: "Whether to auto-import toValue when fixing",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferToValue:
        "Use toValue({{ref}}) instead of {{ref}}.value for better flexibility and type inference",
      preferToValueOverUnref:
        "Use toValue({{ref}}) instead of unref({{ref}}) for consistency and better type inference",
    },
  },
  defaultOptions: [
    {
      autoImport: false,
    },
  ],
  create(context, [options]) {
    const autoImport = options?.autoImport ?? false;
    let hasToValueImport = false;
    let vueImportNode: TSESTree.ImportDeclaration | null = null;
    let importsToValue = false;

    /**
     * Checks if toValue needs to be imported and adds it if necessary
     */
    function ensureToValueImport(fixer: any): any[] {
      const fixes: unknown[] = [];

      if (!hasToValueImport && autoImport) {
        if (vueImportNode) {
          // Add toValue to existing Vue import
          const importSpecifiers = vueImportNode.specifiers
            .filter(
              (s): s is TSESTree.ImportSpecifier => s.type === "ImportSpecifier"
            )
            .map((s) => (s.imported as TSESTree.Identifier).name);

          if (!importSpecifiers.includes("toValue")) {
            const lastSpecifier = vueImportNode.specifiers.at(-1);
            fixes.push(fixer.insertTextAfter(lastSpecifier, ", toValue"));
          }
        } else {
          // Add new Vue import at the top
          const program = context.getSourceCode().ast;
          const sourceCode = context.getSourceCode();
          const firstImport = program.body.find(
            (node): node is TSESTree.ImportDeclaration =>
              node.type === "ImportDeclaration"
          );

          // Try to detect indentation from the first line of code
          const firstCodeLine = sourceCode.lines.find(
            (line) => line.trim().length > 0
          );
          const indentMatch = firstCodeLine?.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : "";

          if (firstImport) {
            fixes.push(
              fixer.insertTextBefore(
                firstImport,
                `${indent}import { toValue } from 'vue';\n`
              )
            );
          } else {
            // Insert at the beginning with detected indentation
            // Check if the file starts with a newline (common in test fixtures)
            const firstChar = sourceCode.text[0];
            const startsWithNewline = firstChar === "\n";

            const importStatement = startsWithNewline
              ? `\n${indent}import { toValue } from 'vue';\n`
              : `${indent}import { toValue } from 'vue';\n\n`;

            fixes.push(fixer.insertTextBeforeRange([0, 0], importStatement));
          }
        }
      }

      return fixes;
    }

    /**
     * Gets the identifier name from various node types
     */
    function getIdentifierName(node: TSESTree.Node): string {
      if (node.type === "Identifier") {
        return node.name;
      }
      if (
        node.type === "MemberExpression" &&
        node.object.type === "Identifier"
      ) {
        return context.getSourceCode().getText(node.object);
      }
      return context.getSourceCode().getText(node);
    }

    return {
      // Track Vue imports
      ImportDeclaration(node) {
        if (
          node.source.value === "vue" ||
          node.source.value === "@vue/reactivity"
        ) {
          vueImportNode = node;

          // Check if toValue is already imported
          hasToValueImport = node.specifiers.some(
            (spec) =>
              spec.type === "ImportSpecifier" &&
              (spec.imported as TSESTree.Identifier).name === "toValue"
          );

          // Check if unref is imported (we'll suggest replacing it)
          importsToValue = node.specifiers.some(
            (spec) =>
              spec.type === "ImportSpecifier" &&
              (spec.imported as TSESTree.Identifier).name === "unref"
          );
        }
      },

      // Check for ref.value pattern
      MemberExpression(node) {
        if (
          node.property.type === "Identifier" &&
          node.property.name === "value" &&
          node.object.type === "Identifier"
        ) {
          // Skip if this is part of an isRef() ? x.value : x pattern
          const parent = node.parent;
          if (
            parent?.type === "ConditionalExpression" &&
            parent.consequent === node &&
            parent.test.type === "CallExpression" &&
            parent.test.callee.type === "Identifier" &&
            parent.test.callee.name === "isRef"
          ) {
            return; // This will be handled by ConditionalExpression
          }
          // Try to determine if this is likely a Vue ref
          // Common ref naming patterns
          const refName = node.object.name;
          const isLikelyRef =
            refName.endsWith("Ref") ||
            refName.startsWith("ref") ||
            refName.startsWith("computed") ||
            refName.includes("Ref") ||
            // Common Vue 3 naming patterns for boolean refs
            /^(is[A-Z]|has[A-Z]|show[A-Z]|can[A-Z]|should[A-Z])/.test(
              refName
            ) ||
            // Common reactive state patterns
            refName === "state" ||
            refName === "formData" ||
            refName.startsWith("form") ||
            refName.startsWith("model");

          // Skip if it's clearly not a ref (like console.value, window.value, etc.)
          const notRef = [
            "console",
            "window",
            "document",
            "global",
            "process",
            "config",
            "options",
            "settings",
            "props",
            "data",
          ];
          if (notRef.includes(refName)) {
            return;
          }

          // Report if it looks like a ref
          if (isLikelyRef) {
            context.report({
              node,
              messageId: "preferToValue",
              data: {
                ref: refName,
              },
              fix:
                hasToValueImport || autoImport
                  ? (fixer) => {
                      const fixes = [
                        fixer.replaceText(node, `toValue(${refName})`),
                      ];
                      return fixes.concat(ensureToValueImport(fixer));
                    }
                  : undefined,
            });
          }
        }
      },

      // Check for unref() calls
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "unref" &&
          node.arguments.length === 1
        ) {
          const argText = getIdentifierName(node.arguments[0]);

          context.report({
            node,
            messageId: "preferToValueOverUnref",
            data: {
              ref: argText,
            },
            fix:
              hasToValueImport || autoImport
                ? (fixer) => {
                    const fixes = [
                      fixer.replaceText(
                        node.callee as TSESTree.Identifier,
                        "toValue"
                      ),
                    ];

                    // If unref is imported but toValue isn't, we might need to update imports
                    if (importsToValue && !hasToValueImport && vueImportNode) {
                      const unrefSpecifier = vueImportNode.specifiers.find(
                        (s): s is TSESTree.ImportSpecifier =>
                          s.type === "ImportSpecifier" &&
                          (s.imported as TSESTree.Identifier).name === "unref"
                      );

                      if (unrefSpecifier) {
                        // Replace unref with toValue in imports
                        fixes.push(
                          fixer.replaceText(
                            unrefSpecifier.imported as TSESTree.Identifier,
                            "toValue"
                          )
                        );
                      }
                    } else {
                      fixes.push(...ensureToValueImport(fixer));
                    }

                    return fixes;
                  }
                : undefined,
          });
        }
      },

      // Check for isRef() ? .value : pattern
      ConditionalExpression(node) {
        // Check for pattern: isRef(x) ? x.value : x
        if (
          node.test.type === "CallExpression" &&
          node.test.callee.type === "Identifier" &&
          node.test.callee.name === "isRef" &&
          node.test.arguments.length === 1
        ) {
          const refArg = node.test.arguments[0];
          const refText = context.getSourceCode().getText(refArg);

          // Check if consequent is ref.value
          const isRefValuePattern =
            node.consequent.type === "MemberExpression" &&
            node.consequent.property.type === "Identifier" &&
            node.consequent.property.name === "value" &&
            context.getSourceCode().getText(node.consequent.object) === refText;

          // Check if alternate is the same ref
          const alternateIsRef =
            context.getSourceCode().getText(node.alternate) === refText;

          if (isRefValuePattern && alternateIsRef) {
            context.report({
              node,
              messageId: "preferToValue",
              data: {
                ref: refText,
              },
              fix:
                hasToValueImport || autoImport
                  ? (fixer) => {
                      const fixes = [
                        fixer.replaceText(node, `toValue(${refText})`),
                      ];
                      return fixes.concat(ensureToValueImport(fixer));
                    }
                  : undefined,
            });
          }
        }
      },
    };
  },
});
