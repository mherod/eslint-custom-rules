import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-complex-type-gymnastics";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("no-complex-type-gymnastics", rule, {
  valid: [
    // Simple types — no nesting
    "type Name = string;",
    "type Id = number | null;",
    "const x: string = 'hello';",

    // Depth 1 — single generic wrapper
    "type Items = Array<string>;",
    "type MaybeUser = Promise<User>;",
    "const fn = (): Promise<void> => {};",

    // Depth 2 — two levels of nesting (under default threshold of 3)
    "type Data = Partial<Pick<User, 'name'>>;",
    "type Result = Promise<Array<string>>;",
    "type Keys = Record<string, Array<number>>;",

    // typeof alone is depth 1, not flagged
    "type FnType = typeof myFunction;",
    "type RT = ReturnType<typeof myFunction>;",

    // Union/intersection at top level don't add depth
    "type Combined = Partial<User> | null;",
    "type Merged = Pick<User, 'name'> & Pick<Post, 'title'>;",

    // Custom maxDepth option — allows deeper nesting
    {
      code: "type Deep = Awaited<ReturnType<typeof fetchData>>;",
      options: [{ maxDepth: 4 }],
    },

    // Function types, tuple types — structural, not gymnastics
    "type Fn = (a: string) => Promise<number>;",
    "type Pair = [string, number];",

    // Mapped and conditional types at top level
    "type Nullable<T> = T | null;",
    "type ReadonlyObj = Readonly<{ name: string }>;",

    // Interface property with shallow nesting — fine
    "interface Props { data: Partial<User>; }",
  ],
  invalid: [
    // Depth 3: Awaited<ReturnType<typeof fn>> — the canonical ugly pattern
    {
      code: "type PrDetail = Awaited<ReturnType<typeof fetchPrDetailViaStore>>;",
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "3", maxDepth: "3" },
        },
      ],
    },

    // Depth 3 with union — union doesn't reduce the nesting
    {
      code: "type MaybePr = Awaited<ReturnType<typeof fetchPrDetail>> | null;",
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "3", maxDepth: "3" },
        },
      ],
    },

    // Depth 3: nested generics without typeof
    {
      code: "type Nested = Record<string, Array<Partial<User>>>;",
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "3", maxDepth: "3" },
        },
      ],
    },

    // Depth 4: even deeper nesting
    {
      code: "type VeryDeep = Awaited<ReturnType<typeof getItems>>[];",
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "3", maxDepth: "3" },
        },
      ],
    },

    // Variable annotation (not just type alias)
    {
      code: "const data: Awaited<ReturnType<typeof fetchData>> = await fetchData();",
      errors: [
        {
          messageId: "typeNestingTooDeep",
        },
      ],
    },

    // Function return type annotation
    {
      code: "function get(): Awaited<ReturnType<typeof fetchData>> { return fetchData(); }",
      errors: [
        {
          messageId: "typeNestingTooDeep",
        },
      ],
    },

    // Function parameter type annotation
    {
      code: "function process(data: Awaited<ReturnType<typeof fetchData>>): void {}",
      errors: [
        {
          messageId: "typeNestingTooDeep",
        },
      ],
    },

    // Custom maxDepth of 2 catches shallower nesting
    {
      code: "type Shallow = Partial<Pick<User, 'name'>>;",
      options: [{ maxDepth: 2 }],
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "2", maxDepth: "2" },
        },
      ],
    },

    // Extract + ReturnType combo
    {
      code: "type Extracted = Extract<ReturnType<typeof handler>, { ok: true }>;",
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "3", maxDepth: "3" },
        },
      ],
    },

    // Parameters indexed access — depth 2 at default, but flagged at maxDepth 2
    {
      code: "type FirstArg = Parameters<typeof myFunction>[0];",
      options: [{ maxDepth: 2 }],
      errors: [
        {
          messageId: "typeNestingTooDeep",
          data: { depth: "2", maxDepth: "2" },
        },
      ],
    },
  ],
});
