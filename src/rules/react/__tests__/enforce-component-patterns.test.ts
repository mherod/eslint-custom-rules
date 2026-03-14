import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../enforce-component-patterns";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("enforce-component-patterns", rule, {
  valid: [
    // export default function — should NOT flag as unexported
    {
      code: `
        import React from 'react';
        export default function BrandsPage() {
          return <div>Brands</div>;
        }
      `,
      filename: "/src/app/admin/brands/page.tsx",
    },
    // export default function in layout
    {
      code: `
        import React from 'react';
        export default function RootLayout({ children }: { children: React.ReactNode }) {
          return <html><body>{children}</body></html>;
        }
      `,
      filename: "/src/app/layout.tsx",
    },
    // Named export function
    {
      code: `
        import React from 'react';
        export function MyComponent() {
          return <div>Hello</div>;
        }
      `,
      filename: "/src/components/MyComponent.tsx",
    },
    // Arrow function with named export
    {
      code: `
        import React from 'react';
        export const MyComponent = () => {
          return <div>Hello</div>;
        };
      `,
      filename: "/src/components/MyComponent.tsx",
    },
    // export default with separate identifier
    {
      code: `
        import React from 'react';
        function MyComponent() {
          return <div>Hello</div>;
        }
        export default MyComponent;
      `,
      filename: "/src/components/MyComponent.tsx",
    },
    // Non-component file — rule does not apply
    {
      code: `
        export function fetchData() {
          return fetch('/api/data');
        }
      `,
      filename: "/src/utils/api.ts",
    },
  ],
  invalid: [
    // Component not exported at all
    {
      code: `
        import React from 'react';
        function MyComponent() {
          return <div>Hello</div>;
        }
      `,
      filename: "/src/components/MyComponent.tsx",
      errors: [{ messageId: "componentMustBeExported" }],
    },
  ],
});
