import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  _hasUnsanitizedInput,
  _isRiskyTemplateContext,
  hasAuthValidation,
  hasDangerousTemplateUsage,
  hasRateLimit,
  hasSecretInArguments,
  hasStringConcatenation,
  hasZodImport,
  isApiKeyOrSecret,
  isHardcodedSecret,
  isLoggingFunction,
  isProtectedRoute,
  isSqlFunction,
  isWeakCryptoFunction,
} from "./security-utils";

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
    const filename = context.filename;
    const isClientFile =
      filename.includes("components/") || filename.includes("pages/");
    const isApiFile = filename.includes("/api/");

    // If file contains Zod, skip template literal security checks entirely
    const sourceCode = context.sourceCode;
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
          if (
            isProtectedRoute(filename) &&
            !hasAuthValidation(node, sourceCode)
          ) {
            context.report({
              node,
              messageId: "requireAuthValidation",
            });
          }

          // Check for missing rate limiting in public routes
          if (isPublicApiRoute(filename) && !hasRateLimit(node, sourceCode)) {
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

function isUnsafeRedirectFunction(functionName: string): boolean {
  const redirectFunctions = [
    "redirect",
    "permanentRedirect",
    "replace",
    "push",
  ];

  return redirectFunctions.includes(functionName);
}

function isPublicApiRoute(filename: string): boolean {
  return filename.includes("/api/") && !isProtectedRoute(filename);
}
