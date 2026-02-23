import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../enforce-use-server-vs-server-only";

/**
 * These tests verify the critical distinction between 'use server' and 'server-only':
 *
 * 'use server' (Server Actions) - COMMUNICATION
 * - Marks functions as server-side entry points that clients CAN call
 * - Creates API-like endpoints for form submissions, mutations, etc.
 *
 * 'server-only' (Security Guardrail) - ISOLATION
 * - Build-time protection to prevent code from leaking to client bundles
 * - Triggers a build error if accidentally imported by a client component
 *
 * Key rule: These should NEVER be used together - they contradict each other.
 */

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

ruleTester.run("enforce-use-server-vs-server-only", rule, {
  valid: [
    // ==========================================
    // CORRECT: Action file with 'use server'
    // ==========================================
    {
      name: "Action file with 'use server' directive (correct)",
      filename: "/app/actions/user.action.ts",
      code: `
        "use server";

        export async function updateUser(formData: FormData) {
          // Server action logic - callable from client
        }
      `,
    },
    {
      name: "Action file in lib/actions with 'use server' (correct)",
      filename: "/app/lib/actions/posts.ts",
      code: `
        "use server";

        export async function deletePost(formData: FormData) {
          // Delete post action
        }

        export async function createPost(formData: FormData) {
          // Create post action
        }
      `,
    },
    {
      name: "Action file with Request parameter (correct)",
      filename: "/app/actions/api.action.ts",
      code: `
        "use server";

        export async function handleWebhook(request: Request) {
          // Process webhook
        }
      `,
    },
    {
      name: "Action file with NextRequest parameter (correct)",
      filename: "/app/actions/next-api.action.ts",
      code: `
        "use server";

        export async function handleNextRequest(request: NextRequest) {
          // Process Next.js request
        }
      `,
    },
    {
      name: "Action file with useActionState pattern (prevState, FormData) (correct)",
      filename: "/app/lib/actions/pin.ts",
      code: `
        "use server";

        export async function validatePin(
          prevState: unknown,
          formData: FormData
        ): Promise<{ error: string | null }> {
          // Server action for useActionState hook
          const pin = formData.get("pin");
          return { error: null };
        }
      `,
    },

    // ==========================================
    // CORRECT: Data file with 'server-only'
    // ==========================================
    {
      name: "Data file with 'server-only' import (correct)",
      filename: "/app/lib/data/user.ts",
      code: `
        import "server-only";

        export function getUserFromDB(id: string) {
          return db.user.find({ id });
        }
      `,
    },
    {
      name: "Repository file with 'server-only' (correct)",
      filename: "/app/repositories/post-repository.ts",
      code: `
        import "server-only";

        export async function getPostById(id: string) {
          return prisma.post.findUnique({ where: { id } });
        }
      `,
    },
    {
      name: "Service file with API key and 'server-only' (correct)",
      filename: "/app/services/payment.ts",
      code: `
        import "server-only";

        const API_SECRET = process.env.STRIPE_SECRET_KEY;

        export async function processPayment(amount: number) {
          // Use API_SECRET safely
        }
      `,
    },
    {
      name: "Database utility with 'server-only' (correct)",
      filename: "/app/lib/db/connection.ts",
      code: `
        import "server-only";

        export const db = new Database(process.env.DATABASE_URL);
      `,
    },

    // ==========================================
    // CORRECT: Files that don't need either
    // ==========================================
    {
      name: "Pure utility file without server code (no directive needed)",
      filename: "/app/lib/utils/format.ts",
      code: `
        export function formatDate(date: Date): string {
          return date.toISOString();
        }

        export function formatCurrency(amount: number): string {
          return "$" + amount.toFixed(2);
        }
      `,
    },
    {
      name: "Shared types file (no directive needed)",
      filename: "/app/types/user.ts",
      code: `
        export interface User {
          id: string;
          name: string;
          email: string;
        }

        export type UserRole = "admin" | "user" | "guest";
      `,
    },
    {
      name: "Client component (no server directive needed)",
      filename: "/app/components/Button.tsx",
      code: `
        "use client";

        export function Button({ onClick }) {
          return <button onClick={onClick}>Click</button>;
        }
      `,
    },

    // ==========================================
    // CORRECT: Action files CAN use database (with 'use server')
    // ==========================================
    {
      name: "Action file using database with 'use server' (correct - intentional exposure)",
      filename: "/app/lib/actions/user.ts",
      code: `
        "use server";

        export async function updateUserProfile(formData: FormData) {
          const name = formData.get("name");
          return prisma.user.update({ where: { id: "1" }, data: { name } });
        }
      `,
    },

    // ==========================================
    // CORRECT: Async utility functions in action directories are accepted
    // because isAsyncExportedFunction returns true for any async fn,
    // so the useServerWithoutActionPatterns check does not fire.
    // ==========================================
    {
      name: "Async utility in /lib/actions/ with 'use server' — not flagged (async fn satisfies isAsyncExportedFunction)",
      filename: "/app/lib/actions/rss-feed.ts",
      code: `
        "use server";

        export async function fetchBBCNewsFeed() {
          // Utility function, not a Server Action (no FormData/Request param)
          const response = await fetch("https://feeds.bbci.co.uk/news/uk/rss.xml");
          return response.text();
        }
      `,
    },
    {
      name: "Async validation helper in /lib/actions/ with 'use server' — not flagged (async fn satisfies isAsyncExportedFunction)",
      filename: "/app/lib/actions/helper.ts",
      code: `
        "use server";

        export async function validateInput(data: unknown) {
          // Validation helper, not a Server Action
          return typeof data === "string";
        }
      `,
    },
  ],

  invalid: [
    // ==========================================
    // CRITICAL: Both directives in same file
    // ==========================================
    {
      name: "ERROR: Both 'use server' and 'server-only' in same file (removes server-only for action-like file)",
      filename: "/app/lib/mixed.ts",
      code: `
        "use server";
        import "server-only";

        export async function doSomething(formData: FormData) {
          return db.query();
        }
      `,
      output:
        '\n        "use server";\n        \n\n        export async function doSomething(formData: FormData) {\n          return db.query();\n        }\n      ',
      errors: [
        {
          messageId: "bothDirectivesPresent",
        },
      ],
    },
    {
      name: "ERROR: Both directives (reversed order) - removes server-only",
      filename: "/app/lib/mixed.ts",
      code: `
        import "server-only";
        "use server";

        export function getData() {
          return db.find();
        }
      `,
      output:
        '\n        \n        "use server";\n\n        export function getData() {\n          return db.find();\n        }\n      ',
      errors: [
        {
          messageId: "bothDirectivesPresent",
        },
      ],
    },

    // ==========================================
    // Action file with wrong directive
    // ==========================================
    {
      name: "ERROR: Action file with 'server-only' instead of 'use server' (auto-fixed)",
      filename: "/app/actions/user.action.ts",
      code: `
        import "server-only";

        export async function updateUser(formData: FormData) {
          // This should use 'use server' not 'server-only'
        }
      `,
      output: `
        "use server";

        export async function updateUser(formData: FormData) {
          // This should use 'use server' not 'server-only'
        }
      `,
      errors: [
        {
          messageId: "serverOnlyInActionFile",
        },
      ],
    },
    {
      name: "ERROR: Actions directory file with 'server-only' (auto-fixed)",
      filename: "/app/lib/actions/post.ts",
      code: `
        import "server-only";

        export async function deletePost(formData: FormData) {
          // Action should be callable from client
          const id = formData.get("id");
        }
      `,
      output: `
        "use server";

        export async function deletePost(formData: FormData) {
          // Action should be callable from client
          const id = formData.get("id");
        }
      `,
      errors: [
        {
          messageId: "serverOnlyInActionFile",
        },
      ],
    },

    // ==========================================
    // Data file with wrong directive
    // ==========================================
    {
      name: "ERROR: Data file with 'use server' instead of 'server-only' (auto-fixed)",
      filename: "/app/lib/data/user.ts",
      code: `
        "use server";

        export function getUserFromDB(id: string) {
          // This should use 'server-only' not 'use server'
          return db.user.find(id);
        }
      `,
      output: `
        import "server-only";

        export function getUserFromDB(id: string) {
          // This should use 'server-only' not 'use server'
          return db.user.find(id);
        }
      `,
      errors: [
        {
          messageId: "useServerInDataFile",
        },
      ],
    },
    {
      name: "ERROR: Repository with 'use server' (auto-fixed)",
      filename: "/app/repositories/post-repo.ts",
      code: `
        "use server";

        export function getAllPosts() {
          return prisma.post.findMany();
        }
      `,
      output: `
        import "server-only";

        export function getAllPosts() {
          return prisma.post.findMany();
        }
      `,
      errors: [
        {
          messageId: "useServerInDataFile",
        },
      ],
    },
    {
      name: "ERROR: Service file with 'use server' (auto-fixed)",
      filename: "/app/services/email.ts",
      code: `
        "use server";

        export function sendEmail(to: string, subject: string) {
          // Service should be isolated, not exposed as endpoint
        }
      `,
      output: `
        import "server-only";

        export function sendEmail(to: string, subject: string) {
          // Service should be isolated, not exposed as endpoint
        }
      `,
      errors: [
        {
          messageId: "useServerInDataFile",
        },
      ],
    },

    // ==========================================
    // Missing directives
    // ==========================================
    {
      name: "ERROR: Server action without 'use server' directive",
      filename: "/app/lib/form-handlers.ts",
      code: `
        export async function handleFormSubmit(formData: FormData) {
          // Missing 'use server' directive
          console.log(formData);
        }
      `,
      output: `
        "use server";
export async function handleFormSubmit(formData: FormData) {
          // Missing 'use server' directive
          console.log(formData);
        }
      `,
      errors: [
        {
          messageId: "missingUseServerDirective",
        },
      ],
    },
    {
      name: "ERROR: Request handler without 'use server'",
      filename: "/app/lib/handlers.ts",
      code: `
        export async function handleRequest(request: Request) {
          // Missing 'use server'
          return new Response("OK");
        }
      `,
      output: `
        "use server";
export async function handleRequest(request: Request) {
          // Missing 'use server'
          return new Response("OK");
        }
      `,
      errors: [
        {
          messageId: "missingUseServerDirective",
        },
      ],
    },
    {
      name: "ERROR: Data file with database ops but no protection",
      filename: "/app/lib/queries.ts",
      code: `
        export function getUserById(id: string) {
          // Database operation without 'server-only'
          return db.user.find(id);
        }
      `,
      output: `
        import "server-only";
export function getUserById(id: string) {
          // Database operation without 'server-only'
          return db.user.find(id);
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: File with API key usage but no protection",
      filename: "/app/lib/api-client.ts",
      code: `
        export function callExternalAPI(endpoint: string) {
          const apiKey = process.env.EXTERNAL_API_KEY;
          return fetch(endpoint, {
            headers: { "X-API-Key": apiKey }
          });
        }
      `,
      output: `
        import "server-only";
export function callExternalAPI(endpoint: string) {
          const apiKey = process.env.EXTERNAL_API_KEY;
          return fetch(endpoint, {
            headers: { "X-API-Key": apiKey }
          });
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: File with secret token but no protection",
      filename: "/app/lib/auth.ts",
      code: `
        export function verifyToken(token: string) {
          const secret = process.env.JWT_SECRET_KEY;
          // Verify token logic
        }
      `,
      output: `
        import "server-only";
export function verifyToken(token: string) {
          const secret = process.env.JWT_SECRET_KEY;
          // Verify token logic
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: Prisma operations without protection",
      filename: "/app/lib/database.ts",
      code: `
        export async function getUsers() {
          return prisma.user.findMany();
        }
      `,
      output: `
        import "server-only";
export async function getUsers() {
          return prisma.user.findMany();
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: Firestore operations without protection",
      filename: "/app/lib/firestore.ts",
      code: `
        export async function getDocuments() {
          return firestore.collection("users").get();
        }
      `,
      output: `
        import "server-only";
export async function getDocuments() {
          return firestore.collection("users").get();
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },

    // ==========================================
    // Edge cases with sensitive env vars
    // ==========================================
    {
      name: "ERROR: Password env var without protection",
      filename: "/app/lib/config.ts",
      code: `
        export const config = {
          dbPassword: process.env.DATABASE_PASSWORD,
        };
      `,
      output: `
        import "server-only";
export const config = {
          dbPassword: process.env.DATABASE_PASSWORD,
        };
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: Private key env var without protection",
      filename: "/app/lib/crypto.ts",
      code: `
        export function sign(data: string) {
          const privateKey = process.env.SIGNING_PRIVATE_KEY;
          // Sign data
        }
      `,
      output: `
        import "server-only";
export function sign(data: string) {
          const privateKey = process.env.SIGNING_PRIVATE_KEY;
          // Sign data
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
    {
      name: "ERROR: Credentials env var without protection",
      filename: "/app/lib/oauth.ts",
      code: `
        export function getOAuthClient() {
          const clientCredential = process.env.OAUTH_CLIENT_CREDENTIAL;
          // Create client
        }
      `,
      output: `
        import "server-only";
export function getOAuthClient() {
          const clientCredential = process.env.OAUTH_CLIENT_CREDENTIAL;
          // Create client
        }
      `,
      errors: [
        {
          messageId: "missingServerOnlyImport",
        },
      ],
    },
  ],
});

// Additional edge case tests
ruleTester.run("enforce-use-server-vs-server-only (edge cases)", rule, {
  valid: [
    // Public env vars are OK without protection
    {
      name: "NEXT_PUBLIC_ env vars don't need protection",
      filename: "/app/lib/config.ts",
      code: `
        export const config = {
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          appName: process.env.NEXT_PUBLIC_APP_NAME,
        };
      `,
    },
    {
      name: "REACT_APP_ env vars don't need protection",
      filename: "/app/lib/config.ts",
      code: `
        export const config = {
          environment: process.env.REACT_APP_ENV,
        };
      `,
    },
    {
      name: "Client-only module with db identifiers doesn't need server-only",
      filename: "/app/lib/indexeddb-recovery.ts",
      code: `
        import "client-only";

        export async function listDatabaseNames() {
          const databases = await indexedDB.databases();
          return databases.map((db) => db.name);
        }
      `,
    },
    // Arrow function server actions with 'use server'
    {
      name: "Arrow function action with 'use server'",
      filename: "/app/actions/submit.action.ts",
      code: `
        "use server";

        export const submitForm = async (formData: FormData) => {
          // Handle form
        };
      `,
    },
  ],
  invalid: [],
});
