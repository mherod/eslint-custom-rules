import { configs as combinedConfigs, plugin as combinedPlugin } from "../index";
import {
  SECURITY_RECOMMENDED_SEVERITIES,
  SECURITY_STRICT_SEVERITIES,
  securityConfigs,
  securityPlugin,
  securityRules,
} from "../security";

const AGGREGATE_RULE = "enforce-security-patterns";

const FOCUSED_RECOMMENDED_SEVERITIES = {
  "no-hardcoded-secrets": "error",
  "no-log-secrets": "error",
  "no-sql-injection": "error",
  "no-unsafe-eval": "error",
  "no-unsafe-innerHTML": "error",
  "no-unsafe-redirect": "error",
  "no-unsafe-template-literals": "warn",
  "no-unstable-math-random": "warn",
  "no-weak-crypto": "error",
  "require-auth-validation": "error",
  "require-rate-limiting": "warn",
} as const;

const FOCUSED_STRICT_SEVERITIES = {
  ...FOCUSED_RECOMMENDED_SEVERITIES,
  "no-unsafe-template-literals": "error",
  "no-unstable-math-random": "error",
  "require-rate-limiting": "error",
} as const;

describe("security config contract", () => {
  const presetRuleMaps: [string, Record<string, string>][] = [
    ["legacy recommended", securityPlugin.configs.recommended.rules],
    ["legacy strict", securityPlugin.configs.strict.rules],
    ["flat recommended", securityConfigs.recommended.rules],
    ["flat strict", securityConfigs.strict.rules],
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

  it("keeps focused recommended severities unchanged", () => {
    expect(SECURITY_RECOMMENDED_SEVERITIES).toEqual(
      FOCUSED_RECOMMENDED_SEVERITIES
    );
  });

  it("keeps focused strict severities unchanged", () => {
    expect(SECURITY_STRICT_SEVERITIES).toEqual(FOCUSED_STRICT_SEVERITIES);
  });

  it("keeps the aggregate rule registered for explicit opt-in", () => {
    expect(securityRules[AGGREGATE_RULE]).toBeDefined();
    expect(securityRules[AGGREGATE_RULE].meta.deprecated).toBe(true);
  });
});
