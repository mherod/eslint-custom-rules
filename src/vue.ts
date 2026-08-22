// Vue-specific rules plugin
import { buildCategoryPlugin } from "./config-utils";
import preferToValue from "./rules/vue/prefer-to-value";

// Canonical manifest: one entry per rule holding identity + preset policy.
export const VUE_MANIFEST = {
  "prefer-to-value": {
    recommended: "warn",
    rule: preferToValue,
    strict: "error",
  },
} as const;

const assembly = buildCategoryPlugin("@mherod/vue", VUE_MANIFEST);

export const VUE_RECOMMENDED_SEVERITIES = assembly.recommendedSeverities;
export const VUE_STRICT_SEVERITIES = assembly.strictSeverities;
export const vueRules = assembly.rules;
export const vuePlugin = assembly.plugin;
export const vueConfigs = assembly.configs;

export default vuePlugin;
