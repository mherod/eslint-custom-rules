// General/shared rules plugin
import { prefixRules } from "./config-utils";
import enforceFileNaming from "./rules/general/enforce-file-naming";
import enforceImportOrder from "./rules/general/enforce-import-order";
import noBarrelFileImports from "./rules/general/no-barrel-file-imports";
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

// Rule severity maps -- single source of truth for both legacy and flat configs
export const GENERAL_RECOMMENDED_SEVERITIES = {
  "enforce-file-naming": "warn",
  "enforce-import-order": "warn",
  "no-barrel-file-imports": "warn",
  "no-debug-comments": "warn",
  "no-deprecated-declarations": "warn",
  "no-long-relative-imports": "warn",
  "prefer-date-fns": "warn",
  "prefer-date-fns-over-date-operations": "warn",
  "prefer-direct-imports": "warn",
  "prefer-lodash-es-imports": "error",
  "prefer-lodash-uniq-over-set": "warn",
  "prefer-ufo-with-query": "warn",
  "prefer-zod-default-with-catch": "warn",
  "prefer-zod-url": "warn",
} as const;

export const GENERAL_STRICT_SEVERITIES = {
  ...GENERAL_RECOMMENDED_SEVERITIES,
  "enforce-file-naming": "error",
  "enforce-import-order": "error",
  "no-import-type-queries": "warn",
  "prefer-date-fns": "error",
  "prefer-lodash-uniq-over-set": "error",
  "prefer-ufo-with-query": "error",
} as const;

export const generalRules = {
  "enforce-file-naming": enforceFileNaming,
  "no-barrel-file-imports": noBarrelFileImports,
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

const GENERAL_PREFIX = "@mherod/general";

export const generalPlugin = {
  rules: generalRules,
  configs: {
    recommended: {
      plugins: [GENERAL_PREFIX],
      rules: prefixRules(GENERAL_RECOMMENDED_SEVERITIES, GENERAL_PREFIX),
    },
    strict: {
      plugins: [GENERAL_PREFIX],
      rules: prefixRules(GENERAL_STRICT_SEVERITIES, GENERAL_PREFIX),
    },
  },
};

// Support for flat config
export const generalConfigs = {
  recommended: {
    plugins: { [GENERAL_PREFIX]: generalPlugin },
    rules: prefixRules(GENERAL_RECOMMENDED_SEVERITIES, GENERAL_PREFIX),
  },
  strict: {
    plugins: { [GENERAL_PREFIX]: generalPlugin },
    rules: prefixRules(GENERAL_STRICT_SEVERITIES, GENERAL_PREFIX),
  },
};

export default generalPlugin;
