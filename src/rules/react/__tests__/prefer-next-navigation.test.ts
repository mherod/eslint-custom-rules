import { RuleTester } from "@typescript-eslint/rule-tester";
import preferNextNavigation from "../prefer-next-navigation";

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

ruleTester.run("prefer-next-navigation", preferNextNavigation, {
  valid: [
    // Valid Next.js navigation patterns
    `
      import { useRouter } from 'next/navigation';
      const router = useRouter();
      router.push('/dashboard');
    `,
    `
      import { useRouter } from 'next/navigation';
      const router = useRouter();
      router.replace('/login');
    `,
    `
      import Link from 'next/link';
      <Link href="/about">About</Link>
    `,
    `
      import { redirect } from 'next/navigation';
      redirect('/dashboard');
    `,
    // Valid non-navigation window.location usage
    `
      const currentUrl = window.location.href;
    `,
    `
      const pathname = window.location.pathname;
    `,
    `
      console.log(location.origin);
    `,
    // Other valid patterns
    `
      const config = { location: '/api/endpoint' };
    `,
    `
      const obj = { href: 'https://example.com' };
      obj.href = 'https://newsite.com';
    `,
  ],
  invalid: [
    // window.location.href assignments
    {
      code: `window.location.href = '/dashboard';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    {
      code: `window.location.href = 'https://example.com';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // window.location.pathname assignments
    {
      code: `window.location.pathname = '/new-path';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // window.location.search assignments
    {
      code: `window.location.search = '?param=value';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // window.location.hash assignments
    {
      code: `window.location.hash = '#section';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // Direct window.location assignments
    {
      code: `window.location = '/dashboard';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    {
      code: `window.location = 'https://example.com';`,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // location.href assignments (without window prefix)
    {
      code: `location.href = '/dashboard';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    {
      code: `location.href = 'https://example.com';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // location.pathname assignments
    {
      code: `location.pathname = '/new-path';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // location.search assignments
    {
      code: `location.search = '?param=value';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // location.hash assignments
    {
      code: `location.hash = '#section';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // Direct location assignments
    {
      code: `location = '/dashboard';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    {
      code: `location = 'https://example.com';`,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // window.history methods
    {
      code: `window.history.pushState({}, '', '/new-path');`,
      errors: [{ messageId: "windowHistoryMethod" }],
    },
    {
      code: `window.history.replaceState({}, '', '/new-path');`,
      errors: [{ messageId: "windowHistoryMethod" }],
    },
    {
      code: `history.pushState({}, '', '/new-path');`,
      errors: [{ messageId: "historyMethod" }],
    },
    // Complex expressions
    {
      code: `
        function navigate() {
          window.location.href = '/dashboard';
        }
      `,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    {
      code: `
        const handleClick = () => {
          location.href = '/login';
        };
      `,
      errors: [
        {
          messageId: "locationAssignment",
        },
      ],
    },
    // Template literals
    {
      code: "window.location.href = `/user/${userId}`;",
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
    // Conditional assignments
    {
      code: `
        if (condition) {
          window.location.pathname = '/dashboard';
        }
      `,
      errors: [
        {
          messageId: "windowLocationAssignment",
        },
      ],
    },
  ],
});
