import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-date-fns-over-date-operations";

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
    // Using date-fns functions instead of direct date operations
    {
      code: `
        import { compareAsc, compareDesc } from 'date-fns';
        results.sort(compareAsc);
      `,
    },
    {
      code: `
        import { isAfter, isBefore } from 'date-fns';
        const isLater = isAfter(date1, date2);
      `,
    },
    {
      code: `
        import { differenceInDays } from 'date-fns';
        const daysDiff = differenceInDays(date1, date2);
      `,
    },
    // Non-date operations should not trigger
    {
      code: `
        results.sort((a, b) => a.name.localeCompare(b.name));
      `,
    },
    {
      code: `
        const sum = a + b;
        const diff = x - y;
      `,
    },
    // Date operations that are not the problematic patterns
    {
      code: `
        const now = new Date();
        const timestamp = Date.now();
      `,
    },
  ],
  invalid: [
    // Sort with date operations - the exact pattern from the example
    {
      code: `
        results.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      `,
      errors: [
        {
          messageId: "preferDateFnsSort",
        },
      ],
    },
    // Other variations of sort with date operations
    {
      code: `
        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      `,
      errors: [
        {
          messageId: "preferDateFnsSort",
        },
      ],
    },
    // Date comparison operations
    {
      code: `
        if (new Date(a.timestamp) > new Date(b.timestamp)) {
          return true;
        }
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    {
      code: `
        const isNewer = new Date(item.created).getTime() >= new Date(other.created).getTime();
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    // Date arithmetic operations
    {
      code: `
        const timeDiff = new Date(end).getTime() - new Date(start).getTime();
      `,
      errors: [
        {
          messageId: "preferDateFnsSubtraction",
        },
      ],
    },
    {
      code: `
        const futureTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      `,
      errors: [
        {
          messageId: "preferDateFnsArithmetic",
        },
      ],
    },
    // Mixed scenarios
    {
      code: `
        const isOlder = date1.getTime() < date2.getTime();
        const sortedDates = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
        {
          messageId: "preferDateFnsSort",
        },
      ],
    },
  ],
});
