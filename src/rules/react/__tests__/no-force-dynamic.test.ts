import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-force-dynamic";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    {
      name: "Regular export const with different name",
      code: `
        export const something = "force-dynamic";
      `,
    },
    {
      name: "Regular const declaration without export",
      code: `
        const dynamic = "force-dynamic";
      `,
    },
    {
      name: "Export const dynamic with different value",
      code: `
        export const dynamic = "error";
      `,
    },
    {
      name: "Export let dynamic (not const)",
      code: `
        export let dynamic = "force-dynamic";
      `,
    },
    {
      name: "Export const dynamic with expression",
      code: `
        export const dynamic = process.env.NODE_ENV === "development" ? "force-dynamic" : "error";
      `,
    },
    {
      name: "Export const dynamic with number",
      code: `
        export const dynamic = 42;
      `,
    },
    {
      name: "Export const dynamic with boolean",
      code: `
        export const dynamic = true;
      `,
    },
    {
      name: "Export const dynamic with null",
      code: `
        export const dynamic = null;
      `,
    },
    {
      name: "Default export (not named export)",
      code: `
        const dynamic = "force-dynamic";
        export default dynamic;
      `,
    },
    {
      name: "Named export of different variable",
      code: `
        const forceDynamic = "force-dynamic";
        export { forceDynamic };
      `,
    },
  ],
  invalid: [
    {
      name: 'export const dynamic = "force-dynamic"',
      code: `
        export const dynamic = "force-dynamic";
      `,
      errors: [
        {
          messageId: "noForceDynamic",
        },
      ],
    },
    {
      name: 'export const dynamic = "force-dynamic" with single quotes',
      code: `
        export const dynamic = 'force-dynamic';
      `,
      errors: [
        {
          messageId: "noForceDynamic",
        },
      ],
    },
    {
      name: 'export const dynamic = "force-dynamic" in a page file',
      code: `
        import { NextRequest } from "next/server";

        export const dynamic = "force-dynamic";

        export async function GET(request: NextRequest) {
          return new Response("Hello World");
        }
      `,
      errors: [
        {
          messageId: "noForceDynamic",
        },
      ],
    },
    {
      name: 'export const dynamic = "force-dynamic" with extra whitespace',
      code: `
        export const dynamic =  "force-dynamic"  ;
      `,
      errors: [
        {
          messageId: "noForceDynamic",
        },
      ],
    },
    {
      name: 'Multiple exports, one with dynamic = "force-dynamic"',
      code: `
        export const revalidate = 300;
        export const dynamic = "force-dynamic";
        export const runtime = "nodejs";
      `,
      errors: [
        {
          messageId: "noForceDynamic",
        },
      ],
    },
  ],
});
