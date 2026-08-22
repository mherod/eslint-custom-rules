import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-typescript-patterns";

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

    // Multiple `unknown` tokens sharing one nearby comment — all allowed via
    // the per-file comment-line index
    "// upstream values of unknown shape\nlet first: unknown;\nlet second: unknown;\nlet third: unknown;",
  ],
  invalid: [
    // Bare `unknown` with no explanation — flagged, offered as a suggestion
    // (NOT an auto-fix) that inserts a neutral placeholder comment, never a
    // TODO/FIXME marker.
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
    // Multiple bare `unknown` tokens with no comments anywhere — each one is
    // flagged independently against the shared comment-line index
    {
      code: "let a: unknown;\nlet b: unknown;",
      errors: [
        {
          messageId: "avoidUnknownWithoutComment",
          suggestions: [
            {
              messageId: "addUnknownExplanationComment",
              output:
                "let a: // Explain why 'unknown' is used here, or replace it with a specific type\nunknown;\nlet b: unknown;",
            },
          ],
        },
        {
          messageId: "avoidUnknownWithoutComment",
          suggestions: [
            {
              messageId: "addUnknownExplanationComment",
              output:
                "let a: unknown;\nlet b: // Explain why 'unknown' is used here, or replace it with a specific type\nunknown;",
            },
          ],
        },
      ],
    },
  ],
});
