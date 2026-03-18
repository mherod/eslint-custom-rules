import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-documentation";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Non-exported interface — no JSDoc required
    "interface InternalFilter { id: string; }",

    // Exported interface WITH JSDoc on the export — should NOT be flagged (issue #23)
    "/** Filters applied to entity queries. */ export interface BaseFilters { page: number; limit: number; }",

    // Exported interface with JSDoc using multiline format
    `/**
     * Filters for campaign queries.
     * @property page - Current page number
     */
    export interface CampaignFilters { page: number; }`,

    // Exported type alias with JSDoc on the export — should NOT be flagged (issue #23)
    "/** Union of allowed status values. */ export type Status = 'active' | 'inactive' | string;",

    // Non-exported type alias — no JSDoc required even for complex types
    "type InternalConfig = { host: string; port: number; timeout: number; };",

    // Exported function with JSDoc on the export — should NOT be flagged
    "/** Performs setup. */ export function setup() {}",

    // Non-exported function — no JSDoc required
    "function helper(x: string): void {}",
  ],
  invalid: [
    // Exported interface without any JSDoc — should be flagged
    {
      code: "export interface BaseFilters { page: number; limit: number; }",
      errors: [
        {
          messageId: "missingTypeDocumentation",
          data: { name: "BaseFilters" },
        },
      ],
    },

    // Exported type alias with complex type (>3 members) and no JSDoc — should be flagged
    {
      code: "export type Config = { host: string; port: number; timeout: number; retries: number; };",
      errors: [
        { messageId: "missingTypeDocumentation", data: { name: "Config" } },
      ],
    },
  ],
});
