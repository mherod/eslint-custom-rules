import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-async-server-component-in-client";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // ==========================================
    // SAFE CLIENT COMPONENT PATTERNS
    // ==========================================

    {
      name: "Pure client component with useState",
      filename: "/app/components/ClientCounter.tsx",
      code: `
        "use client";
        import { useState } from "react";

        export function ClientCounter() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
      `,
    },

    {
      name: "Client component with Suspense for client-side data fetching",
      filename: "/app/components/ClientDataFetcher.tsx",
      code: `
        "use client";
        import { Suspense } from "react";
        import { useSWR } from "swr";

        function ClientDataDisplay() {
          const { data } = useSWR("/api/client-data", fetcher);
          return <div>{data}</div>;
        }

        export function ClientDataFetcher() {
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <ClientDataDisplay />
            </Suspense>
          );
        }
      `,
    },

    {
      name: "Client component with async function that doesn't return JSX",
      filename: "/app/components/ClientAsyncUtil.tsx",
      code: `
        "use client";

        async function fetchData() {
          return await fetch("/api/data").then(r => r.json());
        }

        export function ClientAsyncUtil() {
          const handleClick = async () => {
            const data = await fetchData();
            console.log(data);
          };
          return <button onClick={handleClick}>Fetch</button>;
        }
      `,
    },

    // ==========================================
    // SERVER COMPONENTS (should not be flagged)
    // ==========================================

    {
      name: "Server component without 'use client'",
      filename: "/app/components/ServerComponent.tsx",
      code: `
        import { asyncServerComponent } from "./async-server-component";

        export function ServerWrapper() {
          return <asyncServerComponent />;
        }
      `,
    },

    // ==========================================
    // ACTIONS ARE ALLOWED (server actions CAN be called from client)
    // ==========================================

    {
      name: "Client component importing from actions directory (allowed - server actions are callable)",
      filename: "/app/components/ActionImporter.tsx",
      code: `
        "use client";
        import { updatePost } from "@/lib/actions/post-actions";

        export function ActionImporter() {
          return <button onClick={() => updatePost()}>Update</button>;
        }
      `,
    },
  ],

  invalid: [
    // ==========================================
    // REACT.LAZY() DETECTION
    // ==========================================

    {
      name: "React.lazy() loading server component",
      filename: "/app/components/LazyServerLoader.tsx",
      code: `
        "use client";
        import React from "react";

        const LazyServerComponent = React.lazy(() => import("./server-data"));

        export function LazyServerLoader() {
          return <LazyServerComponent />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "LazyServerComponent",
            importSource: "react-lazy-dynamic-import",
          },
        },
      ],
    },

    {
      name: "lazy() import (destructured) loading server component",
      filename: "/app/components/LazyDestructured.tsx",
      code: `
        "use client";
        import { lazy } from "react";

        const LazyServerData = lazy(() => import("./server-data-component"));

        export function LazyDestructured() {
          return <LazyServerData />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "LazyServerData",
            importSource: "react-lazy-dynamic-import",
          },
        },
      ],
    },

    // ==========================================
    // ASYNC COMPONENT DETECTION
    // ==========================================

    {
      name: "Async function declaration component",
      filename: "/app/components/AsyncFunctionDeclaration.tsx",
      code: `
        "use client";

        async function AsyncServerComponent() {
          const data = await fetch("/api/data");
          return <div>{data}</div>;
        }

        export function ClientWrapper() {
          return <AsyncServerComponent />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "AsyncServerComponent",
            importSource: "async-component",
          },
        },
      ],
    },

    {
      name: "Async arrow function component",
      filename: "/app/components/AsyncArrowFunction.tsx",
      code: `
        "use client";

        const AsyncServerArrow = async () => {
          const data = await fetch("/api/data");
          return <div>{data}</div>;
        };

        export function ClientWrapper() {
          return <AsyncServerArrow />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "AsyncServerArrow",
            importSource: "async-component",
          },
        },
      ],
    },

    {
      name: "Async arrow function without braces",
      filename: "/app/components/AsyncArrowNoBraces.tsx",
      code: `
        "use client";

        const AsyncServerArrow = async () =>
          <div>{await fetch("/api/data")}</div>;

        export function ClientWrapper() {
          return <AsyncServerArrow />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "AsyncServerArrow",
            importSource: "async-component",
          },
        },
      ],
    },

    // ==========================================
    // IMPORT PATTERN DETECTION
    // ==========================================

    {
      name: "Import from *-data.tsx file",
      filename: "/app/components/DataImporter.tsx",
      code: `
        "use client";
        import { CampaignsListData } from "./campaigns-list-data";

        export function DataImporter() {
          return <CampaignsListData />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "CampaignsListData",
            importSource: "./campaigns-list-data",
          },
        },
      ],
    },

    {
      name: "Import from /lib/data/ directory",
      filename: "/app/components/LibDataImporter.tsx",
      code: `
        "use client";
        import { UserData } from "@/lib/data/user-data";

        export function LibDataImporter() {
          return <UserData />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "UserData",
            importSource: "@/lib/data/user-data",
          },
        },
      ],
    },

    {
      name: "Import from repositories directory",
      filename: "/app/components/RepoImporter.tsx",
      code: `
        "use client";
        import { PostRepository } from "@/repositories/post-repository";

        export function RepoImporter() {
          return <PostRepository />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "PostRepository",
            importSource: "@/repositories/post-repository",
          },
        },
      ],
    },

    {
      name: "Import from server directory",
      filename: "/app/components/ServerImporter.tsx",
      code: `
        "use client";
        import { ServerComponent } from "@/server/server-component";

        export function ServerImporter() {
          return <ServerComponent />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "ServerComponent",
            importSource: "@/server/server-component",
          },
        },
      ],
    },

    {
      name: "Import server- prefixed module",
      filename: "/app/components/ServerPrefixImporter.tsx",
      code: `
        "use client";
        import { DataComponent } from "./server-data-component";

        export function ServerPrefixImporter() {
          return <DataComponent />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "DataComponent",
            importSource: "./server-data-component",
          },
        },
      ],
    },

    // ==========================================
    // EDGE CASES
    // ==========================================

    {
      name: "Nested async component in conditional",
      filename: "/app/components/ConditionalAsync.tsx",
      code: `
        "use client";

        const AsyncServerComponent = async () => {
          return condition ? <div>One</div> : <span>Two</span>;
        };

        export function ConditionalAsync() {
          return <AsyncServerComponent />;
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "AsyncServerComponent",
            importSource: "async-component",
          },
        },
      ],
    },

    {
      name: "Multiple violations in one file",
      filename: "/app/components/MultipleViolations.tsx",
      code: `
        "use client";
        import { DataComponent } from "./server-data";
        import { lazy } from "react";

        const LazyServer = lazy(() => import("./server-component"));
        const AsyncServer = async () => <div>async</div>;

        export function MultipleViolations() {
          return (
            <>
              <DataComponent />
              <LazyServer />
              <AsyncServer />
            </>
          );
        }
      `,
      errors: [
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "DataComponent",
            importSource: "./server-data",
          },
        },
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "LazyServer",
            importSource: "react-lazy-dynamic-import",
          },
        },
        {
          messageId: "asyncServerComponentInClient",
          data: {
            componentName: "AsyncServer",
            importSource: "async-component",
          },
        },
      ],
    },
  ],
});
