import { readFileSync } from "node:fs";
import path from "node:path";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-unused-exports";

const FIXTURE_ROOT = path.join(__dirname, "fixtures", "no-unused-exports");

function fixture(relativePath: string): {
  code: string;
  filename: string;
} {
  const filename = path.join(FIXTURE_ROOT, relativePath);
  return { code: readFileSync(filename, "utf8"), filename };
}

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    fixture("used.ts"),
    fixture("public.ts"),
    fixture("app/page.ts"),
    {
      code: "export const outsideProject = true;",
      filename: "/virtual/no-project.ts",
    },
  ],
  invalid: [
    {
      ...fixture("unused.ts"),
      errors: [
        {
          data: { name: "unused" },
          messageId: "unusedExport",
        },
      ],
    },
    {
      ...fixture("internal-only.ts"),
      errors: [
        {
          data: { name: "internalOnly" },
          messageId: "unnecessaryExport",
        },
      ],
    },
    {
      ...fixture("specifier.ts"),
      errors: [
        {
          data: { name: "exportedValue" },
          messageId: "unusedExport",
        },
      ],
    },
  ],
});
