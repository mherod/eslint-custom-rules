import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../require-use-client-for-client-named-files";

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
      name: "Client-named file with directive",
      code: `"use client";\nexport function FooClient() { return null; }`,
      filename: "/app/components/foo-client.tsx",
    },
    {
      name: "Non-client named file without directive",
      code: "export function Foo() { return null; }",
      filename: "/app/components/foo.tsx",
    },
    {
      name: "Client-named non-TSX file ignored",
      code: "export const foo = 1;",
      filename: "/app/lib/foo-client.ts",
    },
    {
      name: "PascalCaseClient file with directive",
      code: `"use client";\nexport function UserFormClient() { return null; }`,
      filename: "/app/components/UserFormClient.tsx",
    },
    {
      name: "PascalCaseClient non-TSX file ignored",
      code: "export const foo = 1;",
      filename: "/app/lib/UserFormClient.ts",
    },
  ],
  invalid: [
    {
      name: "Missing directive in -client file",
      code: "export function Foo() { return null; }",
      filename: "/app/components/foo-client.tsx",
      errors: [{ messageId: "missingUseClientDirective" }],
      output: `"use client";\n\nexport function Foo() { return null; }`,
    },
    {
      name: "Missing directive in .client file",
      code: "export default function Foo() { return null; }",
      filename: "/app/components/foo.client.jsx",
      errors: [{ messageId: "missingUseClientDirective" }],
      output: `"use client";\n\nexport default function Foo() { return null; }`,
    },
    {
      name: "Missing directive in PascalCaseClient file",
      code: "export function UserFormClient() { return null; }",
      filename: "/app/components/UserFormClient.tsx",
      errors: [{ messageId: "missingUseClientDirective" }],
      output: `"use client";\n\nexport function UserFormClient() { return null; }`,
    },
    {
      name: "Missing directive in PascalCaseClient JSX file",
      code: "export default function ComponentClient() { return null; }",
      filename: "/app/components/ComponentClient.jsx",
      errors: [{ messageId: "missingUseClientDirective" }],
      output: `"use client";\n\nexport default function ComponentClient() { return null; }`,
    },
  ],
});
