// Vue-specific rules plugin
import preferToValue from "./rules/vue/prefer-to-value";

export const vueRules = {
  "prefer-to-value": preferToValue,
};

export const vuePlugin = {
  rules: vueRules,
  configs: {
    recommended: {
      plugins: ["@mherod/vue"],
      rules: {
        "@mherod/vue/prefer-to-value": "warn",
      },
    },
    strict: {
      plugins: ["@mherod/vue"],
      rules: {
        "@mherod/vue/prefer-to-value": "error",
      },
    },
  },
};

// Support for flat config
export const vueConfigs = {
  recommended: {
    plugins: {
      "@mherod/vue": vuePlugin,
    },
    rules: {
      "@mherod/vue/prefer-to-value": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/vue": vuePlugin,
    },
    rules: {
      "@mherod/vue/prefer-to-value": "error",
    },
  },
};

export default vuePlugin;
