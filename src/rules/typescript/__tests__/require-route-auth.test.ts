import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../require-route-auth";

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
    // Non-protected route needs no auth check
    {
      code: "export async function GET() { return null; }",
      filename: "/app/api/public/route.ts",
    },
    // Protected route with an auth call
    {
      code: "export async function GET() { await authenticateUser(); return null; }",
      filename: "/app/api/admin/users/route.ts",
    },
    // Non-API file is not checked
    {
      code: "export function helper() { return 1; }",
      filename: "/src/lib/api/client.ts",
    },
  ],
  invalid: [
    // Protected route with no auth check
    {
      code: "export async function GET() { return null; }",
      filename: "/app/api/admin/users/route.ts",
      errors: [{ messageId: "missingAuthCheck" }],
    },
  ],
});
