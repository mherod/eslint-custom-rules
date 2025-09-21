import { RuleTester } from "@typescript-eslint/rule-tester";
import noUnstableMathRandom from "../no-unstable-math-random";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("no-unstable-math-random", noUnstableMathRandom, {
  valid: [
    // Non-component usage is fine
    {
      code: `
        const randomValue = Math.random();
        function helper() {
          return Math.random();
        }
      `,
    },
    // Usage in non-React functions is fine
    {
      code: `
        function calculateSomething() {
          return Math.random() * 100;
        }
      `,
    },
    // Usage in useMemo with empty deps is fine
    {
      code: `
        function MyComponent() {
          const value = useMemo(() => Math.random(), []);
          return <div>{value}</div>;
        }
      `,
    },
    // Usage outside component is fine
    {
      code: `
        const defaultValue = Math.random();
        function MyComponent() {
          return <div>{defaultValue}</div>;
        }
      `,
    },
  ],
  invalid: [
    // Direct usage in component render
    {
      code: `
        function MyComponent() {
          const value = Math.random();
          return <div>{value}</div>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInRender",
        },
      ],
    },
    // Usage in JSX expression
    {
      code: `
        function MyComponent() {
          return <div>{Math.random()}</div>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInJSX",
        },
      ],
    },
    // Usage in array selection
    {
      code: `
        function MyComponent() {
          const messages = ["Hello", "Hi", "Hey"];
          const message = messages[Math.floor(Math.random() * messages.length)];
          return <div>{message}</div>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInRender",
        },
      ],
    },
    // Usage in useMemo with dependencies
    {
      code: `
        function MyComponent({ data }) {
          const value = useMemo(() => Math.random() * data.length, [data]);
          return <div>{value}</div>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInUseMemo",
        },
      ],
    },
    // Usage in useCallback
    {
      code: `
        function MyComponent() {
          const handleClick = useCallback(() => {
            alert(Math.random());
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInUseCallback",
        },
      ],
    },
    // Real-world example from OnlineUsersBubble (before fix)
    {
      code: `
        function OnlineUsersBubble() {
          const getBubbleText = () => {
            const weekendMessages = [
              "Working at the weekend? Dedicated!",
              "Weekend warrior mode: activated",
            ];
            return weekendMessages[Math.floor(Math.random() * weekendMessages.length)];
          };
          return <div>{getBubbleText()}</div>;
        }
      `,
      errors: [
        {
          messageId: "avoidMathRandomInRender",
        },
      ],
    },
  ],
});
