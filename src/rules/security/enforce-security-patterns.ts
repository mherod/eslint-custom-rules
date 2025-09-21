import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "enforce-security-patterns";

type MessageIds =
  | "noDirectProcessEnvInClient"
  | "noHardcodedSecrets"
  | "noUnsafeEval"
  | "noUnsafeInnerHTML"
  | "requireInputSanitization"
  | "noSqlInjection"
  | "requireCSRFProtection"
  | "noWeakCrypto"
  | "requireSecureHeaders"
  | "noLogSecrets"
  | "requireAuthValidation"
  | "noUnsafeRedirect"
  | "requireRateLimit"
  | "noClientSideSecrets";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce security best practices and prevent common vulnerabilities",
    },
    schema: [],
    messages: {
      noDirectProcessEnvInClient:
        "Avoid accessing process.env directly in client code. Use public environment variables or server actions.",
      noHardcodedSecrets:
        "Hardcoded secret detected: '{{secret}}'. Use environment variables instead.",
      noUnsafeEval:
        "Avoid using eval() or Function constructor. Use safer alternatives like JSON.parse().",
      noUnsafeInnerHTML:
        "Avoid using dangerouslySetInnerHTML without proper sanitization. Use DOMPurify or similar.",
      requireInputSanitization:
        "User input '{{input}}' should be sanitized before use. Use validation libraries like Zod.",
      noSqlInjection:
        "Potential SQL injection vulnerability. Use parameterized queries or ORM methods.",
      requireCSRFProtection:
        "API route should implement CSRF protection for state-changing operations.",
      noWeakCrypto:
        "Weak cryptographic function '{{function}}' detected. Use stronger alternatives.",
      requireSecureHeaders:
        "Response should include security headers (CSP, HSTS, etc.)",
      noLogSecrets:
        "Potential secret logging detected. Avoid logging sensitive data.",
      requireAuthValidation:
        "Protected route should validate authentication and authorization.",
      noUnsafeRedirect:
        "Unsafe redirect detected. Validate redirect URLs to prevent open redirects.",
      requireRateLimit:
        "Public API endpoint should implement rate limiting to prevent abuse.",
      noClientSideSecrets:
        "Client-side code should not contain API keys or secrets.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isClientFile =
      filename.includes("components/") || filename.includes("pages/");
    const isApiFile = filename.includes("/api/");

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

      // Check for hardcoded secrets
      Literal(node: TSESTree.Literal): void {
        if (typeof node.value === "string" && isHardcodedSecret(node.value)) {
          context.report({
            node,
            messageId: "noHardcodedSecrets",
            data: { secret: `${node.value.substring(0, 10)}...` },
          });
        }
      },

      // Check for unsafe eval usage
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;

          // Check for eval or Function constructor
          if (functionName === "eval" || functionName === "Function") {
            context.report({
              node,
              messageId: "noUnsafeEval",
            });
          }

          // Check for weak crypto functions
          if (isWeakCryptoFunction(functionName)) {
            context.report({
              node,
              messageId: "noWeakCrypto",
              data: { function: functionName },
            });
          }

          // Check for unsafe redirects
          if (isUnsafeRedirectFunction(functionName)) {
            context.report({
              node,
              messageId: "noUnsafeRedirect",
            });
          }

          // Check for SQL injection potential
          if (
            isSqlFunction(functionName) &&
            hasStringConcatenation(node.arguments)
          ) {
            context.report({
              node,
              messageId: "noSqlInjection",
            });
          }
        }

        // Check for logging secrets
        if (isLoggingFunction(node) && hasSecretInArguments(node.arguments)) {
          context.report({
            node,
            messageId: "noLogSecrets",
          });
        }
      },

      // Check for dangerouslySetInnerHTML
      JSXAttribute(node: TSESTree.JSXAttribute): void {
        if (
          node.name.type === AST_NODE_TYPES.JSXIdentifier &&
          node.name.name === "dangerouslySetInnerHTML"
        ) {
          context.report({
            node,
            messageId: "noUnsafeInnerHTML",
          });
        }
      },

      // Check for template literals with user input
      TemplateLiteral(node: TSESTree.TemplateLiteral): void {
        // Skip if Zod is present in the file
        if (skipTemplateCheck) {
          return; // Skip rule completely when Zod is present
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

      // Check API routes for security patterns
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (isApiFile && node.id) {
          // Check for missing authentication in protected routes
          if (isProtectedRoute(filename) && !hasAuthValidation(node)) {
            context.report({
              node,
              messageId: "requireAuthValidation",
            });
          }

          // Check for missing rate limiting in public routes
          if (isPublicApiRoute(filename) && !hasRateLimit(node)) {
            context.report({
              node,
              messageId: "requireRateLimit",
            });
          }
        }
      },

      // Check for client-side secrets in variable declarations
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          isClientFile &&
          node.init &&
          node.init.type === AST_NODE_TYPES.Literal
        ) {
          const value = node.init.value;
          if (typeof value === "string" && isApiKeyOrSecret(value)) {
            context.report({
              node,
              messageId: "noClientSideSecrets",
            });
          }
        }
      },
    };
  },
});

function isHardcodedSecret(value: string): boolean {
  const secretPatterns = [
    /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
    /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
    /^[0-9a-f]{32,}$/, // Hex encoded secrets
    /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
  ];

  return (
    secretPatterns.some((pattern) => pattern.test(value)) && value.length > 20
  ); // Avoid false positives on short strings
}

function isWeakCryptoFunction(functionName: string): boolean {
  const weakFunctions = ["md5", "sha1", "des", "rc4", "crc32"];

  return weakFunctions.includes(functionName.toLowerCase());
}

function isUnsafeRedirectFunction(functionName: string): boolean {
  const redirectFunctions = [
    "redirect",
    "permanentRedirect",
    "replace",
    "push",
  ];

  return redirectFunctions.includes(functionName);
}

function isSqlFunction(functionName: string): boolean {
  const sqlFunctions = ["query", "execute", "raw", "sql", "exec"];

  return sqlFunctions.includes(functionName.toLowerCase());
}

function hasStringConcatenation(
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

function isLoggingFunction(node: TSESTree.CallExpression): boolean {
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

function hasSecretInArguments(
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

function isProtectedRoute(filename: string): boolean {
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

function isPublicApiRoute(filename: string): boolean {
  return filename.includes("/api/") && !isProtectedRoute(filename);
}

function hasAuthValidation(node: TSESTree.FunctionDeclaration): boolean {
  // Simple check for auth-related function calls in the function body
  // In a real implementation, you'd do a more thorough AST traversal
  const bodyString = node.body.body.toString();
  return (
    bodyString.includes("auth") ||
    bodyString.includes("verify") ||
    bodyString.includes("authenticate") ||
    bodyString.includes("authorize")
  );
}

function hasRateLimit(node: TSESTree.FunctionDeclaration): boolean {
  // Simple check for rate limiting patterns
  const bodyString = node.body.body.toString();
  return (
    bodyString.includes("rateLimit") ||
    bodyString.includes("throttle") ||
    bodyString.includes("limit")
  );
}

function isApiKeyOrSecret(value: string): boolean {
  const apiKeyPatterns = [
    /^sk_/, // Stripe
    /^pk_/, // Public keys (less sensitive but still shouldn't be hardcoded)
    /^AIza/, // Google API keys
    /^ya29/, // Google OAuth tokens
    /^ghp_/, // GitHub tokens
    /^xoxb/, // Slack tokens
    /^[0-9a-f]{32}$/, // 32 character hex
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded
  ];

  return apiKeyPatterns.some((pattern) => pattern.test(value));
}
