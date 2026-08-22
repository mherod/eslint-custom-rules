// TypeScript-specific rules plugin
import { buildCategoryPlugin } from "./config-utils";
import enforceApiPatterns from "./rules/typescript/enforce-api-patterns";
import enforceAssertionPolicies from "./rules/typescript/enforce-assertion-policies";
import enforceDocumentation from "./rules/typescript/enforce-documentation";
import enforceRouteShape from "./rules/typescript/enforce-route-shape";
import enforceTypeNaming from "./rules/typescript/enforce-type-naming";
import enforceTypescriptPatterns from "./rules/typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./rules/typescript/enforce-zod-schema-naming";
import noComplexTypeGymnastics from "./rules/typescript/no-complex-type-gymnastics";
import noDirectDbInRoute from "./rules/typescript/no-direct-db-in-route";
import noEmptyFunctionImplementations from "./rules/typescript/no-empty-function-implementations";
import noUndocumentedUnknown from "./rules/typescript/no-undocumented-unknown";
import noUnsafeTypeAssertion from "./rules/typescript/no-unsafe-type-assertion";
import requireRouteAuth from "./rules/typescript/require-route-auth";
import requireRouteValidation from "./rules/typescript/require-route-validation";

// Canonical manifest: one entry per rule holding identity + preset policy.
// "enforce-typescript-patterns" and "enforce-api-patterns" carry no preset
// severity: the deprecated aggregates stay registered for explicit opt-in
// during their deprecation window and will be removed in the next major
// release.
export const TYPESCRIPT_MANIFEST = {
  "enforce-api-patterns": { rule: enforceApiPatterns },
  "enforce-assertion-policies": {
    recommended: "warn",
    rule: enforceAssertionPolicies,
    strict: "error",
  },
  "enforce-documentation": { rule: enforceDocumentation, strict: "warn" },
  "enforce-route-shape": { rule: enforceRouteShape, strict: "error" },
  "enforce-type-naming": {
    recommended: "warn",
    rule: enforceTypeNaming,
    strict: "error",
  },
  "enforce-typescript-patterns": { rule: enforceTypescriptPatterns },
  "enforce-zod-schema-naming": {
    recommended: "warn",
    rule: enforceZodSchemaNaming,
    strict: "error",
  },
  "no-complex-type-gymnastics": {
    recommended: "warn",
    rule: noComplexTypeGymnastics,
    strict: "error",
  },
  "no-direct-db-in-route": { rule: noDirectDbInRoute, strict: "error" },
  "no-empty-function-implementations": {
    recommended: "warn",
    rule: noEmptyFunctionImplementations,
    strict: "error",
  },
  "no-undocumented-unknown": {
    recommended: "warn",
    rule: noUndocumentedUnknown,
    strict: "error",
  },
  "no-unsafe-type-assertion": {
    recommended: "warn",
    rule: noUnsafeTypeAssertion,
  },
  "require-route-auth": { rule: requireRouteAuth, strict: "error" },
  "require-route-validation": {
    rule: requireRouteValidation,
    strict: "error",
  },
} as const;

const assembly = buildCategoryPlugin("@mherod/typescript", TYPESCRIPT_MANIFEST);

export const TYPESCRIPT_RECOMMENDED_SEVERITIES = assembly.recommendedSeverities;
export const TYPESCRIPT_STRICT_SEVERITIES = assembly.strictSeverities;
export const typescriptRules = assembly.rules;
export const typescriptPlugin = assembly.plugin;
export const typescriptConfigs = assembly.configs;

export default typescriptPlugin;
