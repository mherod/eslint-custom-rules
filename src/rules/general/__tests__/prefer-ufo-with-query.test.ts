import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-ufo-with-query";

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
    // Using withQuery from ufo
    {
      code: `
        import { withQuery } from 'ufo';
        const url = withQuery('/path', { key: 'value' });
      `,
    },
    // Regular string concatenation without query params
    {
      code: `
        const path = base + '/users';
      `,
    },
    // Template literals without query params
    {
      code: `
        const path = \`\${base}/users\`;
      `,
    },
  ],
  invalid: [
    // URLSearchParams constructor
    {
      code: `
        const params = new URLSearchParams({ key: 'value' });
      `,
      errors: [
        {
          messageId: "preferUfoWithQuery",
        },
      ],
    },
    // String concatenation with ? on right
    {
      code: `
        const url = base + '?key=value';
      `,
      errors: [
        {
          messageId: "preferUfoWithQuery",
        },
      ],
    },
    // String concatenation with ? on left
    {
      code: `
        const url = '/path?' + queryString;
      `,
      errors: [
        {
          messageId: "preferUfoWithQuery",
        },
      ],
    },
    // Template literal ending with ?
    {
      code: `
        const url = \`\${base}?\${queryString}\`;
      `,
      errors: [
        {
          messageId: "preferUfoWithQuery",
        },
      ],
    },
    // Template literal with ? in middle (ends with ? in quasi)
    {
      code: `
        const url = \`/path?\`;
      `,
      errors: [
        {
          messageId: "preferUfoWithQuery",
        },
      ],
    },
  ],
});
