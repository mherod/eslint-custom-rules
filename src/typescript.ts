// TypeScript-specific rules plugin
import { prefixRules } from "./config-utils";
import enforceApiPatterns from "./rules/typescript/enforce-api-patterns";
import enforceDocumentation from "./rules/typescript/enforce-documentation";
import enforceTypescriptPatterns from "./rules/typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./rules/typescript/enforce-zod-schema-naming";
import noEmptyFunctionImplementations from "./rules/typescript/no-empty-function-implementations";

// Rule severity maps -- single source of truth for both legacy and flat configs
export const TYPESCRIPT_RECOMMENDED_SEVERITIES = {
  "enforce-typescript-patterns": "warn",
  "enforce-zod-schema-naming": "warn",
  "no-empty-function-implementations": "warn",
} as const;

export const TYPESCRIPT_STRICT_SEVERITIES = {
  ...TYPESCRIPT_RECOMMENDED_SEVERITIES,
  "enforce-api-patterns": "error",
  "enforce-documentation": "warn",
  "enforce-typescript-patterns": "error",
  "enforce-zod-schema-naming": "error",
  "no-empty-function-implementations": "error",
} as const;

export const typescriptRules = {
  "enforce-api-patterns": enforceApiPatterns,
  "enforce-documentation": enforceDocumentation,
  "enforce-typescript-patterns": enforceTypescriptPatterns,
  "enforce-zod-schema-naming": enforceZodSchemaNaming,
  "no-empty-function-implementations": noEmptyFunctionImplementations,
};

const TYPESCRIPT_PREFIX = "@mherod/typescript";

export const typescriptPlugin = {
  rules: typescriptRules,
  configs: {
    recommended: {
      plugins: [TYPESCRIPT_PREFIX],
      rules: prefixRules(TYPESCRIPT_RECOMMENDED_SEVERITIES, TYPESCRIPT_PREFIX),
    },
    strict: {
      plugins: [TYPESCRIPT_PREFIX],
      rules: prefixRules(TYPESCRIPT_STRICT_SEVERITIES, TYPESCRIPT_PREFIX),
    },
  },
};

// Support for flat config
export const typescriptConfigs = {
  recommended: {
    plugins: { [TYPESCRIPT_PREFIX]: typescriptPlugin },
    rules: prefixRules(TYPESCRIPT_RECOMMENDED_SEVERITIES, TYPESCRIPT_PREFIX),
  },
  strict: {
    plugins: { [TYPESCRIPT_PREFIX]: typescriptPlugin },
    rules: prefixRules(TYPESCRIPT_STRICT_SEVERITIES, TYPESCRIPT_PREFIX),
  },
};

export default typescriptPlugin;
