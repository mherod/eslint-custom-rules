import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";

jest.mock("../../utils/resect-sync-bridge", () => ({
  detectImportCyclesSync: jest.fn(() => null),
}));

import rule, { RULE_NAME } from "../no-import-cycles";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(`${RULE_NAME} without resect`, rule, {
  valid: [
    {
      code: 'import { b } from "./b";',
      filename: "/project/a.ts",
    },
  ],
  invalid: [],
});
