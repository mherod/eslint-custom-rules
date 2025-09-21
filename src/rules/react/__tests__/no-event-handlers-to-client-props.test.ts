import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-event-handlers-to-client-props";

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

ruleTester.run("no-event-handlers-to-client-props", rule, {
  valid: [
    // Client components can have event handlers
    {
      code: `
        "use client";
        function MyComponent() {
          const handleClick = () => {};
          return <Button onClick={handleClick} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // Server components with non-event props
    {
      code: `
        function MyComponent() {
          return <Button title="Save" description="Click to save" />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // Server components with string/number props
    {
      code: `
        function MyComponent() {
          const text = "Hello";
          return <Button actionButtonText={text} count={5} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // Server Action as inline function (should be allowed)
    {
      code: `
        function MyComponent() {
          return <Form onSubmit={async (formData) => {
            "use server";
            console.log(formData);
          }} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // Server Action as function reference (should be allowed)
    {
      code: `
        function MyComponent() {
          async function handleSubmit(formData) {
            "use server";
            console.log(formData);
          }
          return <Form onSubmit={handleSubmit} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // Server Action with different naming pattern (should be allowed)
    {
      code: `
        function MyComponent() {
          async function onEmailSubmit(email) {
            "use server";
            return { success: true };
          }
          return <EmailForm onEmailSubmit={onEmailSubmit} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
    },
    // API routes should be ignored (no JSX typically)
    {
      code: `
        export function GET() {
          const handler = () => {};
          return Response.json({ success: true });
        }
      `,
      filename: "/app/api/route.ts",
    },
  ],
  invalid: [
    // Arrow function event handler
    {
      code: `
        function MyComponent() {
          return <Button onClick={() => console.log('clicked')} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "function",
          },
        },
      ],
    },
    // Named function event handler
    {
      code: `
        function MyComponent() {
          const handleClick = () => {};
          return <Button onClick={handleClick} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "handleClick",
          },
        },
      ],
    },
    // Function expression
    {
      code: `
        function MyComponent() {
          return <Button onClick={function handleClick() {}} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "handleClick",
          },
        },
      ],
    },
    // useCallback hook
    {
      code: `
        function MyComponent() {
          const handleClick = useCallback(() => {}, []);
          return <Button onClick={handleClick} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "handleClick",
          },
        },
      ],
    },
    // Client-side event handlers (not server actions)
    {
      code: `
        function MyComponent() {
          const handleClick = () => {};
          const handleFocus = () => {};
          return <Button onClick={handleClick} onFocus={handleFocus} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "handleClick",
          },
        },
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onFocus",
            handlerName: "handleFocus",
          },
        },
      ],
    },
    // Custom event handler patterns
    {
      code: `
        function MyComponent() {
          const customClickHandler = () => {};
          const toggleHandler = () => {};
          return <Component clickHandler={customClickHandler} onToggle={toggleHandler} />;
        }
      `,
      filename: "/app/pages/MyPage.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "clickHandler",
            handlerName: "customClickHandler",
          },
        },
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onToggle",
            handlerName: "toggleHandler",
          },
        },
      ],
    },
    // Method from object
    {
      code: `
        function MyComponent() {
          const actions = {
            handleClick: () => {}
          };
          return <Button onClick={actions.handleClick} />;
        }
      `,
      filename: "/app/components/MyComponent.tsx",
      errors: [
        {
          messageId: "eventHandlerToClientProp",
          data: {
            propName: "onClick",
            handlerName: "handleClick",
          },
        },
      ],
    },
  ],
});
