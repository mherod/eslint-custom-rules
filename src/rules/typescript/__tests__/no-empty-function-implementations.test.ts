import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-empty-function-implementations";

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

ruleTester.run("no-empty-function-implementations", rule, {
  valid: [
    // Functions with actual implementation
    {
      code: `
        const handler = () => {
          console.log('doing something');
        };
      `,
    },
    {
      code: `
        function myFunction() {
          return 'something';
        }
      `,
    },
    {
      code: `
        const obj = {
          method() {
            this.doSomething();
          }
        };
      `,
    },
    {
      code: `
        class MyClass {
          myMethod() {
            return this.value;
          }
        }
      `,
    },
    {
      code: `
        const arrow = () => 'expression body is fine';
      `,
    },
    {
      code: `
        const arrow = () => someValue;
      `,
    },
    // Functions with comments are still considered empty for our purposes
    // but this tests that the rule doesn't crash on them
  ],
  invalid: [
    {
      code: `
        const emptyArrow = () => {};
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "arrow function",
          },
        },
      ],
    },
    {
      code: `
        function emptyFunction() {}
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "function declaration",
          },
        },
      ],
    },
    {
      code: `
        const emptyFunctionExpr = function() {};
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "function expression",
          },
        },
      ],
    },
    {
      code: `
        const obj = {
          emptyMethod() {}
        };
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "object method",
          },
        },
      ],
    },
    {
      code: `
        class MyClass {
          emptyMethod() {}
        }
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "method",
          },
        },
      ],
    },
    {
      code: `
        const Component = () => {
          const handleClick = () => {};
          return <button onClick={handleClick}>Click</button>;
        };
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "arrow function",
          },
        },
      ],
    },
    // Multiple empty functions in one file
    {
      code: `
        const empty1 = () => {};
        const empty2 = function() {};
        function empty3() {}
      `,
      errors: [
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "arrow function",
          },
        },
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "function expression",
          },
        },
        {
          messageId: "emptyFunctionImplementation",
          data: {
            functionType: "function declaration",
          },
        },
      ],
    },
  ],
});
