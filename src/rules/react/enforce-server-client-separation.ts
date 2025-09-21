import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "enforce-server-client-separation";

type MessageIds =
  | "clientImportingServerModule"
  | "serverImportingClientModule"
  | "clientUsingServerAction"
  | "serverUsingClientHook"
  | "clientAccessingServerEnv"
  | "missingUseServerDirective"
  | "missingUseClientDirective";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce proper server/client code separation in Next.js applications",
    },
    schema: [],
    messages: {
      clientImportingServerModule:
        "Client component cannot import server-only module '{{module}}'. Move to server component or use server action.",
      serverImportingClientModule:
        "Server component cannot import client-only module '{{module}}'. Move to client component or use different approach.",
      clientUsingServerAction:
        "Client component is using server action '{{action}}' without proper server action import.",
      serverUsingClientHook:
        "Server component cannot use client-only hook '{{hook}}'. Move to client component or use server-side alternative.",
      clientAccessingServerEnv:
        "Client component cannot access server environment variable '{{variable}}'. Use public environment variables or server actions.",
      missingUseServerDirective:
        "File contains server-only code but is missing 'use server' directive.",
      missingUseClientDirective:
        "File contains client-only code but is missing 'use client' directive.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    let hasUseServerDirective = false;
    let hasUseClientDirective = false;
    let hasServerOnlyCode = false;
    let hasClientOnlyCode = false;

    // Check for directives at the top of the file
    const firstToken = sourceCode.getFirstToken(sourceCode.ast);
    const comments = sourceCode.getCommentsBefore(firstToken || sourceCode.ast);
    const allComments = [...comments, ...sourceCode.getAllComments()];

    for (const comment of allComments) {
      if (comment.type === "Line" && comment.value.trim() === "use server") {
        hasUseServerDirective = true;
      }
      if (comment.type === "Line" && comment.value.trim() === "use client") {
        hasUseClientDirective = true;
      }
    }

    // Also check for string literals
    const program = sourceCode.ast;
    if (program.body.length > 0) {
      const firstStatement = program.body[0];
      if (
        firstStatement &&
        firstStatement.type === "ExpressionStatement" &&
        "expression" in firstStatement &&
        firstStatement.expression.type === "Literal" &&
        typeof firstStatement.expression.value === "string"
      ) {
        if (firstStatement.expression.value === "use server") {
          hasUseServerDirective = true;
        }
        if (firstStatement.expression.value === "use client") {
          hasUseClientDirective = true;
        }
      }
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importedModule = node.source.value;

        if (typeof importedModule !== "string") {
          return;
        }

        // Check client importing server modules
        if (
          (hasUseClientDirective || isClientComponent(filename)) &&
          isServerOnlyModule(importedModule)
        ) {
          hasServerOnlyCode = true;
          context.report({
            node,
            messageId: "clientImportingServerModule",
            data: { module: importedModule },
          });
        }

        // Check server importing client modules
        if (
          (hasUseServerDirective || isServerComponent(filename)) &&
          isClientOnlyModule(importedModule)
        ) {
          hasClientOnlyCode = true;
          context.report({
            node,
            messageId: "serverImportingClientModule",
            data: { module: importedModule },
          });
        }
      },

      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type === "Identifier") {
          const functionName = node.callee.name;

          // Check for client-only hooks in server components
          if (isClientOnlyHook(functionName)) {
            hasClientOnlyCode = true;
            if (hasUseServerDirective || isServerComponent(filename)) {
              context.report({
                node,
                messageId: "serverUsingClientHook",
                data: { hook: functionName },
              });
            }
          }
        }
      },

      MemberExpression(node: TSESTree.MemberExpression) {
        // Check for process.env access in client components
        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "Identifier" &&
          node.object.object.name === "process" &&
          node.object.property.type === "Identifier" &&
          node.object.property.name === "env" &&
          node.property.type === "Identifier"
        ) {
          const envVar = node.property.name;

          if (isServerEnvVar(envVar)) {
            hasServerOnlyCode = true;
            if (hasUseClientDirective || isClientComponent(filename)) {
              context.report({
                node,
                messageId: "clientAccessingServerEnv",
                data: { variable: envVar },
              });
            }
          }
        }
      },

      "Program:exit"() {
        // Check for missing directives
        if (
          hasServerOnlyCode &&
          !hasUseServerDirective &&
          !isServerComponent(filename)
        ) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingUseServerDirective",
          });
        }

        if (
          hasClientOnlyCode &&
          !hasUseClientDirective &&
          !isClientComponent(filename)
        ) {
          context.report({
            node: sourceCode.ast,
            messageId: "missingUseClientDirective",
          });
        }
      },
    };
  },
});

function isClientComponent(filename: string): boolean {
  // Check if it's in a client-specific directory or follows client naming pattern
  return (
    filename.includes("/components/") &&
    !filename.includes("/server/") &&
    !filename.includes("/api/")
  );
}

function isServerComponent(filename: string): boolean {
  // Check if it's in server-specific locations
  return (
    filename.includes("/api/") ||
    filename.includes("/server/") ||
    filename.includes("/lib/server") ||
    filename.includes("/actions/")
  );
}

function isServerOnlyModule(moduleName: string): boolean {
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

    // Database and server tools
    "firebase-admin",
    "mysql",
    "mysql2",
    "pg",
    "sqlite3",
    "mongodb",
    "mongoose",
    "prisma",
    "@prisma/client",
    "bcrypt",
    "bcryptjs",
    "jsonwebtoken",
    "nodemailer",
    "sharp",
    "jimp",

    // Environment
    "dotenv",
    "@next/env",
  ];

  return serverOnlyModules.includes(moduleName);
}

function isClientOnlyModule(moduleName: string): boolean {
  const clientOnlyModules = [
    // DOM and browser APIs
    "react-dom",
    "react-dom/client",

    // Client-only libraries
    "framer-motion",
    "react-spring",
    "react-transition-group",
    "react-player",
    "react-chartjs-2",
    "recharts",
    "react-map-gl",
    "leaflet",
    "mapbox-gl",

    // Browser storage
    "localforage",
    "idb",

    // Client-only utilities
    "client-only",
    "use-debounce",
    "use-throttle",

    // Analytics and tracking
    "mixpanel-browser",
    "hotjar",
    "google-analytics",

    // UI libraries that require DOM
    "react-modal",
    "react-tooltip",
    "react-select",
    "react-datepicker",
    "react-color",
    "react-dropzone",
  ];

  return clientOnlyModules.includes(moduleName);
}

function isClientOnlyHook(hookName: string): boolean {
  const clientOnlyHooks = [
    // DOM manipulation
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

    // Browser storage
    "useLocalStorage",
    "useSessionStorage",
    "useCookie",
    "useIndexedDB",

    // Navigation (client-side)
    "useHistory",
    "useLocation",
    "useNavigate",
    "useSearchParams",

    // Media queries and responsive
    "useMedia",
    "useMediaQuery",
    "useBreakpoint",
    "useOrientation",

    // Device APIs
    "useGeolocation",
    "useBattery",
    "useNetworkState",
    "useOnlineStatus",
    "usePermission",
    "useNotification",
    "useCamera",
    "useMicrophone",

    // Interaction
    "useDrag",
    "useDrop",
    "useGesture",
    "useTouch",
    "useMouse",
    "useHover",
    "useFocus",
    "useActive",

    // Performance
    "usePerformance",
    "useWebVitals",

    // Theme
    "useDarkMode",
    "useTheme",
    "useColorScheme",
  ];

  return clientOnlyHooks.includes(hookName);
}

function isServerEnvVar(envVarName: string): boolean {
  // Check if it's a server-side environment variable
  const serverEnvPatterns = [
    /.*SECRET.*/i,
    /.*KEY.*/i,
    /.*TOKEN.*/i,
    /.*PASSWORD.*/i,
    /.*PRIVATE.*/i,
    /.*DATABASE_URL.*/i,
    /.*API_KEY.*/i,
    /.*WEBHOOK_SECRET.*/i,
  ];

  // Skip public environment variables
  const publicPatterns = [
    /.*PUBLIC.*/i,
    /.*NEXT_PUBLIC.*/i,
    /.*REACT_APP.*/i,
    /.*VITE.*/i,
  ];

  if (publicPatterns.some((pattern) => pattern.test(envVarName))) {
    return false;
  }

  return serverEnvPatterns.some((pattern) => pattern.test(envVarName));
}
