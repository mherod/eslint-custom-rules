import type { TSESTree } from "@typescript-eslint/utils";
import { isProtectedRoute } from "../security/route-policy-detectors";
import { isApiRoute } from "./common";
import {
  hasDirective,
  isClientComponent,
  isServerComponent,
  normalizePath,
} from "./component-type-utils";
import { isActionFile, isDataFile } from "./server-action-utils";

interface SourceCodeLike {
  ast: TSESTree.Program;
  getAllComments: () => TSESTree.Comment[];
  lines: string[];
}

/**
 * Per-file facts shared by rules. Each fact stays distinct on purpose —
 * route handler, API endpoint, protected route, action file, and data file
 * answer different questions and must not collapse into one predicate.
 * Rule-specific policy stays in the consuming rules.
 */
export interface FileFacts {
  hasUseCache: boolean;
  hasUseClient: boolean;
  hasUseServer: boolean;
  isActionFile: boolean;
  /** Any API endpoint by shared repository heuristics */
  isApiEndpoint: boolean;
  /** App Router API route file: a route file under app/api */
  isAppRouterApiRoute: boolean;
  isClientFile: boolean;
  isDataFile: boolean;
  /** middleware.(ts|js|tsx|jsx) at project root or src/ */
  isMiddleware: boolean;
  /** Pages Router API route file: pages/api/... */
  isPagesRouterApiRoute: boolean;
  isProtectedRoute: boolean;
  /** Next.js App Router Route Handler: route.(ts|js|tsx|jsx) anywhere in app/ */
  isRouteHandler: boolean;
  isServerFile: boolean;
  normalizedPath: string;
}

// Route Handlers are route.* files anywhere inside app/, not only app/api.
const APP_ROUTE_HANDLER_PATTERN = /\/app\/(?:.*\/)?route\.(ts|js|tsx|jsx)$/;
const APP_ROUTER_API_ROUTE_PATTERN = /\/app\/api\/.*\/route\.(ts|js|tsx|jsx)$/;
const PAGES_ROUTER_API_ROUTE_PATTERN = /\/pages\/api\/.+\.(ts|js|tsx|jsx)$/;
const MIDDLEWARE_PATTERN = /\/(src\/)?middleware\.(ts|js|tsx|jsx)$/;

const factsByProgram = new WeakMap<TSESTree.Program, FileFacts>();

/**
 * Compute the per-file facts once per ESLint file context. Results are keyed
 * by the parsed Program node, so a fresh parse (new file content) always gets
 * fresh facts and nothing leaks across files or lint runs.
 */
export function getFileFacts(
  filename: string,
  sourceCode: SourceCodeLike
): FileFacts {
  const cached = factsByProgram.get(sourceCode.ast);
  if (cached) {
    return cached;
  }

  const normalizedPath = normalizePath(filename);
  const facts: FileFacts = {
    normalizedPath,
    hasUseClient: hasDirective(sourceCode, "use client"),
    hasUseServer: hasDirective(sourceCode, "use server"),
    hasUseCache: hasDirective(sourceCode, "use cache"),
    isClientFile: isClientComponent(filename, sourceCode),
    isServerFile: isServerComponent(filename, sourceCode),
    isRouteHandler: APP_ROUTE_HANDLER_PATTERN.test(normalizedPath),
    isAppRouterApiRoute: APP_ROUTER_API_ROUTE_PATTERN.test(normalizedPath),
    isPagesRouterApiRoute: PAGES_ROUTER_API_ROUTE_PATTERN.test(normalizedPath),
    isApiEndpoint: isApiRoute(filename),
    isMiddleware: MIDDLEWARE_PATTERN.test(normalizedPath),
    isActionFile: isActionFile(filename),
    isDataFile: isDataFile(filename),
    isProtectedRoute: isProtectedRoute(normalizedPath),
  };

  factsByProgram.set(sourceCode.ast, facts);
  return facts;
}
