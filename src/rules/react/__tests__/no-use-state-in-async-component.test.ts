import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-use-state-in-async-component";

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

ruleTester.run("no-use-state-in-async-component", rule, {
  valid: [
    // Non-async component with useState - should be allowed
    {
      code: `
        function MyComponent() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `,
    },
    // Non-async arrow function component with useState - should be allowed
    {
      code: `
        const MyComponent = () => {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        };
      `,
    },
    // Async component without useState - should be allowed
    {
      code: `
        async function MyComponent() {
          const data = await fetchData();
          return <div>{data}</div>;
        }
      `,
    },
    // Async arrow function component without useState - should be allowed
    {
      code: `
        const MyComponent = async () => {
          const data = await fetchData();
          return <div>{data}</div>;
        };
      `,
    },
    // Non-component async function with useState - should be allowed
    {
      code: `
        async function fetchUserData() {
          const [user, setUser] = useState(null);
          return user;
        }
      `,
    },
  ],
  invalid: [
    // Async function component with useState - should error
    {
      code: `
        async function MyComponent() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `,
      errors: [
        {
          messageId: "noUseStateInAsyncComponent",
        },
      ],
    },
    // Async arrow function component with useState - should error
    {
      code: `
        const MyComponent = async () => {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        };
      `,
      errors: [
        {
          messageId: "noUseStateInAsyncComponent",
        },
      ],
    },
    // Async component with React.useState - should error
    {
      code: `
        async function MyComponent() {
          const [state, setState] = React.useState(0);
          return <div>{state}</div>;
        }
      `,
      errors: [
        {
          messageId: "noUseStateInAsyncComponent",
        },
      ],
    },
    // Async component with multiple useState calls - should error on each
    {
      code: `
        async function MyComponent() {
          const [state1, setState1] = useState(0);
          const [state2, setState2] = useState("");
          return <div>{state1} {state2}</div>;
        }
      `,
      errors: [
        {
          messageId: "noUseStateInAsyncComponent",
        },
        {
          messageId: "noUseStateInAsyncComponent",
        },
      ],
    },
    // Export default async component with useState - should error
    {
      code: `
        export default async function() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `,
      errors: [
        {
          messageId: "noUseStateInAsyncComponent",
        },
      ],
    },
  ],
});
