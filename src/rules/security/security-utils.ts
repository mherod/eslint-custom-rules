import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

export function isHardcodedSecret(value: string): boolean {
  const secretPatterns = [
    /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
    /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
    /^[0-9a-f]{32,}$/, // Hex encoded secrets
    /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
  ];

  return (
    secretPatterns.some((pattern) => pattern.test(value)) && value.length > 20
  );
}

export function isWeakCryptoFunction(functionName: string): boolean {
  const weakFunctions = ["md5", "sha1", "des", "rc4", "crc32"];

  return weakFunctions.includes(functionName.toLowerCase());
}

export function isSqlFunction(functionName: string): boolean {
  const sqlFunctions = ["query", "execute", "raw", "sql", "exec"];

  return sqlFunctions.includes(functionName.toLowerCase());
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

export function isLoggingFunction(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    const object = node.callee.object;
    const property = node.callee.property;

    if (
      object.type === AST_NODE_TYPES.Identifier &&
      object.name === "console" &&
      property.type === AST_NODE_TYPES.Identifier
    ) {
      return ["log", "info", "warn", "error", "debug"].includes(property.name);
    }
  }

  return false;
}

export function hasSecretInArguments(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some((arg) => {
    if (arg.type === AST_NODE_TYPES.Identifier) {
      const varName = arg.name.toLowerCase();
      return (
        varName.includes("secret") ||
        varName.includes("key") ||
        varName.includes("token") ||
        varName.includes("password")
      );
    }
    return false;
  });
}

export function isDangerousVariableName(varName: string): boolean {
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

export function isSafeVariable(varName: string): boolean {
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

  if (safeNames.includes(varName)) {
    return true;
  }

  const safePrefixes = ["safe", "validated", "sanitized", "clean", "parsed"];
  if (safePrefixes.some((prefix) => varName.startsWith(prefix))) {
    return true;
  }

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

export function isObviouslyDangerousVariable(varName: string): boolean {
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

export function isDirectRequestAccess(
  expr: TSESTree.MemberExpression
): boolean {
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
        ["log", "info", "warn", "error", "debug"].includes(prop.name)
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

export function isDangerousContext(node: TSESTree.Node): boolean {
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier
    ) {
      const functionName = current.callee.name.toLowerCase();
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

export function hasZodImport(sourceCode: { text: string }): boolean {
  const fileText = sourceCode.text;

  const zodPatterns = [/from\s*["']zod["']/i, /import.*zod/i, /zod/i];

  return zodPatterns.some((pattern) => pattern.test(fileText));
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

export function isProtectedRoute(filename: string): boolean {
  const protectedPatterns = [
    "/admin/",
    "/dashboard/",
    "/profile/",
    "/settings/",
    "/account/",
    "/user/",
    "/private/",
    "/protected/",
  ];

  return protectedPatterns.some((pattern) => filename.includes(pattern));
}

export function hasAuthValidation(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  const bodyText = sourceCode.getText(node.body);
  return (
    bodyText.includes("auth") ||
    bodyText.includes("verify") ||
    bodyText.includes("authenticate") ||
    bodyText.includes("authorize")
  );
}

export function hasRateLimit(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  const bodyText = sourceCode.getText(node.body);
  return (
    bodyText.includes("rateLimit") ||
    bodyText.includes("throttle") ||
    bodyText.includes("limit")
  );
}

export function isApiKeyOrSecret(value: string): boolean {
  const apiKeyPatterns = [
    /^sk_/, // Stripe
    /^pk_/, // Public keys
    /^AIza/, // Google API keys
    /^ya29/, // Google OAuth tokens
    /^ghp_/, // GitHub tokens
    /^xoxb/, // Slack tokens
    /^[0-9a-f]{32}$/, // 32 character hex
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded
  ];

  return apiKeyPatterns.some((pattern) => pattern.test(value));
}
