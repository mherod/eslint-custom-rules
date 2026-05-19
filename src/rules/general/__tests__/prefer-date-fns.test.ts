import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-date-fns";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
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
    // Unknown receivers may be non-Date values, so the rule stays conservative
    {
      code: `
        const formatted = value.toLocaleString();
        const dateString = value.toLocaleDateString();
        const timeString = value.toLocaleTimeString();
      `,
    },
    // Number formatting should not be converted to date-fns formatting
    {
      code: `
        const itemCount: number = 1000;
        const formatted = itemCount.toLocaleString();
        const element = <span>{itemCount.toLocaleString()} items</span>;
      `,
    },
  ],
  invalid: [
    // toLocaleDateString
    {
      code: `
        const date = new Date();
        const formatted = date.toLocaleDateString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const date = new Date();
        const formatted = format(date, 'PP');
      `,
    },
    // toLocaleTimeString
    {
      code: `
        const date = new Date();
        const time = date.toLocaleTimeString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const date = new Date();
        const time = format(date, 'PP');
      `,
    },
    // toLocaleString
    {
      code: `
        const date = new Date();
        const str = date.toLocaleString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const date = new Date();
        const str = format(date, 'PP');
      `,
    },
    // toDateString
    {
      code: `
        const date = new Date();
        const str = date.toDateString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const date = new Date();
        const str = format(date, 'PP');
      `,
    },
    // toTimeString
    {
      code: `
        const date = new Date();
        const str = date.toTimeString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const date = new Date();
        const str = format(date, 'PP');
      `,
    },
    // Direct new Date() receiver
    {
      code: `
        const str = new Date().toLocaleString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: `
        const str = format(new Date(), 'PP');
      `,
    },
    // toISOString
    {
      code: `
        const date: Date = getDate();
        const iso = date.toISOString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormatISO",
        },
      ],
      output: `
        const date: Date = getDate();
        const iso = formatISO(date);
      `,
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
      output: `
        const timestamp = parseISO('2023-01-01');
      `,
    },
    // Multiple violations
    {
      code: `
        const date = new Date();
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
      output: `
        const date = new Date();
        const dateStr = format(date, 'PP');
        const iso = formatISO(date);
        const parsed = parseISO('2023-01-01');
      `,
    },
  ],
});
