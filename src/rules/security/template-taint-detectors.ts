import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { CONSOLE_METHODS } from "./sql-logging-detectors";

const DANGEROUS_VARIABLE_NAMES = new Set([
  "userinput",
  "rawquery",
  "rawbody",
  "rawparams",
  "untrustedinput",
  "unsanitizedinput",
]);

export function isDangerousVariableName(varName: string): boolean {
  return DANGEROUS_VARIABLE_NAMES.has(varName);
}

const SAFE_NAMES = new Set([
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
]);

const SAFE_PREFIXES: readonly string[] = [
  "safe",
  "validated",
  "sanitized",
  "clean",
  "parsed",
];

const VALIDATION_INDICATORS: readonly string[] = [
  "validation",
  "schema",
  "result",
  "processed",
  "filtered",
];

export function isSafeVariable(varName: string): boolean {
  if (SAFE_NAMES.has(varName)) {
    return true;
  }
  for (const prefix of SAFE_PREFIXES) {
    if (varName.startsWith(prefix)) {
      return true;
    }
  }
  for (const indicator of VALIDATION_INDICATORS) {
    if (varName.includes(indicator)) {
      return true;
    }
  }
  return false;
}

const OBVIOUSLY_DANGEROUS_NAMES = new Set([
  "req.body",
  "req.query",
  "req.params",
  "request.body",
  "request.query",
  "request.params",
  "userinput",
  "rawbody",
  "rawquery",
  "unsanitizedinput",
]);

export function isObviouslyDangerousVariable(varName: string): boolean {
  return OBVIOUSLY_DANGEROUS_NAMES.has(varName);
}

const REQUEST_PROPS = new Set(["body", "query", "params"]);

export function isDirectRequestAccess(
  expr: TSESTree.MemberExpression
): boolean {
  if (
    expr.object.type !== AST_NODE_TYPES.Identifier ||
    expr.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }
  const objName = expr.object.name.toLowerCase();
  if (objName !== "req" && objName !== "request") {
    return false;
  }
  return REQUEST_PROPS.has(expr.property.name.toLowerCase());
}

export function _hasUnsanitizedInput(node: TSESTree.TemplateLiteral): boolean {
  return node.expressions.some((expr) => {
    if (expr.type === AST_NODE_TYPES.Identifier) {
      const varName = expr.name;
      const varNameLower = varName.toLowerCase();

      if (isSafeVariable(varNameLower)) {
        return false;
      }

      return isObviouslyDangerousVariable(varNameLower);
    }

    if (expr.type === AST_NODE_TYPES.MemberExpression) {
      return isDirectRequestAccess(expr);
    }

    return false;
  });
}

export function isErrorMessageContext(node: TSESTree.Node): boolean {
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

export function isLoggingContext(node: TSESTree.Node): boolean {
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
        CONSOLE_METHODS.has(prop.name)
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

export function isValidationContext(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    if (node.parent && node.parent.type === AST_NODE_TYPES.ReturnStatement) {
      return true;
    }
  }
  return false;
}

const DANGEROUS_CALLEES = new Set([
  "eval",
  "execute",
  "query",
  "exec",
  "system",
  "spawn",
]);

export function isDangerousContext(node: TSESTree.Node): boolean {
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier &&
      DANGEROUS_CALLEES.has(current.callee.name.toLowerCase())
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export function _isRiskyTemplateContext(
  node: TSESTree.TemplateLiteral
): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (isErrorMessageContext(parent) || isLoggingContext(parent)) {
    return false;
  }

  if (isValidationContext(parent)) {
    return false;
  }

  return isDangerousContext(parent);
}

// The previous implementation tested three regex patterns; the last (/zod/i)
// subsumed the first two, so we keep only the loosest case-insensitive check.
const ZOD_PATTERN = /zod/i;
export function hasZodImport(sourceCode: { text: string }): boolean {
  return ZOD_PATTERN.test(sourceCode.text);
}

export function hasDangerousTemplateUsage(
  node: TSESTree.TemplateLiteral
): boolean {
  return node.expressions.some((expr) => {
    if (expr.type === AST_NODE_TYPES.MemberExpression) {
      return isDirectRequestAccess(expr);
    }

    if (expr.type === AST_NODE_TYPES.Identifier) {
      const varName = expr.name.toLowerCase();
      return isDangerousVariableName(varName);
    }

    return false;
  });
}
