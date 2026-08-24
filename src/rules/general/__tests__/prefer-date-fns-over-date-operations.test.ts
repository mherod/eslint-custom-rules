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
    // Unknown getTime methods are not necessarily Date operations
    {
      code: `
        const delta = clock.getTime() - baseline;
      `,
    },
    // Date identity and string coercion do not have equivalent date-fns operations
    {
      code: `
        const sameReference = new Date(a) === new Date(b);
        const label = new Date(a) + '';
      `,
    },
    // Date.parse diagnostics belong to the leaf prefer-date-fns rule
    {
      code: `
        const delta = Date.parse(a) - Date.parse(b);
      `,
    },
    // A local constructor named Date is not the built-in Date
    {
      code: `
        function compareCustomDates(
          Date: { new (value: string): { getTime(): number } },
        ) {
          return new Date(a).getTime() - new Date(b).getTime();
        }
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
    // An unrelated date-fns import must not disable native Date diagnostics
    {
      code: `
        const beforeImport = new Date(item.created) > new Date(other.created);
        import { format } from 'date-fns';
        const afterImport = new Date(item.updated) > new Date(other.updated);
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    // Proven Date identifiers are detected without requiring inline constructors
    {
      code: `
        const created = new Date(item.created);
        const updated: Date = getUpdatedDate();
        const isNewer = updated >= created;
        const isGlobalNewer = new globalThis.Date(a) > new globalThis.Date(b);
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    // Block-bodied arrow and function comparators receive one sort diagnostic each
    {
      code: `
        items.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        items.sort(function compare(a, b) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      `,
      errors: [
        {
          messageId: "preferDateFnsSort",
        },
        {
          messageId: "preferDateFnsSort",
        },
      ],
    },
    // Computed sort and toSorted calls use the same comparator contract
    {
      code: `
        items['sort'](
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        items.toSorted(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      `,
      errors: [
        {
          messageId: "preferDateFnsSort",
        },
        {
          messageId: "preferDateFnsSort",
        },
      ],
    },
    // Other Date expressions inside sort callbacks must not be hidden
    {
      code: `
        items.sort((a, b) => {
          if (new Date(a.date) > new Date(b.date)) {
            return 1;
          }
          return -1;
        });
      `,
      errors: [
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    // Computed getTime access and timestamp equality stay detectable
    {
      code: `
        const left: Date = getLeftDate();
        const right: Date = getRightDate();
        const delta = left['getTime']() - right.getTime();
        const isEqual = left.getTime() === right.getTime();
      `,
      errors: [
        {
          messageId: "preferDateFnsSubtraction",
        },
        {
          messageId: "preferDateFnsComparison",
        },
      ],
    },
    // Mixed scenarios
    {
      code: `
        const date1: Date = getDate1();
        const date2: Date = getDate2();
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
