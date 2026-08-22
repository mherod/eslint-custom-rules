import { configs as combinedConfigs, plugin as combinedPlugin } from "../index";
import {
  TYPESCRIPT_RECOMMENDED_SEVERITIES,
  TYPESCRIPT_STRICT_SEVERITIES,
  typescriptConfigs,
  typescriptPlugin,
  typescriptRules,
} from "../typescript";

const AGGREGATE_RULE = "enforce-typescript-patterns";
const FOCUSED_RULES = [
  "enforce-assertion-policies",
  "enforce-type-naming",
  "no-undocumented-unknown",
] as const;

describe("typescript config contract", () => {
  const presetRuleMaps: [string, Record<string, string>][] = [
    ["legacy recommended", typescriptPlugin.configs.recommended.rules],
    ["legacy strict", typescriptPlugin.configs.strict.rules],
    ["flat recommended", typescriptConfigs.recommended.rules],
    ["flat strict", typescriptConfigs.strict.rules],
    ["combined legacy recommended", combinedPlugin.configs.recommended.rules],
    ["combined legacy strict", combinedPlugin.configs.strict.rules],
    ["combined flat recommended", combinedConfigs.recommended.rules],
    ["combined flat strict", combinedConfigs.strict.rules],
  ];

  it.each(
    presetRuleMaps
  )("%s preset does not enable the aggregate rule", (_name, ruleMap) => {
    const aggregateEntries = Object.keys(ruleMap).filter((ruleId) =>
      ruleId.endsWith(`/${AGGREGATE_RULE}`)
    );
    expect(aggregateEntries).toEqual([]);
  });

  it.each(
    presetRuleMaps
  )("%s preset enables every focused replacement rule", (_name, ruleMap) => {
    for (const focusedRule of FOCUSED_RULES) {
      const entries = Object.keys(ruleMap).filter((ruleId) =>
        ruleId.endsWith(`/${focusedRule}`)
      );
      expect({ focusedRule, count: entries.length }).toEqual({
        focusedRule,
        count: 1,
      });
    }
  });

  it("keeps focused severities at the aggregate's previous levels", () => {
    for (const focusedRule of FOCUSED_RULES) {
      expect(TYPESCRIPT_RECOMMENDED_SEVERITIES[focusedRule]).toBe("warn");
      expect(TYPESCRIPT_STRICT_SEVERITIES[focusedRule]).toBe("error");
    }
  });

  it("keeps the aggregate rule registered for explicit opt-in", () => {
    expect(typescriptRules[AGGREGATE_RULE]).toBeDefined();
    expect(typescriptRules[AGGREGATE_RULE].meta.deprecated).toBe(true);
  });
});
