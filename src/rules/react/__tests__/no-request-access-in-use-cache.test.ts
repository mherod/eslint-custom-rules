import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-request-access-in-use-cache";

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
    // Function without "use cache" - can access request
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          const url = request.url;
          const referer = request.headers.get("referer");
          return NextResponse.json({ url, referer });
        }
      `,
    },
    // "use cache" function without Request parameter
    {
      code: `
        async function fetchData(): Promise<string> {
          "use cache";
          const data = await fetch('/api/data');
          return data.text();
        }
      `,
    },
    // "use cache" function that doesn't access Request properties
    {
      code: `
        async function fetchData(userId: string): Promise<string> {
          "use cache";
          const data = await fetch(\`/api/users/\${userId}\`);
          return data.text();
        }
      `,
    },
    // Extracting request data before cached function call (correct pattern)
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          const url = request.url;
          const referer = request.headers.get("referer");

          const data = await fetchCachedData(url, referer);
          return NextResponse.json(data);
        }

        async function fetchCachedData(url: string, referer: string | null): Promise<any> {
          "use cache";
          return await fetch('/api/data');
        }
      `,
    },
    // Non-Request parameter with similar name
    {
      code: `
        async function processData(requestData: { id: string }): Promise<string> {
          "use cache";
          return requestData.id;
        }
      `,
    },
  ],
  invalid: [
    // Accessing request.url in "use cache" function
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const url = request.url;
          return NextResponse.json({ url });
        }
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.url" },
        },
      ],
    },
    // Accessing request.headers in "use cache" function
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const referer = request.headers.get("referer");
          return NextResponse.json({ referer });
        }
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.headers" },
        },
      ],
    },
    // Accessing request.method in "use cache" function
    {
      code: `
        export async function handler(request: Request): Promise<Response> {
          "use cache";
          if (request.method === "POST") {
            return new Response("OK");
          }
          return new Response("Not allowed");
        }
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.method" },
        },
      ],
    },
    // Accessing headers() in "use cache" function
    {
      code: `
        export async function GET(): Promise<NextResponse> {
          "use cache";
          const headersList = headers();
          return NextResponse.json({ headers: headersList });
        }
      `,
      errors: [
        {
          messageId: "noHeadersAccessInUseCache",
        },
      ],
    },
    // Accessing cookies() in "use cache" function
    {
      code: `
        export async function GET(): Promise<NextResponse> {
          "use cache";
          const cookieStore = cookies();
          return NextResponse.json({ cookies: cookieStore });
        }
      `,
      errors: [
        {
          messageId: "noCookiesAccessInUseCache",
        },
      ],
    },
    // Multiple violations in one function
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const url = request.url;
          const referer = request.headers.get("referer");
          const method = request.method;
          return NextResponse.json({ url, referer, method });
        }
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.url" },
        },
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.headers" },
        },
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.method" },
        },
      ],
    },
    // Arrow function with "use cache"
    {
      code: `
        const handler = async (request: NextRequest): Promise<NextResponse> => {
          "use cache";
          const url = request.url;
          return NextResponse.json({ url });
        };
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.url" },
        },
      ],
    },
    // Accessing request.nextUrl (Next.js specific)
    {
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const pathname = request.nextUrl.pathname;
          return NextResponse.json({ pathname });
        }
      `,
      errors: [
        {
          messageId: "noRequestAccessInUseCache",
          data: { property: "request.nextUrl" },
        },
      ],
    },
  ],
});
