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
    // Mixed unions are not statically guaranteed to contain a Date
    {
      code: `
        declare const value: Date | number;
        const formatted = value.toLocaleString();
      `,
    },
    // Local type declarations named Date must not be treated as the built-in
    {
      code: `
        interface Date {
          toISOString(): string;
        }
        declare const value: Date;
        const formatted = value.toISOString();
      `,
    },
    // Local value bindings named Date must not be treated as the built-in
    {
      code: `
        function useCustomDate(
          Date: {
            new (): { toISOString(): string };
            parse(value: string): number;
          },
        ) {
          const formatted = new Date().toISOString();
          return [formatted, Date.parse(input)];
        }
      `,
    },
    // Reassigned inferred values are not safe to classify from their initializer
    {
      code: `
        let value = new Date();
        value = formatter;
        const formatted = value.toLocaleString();
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
      output: null,
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
      output: null,
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
      output: null,
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
      output: null,
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
      output: null,
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
      output: null,
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
      output: null,
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
      output: null,
    },
    // Date.parse remains numeric inside validation and arithmetic expressions
    {
      code: `
        const isInvalid = Number.isNaN(Date.parse(input));
        const expiresAt = Date.parse(input) + 30_000;
      `,
      errors: [
        {
          messageId: "preferDateFnsParse",
        },
        {
          messageId: "preferDateFnsParse",
        },
      ],
      output: null,
    },
    // Date.parse input semantics must not be rewritten implicitly
    {
      code: `
        const utc = Date.parse('2026-08-17T12:34:56.789Z');
        const offset = Date.parse('2026-08-17T12:34:56+01:00');
        const httpDate = Date.parse('Wed, 21 Oct 2015 07:28:00 GMT');
      `,
      errors: [
        {
          messageId: "preferDateFnsParse",
        },
        {
          messageId: "preferDateFnsParse",
        },
        {
          messageId: "preferDateFnsParse",
        },
      ],
      output: null,
    },
    // Native ISO output semantics must remain unchanged
    {
      code: `
        const iso = new Date('2026-08-17T12:34:56.789Z').toISOString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormatISO",
        },
      ],
      output: null,
    },
    // Statically known computed method names are equivalent to dot access
    {
      code: `
        const date = new Date();
        const formatted = date['toLocaleDateString']();
        const iso = date['toISOString']();
        const timestamp = Date['parse'](input);
        const globalIso = new globalThis.Date().toISOString();
        const globalTimestamp = globalThis.Date.parse(input);
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
        {
          messageId: "preferDateFnsFormatISO",
        },
        {
          messageId: "preferDateFnsParse",
        },
      ],
      output: null,
    },
    // Transparent TypeScript wrappers and nullish Date unions stay detectable
    {
      code: `
        declare const maybeDate: Date | undefined;
        const iso = maybeDate!['toISOString']();
        const formatted = maybeDate?.toLocaleDateString();
        const asserted = new Date() satisfies Date;
        const assertedFormat = asserted.toLocaleString();
      `,
      errors: [
        {
          messageId: "preferDateFnsFormatISO",
        },
        {
          messageId: "preferDateFnsFormat",
        },
        {
          messageId: "preferDateFnsFormat",
        },
      ],
      output: null,
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
      output: null,
    },
  ],
});
