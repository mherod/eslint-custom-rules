import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../require-rate-limiting";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("require-rate-limiting", rule, {
  valid: [
    // Client-side fetch wrapper in lib/api/ — not a route handler
    {
      code: `
        export async function exportPostsToCSV(eventId: string) {
          const res = await fetch(\`/api/events/\${eventId}/export\`);
          return res.blob();
        }
      `,
      filename: "/src/lib/api/exports.ts",
    },
    // Non-exported helper in lib/api/ — not a public endpoint
    {
      code: `
        async function serializeArrayParam(arr: string[]) {
          return JSON.stringify(arr);
        }
      `,
      filename: "/src/lib/api/exports.ts",
    },
    // Non-API file — rule does not apply
    {
      code: `
        export async function GET() {
          return Response.json({ ok: true });
        }
      `,
      filename: "/src/components/DataTable.tsx",
    },
    // Route handler WITH rate limiting — should pass
    {
      code: `
        export async function GET(request: Request) {
          await rateLimit(request);
          return Response.json({ data: [] });
        }
      `,
      filename: "/src/app/api/users/route.ts",
    },
    // Route handler with throttle — should pass
    {
      code: `
        export async function POST(request: Request) {
          await throttle(request);
          return Response.json({ ok: true });
        }
      `,
      filename: "/src/app/api/upload/route.ts",
    },
    // Protected route — excluded from check
    {
      code: `
        export async function GET(request: Request) {
          return Response.json({ data: [] });
        }
      `,
      filename: "/src/app/api/admin/users/route.ts",
    },
    // Non-HTTP-method export in route file — not a handler
    {
      code: `
        export async function fetchUserData(id: string) {
          return db.users.find(id);
        }
      `,
      filename: "/src/app/api/users/route.ts",
    },
    // Non-exported function in route file
    {
      code: `
        async function GET(request: Request) {
          return Response.json({ ok: true });
        }
      `,
      filename: "/src/app/api/items/route.ts",
    },
    // File in utils/api/ — not a route handler
    {
      code: `
        export async function POST(data: FormData) {
          const res = await fetch("/api/submit", { method: "POST", body: data });
          return res.json();
        }
      `,
      filename: "/src/utils/api/submit.ts",
    },
    // Pages Router: default export WITH rate limiting — should pass
    {
      code: `
        export default async function handler(req, res) {
          await rateLimit(req);
          res.status(200).json({ ok: true });
        }
      `,
      filename: "/src/pages/api/users.ts",
    },
    // Pages Router: protected route — excluded
    {
      code: `
        export default async function handler(req, res) {
          res.status(200).json({ data: [] });
        }
      `,
      filename: "/src/pages/api/admin/users.ts",
    },
    // Pages Router: named export (not default) — not a handler
    {
      code: `
        export async function getUsers() {
          return db.users.findAll();
        }
      `,
      filename: "/src/pages/api/users.ts",
    },
    // Pages Router: non-exported function — not a handler
    {
      code: `
        async function handler(req, res) {
          res.status(200).json({ ok: true });
        }
      `,
      filename: "/src/pages/api/items.ts",
    },
  ],
  invalid: [
    // Exported GET handler in app/api route without rate limiting
    {
      code: `
        export async function GET(request: Request) {
          return Response.json({ data: [] });
        }
      `,
      filename: "/src/app/api/users/route.ts",
      errors: [{ messageId: "requireRateLimit" }],
    },
    // Exported POST handler without rate limiting
    {
      code: `
        export async function POST(request: Request) {
          const body = await request.json();
          return Response.json({ ok: true });
        }
      `,
      filename: "/src/app/api/events/route.ts",
      errors: [{ messageId: "requireRateLimit" }],
    },
    // Exported DELETE handler without rate limiting
    {
      code: `
        export async function DELETE(request: Request) {
          return Response.json({ deleted: true });
        }
      `,
      filename: "/src/app/api/items/route.ts",
      errors: [{ messageId: "requireRateLimit" }],
    },
    // Pages Router: default export without rate limiting
    {
      code: `
        export default async function handler(req, res) {
          res.status(200).json({ data: [] });
        }
      `,
      filename: "/src/pages/api/users.ts",
      errors: [{ messageId: "requireRateLimit" }],
    },
    // Pages Router: nested route without rate limiting
    {
      code: `
        export default async function handler(req, res) {
          const { id } = req.query;
          res.status(200).json({ id });
        }
      `,
      filename: "/src/pages/api/users/[id].ts",
      errors: [{ messageId: "requireRateLimit" }],
    },
  ],
});
