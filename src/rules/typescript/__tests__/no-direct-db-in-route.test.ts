import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-direct-db-in-route";

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
    // Repository-pattern access is fine
    {
      code: "export async function GET() { return userRepository.findAll(); }",
      filename: "/app/api/users/route.ts",
    },
    // Non-API file is not checked
    {
      code: "const users = prisma.user.findMany();",
      filename: "/src/lib/data/users.ts",
    },
  ],
  invalid: [
    // Direct database client access in a route
    {
      code: "export async function GET() { return db.query('select 1'); }",
      filename: "/app/api/users/route.ts",
      errors: [{ messageId: "unsafeDirectDbAccess" }],
    },
  ],
});
