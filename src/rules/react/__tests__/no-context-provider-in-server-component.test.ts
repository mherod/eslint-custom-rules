import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-context-provider-in-server-component";

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

// Server component filename (App Router page — isServerComponent returns true)
const SERVER_FILE = "/src/app/dashboard/page.tsx";

ruleTester.run("no-context-provider-in-server-component", rule, {
  valid: [
    // createContext in a Client Component (has "use client") — allowed
    {
      code: `
        "use client";
        import { createContext } from "react";
        const MyContext = createContext(null);
      `,
      filename: SERVER_FILE,
    },
    // <Context.Provider> in a Client Component — allowed
    {
      code: `
        "use client";
        export default function MyProvider({ children }) {
          return <MyContext.Provider value={null}>{children}</MyContext.Provider>;
        }
      `,
      filename: SERVER_FILE,
    },
    // createContext in a plain utility file (not a server component path) — not flagged
    {
      code: `
        import { createContext } from "react";
        export const MyContext = createContext(null);
      `,
      filename: "/src/lib/context.ts",
    },
    // JSX without Provider in server component — allowed
    {
      code: `
        export default async function Page() {
          return <div className="page"><h1>Hello</h1></div>;
        }
      `,
      filename: SERVER_FILE,
    },
    // <Something.Consumer> (not Provider) in server component — not flagged
    {
      code: `
        export default async function Page() {
          return <MyContext.Consumer>{(v) => <span>{v}</span>}</MyContext.Consumer>;
        }
      `,
      filename: SERVER_FILE,
    },
    // Named .client. file — isClientComponent returns true, rule skips it
    {
      code: `
        import { createContext } from "react";
        const MyContext = createContext(null);
        export default function MyProvider({ children }) {
          return <MyContext.Provider value={null}>{children}</MyContext.Provider>;
        }
      `,
      filename: "/src/components/my-provider.client.tsx",
    },
  ],
  invalid: [
    // createContext called in a Server Component page
    {
      code: `
        import { createContext } from "react";
        const MyContext = createContext(null);
        export default async function Page() {
          return <div />;
        }
      `,
      filename: SERVER_FILE,
      errors: [{ messageId: "contextInServerComponent" }],
    },
    // <Context.Provider> rendered in a Server Component page
    {
      code: `
        export default async function Page() {
          return <MyContext.Provider value={null}><div /></MyContext.Provider>;
        }
      `,
      filename: SERVER_FILE,
      errors: [{ messageId: "contextInServerComponent" }],
    },
    // Both createContext and <Provider> in the same server file — two errors
    {
      code: `
        import { createContext } from "react";
        const Ctx = createContext(null);
        export default async function Page() {
          return <Ctx.Provider value={null}><div /></Ctx.Provider>;
        }
      `,
      filename: SERVER_FILE,
      errors: [
        { messageId: "contextInServerComponent" },
        { messageId: "contextInServerComponent" },
      ],
    },
    // createContext in server /components/ directory (treated as server component)
    {
      code: `
        import { createContext } from "react";
        export const MyContext = createContext(null);
      `,
      filename: "/src/components/my-context.tsx",
      errors: [{ messageId: "contextInServerComponent" }],
    },
  ],
});
