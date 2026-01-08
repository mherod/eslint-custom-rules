import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-date-fns";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Using date-fns format
    {
      code: `
        import { format } from 'date-fns';
        const formatted = format(new Date(), 'yyyy-MM-dd');
      `,
    },
    // Using date-fns formatISO
    {
      code: `
        import { formatISO } from 'date-fns';
        const iso = formatISO(new Date());
      `,
    },
    // Using date-fns parseISO
    {
      code: `
        import { parseISO } from 'date-fns';
        const date = parseISO('2023-01-01');
      `,
    },
    // Other Date methods that are allowed
    {
      code: `
        const now = new Date();
        const timestamp = Date.now();
        const utc = Date.UTC(2023, 0, 1);
      `,
    },
    // getTime() is allowed
    {
      code: `
        const time = date.getTime();
      `,
    },
  ],
  invalid: [
    // toLocaleDateString
    {
      code: `
        const formatted = date.toLocaleDateString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
    },
    // toLocaleTimeString
    {
      code: `
        const time = date.toLocaleTimeString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
    },
    // toLocaleString
    {
      code: `
        const str = date.toLocaleString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
    },
    // toDateString
    {
      code: `
        const str = date.toDateString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
    },
    // toTimeString
    {
      code: `
        const str = date.toTimeString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
    },
    // toISOString
    {
      code: `
        const iso = date.toISOString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormatISO",
        },
      ],
    },
    // Date.parse
    {
      code: `
        const timestamp = Date.parse('2023-01-01');
      `,
      errors: [
        {
          messageId: "preferDateFnsParse",
        },
      ],
    },
    // Multiple violations
    {
      code: `
        const dateStr = date.toLocaleDateString();
        const iso = date.toISOString();
        const parsed = Date.parse('2023-01-01');
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
        {
          messageId: "preferDateFnsFormatISO",
        },
        {
          messageId: "preferDateFnsParse",
        },
      ],
    },
  ],
});
