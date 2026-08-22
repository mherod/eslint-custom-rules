/**
 * Shared utilities for generating ESLint plugin configs.
 *
 * Each category plugin defines unprefixed rule-severity maps (e.g. `"no-foo": "error"`)
 * and uses `prefixRules` to produce the prefixed versions needed by both legacy and
 * flat config formats, keeping a single source of truth for rule severities.
 */

/**
 * Prefix every key in a rule-severity map with a plugin namespace.
 *
 * @example
 * prefixRules({ "no-foo": "error" }, "@mherod/react")
 * // => { "@mherod/react/no-foo": "error" }
 */
export function prefixRules(
  rules: Record<string, string>,
  prefix: string
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) => [`${prefix}/${key}`, value])
  );
}

export type RuleSeverity = "error" | "warn";

/**
 * One canonical entry per rule: the rule module plus its preset policy.
 * `recommended` enables the rule in the recommended preset; `strict`
 * overrides (or, when `recommended` is absent, introduces) the severity in
 * the strict preset. A rule with neither stays registered but preset-off —
 * the deprecation-window state for aggregate rules.
 */
export interface RuleManifestEntry<TRule = unknown> {
  recommended?: RuleSeverity;
  rule: TRule;
  strict?: RuleSeverity;
}

export type CategoryManifest = Record<string, RuleManifestEntry>;

export function rulesFromManifest<TManifest extends CategoryManifest>(
  manifest: TManifest
): { [TRuleId in keyof TManifest]: TManifest[TRuleId]["rule"] } {
  return Object.fromEntries(
    Object.entries(manifest).map(([ruleId, entry]) => [ruleId, entry.rule])
  ) as { [TRuleId in keyof TManifest]: TManifest[TRuleId]["rule"] };
}

export function recommendedSeveritiesFromManifest(
  manifest: CategoryManifest
): Record<string, RuleSeverity> {
  return Object.fromEntries(
    Object.entries(manifest)
      .filter(([, entry]) => entry.recommended !== undefined)
      .map(([ruleId, entry]) => [ruleId, entry.recommended as RuleSeverity])
  );
}

export function strictSeveritiesFromManifest(
  manifest: CategoryManifest
): Record<string, RuleSeverity> {
  return Object.fromEntries(
    Object.entries(manifest)
      .filter(
        ([, entry]) =>
          entry.strict !== undefined || entry.recommended !== undefined
      )
      .map(([ruleId, entry]) => [
        ruleId,
        (entry.strict ?? entry.recommended) as RuleSeverity,
      ])
  );
}

interface CategoryPluginShape<TRules> {
  configs: {
    recommended: {
      plugins: Record<string, unknown>;
      rules: Record<string, string>;
    };
    strict: {
      plugins: Record<string, unknown>;
      rules: Record<string, string>;
    };
  };
  plugin: {
    configs: {
      recommended: { plugins: string[]; rules: Record<string, string> };
      strict: { plugins: string[]; rules: Record<string, string> };
    };
    rules: TRules;
  };
  recommendedSeverities: Record<string, RuleSeverity>;
  rules: TRules;
  strictSeverities: Record<string, RuleSeverity>;
}

/**
 * Derive every public assembly artifact for one category from its manifest:
 * the rule map, recommended/strict severity maps, the legacy plugin object,
 * and the flat-config object. Category entrypoints re-export these under
 * their existing public names.
 */
export function buildCategoryPlugin<TManifest extends CategoryManifest>(
  prefix: string,
  manifest: TManifest
): CategoryPluginShape<{
  [TRuleId in keyof TManifest]: TManifest[TRuleId]["rule"];
}> {
  const rules = rulesFromManifest(manifest);
  const recommendedSeverities = recommendedSeveritiesFromManifest(manifest);
  const strictSeverities = strictSeveritiesFromManifest(manifest);

  const plugin = {
    rules,
    configs: {
      recommended: {
        plugins: [prefix],
        rules: prefixRules(recommendedSeverities, prefix),
      },
      strict: {
        plugins: [prefix],
        rules: prefixRules(strictSeverities, prefix),
      },
    },
  };

  const configs = {
    recommended: {
      plugins: { [prefix]: plugin },
      rules: prefixRules(recommendedSeverities, prefix),
    },
    strict: {
      plugins: { [prefix]: plugin },
      rules: prefixRules(strictSeverities, prefix),
    },
  };

  return { configs, plugin, recommendedSeverities, rules, strictSeverities };
}
