import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-route-shape";

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
    // Well-shaped route: try/catch, method check, status, NextResponse
    {
      code: `
        export async function POST(request: Request): Promise<Response> {
          if (request.method !== 'POST') {
            return new NextResponse.Error();
          }
          try {
            return NextResponse.json({ ok: true }, { status: 200 });
          } catch (error) {
            return res.status(500);
          }
        }
      `,
      filename: "/app/api/users/route.ts",
    },
  ],
  invalid: [
    // Bare route handler misses every shape requirement
    {
      code: "export function getData() { return 'hello'; }",
      filename: "/app/api/data/route.ts",
      errors: [
        { messageId: "missingErrorHandling" },
        { messageId: "missingRequestMethodCheck" },
        { messageId: "improperStatusCode" },
      ],
    },
    // HTTP-method export without params or return type
    {
      code: "export function GET() { try { return res.status(200); } catch (e) { return new NextResponse.Error(); } }",
      filename: "/app/api/users/route.ts",
      errors: [
        { messageId: "missingRequestMethodCheck" },
        { messageId: "missingResponseType" },
        { messageId: "missingResponseType" },
      ],
    },
  ],
});
