import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-api-patterns";

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
    // Non-API files are not checked at all
    {
      code: "export function fetchUsers() { return fetch('/api/users'); }",
      filename: "/src/components/UserList.tsx",
    },
    // Client-side API client in lib/api/ — should NOT be flagged (issue #24)
    {
      code: "export function fetchUsers() { return fetch('/api/users'); }",
      filename: "/src/lib/api/client.ts",
    },
    // Another client-side API wrapper in lib/api/
    {
      code: "export async function getCampaigns() { return fetch('/api/campaigns').then(r => r.json()); }",
      filename: "/src/lib/api/campaigns.ts",
    },
    // Test file inside lib/api/ — should NOT be flagged
    {
      code: "describe('api', () => { it('works', () => {}); });",
      filename: "/src/lib/api/__tests__/entities.test.ts",
    },
    // Generic /api/ path that isn't app/api/ or pages/api/
    {
      code: "export const apiConfig = {};",
      filename: "/src/services/api/config.ts",
    },
  ],
  invalid: [
    // App Router route handler — should be flagged for missing patterns
    {
      code: "export function getData() { return 'hello'; }",
      filename: "/project/app/api/data/route.ts",
      errors: [
        { messageId: "missingErrorHandling" },
        { messageId: "missingInputValidation" },
        { messageId: "missingRequestMethodCheck" },
        { messageId: "improperStatusCode" },
      ],
    },
    // Pages Router API route — should also be flagged
    {
      code: "export function getData() { return 'hello'; }",
      filename: "/project/pages/api/data.ts",
      errors: [
        { messageId: "missingErrorHandling" },
        { messageId: "missingInputValidation" },
        { messageId: "missingRequestMethodCheck" },
        { messageId: "improperStatusCode" },
      ],
    },
    // File ending with route.ts is flagged regardless of location
    {
      code: "export function getData() { return 'hello'; }",
      filename: "/project/some/path/route.ts",
      errors: [
        { messageId: "missingErrorHandling" },
        { messageId: "missingInputValidation" },
        { messageId: "missingRequestMethodCheck" },
        { messageId: "improperStatusCode" },
      ],
    },
  ],
});
