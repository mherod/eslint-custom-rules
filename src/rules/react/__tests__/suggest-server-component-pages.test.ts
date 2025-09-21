import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../suggest-server-component-pages";

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

ruleTester.run("suggest-server-component-pages", rule, {
  valid: [
    // Server Component page.tsx (no "use client")
    {
      filename: "/project/app/dashboard/page.tsx",
      code: `
        import { Metadata } from 'next';
        import ClientComponent from './client-component';
        
        export const metadata: Metadata = {
          title: 'Dashboard'
        };
        
        export default function DashboardPage() {
          return (
            <div>
              <h1>Dashboard</h1>
              <ClientComponent />
            </div>
          );
        }
      `,
    },
    // Non-page file with "use client" (allowed)
    {
      filename: "/project/app/components/button.tsx",
      code: `
        "use client";
        
        export default function Button() {
          return <button>Click me</button>;
        }
      `,
    },
    // Page file outside app directory (not App Router)
    {
      filename: "/project/pages/dashboard.tsx",
      code: `
        "use client";
        
        export default function DashboardPage() {
          return <div>Dashboard</div>;
        }
      `,
    },
    // Layout file with "use client" (allowed, though unusual)
    {
      filename: "/project/app/dashboard/layout.tsx",
      code: `
        "use client";
        
        export default function DashboardLayout({ children }: { children: React.ReactNode }) {
          return <div>{children}</div>;
        }
      `,
    },
  ],
  invalid: [
    // App Router page.tsx with "use client"
    {
      filename: "/project/app/dashboard/page.tsx",
      code: `"use client";

import { useState } from 'react';

export default function DashboardPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}`,
      errors: [
        {
          messageId: "useClientInPageFile",
          suggestions: [
            {
              messageId: "considerServerComponent",
              output: `
import { useState } from 'react';

export default function DashboardPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}`,
            },
          ],
        },
      ],
    },
    // Root app page with "use client"
    {
      filename: "/project/app/page.tsx",
      code: `"use client";

export default function HomePage() {
  return <div>Home</div>;
}`,
      errors: [
        {
          messageId: "useClientInPageFile",
          suggestions: [
            {
              messageId: "considerServerComponent",
              output: `
export default function HomePage() {
  return <div>Home</div>;
}`,
            },
          ],
        },
      ],
    },
    // Nested app page with "use client"
    {
      filename: "/project/app/admin/users/page.tsx",
      code: `"use client";

import { useEffect } from 'react';

export default function UsersPage() {
  useEffect(() => {
    console.log('Component mounted');
  }, []);
  
  return <div>Users</div>;
}`,
      errors: [
        {
          messageId: "useClientInPageFile",
          suggestions: [
            {
              messageId: "considerServerComponent",
              output: `
import { useEffect } from 'react';

export default function UsersPage() {
  useEffect(() => {
    console.log('Component mounted');
  }, []);
  
  return <div>Users</div>;
}`,
            },
          ],
        },
      ],
    },
  ],
});
