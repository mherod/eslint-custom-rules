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
import { prefixRules } from "./config-utils";
import {
  GENERAL_RECOMMENDED_SEVERITIES,
  GENERAL_STRICT_SEVERITIES,
} from "./general";
import { REACT_RECOMMENDED_SEVERITIES, REACT_STRICT_SEVERITIES } from "./react";
import { rules } from "./rules";
import {
  SECURITY_RECOMMENDED_SEVERITIES,
  SECURITY_STRICT_SEVERITIES,
} from "./security";
import {
  TYPESCRIPT_RECOMMENDED_SEVERITIES,
  TYPESCRIPT_STRICT_SEVERITIES,
} from "./typescript";
import { VUE_RECOMMENDED_SEVERITIES, VUE_STRICT_SEVERITIES } from "./vue";

// Combined severity maps for the main plugin (all categories under @mherod/custom)
const CUSTOM_PREFIX = "@mherod/custom";

const COMBINED_RECOMMENDED_SEVERITIES: Record<string, string> = {
  ...REACT_RECOMMENDED_SEVERITIES,
  ...GENERAL_RECOMMENDED_SEVERITIES,
  ...TYPESCRIPT_RECOMMENDED_SEVERITIES,
  ...SECURITY_RECOMMENDED_SEVERITIES,
  ...VUE_RECOMMENDED_SEVERITIES,
};

const COMBINED_STRICT_SEVERITIES: Record<string, string> = {
  ...REACT_STRICT_SEVERITIES,
  ...GENERAL_STRICT_SEVERITIES,
  ...TYPESCRIPT_STRICT_SEVERITIES,
  ...SECURITY_STRICT_SEVERITIES,
  ...VUE_STRICT_SEVERITIES,
};

// Main plugin that combines all rules (backward compatibility)
export const plugin = {
  rules,
  configs: {
    recommended: {
      plugins: [CUSTOM_PREFIX],
      rules: prefixRules(COMBINED_RECOMMENDED_SEVERITIES, CUSTOM_PREFIX),
    },
    strict: {
      plugins: [CUSTOM_PREFIX],
      rules: prefixRules(COMBINED_STRICT_SEVERITIES, CUSTOM_PREFIX),
    },
  },
};

// Support for flat config (backward compatibility)
export const configs = {
  recommended: {
    plugins: { [CUSTOM_PREFIX]: plugin },
    rules: prefixRules(COMBINED_RECOMMENDED_SEVERITIES, CUSTOM_PREFIX),
  },
  strict: {
    plugins: { [CUSTOM_PREFIX]: plugin },
    rules: prefixRules(COMBINED_STRICT_SEVERITIES, CUSTOM_PREFIX),
  },
};

// Default export (backward compatibility)
export default plugin;
