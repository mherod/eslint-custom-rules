import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-zod-default-with-catch";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Has catch after default
    "z.string().default('foo').catch('foo');",
    // Has catch before default
    "z.string().catch('foo').default('foo');",
    // Not a zod chain (hopefully)
    "something.default('foo');",
    // Zod chain without default
    "z.string();",
    // Catch with function
    "z.string().default('foo').catch(() => 'foo');",
  ],
  invalid: [
    {
      code: "z.string().default('foo');",
      output: "z.string().default('foo').catch(() => 'foo');",
      errors: [{ messageId: "preferZodDefaultWithCatch" }],
    },
    {
      code: "z.number().min(5).default(10);",
      output: "z.number().min(5).default(10).catch(() => 10);",
      errors: [{ messageId: "preferZodDefaultWithCatch" }],
    },
    {
      code: "z.boolean().default(false);",
      output: "z.boolean().default(false).catch(() => false);",
      errors: [{ messageId: "preferZodDefaultWithCatch" }],
    },
    {
      code: "string().default('test');", // chained on imported function
      output: "string().default('test').catch(() => 'test');",
      errors: [{ messageId: "preferZodDefaultWithCatch" }],
    },
    {
      code: "const DEFAULT = 'bar'; z.string().default(DEFAULT);",
      output:
        "const DEFAULT = 'bar'; z.string().default(DEFAULT).catch(() => DEFAULT);",
      errors: [{ messageId: "preferZodDefaultWithCatch" }],
    },
  ],
});
