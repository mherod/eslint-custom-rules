// Security-specific rules plugin
import enforceSecurityPatterns from "./rules/security/enforce-security-patterns";

export const securityRules = {
  "enforce-security-patterns": enforceSecurityPatterns,
};

export const securityPlugin = {
  rules: securityRules,
  configs: {
    recommended: {
      plugins: ["@mherod/security"],
      rules: {
        "@mherod/security/enforce-security-patterns": "error",
      },
    },
    strict: {
      plugins: ["@mherod/security"],
      rules: {
        "@mherod/security/enforce-security-patterns": "error",
      },
    },
  },
};

// Support for flat config
export const securityConfigs = {
  recommended: {
    plugins: {
      "@mherod/security": securityPlugin,
    },
    rules: {
      "@mherod/security/enforce-security-patterns": "error",
      "@mherod/security/no-unstable-math-random": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/security": securityPlugin,
    },
    rules: {
      "@mherod/security/enforce-security-patterns": "error",
      "@mherod/security/no-unstable-math-random": "error",
    },
  },
};

export default securityPlugin;
