import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-boolean-coercion";

const tester = new RuleTester({
  languageOptions: { parser: require("@typescript-eslint/parser") },
});

tester.run("prefer-boolean-coercion", rule, {
  valid: [
    "const result = !!value;",
    "const result = Boolean();",
    "const result = Boolean(value, sideEffect());",
    "const result = Boolean(...values);",
    "const result = new Boolean(value);",
    "const result = object.Boolean(value);",
    "const result = Boolean?.(value);",
    "function convert(Boolean) { return Boolean(value); }",
    "const Boolean = custom; Boolean(value);",
    "import Boolean from 'custom'; Boolean(value);",
    "Boolean = custom; Boolean(value);",
  ],
  invalid: [
    ...[
      ["Boolean(value)", "!!value"],
      ["Boolean(getValue())", "!!getValue()"],
      ["Boolean(object?.value)", "!!object?.value"],
      ["Boolean(a || b)", "!!(a || b)"],
      ["Boolean(a ? b : c)", "!!(a ? b : c)"],
      ["Boolean((a, b))", "!!(a, b)"],
      ["Boolean(value as string)", "!!(value as string)"],
      ["Boolean(!value)", "!value"],
      ["Boolean(!!value)", "!!value"],
      ["Boolean(count++)", "!!count++"],
      ["Boolean(a /* keep */ + b)", "!!(a /* keep */ + b)"],
      ["Boolean(value).toString()", "(!!value).toString()"],
      ["Boolean(value)!.toString()", "(!!value)!.toString()"],
      ["Boolean(value)()", "(!!value)()"],
      ["Boolean(value) ** 2", "(!!value) ** 2"],
      ["Boolean(value) `text`", "(!!value) `text`"],
      ["Boolean(await value)", "!!(await value)"],
    ].map(([before, after]) => ({
      code: `const result = ${before};`,
      output: `const result = ${after};`,
      errors: [{ messageId: "preferShorter" as const }],
    })),
    {
      code: "const result = Boolean(/* keep */ value);",
      output: null,
      errors: [{ messageId: "preferShorter" }],
    },
    {
      code: "function custom(Boolean) { return Boolean(value); } const result = Boolean(value);",
      output:
        "function custom(Boolean) { return Boolean(value); } const result = !!value;",
      errors: [{ messageId: "preferShorter" }],
    },
  ],
});
