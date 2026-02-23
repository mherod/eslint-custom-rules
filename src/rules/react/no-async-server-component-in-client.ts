import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "no-async-server-component-in-client";

type MessageIds = "asyncServerComponentInClient";
type Options = [];

/**
 * Checks if a component name is a React built-in
 */
function isReactBuiltIn(componentName: string): boolean {
  const builtIns = new Set([
    "Suspense",
    "Fragment",
    "StrictMode",
    "Profiler",
    "div",
    "span",
    "a",
    "button",
    "input",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "ol",
    "li",
    "nav",
    "header",
    "footer",
    "section",
    "article",
    "aside",
    "main",
  ]);

  // HTML elements start with lowercase
  const firstChar = componentName[0];
  if (firstChar && firstChar === firstChar.toLowerCase()) {
    return true;
  }

  return builtIns.has(componentName);
}

/**
 * Checks if a component name is a common client component that shouldn't be flagged
 */
function isCommonClientComponent(componentName: string): boolean {
  const commonClientComponents = new Set([
    // UI components that are always client
    "Canvas",
    "HolographicShaderPlane",
    "AutoPageViewTracker",
    // Generic wrappers
    "LazyLoad",
    "ClientOnly",
    "NoSSR",
  ]);

  return commonClientComponents.has(componentName);
}

/**
 * Checks if an import source is likely a server component based on:
 * 1. Import source contains patterns like "-data", "list-data", etc.
 * 2. Import source is from a server-only location (lib/data, repositories, etc.)
 */
function isLikelyServerComponent(importSource: string): boolean {
  // Special handling for dynamic imports and async components
  if (
    importSource === "react-lazy-dynamic-import" ||
    importSource === "async-component"
  ) {
    return true;
  }

  // Check for server component patterns in import source
  const serverPatterns = [
    /-data$/i, // ends with -data (ComponentListData, CampaignsListData)
    /-data\//i, // -data directory
    /\/lib\/data\//, // lib/data directory
    /\/repositories\//, // repositories directory
    /\/actions\//, // server actions
    /\.data\./, // *.data.tsx files
    /\.server\./, // *.server.tsx files
    /\/server\//, // server directory
    /server-/, // server- prefix
  ];

  return serverPatterns.some((pattern) => pattern.test(importSource));
}

/**
 * Detects when client components ("use client") render async server components.
 *
 * This prevents the infinite loop bug where:
 * 1. A file has "use client" directive (making it a client component)
 * 2. It renders an async server component (which uses server-only imports)
 * 3. Next.js tries to serialize the server component for client, causing infinite retries
 *
 * Common patterns this detects:
 * - "use client" file with Suspense wrapping async function components
 * - "use client" file importing and rendering components from *-data.tsx files
 * - "use client" file with async children functions
 *
 * @example
 * // ❌ BAD: Client component rendering async server component
 * "use client";
 * import { MyDataComponent } from "./my-data"; // async server component
 *
 * export function MyClient() {
 *   return (
 *     <Suspense>
 *       <MyDataComponent /> // ERROR: Async server component in client component
 *     </Suspense>
 *   );
 * }
 *
 * // ✅ GOOD: Remove "use client" from wrapper
 * import { Suspense } from "react";
 * import { MyDataComponent } from "./my-data";
 *
 * export function MyWrapper() { // Server component
 *   return (
 *     <Suspense>
 *       <MyDataComponent />
 *     </Suspense>
 *   );
 * }
 */
export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow async server components in client components to prevent infinite render loops",
    },
    schema: [],
    messages: {
      asyncServerComponentInClient:
        "Client components (with 'use client') cannot render async server components. " +
        "This causes infinite loops because server-only imports cannot be serialized for the client. " +
        "Remove 'use client' from this file to make it a server component, or move the async data fetching to the page level.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const filename = context.filename;

    // Only check files with "use client" directive
    if (!hasUseClientDirective(sourceCode)) {
      return {};
    }

    // Skip generic lazy loading utility files
    if (
      filename.includes("lazy-components") ||
      filename.includes("lazy-loading")
    ) {
      return {};
    }

    // Track imports to detect server component patterns
    const imports = new Map<string, string>(); // local name -> source
    // Track async components defined in this file
    const asyncComponents = new Set<string>();

    return {
      // Track async function declarations that return JSX
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.async && containsJSX(node.body)) {
          const functionName = node.id?.name;
          if (functionName && isComponentName(functionName)) {
            asyncComponents.add(functionName);
            imports.set(functionName, "async-component");
          }
        }
      },

      // Track async arrow function expressions assigned to variables
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.init &&
          node.init.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          const arrowFunc = node.init;
          if (arrowFunc.async && containsJSX(arrowFunc.body)) {
            if (node.id.type === AST_NODE_TYPES.Identifier) {
              const varName = node.id.name;
              if (isComponentName(varName)) {
                asyncComponents.add(varName);
                imports.set(varName, "async-component");
              }
            }
          }
        }

        // Check if this is an assignment from React.lazy()
        if (node.init && node.init.type === AST_NODE_TYPES.CallExpression) {
          const callExpr = node.init;

          // Check for React.lazy(...)
          const isReactLazy =
            callExpr.callee.type === AST_NODE_TYPES.MemberExpression &&
            callExpr.callee.object.type === AST_NODE_TYPES.Identifier &&
            callExpr.callee.object.name === "React" &&
            callExpr.callee.property.type === AST_NODE_TYPES.Identifier &&
            callExpr.callee.property.name === "lazy";

          // Check for lazy(...) (if imported)
          const isLazy =
            callExpr.callee.type === AST_NODE_TYPES.Identifier &&
            callExpr.callee.name === "lazy" &&
            imports.get("lazy") === "react";

          if (isReactLazy || isLazy) {
            // Track the variable name as if it were imported from a dynamic source
            if (node.id.type === AST_NODE_TYPES.Identifier) {
              imports.set(node.id.name, "react-lazy-dynamic-import");
            }
          }
        }
      },

      // Track all imports
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const source = node.source.value as string;

        for (const specifier of node.specifiers) {
          if (
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
            specifier.type === AST_NODE_TYPES.ImportSpecifier
          ) {
            imports.set(specifier.local.name, source);
          }
        }
      },

      // Check JSX elements for server component usage
      JSXElement(node: TSESTree.JSXElement): void {
        if (node.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier) {
          const componentName = node.openingElement.name.name;

          // Skip React built-ins and common client components
          if (
            isReactBuiltIn(componentName) ||
            isCommonClientComponent(componentName)
          ) {
            return;
          }

          const importSource = imports.get(componentName);
          if (importSource && isLikelyServerComponent(importSource)) {
            context.report({
              node: node.openingElement,
              messageId: "asyncServerComponentInClient",
            });
          }
        }
      },
    };
  },
});

/**
 * Check if a function body contains JSX elements
 */
function containsJSX(
  body: TSESTree.BlockStatement | TSESTree.Expression
): boolean {
  if (body.type === AST_NODE_TYPES.BlockStatement) {
    return body.body.some((statement) => {
      if (
        statement.type === AST_NODE_TYPES.ReturnStatement &&
        statement.argument
      ) {
        return containsJSXInExpression(statement.argument);
      }
      return false;
    });
  }

  return containsJSXInExpression(body);
}

function containsJSXInExpression(expr: TSESTree.Expression): boolean {
  switch (expr.type) {
    case AST_NODE_TYPES.JSXElement:
    case AST_NODE_TYPES.JSXFragment:
      return true;
    case AST_NODE_TYPES.ConditionalExpression:
      return (
        containsJSXInExpression(expr.consequent) ||
        containsJSXInExpression(expr.alternate)
      );
    case AST_NODE_TYPES.LogicalExpression:
      return (
        containsJSXInExpression(expr.left) ||
        containsJSXInExpression(expr.right)
      );
    default:
      return false;
  }
}

/**
 * Check if a name looks like a React component (starts with uppercase)
 */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}
