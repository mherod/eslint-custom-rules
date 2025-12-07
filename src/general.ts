// General/shared rules plugin
import enforceFileNaming from "./rules/general/enforce-file-naming";
import enforceImportOrder from "./rules/general/enforce-import-order";
import preferDateFns from "./rules/general/prefer-date-fns";
import preferDateFnsOverDateOperations from "./rules/general/prefer-date-fns-over-date-operations";
import preferLodashEsImports from "./rules/general/prefer-lodash-es-imports";
import preferLodashUniqOverSet from "./rules/general/prefer-lodash-uniq-over-set";
import preferUfoWithQuery from "./rules/general/prefer-ufo-with-query";

export const generalRules = {
  "enforce-file-naming": enforceFileNaming,
  "enforce-import-order": enforceImportOrder,
  "prefer-date-fns-over-date-operations": preferDateFnsOverDateOperations,
  "prefer-date-fns": preferDateFns,
  "prefer-lodash-es-imports": preferLodashEsImports,
  "prefer-lodash-uniq-over-set": preferLodashUniqOverSet,
  "prefer-ufo-with-query": preferUfoWithQuery,
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
