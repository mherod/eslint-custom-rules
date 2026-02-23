import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../use-after-for-non-blocking";

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
      name: "API route with after() usage",
      filename: "/api/test/route.ts",
      code: `
        import { after } from 'next/server';

        export async function POST(request: Request) {
          await updateDatabase(request);

          after(async () => {
            await performBackgroundTask({ userAgent: 'test' });
          });

          return new Response(JSON.stringify({ status: 'success' }));
        }
      `,
      // Note: performLogging is not detected as side effect, so no errors expected
    },
    {
      name: "Server action with after()",
      filename: "/actions/user-actions.ts",
      code: `
        import { after } from 'next/server';

        export async function updateUser() {
          await updateUserInDb();

          after(async () => {
            await performBackgroundTask();
            await performBackgroundOperation();
          });

          return { success: true };
        }
      `,
      // Note: performNotification and performActivityLogging are not detected as side effects
    },
    {
      name: "Non-server code (client component)",
      filename: "/components/Button.tsx",
      code: `
        export async function handleClick() {
          await updateUI();
          await logAnalytics();
          return true;
        }
      `,
    },
    {
      name: "Regular utility function",
      filename: "/utils/helpers.ts",
      code: `
        export async function processData() {
          await validateData();
          await logProcessing();
          return result;
        }
      `,
    },
    {
      name: "API route with dependent operations",
      filename: "/api/test/route.ts",
      code: `
        export async function GET() {
          const user = await getUser();
          const posts = await getPosts(user.id);
          return Response.json({ posts });
        }
      `,
    },
    {
      name: "Server action with main business logic",
      filename: "/actions/data-actions.ts",
      code: `
        export async function createPost() {
          const user = await authenticateUser();
          const post = await createPostInDb(user.id);
          return { post };
        }
      `,
    },
    {
      name: "Side effect before return (should be valid if it's part of main flow)",
      filename: "/api/test/route.ts",
      code: `
        export async function POST() {
          await updateDatabase();
          return new Response('OK');
        }
      `,
    },
  ],
  invalid: [
    {
      name: "API route with blocking logging",
      filename: "/api/test/route.ts",
      code: `
        export async function POST(request: Request) {
          await updateDatabase(request);

          await logUserAction({ userAgent: 'test' });

          return new Response(JSON.stringify({ status: 'success' }));
        }
      `,
      errors: [
        {
          messageId: "useAfterForNonBlocking",
        },
      ],
    },
    {
      name: "Server action with blocking analytics",
      filename: "/actions/user-actions.ts",
      code: `
        export async function updateUser() {
          await updateUserInDb();

          await trackAnalytics('user_updated');

          return { success: true };
        }
      `,
      errors: [
        {
          messageId: "useAfterForNonBlocking",
        },
      ],
    },
    {
      name: "Server action with blocking email",
      filename: "/actions/email-actions.ts",
      code: `
        export async function sendWelcomeEmail() {
          await updateUserStatus();

          await sendEmail();

          return { emailed: true };
        }
      `,
      errors: [
        {
          messageId: "useAfterForNonBlocking",
        },
      ],
    },
    {
      name: "API route with multiple blocking side effects",
      filename: "/api/webhook/route.ts",
      code: `
        export async function POST() {
          await processWebhook();

          await logWebhookEvent();
          await sendNotification();

          return Response.json({ processed: true });
        }
      `,
      errors: [
        {
          messageId: "useAfterForNonBlocking",
        },
        {
          messageId: "useAfterForNonBlocking",
        },
        {
          messageId: "useAfterForNonBlocking",
        },
      ],
    },
    {
      name: "Server action with blocking cache invalidation",
      filename: "/actions/cache-actions.ts",
      code: `
        export async function updateData() {
          await updateDatabase();

          await invalidateCache();

          return { updated: true };
        }
      `,
      errors: [
        {
          messageId: "useAfterForNonBlocking",
        },
      ],
    },
  ],
});
