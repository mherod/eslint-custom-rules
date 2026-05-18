import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const SECRET_PATTERNS: readonly RegExp[] = [
  /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
  /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
  /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
  /^[0-9a-f]{32,}$/, // Hex encoded secrets
  /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
];

export function isHardcodedSecret(value: string): boolean {
  if (value.length <= 20) {
    return false;
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

const WEAK_CRYPTO_FUNCTIONS = new Set(["md5", "sha1", "des", "rc4", "crc32"]);

export function isWeakCryptoFunction(functionName: string): boolean {
  return WEAK_CRYPTO_FUNCTIONS.has(functionName.toLowerCase());
}

const SQL_FUNCTIONS = new Set(["query", "execute", "raw", "sql", "exec"]);

export function isSqlFunction(functionName: string): boolean {
  return SQL_FUNCTIONS.has(functionName.toLowerCase());
}

export function hasStringConcatenation(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some(
    (arg) =>
      arg.type === AST_NODE_TYPES.BinaryExpression &&
      arg.operator === "+" &&
      (arg.left.type === AST_NODE_TYPES.Literal ||
        arg.right.type === AST_NODE_TYPES.Literal)
  );
}

const CONSOLE_METHODS = new Set(["log", "info", "warn", "error", "debug"]);

export function isLoggingFunction(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const object = node.callee.object;
  const property = node.callee.property;
  return (
    object.type === AST_NODE_TYPES.Identifier &&
    object.name === "console" &&
    property.type === AST_NODE_TYPES.Identifier &&
    CONSOLE_METHODS.has(property.name)
  );
}

const SECRET_SUBSTRINGS: readonly string[] = [
  "secret",
  "key",
  "token",
  "password",
];

export function hasSecretInArguments(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some((arg) => {
    if (arg.type !== AST_NODE_TYPES.Identifier) {
      return false;
    }
    const varName = arg.name.toLowerCase();
    for (const sub of SECRET_SUBSTRINGS) {
      if (varName.includes(sub)) {
        return true;
      }
    }
    return false;
  });
}

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

const PROTECTED_ROUTE_PATTERNS: readonly string[] = [
  "/admin/",
  "/dashboard/",
  "/profile/",
  "/settings/",
  "/account/",
  "/user/",
  "/private/",
  "/protected/",
];

export function isProtectedRoute(filename: string): boolean {
  for (const pattern of PROTECTED_ROUTE_PATTERNS) {
    if (filename.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function bodyContainsKeywords(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string },
  keywords: readonly string[]
): boolean {
  const bodyText = sourceCode.getText(node.body);
  for (const keyword of keywords) {
    if (bodyText.includes(keyword)) {
      return true;
    }
  }
  return false;
}

const AUTH_KEYWORDS = ["auth", "verify", "authenticate", "authorize"] as const;

export function hasAuthValidation(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  return bodyContainsKeywords(node, sourceCode, AUTH_KEYWORDS);
}

const RATE_LIMIT_KEYWORDS = ["rateLimit", "throttle", "limit"] as const;

export function hasRateLimit(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  return bodyContainsKeywords(node, sourceCode, RATE_LIMIT_KEYWORDS);
}

const API_KEY_PATTERNS: readonly RegExp[] = [
  /^sk_/, // Stripe
  /^pk_/, // Public keys
  /^AIza/, // Google API keys
  /^ya29/, // Google OAuth tokens
  /^ghp_/, // GitHub tokens
  /^xoxb/, // Slack tokens
  /^[0-9a-f]{32}$/, // 32 character hex
  /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded
];

export function isApiKeyOrSecret(value: string): boolean {
  for (const pattern of API_KEY_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}
