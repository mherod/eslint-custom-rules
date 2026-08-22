import { readFileSync } from "node:fs";
import path from "node:path";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-import-cycles";

const FIXTURE_ROOT = path.join(__dirname, "fixtures", "no-import-cycles");

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
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    fixture("acyclic/a.ts"),
    {
      code: 'import { value } from "./value";',
      filename: "/virtual/no-project.ts",
    },
  ],
  invalid: [
    {
      ...fixture("direct/a.ts"),
      errors: [
        {
          data: {
            cycle: "direct/a.ts -> direct/b.ts -> direct/a.ts",
            specifier: "./b",
          },
          messageId: "importCycle",
        },
      ],
    },
    {
      ...fixture("direct/b.ts"),
      errors: [
        {
          data: {
            cycle: "direct/b.ts -> direct/a.ts -> direct/b.ts",
            specifier: "./a",
          },
          messageId: "importCycle",
        },
      ],
    },
    {
      ...fixture("transitive/a.ts"),
      errors: [
        {
          data: {
            cycle:
              "transitive/a.ts -> transitive/b.ts -> transitive/c.ts -> transitive/a.ts",
            specifier: "./b",
          },
          messageId: "importCycle",
        },
      ],
    },
    {
      ...fixture("alias/a.ts"),
      errors: [
        {
          data: {
            cycle: "alias/a.ts -> alias/b.ts -> alias/a.ts",
            specifier: "@alias/b",
          },
          messageId: "importCycle",
        },
      ],
    },
  ],
});
