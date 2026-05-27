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
  ],
});
