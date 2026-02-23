import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "require-use-client-for-react-hooks";

type MessageIds = "missingUseClientDirective";
type Options = [];

const CLIENT_ONLY_REACT_HOOKS = new Set([
  "useState",
  "useReducer",
  "useEffect",
  "useLayoutEffect",
  "useInsertionEffect",
  "useRef",
  "useCallback",
  "useMemo",
  "useImperativeHandle",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useSyncExternalStore",
  "useContext",
]);

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require 'use client' in files that use client-only React hooks.",
    },
    schema: [],
    messages: {
      missingUseClientDirective:
        "React hook '{{hook}}' only works in Client Components. " +
        'Add the "use client" directive to this file or move the hook to a client component.',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const filename = context.filename;
    const normalizedPath = filename.replace(/\\/g, "/");

    if (!/\.(tsx|jsx)$/.test(normalizedPath)) {
      return {};
    }
    if (hasUseClientDirective(sourceCode)) {
      return {};
    }

    const reactHookAliases = new Map<string, string>();
    const reactNamespaceImports = new Set<string>();
    const reportedHooks = new Set<string>();

    const reportHookUsage = (node: TSESTree.Node, hook: string): void => {
      if (reportedHooks.has(hook)) {
        return;
      }
      reportedHooks.add(hook);
      context.report({
        node,
        messageId: "missingUseClientDirective",
        data: { hook },
      });
    };

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (node.source.value !== "react") {
          return;
        }
        if (node.importKind === "type") {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            if (specifier.importKind === "type") {
              continue;
            }
            const importedName =
              specifier.imported.type === AST_NODE_TYPES.Identifier
                ? specifier.imported.name
                : specifier.imported.value;
            if (typeof importedName !== "string") {
              continue;
            }
            if (CLIENT_ONLY_REACT_HOOKS.has(importedName)) {
              reactHookAliases.set(specifier.local.name, importedName);
              reportHookUsage(specifier, importedName);
            }
          }
          if (
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
            specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier
          ) {
            reactNamespaceImports.add(specifier.local.name);
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const hookName = reactHookAliases.get(node.callee.name);
          if (hookName) {
            reportHookUsage(node.callee, hookName);
          }
        }
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          reactNamespaceImports.has(node.callee.object.name) &&
          node.callee.property.type === AST_NODE_TYPES.Identifier
        ) {
          const hookName = node.callee.property.name;
          if (CLIENT_ONLY_REACT_HOOKS.has(hookName)) {
            reportHookUsage(node.callee.property, hookName);
          }
        }
      },
    };
  },
});
