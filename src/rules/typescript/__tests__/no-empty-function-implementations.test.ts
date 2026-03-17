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
      output: `
        const emptyArrow = () => {
  throw new Error("Not implemented");
};
      `,
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
      output: `
        function emptyFunction() {
  throw new Error("Not implemented");
}
      `,
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
      output: `
        const emptyFunctionExpr = function() {
  throw new Error("Not implemented");
};
      `,
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
      output: `
        const obj = {
          emptyMethod() {
  throw new Error("Not implemented");
}
        };
      `,
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
      output: `
        class MyClass {
          emptyMethod() {
  throw new Error("Not implemented");
}
        }
      `,
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
      output: `
        const Component = () => {
          const handleClick = () => {
  throw new Error("Not implemented");
};
          return <button onClick={handleClick}>Click</button>;
        };
      `,
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
      output: `
        const empty1 = () => {
  throw new Error("Not implemented");
};
        const empty2 = function() {
  throw new Error("Not implemented");
};
        function empty3() {
  throw new Error("Not implemented");
}
      `,
    },
  ],
});
