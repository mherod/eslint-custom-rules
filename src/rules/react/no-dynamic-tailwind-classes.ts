import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-dynamic-tailwind-classes";

type MessageIds =
  | "dynamicClassConstruction"
  | "templateLiteralClass"
  | "ternaryClassConstruction"
  | "logicalClassConstruction"
  | "arrayJoinClass"
  | "dynamicUtilityClass";

type Options = [
  {
    /** List of regex patterns for allowed dynamic class constructions */
    allowedDynamicClasses?: string[];
    /** Whether to allow conditional classes with complete class names (default: true) */
    allowConditionalClasses?: boolean;
  }?,
];

const COMMON_CLASS_PROPS = ["className", "class"];
const COMMON_UTILITY_FUNCTIONS = ["cn", "clsx", "classNames", "twMerge", "cx"];

/**
 * ESLint rule to prevent dynamic Tailwind CSS class construction that breaks static analysis.
 *
 * Tailwind CSS uses static analysis (PurgeCSS/JIT) to determine which styles to include in the final bundle.
 * Dynamically constructed class names cannot be analyzed at build time, resulting in missing styles.
 *
 * @example
 * ```js
 * // ❌ Bad - Dynamic construction
 * <div className={`bg-${color}-500`} />
 * <div className={'text-' + size} />
 * <div className={isDark ? 'bg-' + theme : 'text-white'} />
 *
 * // ✅ Good - Static classes
 * <div className="bg-red-500" />
 * <div className={isDark ? 'bg-gray-900' : 'bg-white'} />
 * <div className={cn('bg-blue-500', { 'opacity-50': disabled })} />
 * ```
 *
 * @remarks
 * Detects various patterns including:
 * - Template literals with embedded expressions: `bg-${var}-500`
 * - String concatenation: 'bg-' + color + '-500'
 * - Responsive/state prefixes: 'md:' + className, 'hover:' + color
 * - String methods: .concat(), .replace()
 * - Array joins creating classes
 * - Ternary and logical operators with partial classes
 *
 * @see {@link https://tailwindcss.com/docs/content-configuration#dynamic-class-names}
 */
export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent dynamic construction of Tailwind CSS classes that break static analysis",
    },
    messages: {
      dynamicClassConstruction:
        "Avoid dynamic class construction with {{method}}. Tailwind can't analyze classes like '{{example}}' at build time. Use complete class names or a safelist.",
      templateLiteralClass:
        "Avoid template literals for Tailwind classes. Use complete class names like '{{suggestion}}' instead of dynamic construction.",
      ternaryClassConstruction:
        "Avoid ternary operators that construct partial class names. Use complete classes in both branches: {{suggestion}}",
      logicalClassConstruction:
        "Avoid logical operators that construct partial class names. Use complete classes: {{suggestion}}",
      arrayJoinClass:
        "Avoid joining arrays to construct class names. Use complete class strings instead.",
      dynamicUtilityClass:
        "Dynamic color/size utilities like '{{example}}' can't be analyzed. Use static classes or configure a safelist.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedDynamicClasses: {
            type: "array",
            items: { type: "string" },
            description: "List of allowed dynamic class patterns",
          },
          allowConditionalClasses: {
            type: "boolean",
            description: "Allow conditional classes with complete class names",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      allowedDynamicClasses: [],
      allowConditionalClasses: true,
    },
  ],
  create(context, [options]) {
    const allowedDynamicClasses = options?.allowedDynamicClasses || [];
    const allowConditionalClasses = options?.allowConditionalClasses ?? true;

    /**
     * Checks if a JSX attribute is a className prop.
     * @param node - JSX attribute node to check
     * @returns True if the attribute is className or class
     */
    function isClassProp(node: TSESTree.JSXAttribute): boolean {
      return (
        node.type === AST_NODE_TYPES.JSXAttribute &&
        node.name.type === AST_NODE_TYPES.JSXIdentifier &&
        COMMON_CLASS_PROPS.includes(node.name.name)
      );
    }

    /**
     * Checks if a function call is a common CSS class utility function.
     * @param node - Call expression node to check
     * @returns True if the function is cn, clsx, classNames, twMerge, or cx
     */
    function isUtilityFunction(node: TSESTree.CallExpression): boolean {
      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return COMMON_UTILITY_FUNCTIONS.includes(node.callee.name);
      }
      return false;
    }

    /**
     * Detects if a string contains dynamic Tailwind patterns that won't work with static analysis.
     * @param text - String to check for dynamic patterns
     * @returns True if dynamic patterns are found
     */
    function containsDynamicTailwindPattern(text: string): boolean {
      // Common Tailwind dynamic patterns that won't work
      const dynamicPatterns = [
        /\b(bg|text|border|ring|from|to|via)-\$\{/, // ${} in color utilities
        /\b(bg|text|border|ring|from|to|via)-`/, // Template literal in color
        /\b(w|h|p|m|px|py|mt|mb|ml|mr)-\$\{/, // ${} in spacing utilities
        /\b(text|font)-\$\{/, // ${} in typography
        /\$\{[^}]+\}-([\w-]+)/, // ${var}-something
        /([\w-]+)-\$\{[^}]+\}/, // something-${var}
      ];

      return dynamicPatterns.some((pattern) => pattern.test(text));
    }

    /**
     * Analyzes template literals for dynamic class construction patterns.
     * Reports errors for patterns like `bg-${color}-500` or `p-${spacing}`.
     * @param node - Template literal node to analyze
     */
    function checkTemplateLiteral(node: TSESTree.TemplateLiteral): void {
      // Check if template literal contains dynamic Tailwind patterns
      const hasExpression = node.expressions.length > 0;
      if (!hasExpression) {
        return;
      }

      // Get original source text for allowed check
      // Remove backticks to match against the actual template content
      const fullText = context.getSourceCode().getText(node);
      const originalText = fullText.startsWith("`")
        ? fullText.slice(1, -1)
        : fullText;

      // Reconstruct the template to analyze
      let reconstructed = "";
      node.quasis.forEach((quasi, index) => {
        reconstructed += quasi.value.raw;
        if (index < node.expressions.length) {
          reconstructed += "${expr}";
        }
      });

      // Check for problematic patterns (unless allowed by config)
      if (
        containsDynamicTailwindPattern(reconstructed) &&
        !isAllowedDynamic(originalText)
      ) {
        // Try to detect the pattern and suggest fix
        let example = reconstructed;
        let suggestion = "";

        // Detect color utilities
        if (/\b(bg|text|border|ring)-\$\{/.test(reconstructed)) {
          example =
            reconstructed.match(
              /\b((?:bg|text|border|ring)-\$\{[^}]*\})/
            )?.[1] || reconstructed;
          suggestion =
            "Use complete class names like 'bg-red-500' or 'text-blue-600'";
        }
        // Detect spacing utilities
        else if (/\b(w|h|p|m|px|py|mt|mb|ml|mr)-\$\{/.test(reconstructed)) {
          suggestion = "Use complete class names like 'p-4' or 'mt-8'";
        }

        // Use different message IDs based on the pattern type
        // dynamicUtilityClass is for color/theme utilities specifically
        // templateLiteralClass is for other dynamic patterns
        const isColorUtility =
          /\b(bg|text|border|ring|from|to|via)-\$\{[^}]*\}-(50|100|200|300|400|500|600|700|800|900|950)\b/.test(
            reconstructed
          ) ||
          /\b(text|bg|border)-(red|blue|green|yellow|gray|indigo|purple|pink)-\$\{/.test(
            reconstructed
          );

        const messageId = isColorUtility
          ? "dynamicUtilityClass"
          : "templateLiteralClass";

        context.report({
          node,
          messageId,
          data: {
            example,
            suggestion,
          },
        });
      }
    }

    /**
     * Analyzes binary expressions (string concatenation) for dynamic class patterns.
     * Detects patterns like 'bg-' + color + '-500' or 'md:' + className.
     * @param node - Binary expression node to analyze
     * @param isNested - Whether this is a nested call (to avoid duplicate reporting)
     */
    function checkBinaryExpression(
      node: TSESTree.BinaryExpression,
      isNested = false
    ): void {
      if (node.operator !== "+") {
        return;
      }

      // Check if concatenating partial class names
      const leftText = getStaticString(node.left);
      const rightText = getStaticString(node.right);
      const leftIsVariable = node.left.type === AST_NODE_TYPES.Identifier;
      const rightIsVariable = node.right.type === AST_NODE_TYPES.Identifier;
      const leftIsBinary = node.left.type === AST_NODE_TYPES.BinaryExpression;
      const rightIsBinary = node.right.type === AST_NODE_TYPES.BinaryExpression;

      // Check patterns:
      // 1. Prefix patterns: "md:" + something, "hover:" + something
      // 2. Suffix patterns: something + "-500", something + ":hidden"
      // 3. Variable + suffix: variant + "-500", breakpoint + ":hidden"
      // 4. Prefix + variable: "bg-" + color, "text-" + size
      // 5. Nested concatenations: "lg:" + "grid-cols-" + columns

      // Handle nested binary expressions recursively - but don't report them
      if (
        leftIsBinary &&
        (node.left as TSESTree.BinaryExpression).operator === "+"
      ) {
        checkBinaryExpression(node.left as TSESTree.BinaryExpression, true);
      }
      if (
        rightIsBinary &&
        (node.right as TSESTree.BinaryExpression).operator === "+"
      ) {
        checkBinaryExpression(node.right as TSESTree.BinaryExpression, true);
      }

      // If this is a nested call, don't report - let the parent report
      if (isNested) {
        return;
      }

      if (
        (leftText && isTailwindPrefix(leftText)) ||
        (rightText && isTailwindSuffix(rightText)) ||
        (leftIsVariable &&
          rightText &&
          (rightText.startsWith(":") || rightText.startsWith("-"))) ||
        (rightIsVariable &&
          leftText &&
          (leftText.endsWith(":") || leftText.endsWith("-"))) ||
        (leftIsBinary && rightIsVariable) ||
        (leftText?.endsWith("-") && rightIsBinary)
      ) {
        const example = `${leftText || (leftIsVariable ? "variable" : leftIsBinary ? "expression" : "prefix")} + ${rightText || (rightIsVariable ? "variable" : rightIsBinary ? "expression" : "suffix")}`;

        // Check if this pattern is allowed by configuration
        const originalText = context.getSourceCode().getText(node);
        if (isAllowedDynamic(originalText)) {
          return;
        }

        context.report({
          node,
          messageId: "dynamicClassConstruction",
          data: {
            method: "string concatenation",
            example,
          },
        });
      }
    }

    function checkConditionalExpression(
      node: TSESTree.ConditionalExpression
    ): void {
      if (!allowConditionalClasses) {
        // If not allowing any conditional classes
        context.report({
          node,
          messageId: "ternaryClassConstruction",
          data: {
            suggestion:
              "Use static classes or configure allowConditionalClasses",
          },
        });
        return;
      }

      // Check if the ternary is constructing partial classes
      const consequentText = getStaticString(node.consequent);
      const alternateText = getStaticString(node.alternate);

      // Also check if consequent or alternate are binary expressions (string concatenation)
      const consequentIsDynamic =
        node.consequent.type === AST_NODE_TYPES.BinaryExpression &&
        node.consequent.operator === "+";
      const alternateIsDynamic =
        node.alternate.type === AST_NODE_TYPES.BinaryExpression &&
        node.alternate.operator === "+";

      // Check if the binary expressions are actually constructing dynamic classes
      if (consequentIsDynamic) {
        checkBinaryExpression(node.consequent as TSESTree.BinaryExpression);
      }
      if (alternateIsDynamic) {
        checkBinaryExpression(node.alternate as TSESTree.BinaryExpression);
      }

      // Check for partial class construction patterns
      if (
        (consequentText && isTailwindPrefix(consequentText)) ||
        (alternateText && isTailwindPrefix(alternateText))
      ) {
        context.report({
          node,
          messageId: "ternaryClassConstruction",
          data: {
            suggestion: `condition ? 'bg-red-500' : 'bg-blue-500' instead of constructing classes dynamically`,
          },
        });
      }
    }

    function checkLogicalExpression(node: TSESTree.LogicalExpression): void {
      if (!allowConditionalClasses) {
        context.report({
          node,
          messageId: "logicalClassConstruction",
          data: {
            suggestion:
              "Use static classes or configure allowConditionalClasses",
          },
        });
        return;
      }

      // Check for partial class construction
      const leftText = getStaticString(node.left);
      const rightText = getStaticString(node.right);

      // Also check if right side is a binary expression (string concatenation)
      const rightIsDynamic =
        node.right.type === AST_NODE_TYPES.BinaryExpression &&
        node.right.operator === "+";

      // Check the binary expression if it exists
      if (rightIsDynamic) {
        checkBinaryExpression(node.right as TSESTree.BinaryExpression);
      }

      if (
        (leftText && isTailwindPrefix(leftText)) ||
        (rightText && isTailwindPrefix(rightText))
      ) {
        context.report({
          node,
          messageId: "logicalClassConstruction",
          data: {
            suggestion: `isActive && 'bg-blue-500' instead of constructing classes dynamically`,
          },
        });
      }
    }

    function checkArrayJoin(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        node.callee.property.name === "join" &&
        node.callee.object.type === AST_NODE_TYPES.ArrayExpression
      ) {
        // Check if array contains partial class names
        const elements = node.callee.object.elements;
        const hasPartialClasses = elements.some((element) => {
          if (
            element?.type === AST_NODE_TYPES.Literal &&
            typeof element.value === "string"
          ) {
            return isTailwindPrefix(element.value);
          }
          return false;
        });

        if (hasPartialClasses) {
          context.report({
            node,
            messageId: "arrayJoinClass",
          });
          return true;
        }
      }
      return false;
    }

    /**
     * Checks if a string is a Tailwind utility prefix that might be concatenated.
     * Examples: 'bg-', 'text-', 'hover:', 'md:', 'p-'
     * @param str - String to check
     * @returns True if the string is a recognized Tailwind prefix
     */
    function isTailwindPrefix(str: string): boolean {
      // Common Tailwind prefixes that might be concatenated
      const prefixes = [
        /^(bg|text|border|ring|from|to|via)-$/,
        /^(hover|focus|active|disabled|group-hover|dark):$/,
        /^(sm|md|lg|xl|2xl):$/,
        /^(w|h|p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr)-$/,
        /^(flex|grid|inline|block|hidden)-?$/,
        /^(rounded|shadow|opacity|z)-?$/,
      ];

      return prefixes.some((pattern) => pattern.test(str.trim()));
    }

    /**
     * Checks if a string is a Tailwind utility suffix that might be concatenated.
     * Examples: '-500', '-lg', ':hidden', '-2xl'
     * @param str - String to check
     * @returns True if the string is a recognized Tailwind suffix
     */
    function isTailwindSuffix(str: string): boolean {
      // Common Tailwind suffixes
      const suffixes = [
        /^-?(xs|sm|md|lg|xl|2xl|3xl|full)$/,
        /^-?\d+(\.5)?$/,
        /^-?\[([\w-]+|[\d.]+[a-z]+)\]$/,
        /^-?(50|100|200|300|400|500|600|700|800|900|950)$/,
      ];

      return suffixes.some((pattern) => pattern.test(str.trim()));
    }

    /**
     * Extracts a static string value from a node if possible.
     * @param node - AST node to extract string from
     * @returns The string value if static, null otherwise
     */
    function getStaticString(node: TSESTree.Node): string | null {
      if (
        node.type === AST_NODE_TYPES.Literal &&
        typeof node.value === "string"
      ) {
        return node.value;
      }
      if (
        node.type === AST_NODE_TYPES.TemplateLiteral &&
        node.expressions.length === 0
      ) {
        return node.quasis[0]?.value.raw || null;
      }
      return null;
    }

    /**
     * Check if dynamic class is allowed by configuration
     */
    function isAllowedDynamic(text: string): boolean {
      if (allowedDynamicClasses.length === 0) {
        return false;
      }

      return allowedDynamicClasses.some((pattern) => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(text);
        } catch {
          // If pattern is invalid regex, try exact match
          return text === pattern;
        }
      });
    }

    return {
      // Check className and class props in JSX
      JSXAttribute(node: TSESTree.JSXAttribute): void {
        if (!(isClassProp(node) && node.value)) {
          return;
        }

        // Handle JSXExpressionContainer
        if (node.value.type === AST_NODE_TYPES.JSXExpressionContainer) {
          const expression = node.value.expression;
          if (expression.type === AST_NODE_TYPES.TemplateLiteral) {
            checkTemplateLiteral(expression);
          } else if (expression.type === AST_NODE_TYPES.BinaryExpression) {
            checkBinaryExpression(expression);
          } else if (expression.type === AST_NODE_TYPES.ConditionalExpression) {
            checkConditionalExpression(expression);
          } else if (expression.type === AST_NODE_TYPES.LogicalExpression) {
            checkLogicalExpression(expression);
          } else if (expression.type === AST_NODE_TYPES.CallExpression) {
            checkArrayJoin(expression);
          }
        }
        // Handle direct template literal
        else if (
          node.value.type === AST_NODE_TYPES.Literal &&
          typeof node.value.value === "string"
        ) {
          // Check for variable-like patterns in string literals (less common but possible)
          const value = node.value.value;
          if (value.includes("${") || value.includes("`")) {
            context.report({
              node: node.value,
              messageId: "dynamicClassConstruction",
              data: {
                method: "string interpolation",
                example: value,
              },
            });
          }
        }
      },

      // Check utility functions like cn(), clsx(), etc.
      CallExpression(node: TSESTree.CallExpression): void {
        // Skip array.join() calls inside className (handled by JSXAttribute visitor)
        const parent = node.parent;
        if (
          parent?.type === AST_NODE_TYPES.JSXExpressionContainer &&
          parent.parent?.type === AST_NODE_TYPES.JSXAttribute &&
          isClassProp(parent.parent as TSESTree.JSXAttribute) &&
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "join"
        ) {
          // Array.join() in className will be handled by the JSXAttribute visitor
          return;
        }

        // Check for string methods that construct classes
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier
        ) {
          const method = node.callee.property.name;
          const object = node.callee.object;

          // Check for .concat() method
          if (method === "concat" && object.type === AST_NODE_TYPES.Literal) {
            const baseString = String(object.value);
            if (isTailwindPrefix(baseString)) {
              context.report({
                node,
                messageId: "dynamicClassConstruction",
                data: {
                  method: "string concat method",
                  example: `${baseString}.concat(...)`,
                },
              });
            }
          }

          // Check for .replace() method constructing classes
          if (method === "replace" && object.type === AST_NODE_TYPES.Literal) {
            const baseString = String(object.value);
            // Check if it's a pattern like "bg-COLOR-500".replace("COLOR", var)
            if (
              /\b(bg|text|border)-(COLOR|PLACEHOLDER|VAR)/i.test(baseString)
            ) {
              context.report({
                node,
                messageId: "dynamicClassConstruction",
                data: {
                  method: "string replace method",
                  example: baseString,
                },
              });
            }
          }
        }

        // Check array join
        if (checkArrayJoin(node)) {
          return; // Already handled as array join
        }

        // Check utility functions
        if (!isUtilityFunction(node)) {
          return;
        }

        // Check arguments for dynamic patterns
        node.arguments.forEach((arg) => {
          if (arg.type === AST_NODE_TYPES.TemplateLiteral) {
            checkTemplateLiteral(arg);
          } else if (arg.type === AST_NODE_TYPES.BinaryExpression) {
            checkBinaryExpression(arg);
          } else if (arg.type === AST_NODE_TYPES.ConditionalExpression) {
            checkConditionalExpression(arg);
          } else if (arg.type === AST_NODE_TYPES.LogicalExpression) {
            checkLogicalExpression(arg);
          } else if (arg.type === AST_NODE_TYPES.CallExpression) {
            checkArrayJoin(arg);
          }
        });
      },

      // Check template literals in general (not just in className)
      TemplateLiteral(node: TSESTree.TemplateLiteral): void {
        // Skip if not in a relevant context
        const parent = node.parent;
        if (
          parent?.type !== AST_NODE_TYPES.JSXExpressionContainer &&
          parent?.type !== AST_NODE_TYPES.CallExpression &&
          parent?.type !== AST_NODE_TYPES.VariableDeclarator &&
          parent?.type !== AST_NODE_TYPES.ReturnStatement &&
          parent?.type !== AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          return;
        }

        // Skip if this is inside a className/class prop (already handled by JSXAttribute)
        if (
          parent?.type === AST_NODE_TYPES.JSXExpressionContainer &&
          parent.parent?.type === AST_NODE_TYPES.JSXAttribute
        ) {
          const attr = parent.parent as TSESTree.JSXAttribute;
          if (isClassProp(attr)) {
            return; // Already handled by JSXAttribute visitor
          }
        }

        // Skip if this is an argument to a utility function (already handled by CallExpression)
        if (
          parent?.type === AST_NODE_TYPES.CallExpression &&
          isUtilityFunction(parent)
        ) {
          return; // Already handled by CallExpression visitor for utility functions
        }

        // Additional check for common Tailwind dynamic patterns
        const hasExpression = node.expressions.length > 0;
        if (!hasExpression) {
          return;
        }

        // Check for color scale patterns like `text-${color}-500`
        const quasisText = node.quasis.map((q) => q.value.raw).join("${...}");
        if (
          /\b(bg|text|border|ring|from|to|via)-\$\{[^}]*\}-(50|100|200|300|400|500|600|700|800|900|950)\b/.test(
            quasisText
          ) ||
          /\b(bg|text|border|ring|from|to|via)-(red|blue|green|yellow|purple|pink|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\$\{[^}]*\}\b/.test(
            quasisText
          )
        ) {
          const match = quasisText.match(
            /\b((bg|text|border|ring|from|to|via)-[^$]*\$\{[^}]*\}[^$]*)/
          );
          const example = match?.[1] || "color-${variant}-500";

          context.report({
            node,
            messageId: "dynamicUtilityClass",
            data: {
              example,
            },
          });
        }
      },
    };
  },
});
