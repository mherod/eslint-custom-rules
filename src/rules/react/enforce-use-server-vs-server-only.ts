import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";
import {
  isActionFile,
  isAsyncExportedFunction,
  isDataFile,
  isServerActionFunction,
} from "../utils/server-action-utils";

export const RULE_NAME = "enforce-use-server-vs-server-only";

type MessageIds =
  | "bothDirectivesPresent"
  | "serverOnlyInActionFile"
  | "useServerInDataFile"
  | "missingUseServerDirective"
  | "missingServerOnlyImport"
  | "useServerWithoutActionPatterns";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Enforce correct usage of 'use server' (communication) vs 'server-only' (isolation) based on file purpose. " +
        "These directives are mutually exclusive and serve different purposes.",
    },
    schema: [],
    messages: {
      bothDirectivesPresent:
        "File has both 'use server' and 'server-only' which contradict each other. " +
        "'use server' allows clients to call functions (communication), while 'server-only' prevents any client imports (isolation). " +
        "Choose one based on purpose: actions use 'use server', data/utility files use 'server-only'.",
      serverOnlyInActionFile:
        "Action file has 'server-only' import but should use 'use server' directive. " +
        "'server-only' blocks client imports entirely, but Server Actions need to be callable from clients. " +
        "Replace 'import \"server-only\"' with '\"use server\"' directive at the top.",
      useServerInDataFile:
        "Data/utility file has 'use server' directive but should use 'server-only' import. " +
        "'use server' exposes functions as callable endpoints, but data files should be isolated from clients. " +
        "Replace '\"use server\"' with 'import \"server-only\"' for build-time protection.",
      missingUseServerDirective:
        "File contains Server Action patterns (async function with FormData/Request) but is missing 'use server' directive. " +
        "Add '\"use server\"' at the top of the file to make these functions callable from client components.",
      missingServerOnlyImport:
        "File contains sensitive server code (database operations, API keys) but lacks protection. " +
        "Add 'import \"server-only\"' at the top to prevent accidental client-side leakage. " +
        "This causes a build error if any client component tries to import this file.",
      useServerWithoutActionPatterns:
        "File in action directory has 'use server' but exports no Server Actions (async functions with FormData/Request parameters). " +
        "This is a utility/helper file that should use 'import \"server-only\"' instead. " +
        "'use server' should only be used for files that export functions callable from clients.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const sourceCode = context.sourceCode;

    let hasUseServerDirective = false;
    let hasServerOnlyImport = false;
    let hasClientOnlyImport = false;
    let useServerNode: TSESTree.Node | null = null;
    let serverOnlyNode: TSESTree.Node | null = null;
    let hasDatabaseOperations = false;
    let hasApiKeyUsage = false;
    let hasServerActionPatterns = false;
    let serverActionNode: TSESTree.Node | null = null;
    let hasAsyncExportedFunctions = false;

    const program = sourceCode.ast;

    for (let i = 0; i < Math.min(10, program.body.length); i++) {
      const statement = program.body[i];
      if (!statement) {
        continue;
      }

      if (
        statement.type === AST_NODE_TYPES.ExpressionStatement &&
        statement.expression.type === AST_NODE_TYPES.Literal &&
        statement.expression.value === "use server"
      ) {
        hasUseServerDirective = true;
        useServerNode = statement;
      }

      if (
        statement.type === AST_NODE_TYPES.ImportDeclaration &&
        statement.source.type === AST_NODE_TYPES.Literal &&
        statement.source.value === "server-only"
      ) {
        hasServerOnlyImport = true;
        serverOnlyNode = statement;
      }

      if (
        statement.type === AST_NODE_TYPES.ImportDeclaration &&
        statement.source.type === AST_NODE_TYPES.Literal &&
        statement.source.value === "client-only"
      ) {
        hasClientOnlyImport = true;
      }
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (isServerActionFunction(node, node.params)) {
          hasServerActionPatterns = true;
          serverActionNode = node;
        }
        if (isAsyncExportedFunction(node)) {
          hasAsyncExportedFunctions = true;
        }
      },

      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (node.declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const decl of node.declaration.declarations) {
            if (
              decl.init &&
              (decl.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
                decl.init.type === AST_NODE_TYPES.FunctionExpression)
            ) {
              if (isAsyncExportedFunction(decl.init)) {
                hasAsyncExportedFunctions = true;
              }
            }
          }
        }
      },

      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.init &&
          (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            node.init.type === AST_NODE_TYPES.FunctionExpression)
        ) {
          if (isServerActionFunction(node.init, node.init.params)) {
            hasServerActionPatterns = true;
            serverActionNode = node;
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const obj = node.callee.object;
          const prop = node.callee.property;
          if (
            obj.type === AST_NODE_TYPES.Identifier &&
            prop.type === AST_NODE_TYPES.Identifier
          ) {
            const dbPatterns = [
              "db",
              "database",
              "prisma",
              "mongoose",
              "firestore",
              "sql",
              "knex",
              "drizzle",
            ];
            if (dbPatterns.includes(obj.name)) {
              hasDatabaseOperations = true;
            }
          }
          if (
            obj.type === AST_NODE_TYPES.MemberExpression &&
            obj.object.type === AST_NODE_TYPES.Identifier
          ) {
            const dbPatterns = ["prisma", "mongoose", "firestore", "db"];
            if (dbPatterns.includes(obj.object.name)) {
              hasDatabaseOperations = true;
            }
          }
        }
      },

      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          node.object.type === AST_NODE_TYPES.MemberExpression &&
          node.object.object.type === AST_NODE_TYPES.Identifier &&
          node.object.object.name === "process" &&
          node.object.property.type === AST_NODE_TYPES.Identifier &&
          node.object.property.name === "env" &&
          node.property.type === AST_NODE_TYPES.Identifier
        ) {
          const envVar = node.property.name;
          const sensitivePatterns = [
            "KEY",
            "SECRET",
            "TOKEN",
            "PASSWORD",
            "PRIVATE",
            "CREDENTIAL",
          ];
          if (
            sensitivePatterns.some((p) => envVar.toUpperCase().includes(p)) &&
            !envVar.startsWith("NEXT_PUBLIC_") &&
            !envVar.startsWith("REACT_APP_")
          ) {
            hasApiKeyUsage = true;
          }
        }
      },

      "Program:exit"(): void {
        const isActionFileResult = isActionFile(filename);
        const isDataFileResult = isDataFile(filename);
        const isApiRoute =
          filename.includes("/app/api/") || filename.includes("/pages/api/");
        const isMiddleware =
          filename.endsWith("/middleware.ts") ||
          filename.endsWith("/middleware.js");
        const hasSensitiveOperations = hasDatabaseOperations || hasApiKeyUsage;
        const isExplicitClient =
          hasUseClientDirective(sourceCode) || hasClientOnlyImport;

        if (hasUseServerDirective && hasServerOnlyImport) {
          context.report({
            node: serverOnlyNode ?? useServerNode ?? sourceCode.ast,
            messageId: "bothDirectivesPresent",
            fix(fixer) {
              if (isActionFileResult && serverOnlyNode) {
                return fixer.remove(serverOnlyNode);
              }
              if (isDataFileResult && useServerNode) {
                return fixer.remove(useServerNode);
              }
              if (serverOnlyNode) {
                return fixer.remove(serverOnlyNode);
              }
              return null;
            },
          });
          return;
        }

        if (
          isActionFileResult &&
          hasServerOnlyImport &&
          !hasUseServerDirective &&
          hasServerActionPatterns
        ) {
          context.report({
            node: serverOnlyNode ?? sourceCode.ast,
            messageId: "serverOnlyInActionFile",
            fix(fixer) {
              if (!serverOnlyNode) {
                return null;
              }
              return fixer.replaceText(serverOnlyNode, '"use server";');
            },
          });
        }

        if (isDataFileResult && hasUseServerDirective && !hasServerOnlyImport) {
          context.report({
            node: useServerNode ?? sourceCode.ast,
            messageId: "useServerInDataFile",
            fix(fixer) {
              if (!useServerNode) {
                return null;
              }
              return fixer.replaceText(useServerNode, 'import "server-only";');
            },
          });
        }

        if (
          hasServerActionPatterns &&
          !hasUseServerDirective &&
          !hasServerOnlyImport &&
          !hasUseClientDirective(sourceCode) &&
          !isApiRoute &&
          !isMiddleware
        ) {
          context.report({
            node: serverActionNode ?? sourceCode.ast,
            messageId: "missingUseServerDirective",
            fix(fixer) {
              const firstNode = sourceCode.ast.body[0];
              if (!firstNode) {
                return null;
              }
              return fixer.insertTextBefore(firstNode, '"use server";\n');
            },
          });
        }

        if (
          isActionFileResult &&
          hasUseServerDirective &&
          !hasServerActionPatterns &&
          !hasAsyncExportedFunctions &&
          !hasServerOnlyImport &&
          !isApiRoute &&
          !isMiddleware
        ) {
          context.report({
            node: useServerNode ?? sourceCode.ast,
            messageId: "useServerWithoutActionPatterns",
            fix(fixer) {
              if (!useServerNode) {
                return null;
              }
              return fixer.replaceText(useServerNode, 'import "server-only";');
            },
          });
        }

        if (
          hasSensitiveOperations &&
          !hasServerOnlyImport &&
          !hasUseServerDirective &&
          !isActionFileResult &&
          !isApiRoute
        ) {
          if (hasApiKeyUsage || !isExplicitClient) {
            context.report({
              node: sourceCode.ast,
              messageId: "missingServerOnlyImport",
              fix(fixer) {
                const firstNode = sourceCode.ast.body[0];
                if (!firstNode) {
                  return null;
                }
                return fixer.insertTextBefore(
                  firstNode,
                  'import "server-only";\n'
                );
              },
            });
          }
        }
      },
    };
  },
});
