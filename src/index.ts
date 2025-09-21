// Re-exports using export from syntax
export {
  default as generalPlugin,
  generalConfigs,
  generalRules,
} from "./general";
export { default as reactPlugin, reactConfigs, reactRules } from "./react";
export { rules } from "./rules";
export {
  default as securityPlugin,
  securityConfigs,
  securityRules,
} from "./security";
// Import category-specific plugins
export {
  default as typescriptPlugin,
  typescriptConfigs,
  typescriptRules,
} from "./typescript";
export { default as vuePlugin, vueConfigs, vueRules } from "./vue";

// Import for internal use
import { rules } from "./rules";

// Main plugin that combines all rules (backward compatibility)
export const plugin = {
  rules,
  configs: {
    recommended: {
      plugins: ["@mherod/custom"],
      rules: {
        "@mherod/custom/no-event-handlers-to-client-props": "error",
        "@mherod/custom/no-use-state-in-async-component": "error",
        "@mherod/custom/prevent-environment-poisoning": "error",
        "@mherod/custom/prefer-date-fns-over-date-operations": "warn",
        "@mherod/custom/enforce-import-order": "warn",
        "@mherod/custom/enforce-file-naming": "warn",
        "@mherod/custom/enforce-server-client-separation": "error",
        "@mherod/custom/enforce-admin-separation": "error",
        "@mherod/custom/enforce-component-patterns": "warn",
        "@mherod/custom/enforce-workspace-imports": "error",
        "@mherod/custom/enforce-security-patterns": "error",
      },
    },
    strict: {
      plugins: ["@mherod/custom"],
      rules: {
        "@mherod/custom/no-event-handlers-to-client-props": "error",
        "@mherod/custom/no-use-state-in-async-component": "error",
        "@mherod/custom/prevent-environment-poisoning": "error",
        "@mherod/custom/prefer-date-fns-over-date-operations": "warn",
        "@mherod/custom/enforce-import-order": "error",
        "@mherod/custom/enforce-file-naming": "error",
        "@mherod/custom/enforce-server-client-separation": "error",
        "@mherod/custom/enforce-admin-separation": "error",
        "@mherod/custom/enforce-component-patterns": "error",
        "@mherod/custom/enforce-api-patterns": "error",
        "@mherod/custom/enforce-typescript-patterns": "error",
        "@mherod/custom/enforce-workspace-imports": "error",
        "@mherod/custom/enforce-security-patterns": "error",
        "@mherod/custom/enforce-documentation": "warn",
      },
    },
  },
};

// Support for flat config (backward compatibility)
export const configs = {
  recommended: {
    plugins: {
      "@mherod/custom": plugin,
    },
    rules: {
      "@mherod/custom/no-event-handlers-to-client-props": "error",
      "@mherod/custom/no-use-state-in-async-component": "error",
      "@mherod/custom/prevent-environment-poisoning": "error",
      "@mherod/custom/prefer-date-fns-over-date-operations": "warn",
      "@mherod/custom/enforce-import-order": "warn",
      "@mherod/custom/enforce-file-naming": "warn",
      "@mherod/custom/enforce-server-client-separation": "error",
      "@mherod/custom/enforce-admin-separation": "error",
      "@mherod/custom/enforce-component-patterns": "warn",
      "@mherod/custom/enforce-workspace-imports": "error",
      "@mherod/custom/enforce-security-patterns": "error",
    },
  },
  strict: {
    plugins: {
      "@mherod/custom": plugin,
    },
    rules: {
      "@mherod/custom/no-event-handlers-to-client-props": "error",
      "@mherod/custom/no-use-state-in-async-component": "error",
      "@mherod/custom/prevent-environment-poisoning": "error",
      "@mherod/custom/prefer-date-fns-over-date-operations": "warn",
      "@mherod/custom/enforce-import-order": "error",
      "@mherod/custom/enforce-file-naming": "error",
      "@mherod/custom/enforce-server-client-separation": "error",
      "@mherod/custom/enforce-admin-separation": "error",
      "@mherod/custom/enforce-component-patterns": "error",
      "@mherod/custom/enforce-api-patterns": "error",
      "@mherod/custom/enforce-typescript-patterns": "error",
      "@mherod/custom/enforce-workspace-imports": "error",
      "@mherod/custom/enforce-security-patterns": "error",
      "@mherod/custom/enforce-documentation": "warn",
    },
  },
};

// Category-specific plugins and rules are exported above using export from syntax

// Default export (backward compatibility)
export default plugin;
