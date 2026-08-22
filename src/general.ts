// General/shared rules plugin
import { buildCategoryPlugin } from "./config-utils";
import enforceFileNaming from "./rules/general/enforce-file-naming";
import enforceImportOrder from "./rules/general/enforce-import-order";
import noBarrelFileImports from "./rules/general/no-barrel-file-imports";
import noDebugComments from "./rules/general/no-debug-comments";
import noDeprecatedDeclarations from "./rules/general/no-deprecated-declarations";
import noImportTypeQueries from "./rules/general/no-import-type-queries";
import noLongRelativeImports from "./rules/general/no-long-relative-imports";
import noUnresolvableImports from "./rules/general/no-unresolvable-imports";
import preferDateFns from "./rules/general/prefer-date-fns";
import preferDateFnsOverDateOperations from "./rules/general/prefer-date-fns-over-date-operations";
import preferDirectImports from "./rules/general/prefer-direct-imports";
import preferLodashEsImports from "./rules/general/prefer-lodash-es-imports";
import preferLodashUniqOverSet from "./rules/general/prefer-lodash-uniq-over-set";
import preferUfoWithQuery from "./rules/general/prefer-ufo-with-query";
import preferZodDefaultWithCatch from "./rules/general/prefer-zod-default-with-catch";
import preferZodUrl from "./rules/general/prefer-zod-url";

// Canonical manifest: one entry per rule holding identity + preset policy.
export const GENERAL_MANIFEST = {
  "enforce-file-naming": {
    recommended: "warn",
    rule: enforceFileNaming,
    strict: "error",
  },
  "enforce-import-order": {
    recommended: "warn",
    rule: enforceImportOrder,
    strict: "error",
  },
  "no-barrel-file-imports": { recommended: "warn", rule: noBarrelFileImports },
  "no-debug-comments": { recommended: "warn", rule: noDebugComments },
  "no-deprecated-declarations": {
    recommended: "warn",
    rule: noDeprecatedDeclarations,
  },
  "no-import-type-queries": { recommended: "warn", rule: noImportTypeQueries },
  "no-long-relative-imports": {
    recommended: "warn",
    rule: noLongRelativeImports,
  },
  "no-unresolvable-imports": {
    recommended: "warn",
    rule: noUnresolvableImports,
  },
  "prefer-date-fns": {
    recommended: "warn",
    rule: preferDateFns,
    strict: "error",
  },
  "prefer-date-fns-over-date-operations": {
    recommended: "warn",
    rule: preferDateFnsOverDateOperations,
  },
  "prefer-direct-imports": { recommended: "warn", rule: preferDirectImports },
  "prefer-lodash-es-imports": {
    recommended: "error",
    rule: preferLodashEsImports,
  },
  "prefer-lodash-uniq-over-set": {
    recommended: "warn",
    rule: preferLodashUniqOverSet,
    strict: "error",
  },
  "prefer-ufo-with-query": {
    recommended: "warn",
    rule: preferUfoWithQuery,
    strict: "error",
  },
  "prefer-zod-default-with-catch": {
    recommended: "warn",
    rule: preferZodDefaultWithCatch,
  },
  "prefer-zod-url": { recommended: "warn", rule: preferZodUrl },
} as const;

const assembly = buildCategoryPlugin("@mherod/general", GENERAL_MANIFEST);

export const GENERAL_RECOMMENDED_SEVERITIES = assembly.recommendedSeverities;
export const GENERAL_STRICT_SEVERITIES = assembly.strictSeverities;
export const generalRules = assembly.rules;
export const generalPlugin = assembly.plugin;
export const generalConfigs = assembly.configs;

export default generalPlugin;
