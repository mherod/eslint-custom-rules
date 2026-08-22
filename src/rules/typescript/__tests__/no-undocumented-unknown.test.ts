import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-undocumented-unknown";

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
    // `unknown` with an adjacent explanatory comment — allowed
    "// external payload of unknown shape\nlet x: unknown;",

    // `unknown` on a descriptively-named declaration — allowed
    "function handler(payload: unknown) { return payload; }",

    // Multiple `unknown` tokens sharing one nearby comment — all allowed
    "// upstream values of unknown shape\nlet first: unknown;\nlet second: unknown;\nlet third: unknown;",
  ],
  invalid: [
    // `any` is always flagged
    {
      code: "let value: any;",
      errors: [{ messageId: "avoidAnyType" }],
    },
    // Bare `unknown` with no explanation — flagged with the comment suggestion
    {
      code: "let x: unknown;",
      errors: [
        {
          messageId: "avoidUnknownWithoutComment",
          suggestions: [
            {
              messageId: "addUnknownExplanationComment",
              output:
                "let x: // Explain why 'unknown' is used here, or replace it with a specific type\nunknown;",
            },
          ],
        },
      ],
    },
  ],
});
