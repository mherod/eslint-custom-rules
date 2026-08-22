import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../require-route-validation";

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
    // Non-API files are not checked (issue #24 regression)
    {
      code: "export function fetchUsers() { return fetch('/api/users'); }",
      filename: "/src/lib/api/client.ts",
    },
    // route.ts outside app/ is not an API route (issue #26 regression)
    {
      code: "export function getData() { return 'hello'; }",
      filename: "/project/some/path/route.ts",
    },
    // Route that parses its input with a schema
    {
      code: "export async function POST(request: Request) { const body = schema.parse(await request.json()); return body; }",
      filename: "/app/api/users/route.ts",
    },
  ],
  invalid: [
    // Route with no schema validation call
    {
      code: "export async function POST(request: Request) { return request; }",
      filename: "/app/api/users/route.ts",
      errors: [{ messageId: "missingInputValidation" }],
    },
  ],
});
