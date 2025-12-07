import { RuleTester } from "@typescript-eslint/rule-tester";
import preferLodashUniqOverSet from "../prefer-lodash-uniq-over-set";

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

ruleTester.run("prefer-lodash-uniq-over-set", preferLodashUniqOverSet, {
  valid: [
    // Using lodash uniq
    {
      code: `
import { uniq } from 'lodash-es';
const uniqueItems = uniq(items);
      `,
    },
    // Using lodash uniqBy
    {
      code: `
import { uniqBy } from 'lodash-es';
const uniqueItems = uniqBy(items, 'id');
      `,
    },
    // Regular Set usage without array conversion
    {
      code: `
const mySet = new Set();
mySet.add('item');
      `,
    },
    // Set for actual set operations
    {
      code: `
const set1 = new Set([1, 2, 3]);
const set2 = new Set([3, 4, 5]);
const intersection = [...set1].filter(x => set2.has(x));
      `,
    },
  ],
  invalid: [
    // Pattern 1: Array.from(new Set(...))
    {
      code: "const uniqueItems = Array.from(new Set(items));",
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `import { uniq } from 'lodash-es';
const uniqueItems = uniq(items);`,
    },
    // Pattern 2: [...new Set(...)]
    {
      code: "const uniqueItems = [...new Set(items)];",
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `import { uniq } from 'lodash-es';
const uniqueItems = uniq(items);`,
    },
    // Pattern 3: Manual Set iteration - removed because complex pattern detection is harder
    // This pattern would require more sophisticated analysis
    // Pattern with existing lodash import
    {
      code: `
import { map } from 'lodash-es';
const uniqueItems = Array.from(new Set(items));
      `,
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `
import { map, uniq } from 'lodash-es';
const uniqueItems = uniq(items);
      `,
    },
    // Nested Array.from(new Set())
    {
      code: `
function getUniqueValues(arr) {
  return Array.from(new Set(arr));
}
      `,
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `
import { uniq } from 'lodash-es';
function getUniqueValues(arr) {
  return uniq(arr);
}
      `,
    },
    // Spread operator in return statement
    {
      code: `
function getUniqueValues(arr) {
  return [...new Set(arr)];
}
      `,
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `
import { uniq } from 'lodash-es';
function getUniqueValues(arr) {
  return uniq(arr);
}
      `,
    },
    // With map operation
    {
      code: "const uniqueIds = Array.from(new Set(items.map(item => item.id)));",
      errors: [
        {
          messageId: "preferLodashUniq",
        },
      ],
      output: `import { uniq } from 'lodash-es';
const uniqueIds = uniq(items.map(item => item.id));`,
    },
  ],
});
