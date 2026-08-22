import {
  GENERAL_RECOMMENDED_SEVERITIES,
  GENERAL_STRICT_SEVERITIES,
  generalConfigs,
  generalPlugin,
  generalRules,
} from "../general";
import { configs as combinedConfigs, plugin as combinedPlugin } from "../index";
import {
  REACT_RECOMMENDED_SEVERITIES,
  REACT_STRICT_SEVERITIES,
  reactConfigs,
  reactPlugin,
  reactRules,
} from "../react";
import {
  SECURITY_RECOMMENDED_SEVERITIES,
  SECURITY_STRICT_SEVERITIES,
  securityConfigs,
  securityPlugin,
  securityRules,
} from "../security";
import {
  TYPESCRIPT_RECOMMENDED_SEVERITIES,
  TYPESCRIPT_STRICT_SEVERITIES,
  typescriptConfigs,
  typescriptPlugin,
  typescriptRules,
} from "../typescript";
import {
  VUE_RECOMMENDED_SEVERITIES,
  VUE_STRICT_SEVERITIES,
  vueConfigs,
  vuePlugin,
  vueRules,
} from "../vue";

interface CategoryShape {
  configs: {
    recommended: { rules: Record<string, string> };
    strict: { rules: Record<string, string> };
  };
  plugin: {
    configs: {
      recommended: { rules: Record<string, string> };
      strict: { rules: Record<string, string> };
    };
  };
  recommended: Record<string, string>;
  rules: Record<string, unknown>;
  strict: Record<string, string>;
}

const categories: [string, CategoryShape][] = [
  [
    "general",
    {
      configs: generalConfigs,
      plugin: generalPlugin,
      recommended: GENERAL_RECOMMENDED_SEVERITIES,
      rules: generalRules,
      strict: GENERAL_STRICT_SEVERITIES,
    },
  ],
  [
    "react",
    {
      configs: reactConfigs,
      plugin: reactPlugin,
      recommended: REACT_RECOMMENDED_SEVERITIES,
      rules: reactRules,
      strict: REACT_STRICT_SEVERITIES,
    },
  ],
  [
    "security",
    {
      configs: securityConfigs,
      plugin: securityPlugin,
      recommended: SECURITY_RECOMMENDED_SEVERITIES,
      rules: securityRules,
      strict: SECURITY_STRICT_SEVERITIES,
    },
  ],
  [
    "typescript",
    {
      configs: typescriptConfigs,
      plugin: typescriptPlugin,
      recommended: TYPESCRIPT_RECOMMENDED_SEVERITIES,
      rules: typescriptRules,
      strict: TYPESCRIPT_STRICT_SEVERITIES,
    },
  ],
  [
    "vue",
    {
      configs: vueConfigs,
      plugin: vuePlugin,
      recommended: VUE_RECOMMENDED_SEVERITIES,
      rules: vueRules,
      strict: VUE_STRICT_SEVERITIES,
    },
  ],
];

function sortedEntries(map: Record<string, string>): [string, string][] {
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

describe("plugin assembly contract", () => {
  it.each(categories)("%s category contract is stable", (_name, category) => {
    expect({
      ruleIds: Object.keys(category.rules).sort(),
      recommended: sortedEntries(category.recommended),
      strict: sortedEntries(category.strict),
      legacyRecommended: sortedEntries(
        category.plugin.configs.recommended.rules
      ),
      legacyStrict: sortedEntries(category.plugin.configs.strict.rules),
      flatRecommended: sortedEntries(category.configs.recommended.rules),
      flatStrict: sortedEntries(category.configs.strict.rules),
    }).toMatchSnapshot();
  });

  it("combined plugin severity contract is stable", () => {
    expect({
      legacyRecommended: sortedEntries(
        combinedPlugin.configs.recommended.rules
      ),
      legacyStrict: sortedEntries(combinedPlugin.configs.strict.rules),
      flatRecommended: sortedEntries(combinedConfigs.recommended.rules),
      flatStrict: sortedEntries(combinedConfigs.strict.rules),
    }).toMatchSnapshot();
  });

  it("combined plugin registers every category rule", () => {
    const union = new Set(
      categories.flatMap(([, category]) => Object.keys(category.rules))
    );
    const combinedRuleIds = new Set(Object.keys(combinedPlugin.rules));
    const missing = [...union].filter((id) => !combinedRuleIds.has(id)).sort();
    expect(missing).toEqual([]);
  });
});
