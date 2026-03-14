import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-conflicting-directives";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("no-conflicting-directives", rule, {
  valid: [
    // Only "use client"
    {
      code: `"use client";\nexport function Component() { return null; }`,
    },
    // Only "use server"
    {
      code: `"use server";\nexport async function action() { return; }`,
    },
    // No directives at all
    {
      code: "export function Component() { return null; }",
    },
    // String that looks like directive but isn't at top level
    {
      code: `"use client";\nfunction foo() { const x = "use server"; }`,
    },
  ],
  invalid: [
    // Both directives — use client first
    {
      code: `"use client";\n"use server";`,
      errors: [{ messageId: "conflictingDirectives" }],
    },
    // Both directives — use server first
    {
      code: `"use server";\n"use client";`,
      errors: [{ messageId: "conflictingDirectives" }],
    },
  ],
});
