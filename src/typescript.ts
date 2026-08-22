// TypeScript-specific rules plugin
import { prefixRules } from "./config-utils";
import enforceApiPatterns from "./rules/typescript/enforce-api-patterns";
import enforceAssertionPolicies from "./rules/typescript/enforce-assertion-policies";
import enforceDocumentation from "./rules/typescript/enforce-documentation";
import enforceTypeNaming from "./rules/typescript/enforce-type-naming";
import enforceTypescriptPatterns from "./rules/typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./rules/typescript/enforce-zod-schema-naming";
import noComplexTypeGymnastics from "./rules/typescript/no-complex-type-gymnastics";
import noEmptyFunctionImplementations from "./rules/typescript/no-empty-function-implementations";
import noUndocumentedUnknown from "./rules/typescript/no-undocumented-unknown";
import noUnsafeTypeAssertion from "./rules/typescript/no-unsafe-type-assertion";

// Rule severity maps -- single source of truth for both legacy and flat configs
// "enforce-typescript-patterns" is deliberately absent: the aggregate rule
// is deprecated in favour of the focused rules below, stays registered in
// `typescriptRules` for explicit opt-in during the deprecation window, and
// will be removed in the next major release.
export const TYPESCRIPT_RECOMMENDED_SEVERITIES = {
  "enforce-assertion-policies": "warn",
  "enforce-type-naming": "warn",
  "enforce-zod-schema-naming": "warn",
  "no-undocumented-unknown": "warn",
  "no-complex-type-gymnastics": "warn",
  "no-empty-function-implementations": "warn",
  "no-unsafe-type-assertion": "warn",
} as const;

export const TYPESCRIPT_STRICT_SEVERITIES = {
  ...TYPESCRIPT_RECOMMENDED_SEVERITIES,
  "enforce-api-patterns": "error",
  "enforce-assertion-policies": "error",
  "enforce-documentation": "warn",
  "enforce-type-naming": "error",
  "enforce-zod-schema-naming": "error",
  "no-undocumented-unknown": "error",
  "no-complex-type-gymnastics": "error",
  "no-empty-function-implementations": "error",
} as const;

export const typescriptRules = {
  "enforce-api-patterns": enforceApiPatterns,
  "enforce-assertion-policies": enforceAssertionPolicies,
  "enforce-documentation": enforceDocumentation,
  "enforce-type-naming": enforceTypeNaming,
  "no-undocumented-unknown": noUndocumentedUnknown,
  "enforce-typescript-patterns": enforceTypescriptPatterns,
  "enforce-zod-schema-naming": enforceZodSchemaNaming,
  "no-complex-type-gymnastics": noComplexTypeGymnastics,
  "no-empty-function-implementations": noEmptyFunctionImplementations,
  "no-unsafe-type-assertion": noUnsafeTypeAssertion,
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
