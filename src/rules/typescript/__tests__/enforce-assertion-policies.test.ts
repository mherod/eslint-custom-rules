import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-assertion-policies";

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
    // Constrained single-letter generic
    "function first<T extends object>(value: T): T { return value; }",

    // Descriptive multi-character generic without a constraint
    "function pick<TValue>(value: TValue): TValue { return value; }",

    // Asserting an identifier to a named type is allowed
    "const name = value as string;",
  ],
  invalid: [
    // Unconstrained single-letter generic
    {
      code: "function first<T>(value: T): T { return value; }",
      errors: [{ messageId: "missingGenericConstraint" }],
    },
    // Object literal asserted to a named type instead of as const
    {
      code: "const config = { retries: 3 } as RetryConfig;",
      errors: [{ messageId: "preferConstAssertion" }],
    },
    // Non-null assertion
    {
      code: "const name = user!.name;",
      errors: [{ messageId: "avoidNonNullAssertion" }],
    },
  ],
});
