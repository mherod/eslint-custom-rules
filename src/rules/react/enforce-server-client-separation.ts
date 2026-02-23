import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  hasUseClientDirective,
  isClientComponent,
  isClientOnlyHook,
  isClientOnlyModule,
  isServerComponent,
  isServerEnvVar,
  isServerOnlyModule,
  isUseCacheModule,
} from "../utils/component-type-utils";
import { isActionModule } from "../utils/server-action-utils";

export const RULE_NAME = "enforce-server-client-separation";

/**
 * This rule enforces server/client boundaries by checking imports and API usage.
 *
 * This rule checks:
 * - Clients importing server modules (except action files which are callable from clients)
 * - Clients importing "use cache" modules (creates unwanted network boundaries)
 * - Servers importing client modules
 * - Servers using client-only hooks
 * - Clients accessing server environment variables
 */

type MessageIds =
  | "clientImportingServerModule"
  | "serverImportingClientModule"
  | "serverUsingClientHook"
  | "clientAccessingServerEnv"
  | "clientImportingUseCacheFunction";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce server/client code boundary separation in Next.js applications. " +
        "Action files can be imported by clients, but server-only modules cannot.",
    },
    schema: [],
    messages: {
      clientImportingServerModule:
        "Client component cannot import server-only module '{{module}}'. " +
        "Use server actions for server functionality or move to server component.",
      serverImportingClientModule:
        "Server component cannot import client-only module '{{module}}'. " +
        "Move to client component or find a framework-agnostic alternative.",
      serverUsingClientHook:
        "Server component cannot use client-only hook '{{hook}}'. " +
        "Move this to a client component or use a server-compatible alternative.",
      clientAccessingServerEnv:
        "Client component cannot access server environment variable '{{variable}}'. " +
        "Use public environment variables (NEXT_PUBLIC_*) or server actions.",
      clientImportingUseCacheFunction:
        "Client component cannot import '{{module}}' containing 'use cache' directive. " +
        "This creates network boundaries, serialization requirements, and exposes internal data fetching as public endpoints. " +
        "Remove 'use cache' directive to keep as secure server-side function.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const importedModule = node.source.value;
        if (typeof importedModule !== "string") {
          return;
        }

        // Skip type-only imports - they are completely erased at compile time
        // and never end up in the client bundle. This is safe because TypeScript
        // removes these during compilation before bundling.
        // Examples: `import type { User } from "firebase-admin"`
        if (node.importKind === "type") {
          return;
        }

        // Also check if ALL specifiers are type-only (handles mixed imports)
        // Example: `import { type User, type Post } from "firebase-admin"`
        const allSpecifiersAreTypeOnly = node.specifiers.every((specifier) => {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            return specifier.importKind === "type";
          }
          // Default and namespace imports are value imports
          return false;
        });

        if (allSpecifiersAreTypeOnly && node.specifiers.length > 0) {
          return;
        }

        // Determine if this is a client component
        const isClientFile =
          hasUseClientDirective(sourceCode) ||
          isClientComponent(filename, sourceCode);
        const isServerFile = isServerComponent(filename, sourceCode);

        // Client importing server modules
        if (isClientFile && isServerOnlyModule(importedModule)) {
          // Allow action files - clients can call server actions
          if (!isActionModule(importedModule)) {
            context.report({
              node,
              messageId: "clientImportingServerModule",
              data: { module: importedModule },
            });
          }
        }

        // Client importing "use cache" functions - BLOCKED (creates network boundaries)
        if (isClientFile && isUseCacheModule(importedModule)) {
          context.report({
            node,
            messageId: "clientImportingUseCacheFunction",
            data: { module: importedModule },
          });
        }

        // Server importing client modules
        if (isServerFile && isClientOnlyModule(importedModule)) {
          context.report({
            node,
            messageId: "serverImportingClientModule",
            data: { module: importedModule },
          });
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;

          // Server using client-only hook
          if (
            isClientOnlyHook(functionName) &&
            isServerComponent(filename, sourceCode)
          ) {
            context.report({
              node,
              messageId: "serverUsingClientHook",
              data: { hook: functionName },
            });
          }
        }
      },

      MemberExpression(node: TSESTree.MemberExpression): void {
        // Check for process.env access in client components
        if (
          node.object.type === AST_NODE_TYPES.MemberExpression &&
          node.object.object.type === AST_NODE_TYPES.Identifier &&
          node.object.object.name === "process" &&
          node.object.property.type === AST_NODE_TYPES.Identifier &&
          node.object.property.name === "env" &&
          node.property.type === AST_NODE_TYPES.Identifier
        ) {
          const envVar = node.property.name;

          // Client accessing server environment variable
          if (
            isServerEnvVar(envVar) &&
            (hasUseClientDirective(sourceCode) ||
              isClientComponent(filename, sourceCode))
          ) {
            context.report({
              node,
              messageId: "clientAccessingServerEnv",
              data: { variable: envVar },
            });
          }
        }
      },
    };
  },
});
