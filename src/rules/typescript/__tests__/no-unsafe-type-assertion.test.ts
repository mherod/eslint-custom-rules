import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-unsafe-type-assertion";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("no-unsafe-type-assertion", rule, {
  valid: [
    // Accessing with a proper index signature — no cast needed
    "const obj: Record<string, unknown> = {}; const v = obj[key];",

    // as const — totally different use of 'as'
    "const x = { a: 1 } as const;",

    // as unknown as T — double-cast for test/opaque patterns, not Record bracket access
    "const x = (value as unknown as MyType).field;",

    // TSAsExpression not used for index access
    "const n = value as number;",
    "const s = value as string;",

    // Object.keys without cast — correct, intentional string[]
    "const keys = Object.keys(obj);",
    "const entries = Object.entries(obj);",

    // Object.keys cast to string[] — not keyof, fine
    "const keys = Object.keys(obj) as string[];",

    // Cast to (keyof T)[] where T is a named type (not typeof), less common but not the same smell
    "const keys = Object.keys(obj) as (keyof MyType)[];",

    // MemberExpression where the cast is not Record
    "const x = (obj as MyType)[key];",
    "const x = (obj as { [k: string]: number })[key];",

    // Non-computed member access on Record cast — common for narrowing, not bypass
    "const x = (obj as Record<string, unknown>).knownProp;",

    // Object.values / entries cast to non-keyof types
    "const vals = Object.values(obj) as number[];",
    "const entries = Object.entries(obj) as [string, number][];",
  ],
  invalid: [
    // Core pattern: (obj as Record<string, unknown>)[key]
    {
      code: "const v = (obj as Record<string, unknown>)[key];",
      errors: [{ messageId: "noIndexAccessCast" }],
    },
    // Variant: Record with different value type
    {
      code: "const v = (data as Record<string, number>)[prop];",
      errors: [{ messageId: "noIndexAccessCast" }],
    },
    // Inline expression
    {
      code: "return (this as Record<string, unknown>)[fieldName];",
      errors: [{ messageId: "noIndexAccessCast" }],
    },
    // The exact pattern from the issue prompt
    {
      code: "const val = (obj as Record<string, unknown>)[key];",
      errors: [{ messageId: "noIndexAccessCast" }],
    },

    // Core pattern: Object.keys(x) as (keyof typeof x)[]
    {
      code: "const keys = Object.keys(node) as (keyof typeof node)[];",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },
    // Object.keys with different variable name
    {
      code: "const keys = Object.keys(obj) as (keyof typeof obj)[];",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },
    // Array<keyof typeof x> spelling
    {
      code: "const keys = Object.keys(obj) as Array<keyof typeof obj>;",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },
    // Object.values variant
    {
      code: "const vals = Object.values(obj) as (keyof typeof obj)[];",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },
    // Object.entries variant
    {
      code: "const entries = Object.entries(obj) as (keyof typeof obj)[];",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },
    // The exact pattern from the issue prompt
    {
      code: "for (const key of Object.keys(node) as (keyof typeof node)[]) {}",
      errors: [{ messageId: "noObjectKeysKeyofCast" }],
    },

    // Parameters<typeof fn>[N] — extract and name instead
    {
      code: "type P = Parameters<typeof withQuery>[1];",
      errors: [
        {
          messageId: "noParametersTypeofIndexed",
          data: { utility: "Parameters", fn: "withQuery", index: "1" },
        },
      ],
    },
    {
      code: "type First = Parameters<typeof myFn>[0];",
      errors: [
        {
          messageId: "noParametersTypeofIndexed",
          data: { utility: "Parameters", fn: "myFn", index: "0" },
        },
      ],
    },
    // Inline in function parameter
    {
      code: "function wrap(opts: Parameters<typeof withQuery>[1]) {}",
      errors: [
        {
          messageId: "noParametersTypeofIndexed",
          data: { utility: "Parameters", fn: "withQuery", index: "1" },
        },
      ],
    },
    // ConstructorParameters variant
    {
      code: "type Arg = ConstructorParameters<typeof MyClass>[0];",
      errors: [
        {
          messageId: "noParametersTypeofIndexed",
          data: { utility: "ConstructorParameters", fn: "MyClass", index: "0" },
        },
      ],
    },
  ],
});
