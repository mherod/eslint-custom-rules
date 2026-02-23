import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-zod-url";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    "const schema = z.object({ avatarUrl: z.url() });",
    "const schema = z.object({ avatarUrl: z.string().url() });",
    "const schema = z.object({ name: z.string() });",
    "const schema = z.object({ url: z.string() });", // "url" doesn't end with "Url"
  ],
  invalid: [
    {
      code: "const schema = z.object({ avatarUrl: z.string() });",
      output: "const schema = z.object({ avatarUrl: z.url() });",
      errors: [{ messageId: "preferZodUrl" }],
    },
    {
      code: "const schema = z.object({ avatarUrl: z.string().optional() });",
      output: "const schema = z.object({ avatarUrl: z.url().optional() });",
      errors: [{ messageId: "preferZodUrl" }],
    },
    {
      code: "const schema = z.object({ callbackUrl: z.string().min(1) });",
      output: "const schema = z.object({ callbackUrl: z.url().min(1) });",
      errors: [{ messageId: "preferZodUrl" }],
    },
  ],
});
