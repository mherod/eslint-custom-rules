import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-deprecated-declarations";

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
      name: "local deprecated helper",
      code: `
        /** @deprecated Use newHelper instead */
        function helper() {}
      `,
    },
    {
      name: "exported but undocumented",
      code: `
        export const current = () => {};
      `,
    },
  ],
  invalid: [
    {
      name: "deprecated exported const",
      code: `
        /** @deprecated Use new thing */
        export const oldThing = 42;
      `,
      errors: [
        {
          messageId: "deprecatedDeclaration",
        },
      ],
    },
    {
      name: "deprecated exported function",
      code: `
        /** @deprecated Use newFunction */
        export function oldFunction() {}
      `,
      errors: [
        {
          messageId: "deprecatedDeclaration",
        },
      ],
    },
    {
      name: "deprecated exported default class",
      code: `
        /** @deprecated Use ModernClass */
        export default class OldClass {}
      `,
      errors: [
        {
          messageId: "deprecatedDeclaration",
        },
      ],
    },
    {
      name: "deprecated exported type alias",
      code: `
        /** @deprecated Use NewType */
        export type OldType = string;
      `,
      errors: [
        {
          messageId: "deprecatedDeclaration",
        },
      ],
    },
  ],
});
