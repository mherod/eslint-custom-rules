import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-parenthesized-use-cache";

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
    {
      name: "Correct 'use cache' directive without parentheses",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
    },
    {
      name: "Function without 'use cache' directive",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
    },
    {
      name: "Regular string literal (not directive)",
      code: `
        function test() {
          const directive = "use cache";
          console.log(directive);
        }
      `,
    },
    {
      name: "Regular function call",
      code: `
        function test() {
          const result = ("some value");
          return result;
        }
      `,
    },
    {
      name: "Variable assignment with parentheses (should not trigger)",
      code: `
        const cacheDirective = ("use cache");
        console.log(cacheDirective);
      `,
    },
    {
      name: "Function call with arguments (should not trigger)",
      code: `
        function useCache(directive: string) {
          return directive;
        }
        const result = useCache("use cache");
      `,
    },
    {
      name: "Template literal with similar content",
      code: `
        const message = \`use cache\`;
        console.log(message);
      `,
    },
    {
      name: "Different string content",
      code: `
        ("use something else");
      `,
    },
    {
      name: "Valid 'use cache' directive (no parentheses)",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
    },
    {
      name: "Call expression with different string",
      code: `
        ("different string")();
      `,
    },
  ],
  invalid: [
    {
      name: "Valid 'use cache' in a function, then an invalid one",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache"; // Valid
          const data = await fetchData();
          ("use cache"); // Invalid - should trigger
          return NextResponse.json(data);
        }
      `,
      output: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache"; // Valid
          const data = await fetchData();
          "use cache"; // Invalid - should trigger
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Multiple statements - only the problematic one should trigger",
      code: `
        function setup() {
          const config = "use cache";
          ("use cache"); // This should trigger
          return config;
        }
      `,
      output: `
        function setup() {
          const config = "use cache";
          "use cache"; // This should trigger
          return config;
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' directive in function",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          ("use cache");
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      output: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' directive in arrow function",
      code: `
        const handler = async (request: NextRequest): Promise<NextResponse> => {
          ("use cache");
          const data = await fetchData();
          return NextResponse.json(data);
        };
      `,
      output: `
        const handler = async (request: NextRequest): Promise<NextResponse> => {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        };
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' directive in function expression",
      code: `
        const handler = async function (request: NextRequest): Promise<NextResponse> {
          ("use cache");
          const data = await fetchData();
          return NextResponse.json(data);
        };
      `,
      output: `
        const handler = async function (request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        };
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' with single quotes",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          ('use cache');
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      output: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' with extra whitespace",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          ( "use cache" );
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      output: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' in method",
      code: `
        class ApiHandler {
          async get(request: NextRequest): Promise<NextResponse> {
            ("use cache");
            const data = await fetchData();
            return NextResponse.json(data);
          }
        }
      `,
      output: `
        class ApiHandler {
          async get(request: NextRequest): Promise<NextResponse> {
            "use cache";
            const data = await fetchData();
            return NextResponse.json(data);
          }
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Multiple parentheses around 'use cache'",
      code: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          ((("use cache")));
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      output: `
        export async function GET(request: NextRequest): Promise<NextResponse> {
          "use cache";
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' in generator function",
      code: `
        function* generator(request: NextRequest): Generator<NextResponse> {
          ("use cache");
          const data = yield fetchData();
          return NextResponse.json(data);
        }
      `,
      output: `
        function* generator(request: NextRequest): Generator<NextResponse> {
          "use cache";
          const data = yield fetchData();
          return NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' in async generator",
      code: `
        async function* asyncGenerator(request: NextRequest): AsyncGenerator<NextResponse> {
          ("use cache");
          const data = await fetchData();
          yield NextResponse.json(data);
        }
      `,
      output: `
        async function* asyncGenerator(request: NextRequest): AsyncGenerator<NextResponse> {
          "use cache";
          const data = await fetchData();
          yield NextResponse.json(data);
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
    {
      name: "Parenthesized 'use cache' in nested function",
      code: `
        export function outer() {
          return async function inner(request: NextRequest): Promise<NextResponse> {
            ("use cache");
            const data = await fetchData();
            return NextResponse.json(data);
          };
        }
      `,
      output: `
        export function outer() {
          return async function inner(request: NextRequest): Promise<NextResponse> {
            "use cache";
            const data = await fetchData();
            return NextResponse.json(data);
          };
        }
      `,
      errors: [
        {
          messageId: "noParenthesizedUseCache",
        },
      ],
    },
  ],
});
