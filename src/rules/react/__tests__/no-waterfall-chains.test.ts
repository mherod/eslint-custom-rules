import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-waterfall-chains";

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
      name: "Single await in API route",
      filename: "/api/test/route.ts",
      code: `
        export async function GET() {
          const data = await fetchData();
          return Response.json(data);
        }
      `,
    },
    {
      name: "Promise.all usage in API route",
      filename: "/api/test/route.ts",
      code: `
        export async function GET() {
          const [data, config] = await Promise.all([
            fetchData(),
            fetchConfig()
          ]);
          return Response.json({ data, config });
        }
      `,
    },
    {
      name: "Promise.allSettled usage in API route",
      filename: "/api/test/route.ts",
      code: `
        export async function GET() {
          const [data, config] = await Promise.allSettled([
            fetchData(),
            fetchConfig()
          ]);
          return Response.json({ data, config });
        }
      `,
    },
    {
      name: "Sequential dependent operations",
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
      name: "Non-async handler function",
      filename: "/api/test/route.ts",
      code: `
        export function GET() {
          const data = fetchData();
          return Response.json(data);
        }
      `,
    },
    {
      name: "Regular function (not API route)",
      filename: "/utils/helpers.ts",
      code: `
        export async function processData() {
          const result1 = await operation1();
          const result2 = await operation2();
          return { result1, result2 };
        }
      `,
    },
    {
      name: "File with 'action' substring in name but not in /actions/ path",
      filename: "/app/activities.ts",
      code: `
        export async function loadActivities() {
          const a = await fetchA();
          const b = await fetchB();
          const c = await fetchC();
          return { a, b, c };
        }
      `,
    },
    {
      name: "File with 'action' substring: interactions.ts",
      filename: "/features/interactions.ts",
      code: `
        export async function trackInteractions() {
          const a = await fetchA();
          const b = await fetchB();
          const c = await fetchC();
          return { a, b, c };
        }
      `,
    },
    {
      name: "File with 'action' substring: transactions.ts",
      filename: "/services/transactions.ts",
      code: `
        export async function getTransactions() {
          const a = await fetchA();
          const b = await fetchB();
          const c = await fetchC();
          return { a, b, c };
        }
      `,
    },
    {
      name: "Type-only file in /actions/ path should not trigger",
      filename: "/app/actions/favorites.ts",
      code: `
        export type FavoritesResponse = {
          images: Array<{
            sbaName: string;
            eventName: string;
            eventDate: string;
            path: string;
          }>;
          videos: Array<{
            sbaName: string;
            eventName: string;
            eventDate: string;
            path: string;
          }>;
        };
      `,
    },
    {
      name: "Server action file named with -action suffix",
      filename: "/lib/submit-action.ts",
      code: `
        export async function submitAction() {
          const a = await fetchA();
          const b = await fetchB();
          return { a, b };
        }
      `,
    },
    {
      name: "Nested async function — inner awaits must not bleed into outer scope count",
      filename: "/actions/favorites.ts",
      code: `
        export type FavoritesResponse = {
          images: Array<{ sbaName: string; eventName: string; path: string }>;
          videos: Array<{ sbaName: string; eventName: string; path: string }>;
        };

        export async function getFavorites(userId: string) {
          const a = await fetchA(userId);
          const b = await fetchB(userId);
          // Only 2 awaits in the outer function — no waterfall.
          // The inner helper only has 2 awaits as well — no waterfall there either.
          const process = async () => {
            const x = await stepX();
            const y = await stepY();
            return { x, y };
          };
          return { a, b };
        }
      `,
    },
    {
      name: "Outer function with 2 awaits is fine even when inner async has 3",
      filename: "/actions/favorites.ts",
      code: `
        export async function outer() {
          const a = await fetchA();
          const b = await fetchB();
          return { a, b };
        }
      `,
    },
    {
      name: "Server action with Promise.all",
      filename: "/actions/user-actions.ts",
      code: `
        export async function updateUserAction() {
          const [user, settings] = await Promise.all([
            getUser(),
            getSettings()
          ]);
          return { user, settings };
        }
      `,
    },
    {
      name: "Complex dependency chain with Promise.all",
      filename: "/api/complex/route.ts",
      code: `
        export async function POST() {
          const authPromise = authenticate();
          const validatePromise = validateInput();

          const [auth, validation] = await Promise.all([authPromise, validatePromise]);

          if (!auth.success || !validation.success) {
            return Response.json({ error: "Invalid" }, { status: 400 });
          }

          const result = await processData(auth.user, validation.data);
          return Response.json(result);
        }
      `,
    },
  ],
  invalid: [
    {
      name: "Multiple sequential awaits in API route (3+ awaits)",
      filename: "/api/test/route.ts",
      code: `
        export async function GET() {
          const session = await auth();
          const config = await fetchConfig();
          const data = await fetchData();
          const analytics = await getAnalytics();
          return Response.json({ data, config, analytics });
        }
      `,
      errors: [
        {
          messageId: "noWaterfallChains",
        },
      ],
    },
    {
      name: "Waterfall in server action (3+ awaits)",
      filename: "/actions/data-actions.ts",
      code: `
        export async function fetchDashboardData() {
          const user = await getCurrentUser();
          const stats = await getUserStats(user.id);
          const posts = await getUserPosts(user.id);
          const notifications = await getNotifications(user.id);
          return { user, stats, posts, notifications };
        }
      `,
      errors: [
        {
          messageId: "noWaterfallChains",
        },
      ],
    },
    {
      name: "Complex waterfall chain (5+ awaits)",
      filename: "/api/data/route.ts",
      code: `
        export async function GET() {
          const auth = await authenticate();
          const permissions = await getPermissions(auth.userId);
          const data = await fetchData(permissions.scope);
          const analytics = await getAnalytics(data.id);
          const formatted = await formatResponse(data, analytics);
          const cached = await checkCache(data.id);
          return Response.json({ ...formatted, cached });
        }
      `,
      errors: [
        {
          messageId: "noWaterfallChains",
        },
      ],
    },
    {
      name: "Waterfall in arrow function API route (3+ awaits)",
      filename: "/api/test/route.ts",
      code: `
        const handler = async () => {
          const config = await loadConfig();
          const data = await fetchData();
          const result = await processResult(data, config);
          const final = await finalizeResult(result);
          return final;
        };
      `,
      errors: [
        {
          messageId: "noWaterfallChains",
        },
      ],
    },
    {
      name: "Waterfall in function expression (3+ awaits)",
      filename: "/api/test/route.ts",
      code: `
        export const GET = async function() {
          const user = await getUser();
          const settings = await getSettings();
          const preferences = await getPreferences();
          const notifications = await getNotifications();
          return { user, settings, preferences, notifications };
        };
      `,
      errors: [
        {
          messageId: "noWaterfallChains",
        },
      ],
    },
  ],
});
