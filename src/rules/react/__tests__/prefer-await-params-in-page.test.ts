import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-await-params-in-page";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("prefer-await-params-in-page", rule, {
  valid: [
    // Async page — already compliant
    {
      code: `export default async function Page({ params }) {
        const { id } = await params;
        return <div>{id}</div>;
      }`,
      filename: "app/page.tsx",
    },
    // No params destructured
    {
      code: `export default function Page() {
        return <div>Hello</div>;
      }`,
      filename: "app/page.tsx",
    },
    // Not a page file — should not be checked
    {
      code: `export default function Component({ params }) {
        return <div>{params.id}</div>;
      }`,
      filename: "components/my-component.tsx",
    },
    // Delegation pattern — params passed as JSX prop (PPR pattern)
    {
      code: `export default function Page({ searchParams }) {
        return <HomeContent searchParams={searchParams} />;
      }`,
      filename: "app/page.tsx",
    },
    // Delegation pattern — params passed as JSX prop
    {
      code: `export default function Page({ params }) {
        return <Content params={params} />;
      }`,
      filename: "app/page.tsx",
    },
    // Delegation pattern — named props, member passed as JSX prop
    {
      code: `export default function Page(props) {
        return <Content searchParams={props.searchParams} />;
      }`,
      filename: "app/page.tsx",
    },
    // Delegation pattern — both params and searchParams delegated
    {
      code: `export default function Page({ params, searchParams }) {
        return <Content params={params} searchParams={searchParams} />;
      }`,
      filename: "app/page.tsx",
    },
    // Delegation pattern with Suspense wrapper (real PPR pattern from issue)
    {
      code: `export default function Home({ searchParams }) {
        return (
          <Suspense fallback={<Skeleton />}>
            <HomeContent searchParams={searchParams} />
          </Suspense>
        );
      }`,
      filename: "app/page.tsx",
    },
  ],
  invalid: [
    // Destructured params, not async, not delegated
    // (2 errors: FunctionDeclaration + ExportDefaultDeclaration both fire;
    //  fixes overlap at same position so ESLint deduplicates to one `async`)
    {
      code: `export default function Page({ params }) {
        return <div>{params.id}</div>;
      }`,
      filename: "app/page.tsx",
      errors: [{ messageId: "awaitParams" }, { messageId: "awaitParams" }],
      output: `export default async function Page({ params }) {
        return <div>{params.id}</div>;
      }`,
    },
    // Destructured searchParams, not async, not delegated
    {
      code: `export default function Page({ searchParams }) {
        const q = searchParams.q;
        return <div>{q}</div>;
      }`,
      filename: "app/page.tsx",
      errors: [{ messageId: "awaitParams" }, { messageId: "awaitParams" }],
      output: `export default async function Page({ searchParams }) {
        const q = searchParams.q;
        return <div>{q}</div>;
      }`,
    },
    // Named props, accessing props.params directly
    {
      code: `export default function Page(props) {
        return <div>{props.params.id}</div>;
      }`,
      filename: "app/page.tsx",
      errors: [{ messageId: "awaitParams" }, { messageId: "awaitParams" }],
      output: `export default async function Page(props) {
        return <div>{props.params.id}</div>;
      }`,
    },
    // Mixed usage — param used in JSX prop AND accessed directly (not pure delegation)
    {
      code: `export default function Page({ searchParams }) {
        console.log(searchParams);
        return <Content searchParams={searchParams} />;
      }`,
      filename: "app/page.tsx",
      errors: [{ messageId: "awaitParams" }, { messageId: "awaitParams" }],
      output: `export default async function Page({ searchParams }) {
        console.log(searchParams);
        return <Content searchParams={searchParams} />;
      }`,
    },
    // Named export — only fires once from FunctionDeclaration
    {
      code: `export function Page({ params }) {
        return <div>{params.id}</div>;
      }`,
      filename: "app/page.tsx",
      errors: [{ messageId: "awaitParams" }],
      output: `export async function Page({ params }) {
        return <div>{params.id}</div>;
      }`,
    },
  ],
});
