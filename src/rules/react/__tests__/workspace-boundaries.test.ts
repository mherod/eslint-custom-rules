import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import separation from "../enforce-server-client-separation";
import directives from "../enforce-use-server-vs-server-only";

const tester = new RuleTester({ languageOptions: { parser } });

tester.run("configured server module prefixes", separation, {
  valid: [
    { code: '"use client"; import { value } from "@example/server-data";' },
    {
      code: '"use client"; import type { Record } from "@example/server-data";',
      options: [{ serverModulePrefixes: ["@example/server-"] }],
    },
    {
      code: '"use client"; import { save } from "@example/server-data/actions/save";',
      options: [{ serverModulePrefixes: ["@example/server-"] }],
    },
  ],
  invalid: [
    {
      code: '"use client"; import { value } from "@example/server-data";',
      options: [{ serverModulePrefixes: ["@example/server-"] }],
      errors: [{ messageId: "clientImportingServerModule" }],
    },
    {
      code: '"use client"; import("@example/server-data");',
      options: [{ serverModulePrefixes: ["@example/server-"] }],
      errors: [{ messageId: "clientImportingServerModule" }],
    },
    {
      code: '"use client"; require("@example/server-data");',
      options: [{ serverModulePrefixes: ["@example/server-"] }],
      errors: [{ messageId: "clientImportingServerModule" }],
    },
  ],
});

tester.run("configured data directories and proxy", directives, {
  valid: [
    {
      filename: "/packages/backend-records/src/lookup.ts",
      code: '"use server"; export async function lookup() {}',
    },
    {
      filename: "/packages/backend-records/src/actions/save.ts",
      code: '"use server"; export async function save() {}',
      options: [{ dataDirectories: ["backend-records"] }],
    },
    {
      filename: "/app/proxy.ts",
      code: "export async function proxy(request: NextRequest) {}",
    },
    {
      filename: "C:\\app\\proxy.ts",
      code: "export async function proxy(request: NextRequest) {}",
    },
    {
      filename: "/app/proxy.js",
      code: "export async function proxy(request) {}",
    },
    {
      filename: "/packages/backend-records-copy/src/lookup.ts",
      code: '"use server"; export async function lookup() {}',
      options: [{ dataDirectories: ["backend-records"] }],
    },
  ],
  invalid: [
    {
      filename: "/packages/backend-records/src/lookup.ts",
      code: '"use server"; export async function lookup() {}',
      options: [{ dataDirectories: ["backend-records"] }],
      output: 'import "server-only"; export async function lookup() {}',
      errors: [{ messageId: "useServerInDataFile" }],
    },
    {
      filename: "C:\\packages\\backend-records\\src\\lookup.ts",
      code: '"use server"; export async function lookup() {}',
      options: [{ dataDirectories: ["/backend-records/"] }],
      output: 'import "server-only"; export async function lookup() {}',
      errors: [{ messageId: "useServerInDataFile" }],
    },
  ],
});
