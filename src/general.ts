// General/shared rules plugin
import enforceFileNaming from "./rules/general/enforce-file-naming";
import enforceImportOrder from "./rules/general/enforce-import-order";
import enforceWorkspaceImports from "./rules/general/enforce-workspace-imports";
import preferDateFnsOverDateOperations from "./rules/general/prefer-date-fns-over-date-operations";

export const generalRules = {
  "enforce-file-naming": enforceFileNaming,
  "enforce-import-order": enforceImportOrder,
  "enforce-workspace-imports": enforceWorkspaceImports,
  "prefer-date-fns-over-date-operations": preferDateFnsOverDateOperations,
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
      },
    },
    strict: {
      plugins: ["@mherod/general"],
      rules: {
        "@mherod/general/enforce-file-naming": "error",
        "@mherod/general/enforce-import-order": "error",
        "@mherod/general/enforce-workspace-imports": "error",
        "@mherod/general/prefer-date-fns-over-date-operations": "warn",
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
    },
  },
  strict: {
    plugins: {
      "@mherod/general": generalPlugin,
    },
    rules: {
      "@mherod/general/enforce-file-naming": "error",
      "@mherod/general/enforce-import-order": "error",
      "@mherod/general/enforce-workspace-imports": "error",
      "@mherod/general/prefer-date-fns-over-date-operations": "warn",
    },
  },
};

export default generalPlugin;
