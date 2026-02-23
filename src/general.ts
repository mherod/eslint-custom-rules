// General/shared rules plugin
import enforceFileNaming from "./rules/general/enforce-file-naming";
import enforceImportOrder from "./rules/general/enforce-import-order";
import noDebugComments from "./rules/general/no-debug-comments";
import noDeprecatedDeclarations from "./rules/general/no-deprecated-declarations";
import noImportTypeQueries from "./rules/general/no-import-type-queries";
import noLongRelativeImports from "./rules/general/no-long-relative-imports";
import preferDateFns from "./rules/general/prefer-date-fns";
import preferDateFnsOverDateOperations from "./rules/general/prefer-date-fns-over-date-operations";
import preferDirectImports from "./rules/general/prefer-direct-imports";
import preferLodashEsImports from "./rules/general/prefer-lodash-es-imports";
import preferLodashUniqOverSet from "./rules/general/prefer-lodash-uniq-over-set";
import preferUfoWithQuery from "./rules/general/prefer-ufo-with-query";
import preferZodDefaultWithCatch from "./rules/general/prefer-zod-default-with-catch";
import preferZodUrl from "./rules/general/prefer-zod-url";

export const generalRules = {
  "enforce-file-naming": enforceFileNaming,
  "enforce-import-order": enforceImportOrder,
  "no-debug-comments": noDebugComments,
  "no-deprecated-declarations": noDeprecatedDeclarations,
  "no-import-type-queries": noImportTypeQueries,
  "no-long-relative-imports": noLongRelativeImports,
  "prefer-date-fns-over-date-operations": preferDateFnsOverDateOperations,
  "prefer-date-fns": preferDateFns,
  "prefer-direct-imports": preferDirectImports,
  "prefer-lodash-es-imports": preferLodashEsImports,
  "prefer-lodash-uniq-over-set": preferLodashUniqOverSet,
  "prefer-ufo-with-query": preferUfoWithQuery,
  "prefer-zod-default-with-catch": preferZodDefaultWithCatch,
  "prefer-zod-url": preferZodUrl,
};

export const generalPlugin = {
  rules: generalRules,
  configs: {
    recommended: {
      plugins: ["@mherod/general"],
      rules: {
        "@mherod/general/enforce-import-order": "warn",
        "@mherod/general/enforce-file-naming": "warn",
        "@mherod/general/prefer-date-fns-over-date-operations": "warn",
        "@mherod/general/prefer-date-fns": "warn",
        "@mherod/general/prefer-lodash-es-imports": "error",
        "@mherod/general/prefer-lodash-uniq-over-set": "warn",
        "@mherod/general/prefer-ufo-with-query": "warn",
      },
    },
    strict: {
      plugins: ["@mherod/general"],
      rules: {
        "@mherod/general/enforce-file-naming": "error",
        "@mherod/general/enforce-import-order": "error",
        "@mherod/general/prefer-date-fns-over-date-operations": "warn",
        "@mherod/general/prefer-date-fns": "error",
        "@mherod/general/prefer-lodash-es-imports": "error",
        "@mherod/general/prefer-lodash-uniq-over-set": "error",
        "@mherod/general/prefer-ufo-with-query": "error",
      },
    },
  },
};

// Support for flat config
export const generalConfigs = {
  recommended: {
    plugins: {
      "@mherod/general": generalPlugin,
    },
    rules: {
      "@mherod/general/enforce-import-order": "warn",
      "@mherod/general/enforce-file-naming": "warn",
      "@mherod/general/prefer-date-fns-over-date-operations": "warn",
      "@mherod/general/prefer-date-fns": "warn",
      "@mherod/general/prefer-lodash-es-imports": "error",
      "@mherod/general/prefer-lodash-uniq-over-set": "warn",
      "@mherod/general/prefer-ufo-with-query": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/general": generalPlugin,
    },
    rules: {
      "@mherod/general/enforce-file-naming": "error",
      "@mherod/general/enforce-import-order": "error",
      "@mherod/general/prefer-date-fns-over-date-operations": "warn",
      "@mherod/general/prefer-date-fns": "error",
      "@mherod/general/prefer-lodash-es-imports": "error",
      "@mherod/general/prefer-lodash-uniq-over-set": "error",
      "@mherod/general/prefer-ufo-with-query": "error",
    },
  },
};

export default generalPlugin;
