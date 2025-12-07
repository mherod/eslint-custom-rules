// TypeScript-specific rules plugin
import enforceApiPatterns from "./rules/typescript/enforce-api-patterns";
import enforceDocumentation from "./rules/typescript/enforce-documentation";
import enforceTypescriptPatterns from "./rules/typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./rules/typescript/enforce-zod-schema-naming";
import noEmptyFunctionImplementations from "./rules/typescript/no-empty-function-implementations";

export const typescriptRules = {
  "enforce-api-patterns": enforceApiPatterns,
  "enforce-documentation": enforceDocumentation,
  "enforce-typescript-patterns": enforceTypescriptPatterns,
  "enforce-zod-schema-naming": enforceZodSchemaNaming,
  "no-empty-function-implementations": noEmptyFunctionImplementations,
};

export const typescriptPlugin = {
  rules: typescriptRules,
  configs: {
    recommended: {
      plugins: ["@mherod/typescript"],
      rules: {
        "@mherod/typescript/enforce-typescript-patterns": "warn",
        "@mherod/typescript/enforce-zod-schema-naming": "warn",
        "@mherod/typescript/no-empty-function-implementations": "warn",
      },
    },
    strict: {
      plugins: ["@mherod/typescript"],
      rules: {
        "@mherod/typescript/enforce-api-patterns": "error",
        "@mherod/typescript/enforce-documentation": "warn",
        "@mherod/typescript/enforce-typescript-patterns": "error",
        "@mherod/typescript/enforce-zod-schema-naming": "error",
        "@mherod/typescript/no-empty-function-implementations": "error",
      },
    },
  },
};

// Support for flat config
export const typescriptConfigs = {
  recommended: {
    plugins: {
      "@mherod/typescript": typescriptPlugin,
    },
    rules: {
      "@mherod/typescript/enforce-typescript-patterns": "warn",
      "@mherod/typescript/enforce-zod-schema-naming": "warn",
      "@mherod/typescript/no-empty-function-implementations": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/typescript": typescriptPlugin,
    },
    rules: {
      "@mherod/typescript/enforce-api-patterns": "error",
      "@mherod/typescript/enforce-documentation": "warn",
      "@mherod/typescript/enforce-typescript-patterns": "error",
      "@mherod/typescript/enforce-zod-schema-naming": "error",
      "@mherod/typescript/no-empty-function-implementations": "error",
    },
  },
};

export default typescriptPlugin;
