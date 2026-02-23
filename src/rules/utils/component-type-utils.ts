import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

interface SourceCodeLike {
  ast: TSESTree.Program;
  getAllComments: () => TSESTree.Comment[];
  lines: string[];
}

/**
 * Normalize a file path to use forward slashes (handles Windows backslashes).
 */
export function normalizePath(filename: string): string {
  return filename.replace(/\\/g, "/");
}

/**
 * Checks if a file has a specific directive ("use client", "use server", "use cache").
 * Checks both the first statement (standard) and top-level comments/lines (less common but valid).
 */
export function hasDirective(
  sourceCode: SourceCodeLike,
  directive: "use client" | "use server" | "use cache"
): boolean {
  const program = sourceCode.ast;

  // Check first statement
  if (program.body.length > 0) {
    const firstStatement = program.body[0];
    if (
      firstStatement &&
      firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
      "expression" in firstStatement &&
      firstStatement.expression.type === AST_NODE_TYPES.Literal &&
      firstStatement.expression.value === directive
    ) {
      return true;
    }
  }

  // Check comments at the top of the file
  const comments = sourceCode.getAllComments();
  const firstLine = sourceCode.lines[0];

  // Simple string check for the first line
  if (
    firstLine?.includes(`"${directive}"`) ||
    firstLine?.includes(`'${directive}'`)
  ) {
    return true;
  }

  // Check comments specifically
  return comments.some(
    (comment: TSESTree.Comment) =>
      comment.loc?.start.line === 1 &&
      (comment.value.includes(`"${directive}"`) ||
        comment.value.includes(`'${directive}'`))
  );
}

/**
 * Checks if a file has a "use client" directive.
 * Convenience wrapper around hasDirective().
 */
export function hasUseClientDirective(sourceCode: SourceCodeLike): boolean {
  return hasDirective(sourceCode, "use client");
}

/**
 * Checks if a file is explicitly a client component based on "use client" directive or naming conventions.
 */
export function isClientComponent(
  filename: string,
  sourceCode?: {
    ast: TSESTree.Program;
    getAllComments: () => TSESTree.Comment[];
    lines: string[];
  }
): boolean {
  // If we have source code, check for the directive first (most reliable)
  if (sourceCode && hasUseClientDirective(sourceCode)) {
    return true;
  }

  const normalizedPath = normalizePath(filename).toLowerCase();
  const originalPath = normalizePath(filename);

  // Explicit client naming convention
  if (
    normalizedPath.includes(".client.") ||
    normalizedPath.includes("-client.tsx") ||
    normalizedPath.includes("-client.jsx")
  ) {
    return true;
  }

  // PascalCaseClient pattern (e.g., UserFormClient.tsx, ComponentClient.tsx)
  if (/Client\.(tsx|jsx)$/.test(originalPath)) {
    return true;
  }

  return false;
}

/**
 * Checks if a file is a Server Component.
 * In Next.js App Router, components are Server Components by default unless they have "use client".
 * Also checks for explicit server directories and async exports.
 */
export function isServerComponent(
  filename: string,
  sourceCode?: {
    ast: TSESTree.Program;
    getAllComments: () => TSESTree.Comment[];
    lines: string[];
  }
): boolean {
  // If it has "use client", it's explicitly NOT a Server Component
  if (sourceCode && hasUseClientDirective(sourceCode)) {
    return false;
  }

  // If it matches client naming conventions, it's NOT a Server Component
  if (isClientComponent(filename)) {
    return false;
  }

  const normalizedPath = normalizePath(filename).toLowerCase();

  // Exclude explicit client-side logic files (hooks, etc.)
  if (
    normalizedPath.includes("/hooks/") ||
    normalizedPath.includes("/use-") ||
    normalizedPath.endsWith(".hook.ts") ||
    normalizedPath.endsWith(".hook.tsx")
  ) {
    return false;
  }

  // 0. Explicit server files (middleware, proxy)
  if (
    normalizedPath.endsWith("/middleware.ts") ||
    normalizedPath.endsWith("/proxy.ts")
  ) {
    return true;
  }

  // 1. Explicit server directories
  if (
    normalizedPath.includes("/api/") ||
    normalizedPath.includes("/server/") ||
    normalizedPath.includes("/lib/server/") ||
    normalizedPath.includes("/actions/") ||
    normalizedPath.includes("/repositories/") ||
    normalizedPath.includes("/lib/data/")
  ) {
    return true;
  }

  // 2. App Router files (implicit Server Components if no "use client")
  if (isAppRouterComponent(filename)) {
    return true;
  }

  // 3. Components directory (Server Components by default in App Router if no "use client")
  if (normalizedPath.includes("/components/")) {
    return true;
  }

  // 4. Async exports (Heuristic: "no 'use client' + async function" = Server Component)
  if (sourceCode && hasAsyncExport(sourceCode.ast)) {
    return true;
  }

  return false;
}

/**
 * Checks if a file is a standard App Router component file (page, layout, etc.)
 */
export function isAppRouterComponent(filename: string): boolean {
  const normalizedPath = normalizePath(filename).toLowerCase();

  // Must be in app directory
  if (!normalizedPath.includes("/app/")) {
    return false;
  }

  // Exclude API routes
  if (normalizedPath.includes("/api/")) {
    return false;
  }

  // Standard Next.js App Router files that are Server Components by default
  const serverComponentFiles = [
    "page.tsx",
    "page.js",
    "page.ts",
    "page.jsx",
    "layout.tsx",
    "layout.js",
    "layout.ts",
    "layout.jsx",
    "loading.tsx",
    "loading.js",
    "loading.ts",
    "loading.jsx",
    "error.tsx",
    "error.js",
    "error.ts",
    "error.jsx",
    "not-found.tsx",
    "not-found.js",
    "not-found.ts",
    "not-found.jsx",
    "template.tsx",
    "template.js",
    "template.ts",
    "template.jsx",
    "default.tsx",
    "default.js",
    "default.ts",
    "default.jsx",
    "opengraph-image.tsx",
    "twitter-image.tsx",
    "icon.tsx",
    "apple-icon.tsx",
  ];

  return serverComponentFiles.some((file) =>
    normalizedPath.endsWith(`/${file}`)
  );
}

/**
 * Checks if the AST contains an async export (default or named).
 */
export function hasAsyncExport(program: TSESTree.Program): boolean {
  for (const node of program.body) {
    // Check for export default async function
    if (node.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      const decl = node.declaration;
      if (
        (decl.type === AST_NODE_TYPES.FunctionDeclaration ||
          decl.type === AST_NODE_TYPES.FunctionExpression ||
          decl.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
        decl.async
      ) {
        return true;
      }
    }

    // Check for export async function
    if (
      node.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      node.declaration
    ) {
      if (
        node.declaration.type === AST_NODE_TYPES.FunctionDeclaration &&
        node.declaration.async
      ) {
        return true;
      }

      if (node.declaration.type === AST_NODE_TYPES.VariableDeclaration) {
        for (const decl of node.declaration.declarations) {
          if (
            decl.init &&
            (decl.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              decl.init.type === AST_NODE_TYPES.FunctionExpression) &&
            decl.init.async
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function isServerOnlyModule(moduleName: string): boolean {
  const serverOnlyModules = [
    // Node.js built-ins
    "fs",
    "path",
    "os",
    "crypto",
    "util",
    "stream",
    "buffer",
    "events",
    "url",
    "querystring",
    "http",
    "https",
    "net",
    "tls",
    "dgram",
    "dns",
    "cluster",
    "child_process",
    "worker_threads",
    "perf_hooks",
    "inspector",
    "vm",
    "module",
    "repl",
    "readline",
    "tty",
    "zlib",
    // Next.js server-only
    "next/server",
    "next/headers",
    "next/cookies",
    "next/cache",
    "server-only",
    // Database
    "firebase-admin",
    "mysql",
    "mysql2",
    "pg",
    "sqlite3",
    "mongodb",
    "mongoose",
    "prisma",
    "@prisma/client",
    // Auth/crypto
    "bcrypt",
    "bcryptjs",
    "jsonwebtoken",
    // Server tools
    "nodemailer",
    "sharp",
    "jimp",
    "dotenv",
    "@next/env",
  ];

  return serverOnlyModules.includes(moduleName);
}

export function isClientOnlyModule(moduleName: string): boolean {
  // NOTE: "react" and "react-dom" are NOT client-only!
  // Server Components can import React for JSX and certain utilities.
  // Only "react-dom/client" is truly client-only (for client-side rendering).
  const clientOnlyModules = [
    "react-dom/client",
    "framer-motion",
    "react-spring",
    "react-transition-group",
    "react-player",
    "react-chartjs-2",
    "recharts",
    "react-map-gl",
    "leaflet",
    "mapbox-gl",
    "localforage",
    "idb",
    "client-only",
    "use-debounce",
    "use-throttle",
    "mixpanel-browser",
    "hotjar",
    "google-analytics",
    "react-modal",
    "react-tooltip",
    "react-select",
    "react-datepicker",
    "react-color",
    "react-dropzone",
  ];

  return clientOnlyModules.includes(moduleName);
}

export function isClientOnlyHook(hookName: string): boolean {
  const clientOnlyHooks = [
    "useEventListener",
    "useClickOutside",
    "useKeyPress",
    "useScroll",
    "useWindowSize",
    "useViewport",
    "usePageVisibility",
    "useDocumentTitle",
    "useFullscreen",
    "useClipboard",
    "useInView",
    "useIntersectionObserver",
    "useLocalStorage",
    "useSessionStorage",
    "useCookie",
    "useIndexedDB",
    "useHistory",
    "useLocation",
    "useNavigate",
    "useSearchParams",
    "useMedia",
    "useMediaQuery",
    "useBreakpoint",
    "useOrientation",
    "useGeolocation",
    "useBattery",
    "useNetworkState",
    "useOnlineStatus",
    "usePermission",
    "useNotification",
    "useCamera",
    "useMicrophone",
    "useDrag",
    "useDrop",
    "useGesture",
    "useTouch",
    "useMouse",
    "useHover",
    "useFocus",
    "useActive",
    "usePerformance",
    "useWebVitals",
    "useDarkMode",
    "useTheme",
    "useColorScheme",
  ];

  return clientOnlyHooks.includes(hookName);
}

export function isUseCacheModule(moduleName: string): boolean {
  // Filename patterns that commonly contain "use cache" functions
  // These should NOT be imported by client components
  return (
    /\.cache/.test(moduleName) ||
    /\/cache\//.test(moduleName) ||
    /cached/.test(moduleName)
  );
}

export function isServerEnvVar(envVarName: string): boolean {
  const publicPatterns = [/.*PUBLIC.*/i, /.*NEXT_PUBLIC.*/i, /.*REACT_APP.*/i];
  if (publicPatterns.some((p) => p.test(envVarName))) {
    return false;
  }

  const serverPatterns = [
    /.*SECRET.*/i,
    /.*KEY.*/i,
    /.*TOKEN.*/i,
    /.*PASSWORD.*/i,
    /.*PRIVATE.*/i,
    /.*DATABASE.*/i,
    /.*API.*/i,
    /.*WEBHOOK.*/i,
  ];
  return serverPatterns.some((p) => p.test(envVarName));
}
