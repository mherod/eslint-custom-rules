import * as path from "node:path";
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "prevent-environment-poisoning";

type MessageIds =
  | "serverSecretInUtil"
  | "serverOnlyInUtil"
  | "serverSecretAccess"
  | "missingServerOnlyDirective"
  | "browserHookInUtil"
  | "missingClientOnlyDirective";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent environment poisoning by detecting server secrets usage in utility/lib files without proper protection",
    },
    fixable: "code",
    schema: [],
    messages: {
      serverSecretInUtil:
        "Server secret '{{secret}}' is being accessed in utility file. Add 'server-only' import to prevent client bundling.",
      serverOnlyInUtil:
        "Server-only module '{{module}}' is imported in utility file. Add 'server-only' import to prevent client bundling.",
      serverSecretAccess:
        "Accessing server environment variable '{{variable}}' without server-only protection could expose secrets.",
      missingServerOnlyDirective:
        "File uses server secrets or server-only modules but is missing 'server-only' import protection.",
      browserHookInUtil:
        "Browser-only hook '{{hook}}' is being used in utility file. Add 'client-only' import to prevent server-side usage.",
      missingClientOnlyDirective:
        "File uses browser-only hooks or APIs but is missing 'client-only' import protection.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isUtilityFile = isUtilityOrLibFile(filename);

    // Only apply this rule to utility/lib files
    if (!isUtilityFile) {
      return {};
    }

    let hasServerOnlyImport = false;
    let hasClientOnlyImport = false;
    let hasServerSecrets = false;
    let hasServerOnlyModules = false;
    let hasBrowserHooks = false;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importedModule = node.source.value;

        if (typeof importedModule !== "string") {
          return;
        }

        // Track if file has server-only import
        if (importedModule === "server-only") {
          hasServerOnlyImport = true;
          return;
        }

        // Track if file has client-only import
        if (importedModule === "client-only") {
          hasClientOnlyImport = true;
          return;
        }

        // Check for server-only modules in utility files
        if (isServerOnlyModule(importedModule)) {
          hasServerOnlyModules = true;
          if (!hasServerOnlyImport) {
            context.report({
              node,
              messageId: "serverOnlyInUtil",
              data: { module: importedModule },
              fix(fixer) {
                return addServerOnlyImport(fixer, context);
              },
            });
          }
        }
      },

      // Check for process.env access to server secrets
      MemberExpression(node: TSESTree.MemberExpression) {
        // Check for dot notation access: process.env.SECRET
        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "Identifier" &&
          node.object.object.name === "process" &&
          node.object.property.type === "Identifier" &&
          node.object.property.name === "env" &&
          node.property.type === "Identifier"
        ) {
          const envVar = node.property.name;

          if (isServerSecret(envVar)) {
            hasServerSecrets = true;
            if (!hasServerOnlyImport) {
              context.report({
                node,
                messageId: "serverSecretInUtil",
                data: { secret: envVar },
                fix(fixer) {
                  return addServerOnlyImport(fixer, context);
                },
              });
            }
          }
        }

        // Check for bracket notation access: process.env["SECRET"]
        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "Identifier" &&
          node.object.object.name === "process" &&
          node.object.property.type === "Identifier" &&
          node.object.property.name === "env" &&
          node.property.type === "Literal" &&
          typeof node.property.value === "string"
        ) {
          const envVar = node.property.value;

          if (isServerSecret(envVar)) {
            hasServerSecrets = true;
            if (!hasServerOnlyImport) {
              context.report({
                node,
                messageId: "serverSecretInUtil",
                data: { secret: envVar },
                fix(fixer) {
                  return addServerOnlyImport(fixer, context);
                },
              });
            }
          }
        }
      },

      // Check for browser-only hooks
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type === "Identifier" &&
          isBrowserOnlyHook(node.callee.name)
        ) {
          hasBrowserHooks = true;
          if (!hasClientOnlyImport) {
            context.report({
              node,
              messageId: "browserHookInUtil",
              data: { hook: node.callee.name },
              fix(fixer) {
                return addClientOnlyImport(fixer, context);
              },
            });
          }
        }
      },

      // Check at the end of file processing
      "Program:exit"() {
        if (
          (hasServerSecrets || hasServerOnlyModules) &&
          !hasServerOnlyImport
        ) {
          context.report({
            node: context.sourceCode.ast,
            messageId: "missingServerOnlyDirective",
            fix(fixer) {
              return addServerOnlyImport(fixer, context);
            },
          });
        }

        if (hasBrowserHooks && !hasClientOnlyImport) {
          context.report({
            node: context.sourceCode.ast,
            messageId: "missingClientOnlyDirective",
            fix(fixer) {
              return addClientOnlyImport(fixer, context);
            },
          });
        }
      },
    };
  },
});

function isUtilityOrLibFile(filename: string): boolean {
  const normalizedPath = path.normalize(filename);

  // Focus on utility and lib files where environment poisoning is most dangerous
  const utilityPatterns = [
    /\/lib\/.*\.tsx?$/, // Lib directory files
    /\/utils\/.*\.tsx?$/, // Utils directory files
    /\/utilities\/.*\.tsx?$/, // Utilities directory files
    /\/helpers\/.*\.tsx?$/, // Helper files
    /\/shared\/.*\.tsx?$/, // Shared utility files
    /\/common\/.*\.tsx?$/, // Common utility files
    /\/config\/.*\.tsx?$/, // Configuration files
    /\/constants\/.*\.tsx?$/, // Constants files
  ];

  return utilityPatterns.some((pattern) => pattern.test(normalizedPath));
}

function isServerOnlyModule(moduleName: string): boolean {
  const serverOnlyModules = [
    // Node.js built-ins that shouldn't be in client bundles
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

    // Firebase Admin SDK (server-only)
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "firebase-admin/storage",

    // Database drivers (server-only)
    "mysql",
    "mysql2",
    "pg",
    "sqlite3",
    "mongodb",
    "mongoose",
    "prisma",
    "@prisma/client",

    // Server-only packages
    "express",
    "fastify",
    "koa",
    "hapi",
    "cors",
    "helmet",
    "bcrypt",
    "bcryptjs",
    "jsonwebtoken",
    "passport",
    "nodemailer",
    "multer",
    "sharp",
    "jimp",

    // Environment/config (can contain secrets)
    "dotenv",
    "@next/env",

    // Next.js server-only
    "next/server",
    "next/headers",
    "next/cookies",
    "next/cache",
    "server-only",
  ];

  return serverOnlyModules.includes(moduleName);
}

function isServerSecret(envVarName: string): boolean {
  const secretPatterns = [
    // Common secret patterns
    /.*SECRET.*/i,
    /.*KEY.*/i,
    /.*TOKEN.*/i,
    /.*PASSWORD.*/i,
    /.*PRIVATE.*/i,
    /.*CREDENTIAL.*/i,
    /.*AUTH.*/i,
    /.*API_KEY.*/i,
    /.*CLIENT_SECRET.*/i,
    /.*REFRESH_TOKEN.*/i,
    /.*ACCESS_TOKEN.*/i,
    /.*WEBHOOK_SECRET.*/i,
    /.*SIGNING_KEY.*/i,
    /.*DATABASE_URL.*/i,
    /.*DB_PASSWORD.*/i,
    /.*REDIS_URL.*/i,
    /.*SMTP_PASSWORD.*/i,
    /.*JWT_SECRET.*/i,
    /.*SESSION_SECRET.*/i,

    // Firebase secrets
    /.*FIREBASE.*PRIVATE_KEY.*/i,
    /.*GCP.*PRIVATE_KEY.*/i,
    /.*GOOGLE.*PRIVATE_KEY.*/i,

    // OAuth secrets
    /.*OAUTH.*SECRET.*/i,
    /.*CLIENT_SECRET.*/i,

    // Payment provider secrets
    /.*STRIPE.*SECRET.*/i,
    /.*PAYPAL.*SECRET.*/i,

    // Third-party service secrets
    /.*OPENAI.*KEY.*/i,
    /.*RESEND.*KEY.*/i,
    /.*SENDGRID.*KEY.*/i,
    /.*TWILIO.*TOKEN.*/i,
    /.*CLOUDFLARE.*KEY.*/i,
  ];

  // Don't flag public/client-side variables
  const publicPatterns = [
    /.*PUBLIC.*/i,
    /.*NEXT_PUBLIC.*/i,
    /.*REACT_APP.*/i,
    /.*VITE.*/i,
  ];

  if (publicPatterns.some((pattern) => pattern.test(envVarName))) {
    return false;
  }

  return secretPatterns.some((pattern) => pattern.test(envVarName));
}

function isBrowserOnlyHook(hookName: string): boolean {
  const browserOnlyHooks = [
    // DOM manipulation hooks
    "useEventListener",
    "useClickOutside",
    "useOnClickOutside",
    "useKeyPress",
    "useKeyDown",
    "useKeyUp",
    "useHotkeys",
    "useScroll",
    "useScrollPosition",
    "useWindowSize",
    "useViewport",
    "useWindowScroll",
    "usePageVisibility",
    "useDocumentTitle",
    "useFavicon",
    "useFullscreen",
    "useClipboard",
    "useCopyToClipboard",

    // Browser storage hooks
    "useLocalStorage",
    "useSessionStorage",
    "useCookie",
    "useCookies",
    "useIndexedDB",

    // Navigation/routing hooks
    "useHistory",
    "useLocation",
    "useParams",
    "useSearchParams",
    "useNavigate",
    "useRouter", // Next.js client router

    // Media/device hooks
    "useMedia",
    "useMediaQuery",
    "useBreakpoint",
    "useOrientation",
    "useDeviceOrientation",
    "useGeolocation",
    "useBattery",
    "useNetworkState",
    "useOnlineStatus",
    "usePermission",

    // Animation/visual hooks
    "useInView",
    "useIntersectionObserver",
    "useResizeObserver",
    "useMutationObserver",
    "useSpring",
    "useTransition",
    "useChain",

    // Input/interaction hooks
    "useDrag",
    "useDrop",
    "useGesture",
    "useTouch",
    "useMouse",
    "useHover",
    "useFocus",
    "useActive",

    // Browser API hooks
    "useNotification",
    "useShare",
    "useWakeLock",
    "useVibrate",
    "useSpeechSynthesis",
    "useSpeechRecognition",
    "useCamera",
    "useMicrophone",
    "useWebRTC",
    "useWebSocket",
    "useEventSource",
    "useBroadcastChannel",
    "useServiceWorker",

    // Performance monitoring
    "usePerformance",
    "usePageSpeed",
    "useWebVitals",

    // Theme/appearance
    "useDarkMode",
    "useTheme",
    "useColorScheme",
    "usePreferredColorScheme",
  ];

  return browserOnlyHooks.includes(hookName);
}

/**
 * Helper function to add server-only import at the very top of the file
 * Ensures it's positioned before any other imports and includes eslint-disable comment
 */
function addServerOnlyImport(fixer: any, context: any) {
  const sourceCode = context.sourceCode;
  const program = sourceCode.ast;

  // Check if server-only import already exists
  const hasServerOnlyImport = program.body.some(
    (node: any) =>
      node.type === "ImportDeclaration" &&
      node.source &&
      node.source.value === "server-only"
  );

  if (hasServerOnlyImport) {
    // Already has server-only import, no fix needed
    return;
  }

  // Find the position to insert - before any existing imports or at the very start
  const firstImport = program.body.find(
    (node: any) => node.type === "ImportDeclaration"
  );
  const insertText =
    '// eslint-disable-next-line @mherod/custom/enforce-import-order\nimport "server-only";\n\n';

  if (firstImport) {
    // Insert before the first import
    return fixer.insertTextBefore(firstImport, insertText);
  }
  // No imports exist, insert at the very beginning
  const firstToken = sourceCode.getFirstToken(program);
  if (firstToken) {
    return fixer.insertTextBefore(firstToken, insertText);
  }
  // Empty file
  return fixer.insertTextAfter(program, insertText);
}

/**
 * Helper function to add client-only import at the very top of the file
 * Ensures it's positioned before any other imports and includes eslint-disable comment
 */
function addClientOnlyImport(fixer: any, context: any) {
  const sourceCode = context.sourceCode;
  const program = sourceCode.ast;

  // Check if client-only import already exists
  const hasClientOnlyImport = program.body.some(
    (node: any) =>
      node.type === "ImportDeclaration" &&
      node.source &&
      node.source.value === "client-only"
  );

  if (hasClientOnlyImport) {
    // Already has client-only import, no fix needed
    return;
  }

  // Find the position to insert - before any existing imports or at the very start
  const firstImport = program.body.find(
    (node: any) => node.type === "ImportDeclaration"
  );
  const insertText =
    '// eslint-disable-next-line @mherod/custom/enforce-import-order\nimport "client-only";\n\n';

  if (firstImport) {
    // Insert before the first import
    return fixer.insertTextBefore(firstImport, insertText);
  }
  // No imports exist, insert at the very beginning
  const firstToken = sourceCode.getFirstToken(program);
  if (firstToken) {
    return fixer.insertTextBefore(firstToken, insertText);
  }
  // Empty file
  return fixer.insertTextAfter(program, insertText);
}
