// Vue-specific rules plugin
import { prefixRules } from "./config-utils";
import preferToValue from "./rules/vue/prefer-to-value";

// Rule severity maps -- single source of truth for both legacy and flat configs
export const VUE_RECOMMENDED_SEVERITIES = {
  "prefer-to-value": "warn",
} as const;

export const VUE_STRICT_SEVERITIES = {
  ...VUE_RECOMMENDED_SEVERITIES,
  "prefer-to-value": "error",
} as const;

export const vueRules = {
  "prefer-to-value": preferToValue,
};

const VUE_PREFIX = "@mherod/vue";

export const vuePlugin = {
  rules: vueRules,
  configs: {
    recommended: {
      plugins: [VUE_PREFIX],
      rules: prefixRules(VUE_RECOMMENDED_SEVERITIES, VUE_PREFIX),
    },
    strict: {
      plugins: [VUE_PREFIX],
      rules: prefixRules(VUE_STRICT_SEVERITIES, VUE_PREFIX),
    },
  },
};

// Support for flat config
export const vueConfigs = {
  recommended: {
    plugins: { [VUE_PREFIX]: vuePlugin },
    rules: prefixRules(VUE_RECOMMENDED_SEVERITIES, VUE_PREFIX),
  },
  strict: {
    plugins: { [VUE_PREFIX]: vuePlugin },
    rules: prefixRules(VUE_STRICT_SEVERITIES, VUE_PREFIX),
  },
};

export default vuePlugin;
