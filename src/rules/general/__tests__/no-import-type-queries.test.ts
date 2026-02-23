import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-import-type-queries";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    {
      code: `
        import type { TikTokVideoRecord } from "@plugg/server-data";
        type Foo = TikTokVideoRecord[];
      `,
    },
    {
      code: `
        import type * as serverData from "@plugg/server-data";
        type Foo = serverData.TikTokVideoRecord;
      `,
    },
    {
      code: `
        type Foo = { bar: string };
      `,
    },
  ],
  invalid: [
    {
      code: `
        type Foo = import("@plugg/server-data").TikTokVideoRecord;
      `,
      errors: [
        {
          messageId: "noImportTypeQueries",
        },
      ],
    },
    {
      code: `
        const foo: import("@plugg/server-data").TikTokVideoRecord[] = [];
      `,
      errors: [
        {
          messageId: "noImportTypeQueries",
        },
      ],
    },
    {
      code: `
        type Foo = typeof import("@plugg/server-data");
      `,
      errors: [
        {
          messageId: "noImportTypeQueries",
        },
      ],
    },
    {
      code: `
        type Foo = import("@plugg/server-data").TikTokVideoRecord & import("@plugg/server-utils").Other;
      `,
      errors: [
        {
          messageId: "noImportTypeQueries",
        },
        {
          messageId: "noImportTypeQueries",
        },
      ],
    },
  ],
});
