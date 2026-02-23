import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-reexports-in-use-server";

/**
 * These tests verify that files with "use server" directive only export
 * locally-defined async functions, not re-exports from other modules.
 *
 * This constraint exists because Next.js/Turbopack needs to verify that
 * each export in a Server Action file is an async function defined in that file.
 * Re-exports bypass this verification and cause build failures.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Valid: File without "use server" can have re-exports
    {
      name: "Barrel file without 'use server' can re-export",
      code: `
        export { foo } from "./other";
        export { bar, baz } from "./another";
      `,
    },
    // Valid: "use server" file with only local async function exports
    {
      name: "'use server' file with local async function declarations",
      code: `
        "use server";

        export async function createUser(data: FormData) {
          return { success: true };
        }

        export async function deleteUser(id: string) {
          return { success: true };
        }
      `,
    },
    // Valid: "use server" with async arrow function exports
    {
      name: "'use server' file with async arrow function exports",
      code: `
        "use server";

        export const createUser = async (data: FormData) => {
          return { success: true };
        };
      `,
    },
    // Valid: "use server" with type exports (erased at runtime)
    {
      name: "'use server' file with type exports (allowed)",
      code: `
        "use server";

        export type ActionResult<T> = { success: boolean; data?: T };

        export interface UserData {
          name: string;
        }

        export async function createUser(data: FormData) {
          return { success: true };
        }
      `,
    },
    // Valid: Barrel file without "use server" directive
    {
      name: "Barrel file without 'use server' can use export * from",
      code: `
        // This is a barrel file that re-exports - no "use server"
        export { createUser, deleteUser } from "./users";
        export { createPost, deletePost } from "./posts";
        export * from "./comments";
      `,
    },
    // Valid: "use client" file with re-exports
    {
      name: "'use client' file can have re-exports",
      code: `
        "use client";

        export { Button } from "./button";
        export { Card } from "./card";
      `,
    },
    // Valid: No directive at all, re-exports are fine
    {
      name: "File without any directive can re-export",
      code: `
        export { someUtil } from "./utils";
        export * from "./helpers";
      `,
    },
  ],

  invalid: [
    // Invalid: Re-export in "use server" file
    {
      name: "ERROR: Re-export in 'use server' file",
      code: `
        "use server";

        export { createUser } from "./users";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./users" },
        },
      ],
    },
    // Invalid: Multiple re-exports in "use server" file
    {
      name: "ERROR: Multiple re-exports in 'use server' file",
      code: `
        "use server";

        export { createUser, deleteUser } from "./users";
        export { createPost } from "./posts";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./users" },
        },
        {
          messageId: "reexportInUseServer",
          data: { source: "./posts" },
        },
      ],
    },
    // Invalid: Namespace re-export in "use server" file
    {
      name: "ERROR: Namespace re-export (export * from) in 'use server' file",
      code: `
        "use server";

        export * from "./actions";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./actions" },
        },
      ],
    },
    // Invalid: Mix of local functions and re-exports
    {
      name: "ERROR: Mix of local async functions and re-exports",
      code: `
        "use server";

        export async function localAction(data: FormData) {
          return { success: true };
        }

        export { remoteAction } from "./other";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./other" },
        },
      ],
    },
    // Invalid: Non-async function export in "use server" file
    {
      name: "ERROR: Non-async arrow function export in 'use server' file",
      code: `
        "use server";

        export const syncFunction = () => {
          return { success: true };
        };
      `,
      errors: [
        {
          messageId: "nonFunctionExportInUseServer",
        },
      ],
    },
    // Invalid: Constant export in "use server" file
    {
      name: "ERROR: Constant export in 'use server' file",
      code: `
        "use server";

        export const CONFIG = { maxRetries: 3 };
      `,
      errors: [
        {
          messageId: "nonFunctionExportInUseServer",
        },
      ],
    },
    // Invalid: The exact pattern from the build failure (Issue #571)
    {
      name: "ERROR: Real-world case from Issue #571 - barrel file with 'use server' and re-exports",
      code: `
        "use server";

        export async function createCreatorAction(data: any) {
          return { success: true };
        }

        export async function getCreatorsAction() {
          return [];
        }

        // Re-export goal actions - THIS IS THE PROBLEM
        export {
          getCreatorGoalAction,
          getCreatorGoalsAction,
          createCreatorGoalAction,
        } from "./goals";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./goals" },
        },
      ],
    },
    // Invalid: export * from with local exports
    {
      name: "ERROR: Mixed export * from with local exports",
      code: `
        "use server";

        export async function localAction() {
          return true;
        }

        export * from "./other-actions";
      `,
      errors: [
        {
          messageId: "reexportInUseServer",
          data: { source: "./other-actions" },
        },
      ],
    },
  ],
});
