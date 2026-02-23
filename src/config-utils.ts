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
