// Security-specific rules plugin
import { prefixRules } from "./config-utils";
import enforceSecurityPatterns from "./rules/security/enforce-security-patterns";
import noHardcodedSecrets from "./rules/security/no-hardcoded-secrets";
import noLogSecrets from "./rules/security/no-log-secrets";
import noSqlInjection from "./rules/security/no-sql-injection";
import noUnsafeEval from "./rules/security/no-unsafe-eval";
import noUnsafeInnerHTML from "./rules/security/no-unsafe-inner-html";
import noUnsafeRedirect from "./rules/security/no-unsafe-redirect";
import noUnsafeTemplateLiterals from "./rules/security/no-unsafe-template-literals";
import noWeakCrypto from "./rules/security/no-weak-crypto";
import requireAuthValidation from "./rules/security/require-auth-validation";
import requireRateLimiting from "./rules/security/require-rate-limiting";
import noUnstableMathRandom from "./rules/shared/no-unstable-math-random";

// Rule severity maps -- single source of truth for both legacy and flat configs
export const SECURITY_RECOMMENDED_SEVERITIES = {
  "enforce-security-patterns": "error",
  "no-hardcoded-secrets": "error",
  "no-log-secrets": "error",
  "no-sql-injection": "error",
  "no-unsafe-eval": "error",
  "no-unsafe-innerHTML": "error",
  "no-unsafe-redirect": "error",
  "no-unsafe-template-literals": "warn",
  "no-unstable-math-random": "warn",
  "no-weak-crypto": "error",
  "require-auth-validation": "error",
  "require-rate-limiting": "warn",
} as const;

export const SECURITY_STRICT_SEVERITIES = {
  ...SECURITY_RECOMMENDED_SEVERITIES,
  "no-unsafe-template-literals": "error",
  "no-unstable-math-random": "error",
  "require-rate-limiting": "error",
} as const;

export const securityRules = {
  "enforce-security-patterns": enforceSecurityPatterns,
  "no-hardcoded-secrets": noHardcodedSecrets,
  "no-log-secrets": noLogSecrets,
  "no-sql-injection": noSqlInjection,
  "no-unsafe-eval": noUnsafeEval,
  "no-unsafe-innerHTML": noUnsafeInnerHTML,
  "no-unsafe-redirect": noUnsafeRedirect,
  "no-unsafe-template-literals": noUnsafeTemplateLiterals,
  "no-unstable-math-random": noUnstableMathRandom,
  "no-weak-crypto": noWeakCrypto,
  "require-auth-validation": requireAuthValidation,
  "require-rate-limiting": requireRateLimiting,
};

const SECURITY_PREFIX = "@mherod/security";

export const securityPlugin = {
  rules: securityRules,
  configs: {
    recommended: {
      plugins: [SECURITY_PREFIX],
      rules: prefixRules(SECURITY_RECOMMENDED_SEVERITIES, SECURITY_PREFIX),
    },
    strict: {
      plugins: [SECURITY_PREFIX],
      rules: prefixRules(SECURITY_STRICT_SEVERITIES, SECURITY_PREFIX),
    },
  },
};

// Support for flat config
export const securityConfigs = {
  recommended: {
    plugins: { [SECURITY_PREFIX]: securityPlugin },
    rules: prefixRules(SECURITY_RECOMMENDED_SEVERITIES, SECURITY_PREFIX),
  },
  strict: {
    plugins: { [SECURITY_PREFIX]: securityPlugin },
    rules: prefixRules(SECURITY_STRICT_SEVERITIES, SECURITY_PREFIX),
  },
};

export default securityPlugin;
