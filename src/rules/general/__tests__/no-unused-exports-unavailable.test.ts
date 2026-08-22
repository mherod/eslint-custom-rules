import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";

jest.mock("../../utils/resect-sync-bridge", () => ({
  findUnusedExportsSync: jest.fn(() => null),
}));

import rule, { RULE_NAME } from "../no-unused-exports";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
});

ruleTester.run(`${RULE_NAME} without resect`, rule, {
  valid: [
    {
      code: "export const unavailable = true;",
      filename: "/project/unavailable.ts",
    },
  ],
  invalid: [],
});
