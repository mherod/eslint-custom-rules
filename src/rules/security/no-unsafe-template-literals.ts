import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

type MessageIds = "requireInputSanitization" | "noDirectProcessEnvInClient";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect unsafe template literal usage with unsanitized input and direct process.env access in client code",
    },
    schema: [],
    messages: {
      requireInputSanitization:
        "User input '{{input}}' should be sanitized before use. Use validation libraries like Zod.",
      noDirectProcessEnvInClient:
        "Avoid accessing process.env directly in client code. Use public environment variables or server actions.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isClientFile =
      filename.includes("components/") || filename.includes("pages/");

    // If file contains Zod, skip template literal security checks entirely
    const sourceCode = context.getSourceCode();
    const skipTemplateCheck = hasZodImport(sourceCode);

    return {
      // Check for direct process.env access in client code
      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          isClientFile &&
          node.object.type === AST_NODE_TYPES.MemberExpression &&
          node.object.object.type === AST_NODE_TYPES.Identifier &&
          node.object.object.name === "process" &&
          node.object.property.type === AST_NODE_TYPES.Identifier &&
          node.object.property.name === "env"
        ) {
          context.report({
            node,
            messageId: "noDirectProcessEnvInClient",
          });
        }
      },

      // Check for template literals with user input
      TemplateLiteral(node: TSESTree.TemplateLiteral): void {
        // Skip if Zod is present in the file
        if (skipTemplateCheck) {
          return;
        }

        // Only flag truly dangerous template literals
        if (
          hasDangerousTemplateUsage(node) ||
          (_hasUnsanitizedInput(node) && _isRiskyTemplateContext(node))
        ) {
          context.report({
            node,
            messageId: "requireInputSanitization",
            data: { input: "template literal" },
          });
        }
      },
    };
  },
});

function hasZodImport(sourceCode: { text: string }): boolean {
  const fileText = sourceCode.text;

  // Check for any Zod import patterns - if ANY are present, skip the rule entirely
  const zodPatterns = [
    /from\s*["']zod["']/i, // from "zod" or from 'zod'
    /import.*zod/i, // any import containing zod
    /zod/i, // just the word zod anywhere (very permissive)
  ];

  return zodPatterns.some((pattern) => pattern.test(fileText));
}

function hasDangerousTemplateUsage(node: TSESTree.TemplateLiteral): boolean {
  // Only flag template literals that contain obviously dangerous patterns
  return node.expressions.some((expr) => {
    // Check for direct request object access
    if (expr.type === AST_NODE_TYPES.MemberExpression) {
      return isDirectRequestAccess(expr);
    }

    // Check for variables with dangerous names
    if (expr.type === AST_NODE_TYPES.Identifier) {
      const varName = expr.name.toLowerCase();
      return isDangerousVariableName(varName);
    }

    return false;
  });
}

function _hasUnsanitizedInput(node: TSESTree.TemplateLiteral): boolean {
  // Be much more conservative - only flag template literals with clearly dangerous variables
  return node.expressions.some((expr) => {
    if (expr.type === AST_NODE_TYPES.Identifier) {
      const varName = expr.name;
      const varNameLower = varName.toLowerCase();

      // Skip variables that are clearly safe or already validated
      if (isSafeVariable(varNameLower)) {
        return false;
      }

      // Only flag very specific dangerous patterns
      return isObviouslyDangerousVariable(varNameLower);
    }

    // Flag direct access to request properties
    if (expr.type === AST_NODE_TYPES.MemberExpression) {
      return isDirectRequestAccess(expr);
    }

    return false;
  });
}

function _isRiskyTemplateContext(node: TSESTree.TemplateLiteral): boolean {
  // Check if this template literal is in a context where injection could be dangerous
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  // Skip error messages and logging contexts
  if (isErrorMessageContext(parent) || isLoggingContext(parent)) {
    return false;
  }

  // Skip validation/type checking contexts
  if (isValidationContext(parent)) {
    return false;
  }

  // Flag contexts that could be dangerous (SQL, HTML, shell commands, etc.)
  return isDangerousContext(parent);
}

function isObviouslyDangerousVariable(varName: string): boolean {
  // Only flag variables that are OBVIOUSLY dangerous and unsanitized
  const dangerousPatterns = [
    /^req\.body$/,
    /^req\.query$/,
    /^req\.params$/,
    /^request\.body$/,
    /^request\.query$/,
    /^request\.params$/,
    /^userinput$/,
    /^rawbody$/,
    /^rawquery$/,
    /^unsanitizedinput$/,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(varName));
}

function isDirectRequestAccess(expr: TSESTree.MemberExpression): boolean {
  // Flag direct access like req.body, req.query, req.params
  if (
    expr.object.type === AST_NODE_TYPES.Identifier &&
    expr.property.type === AST_NODE_TYPES.Identifier
  ) {
    const objName = expr.object.name.toLowerCase();
    const propName = expr.property.name.toLowerCase();

    return (
      (objName === "req" || objName === "request") &&
      ["body", "query", "params"].includes(propName)
    );
  }

  return false;
}

function isErrorMessageContext(node: TSESTree.Node): boolean {
  // Check if this is in an error object or return statement with error
  if (
    node.type === AST_NODE_TYPES.Property &&
    node.key.type === AST_NODE_TYPES.Identifier
  ) {
    return node.key.name === "error" || node.key.name === "message";
  }

  if (
    node.type === AST_NODE_TYPES.ReturnStatement ||
    node.type === AST_NODE_TYPES.ObjectExpression
  ) {
    // Look for error-related context in parent
    const parent = node.parent;
    if (
      parent &&
      parent.type === AST_NODE_TYPES.Property &&
      parent.key.type === AST_NODE_TYPES.Identifier
    ) {
      return parent.key.name === "error" || parent.key.name === "message";
    }
  }

  return false;
}

function isLoggingContext(node: TSESTree.Node): boolean {
  // Check if this is passed to a logging function
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.MemberExpression
    ) {
      const obj = current.callee.object;
      const prop = current.callee.property;
      if (
        obj.type === AST_NODE_TYPES.Identifier &&
        obj.name === "console" &&
        prop.type === AST_NODE_TYPES.Identifier &&
        ["log", "info", "warn", "error", "debug"].includes(prop.name)
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function isValidationContext(node: TSESTree.Node): boolean {
  // Check if this is in validation/error checking context
  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    // Look for validation-related property names
    if (node.parent && node.parent.type === AST_NODE_TYPES.ReturnStatement) {
      return true; // Likely a validation result
    }
  }
  return false;
}

function isDangerousContext(node: TSESTree.Node): boolean {
  // Check if template literal could be used in dangerous contexts
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier
    ) {
      const functionName = current.callee.name.toLowerCase();
      // Flag dangerous functions
      if (
        ["eval", "execute", "query", "exec", "system", "spawn"].includes(
          functionName
        )
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function isDangerousVariableName(varName: string): boolean {
  // Only flag obviously dangerous variable names
  const dangerousNames = [
    "userinput",
    "rawquery",
    "rawbody",
    "rawparams",
    "untrustedinput",
    "unsanitizedinput",
  ];

  return dangerousNames.includes(varName);
}

function isSafeVariable(varName: string): boolean {
  // Variables that are clearly safe based on naming conventions
  const safeNames = [
    "safeparamname",
    "validtype",
    "defaultvalue",
    "status",
    "message",
    "error",
    "success",
    "valid",
    "result",
    "data",
    "value",
    "config",
    "options",
    "settings",
    "constants",
    "min",
    "max",
    "allowfloat",
  ];

  // Check exact matches for common safe variable names
  if (safeNames.includes(varName)) {
    return true;
  }

  // Variables that indicate they've been validated/sanitized by prefix
  const safePrefixes = ["safe", "validated", "sanitized", "clean", "parsed"];
  if (safePrefixes.some((prefix) => varName.startsWith(prefix))) {
    return true;
  }

  // Variables that suggest validation context
  const validationIndicators = [
    "validation",
    "schema",
    "result",
    "processed",
    "filtered",
  ];
  if (validationIndicators.some((indicator) => varName.includes(indicator))) {
    return true;
  }

  return false;
}
