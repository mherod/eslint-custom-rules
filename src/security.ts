// Security-specific rules plugin
import { buildCategoryPlugin } from "./config-utils";
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

// Canonical manifest: one entry per rule holding identity + preset policy.
// "enforce-security-patterns" carries no preset severity: the deprecated
// aggregate stays registered for explicit opt-in during its deprecation
// window and will be removed in the next major release.
export const SECURITY_MANIFEST = {
  "enforce-security-patterns": { rule: enforceSecurityPatterns },
  "no-hardcoded-secrets": { recommended: "error", rule: noHardcodedSecrets },
  "no-log-secrets": { recommended: "error", rule: noLogSecrets },
  "no-sql-injection": { recommended: "error", rule: noSqlInjection },
  "no-unsafe-eval": { recommended: "error", rule: noUnsafeEval },
  "no-unsafe-innerHTML": { recommended: "error", rule: noUnsafeInnerHTML },
  "no-unsafe-redirect": { recommended: "error", rule: noUnsafeRedirect },
  "no-unsafe-template-literals": {
    recommended: "warn",
    rule: noUnsafeTemplateLiterals,
    strict: "error",
  },
  "no-unstable-math-random": {
    recommended: "warn",
    rule: noUnstableMathRandom,
    strict: "error",
  },
  "no-weak-crypto": { recommended: "error", rule: noWeakCrypto },
  "require-auth-validation": {
    recommended: "error",
    rule: requireAuthValidation,
  },
  "require-rate-limiting": {
    recommended: "warn",
    rule: requireRateLimiting,
    strict: "error",
  },
} as const;

const assembly = buildCategoryPlugin("@mherod/security", SECURITY_MANIFEST);

export const SECURITY_RECOMMENDED_SEVERITIES = assembly.recommendedSeverities;
export const SECURITY_STRICT_SEVERITIES = assembly.strictSeverities;
export const securityRules = assembly.rules;
export const securityPlugin = assembly.plugin;
export const securityConfigs = assembly.configs;

export default securityPlugin;
