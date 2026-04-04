import * as path from "node:path";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-unresolvable-imports";

const FIXTURE_ROOT = path.join(
  __dirname,
  "fixtures",
  "no-unresolvable-imports"
);
const FIXTURE_FILE = path.join(FIXTURE_ROOT, "src", "nested", "view.ts");

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
    {
      code: 'import { existing } from "@/existing";',
      filename: FIXTURE_FILE,
    },
    {
      code: 'import { existing } from "../existing";',
      filename: FIXTURE_FILE,
    },
    {
      code: 'const feature = require("./feature");',
      filename: FIXTURE_FILE,
    },
  ],
  invalid: [
    {
      code: 'import { missing } from "@/missing";',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
    {
      code: 'export { missing } from "./missing";',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
    {
      code: 'await import("@/missing-dynamic");',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
    {
      code: 'const missing = require("./missing-require");',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
    {
      code: 'const resolved = require.resolve("./missing-resolve");',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
    {
      code: 'jest.mock("@/missing-mock");',
      errors: [{ messageId: "unresolvableImport" }],
      filename: FIXTURE_FILE,
    },
  ],
});
