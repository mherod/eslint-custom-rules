import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { hasUseClientDirective } from "../utils/component-type-utils";

export const RULE_NAME = "prefer-use-swr-over-fetch";

type MessageIds = "preferUseSWROverFetch" | "suggestUseSWRPattern";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer useSWR over direct fetch calls in client components and hooks for better caching, revalidation, and error handling",
    },
    schema: [],
    messages: {
      preferUseSWROverFetch:
        "Consider using useSWR instead of fetch for data fetching in client components. useSWR provides automatic caching, revalidation, error handling, and loading states.",
      suggestUseSWRPattern:
        "This fetch call could benefit from useSWR for better data management. useSWR handles caching, loading states, and revalidation automatically.",
    },
  },
  defaultOptions: [],
  create(context) {
    // Track context information
    let isInCustomHook = false;
    const hasUseClient = hasUseClientDirective(context.getSourceCode());
    let componentOrHookContext = false; // Track if we're anywhere inside a component or hook

    // Check if a function name looks like a React component
    function isReactComponent(name: string | undefined): boolean {
      return (
        name != null && name.length > 0 && name[0] === name[0]?.toUpperCase()
      );
    }

    // Check if a function name looks like a custom hook
    function isCustomHookName(name: string | undefined): boolean {
      return Boolean(name?.startsWith("use") && name.length > 3);
    }

    // Check if we're in a context where fetch should be replaced with useSWR
    function shouldSuggestUseSwr(): boolean {
      // Only suggest in files with "use client" directive
      // And we're anywhere inside a React component or custom hook
      return hasUseClient && componentOrHookContext;
    }

    // Check if a fetch call looks like data fetching (GET request)
    function isDataFetchingCall(node: TSESTree.CallExpression): {
      isDataFetching: boolean;
      confidence: "high" | "medium" | "low";
      reasons: string[];
    } {
      const reasons: string[] = [];
      let confidence: "high" | "medium" | "low" = "low";

      // Check if it's a simple fetch call
      if (node.arguments.length === 1) {
        const urlArg = node.arguments[0];
        if (
          urlArg &&
          urlArg.type === AST_NODE_TYPES.Literal &&
          typeof urlArg.value === "string"
        ) {
          reasons.push("simple URL fetch");
          confidence = "high";
        } else if (
          urlArg &&
          (urlArg.type === AST_NODE_TYPES.TemplateLiteral ||
            urlArg.type === AST_NODE_TYPES.Identifier)
        ) {
          reasons.push("dynamic URL fetch");
          confidence = "medium";
        }
      }

      // Check for GET method or no method specified (defaults to GET)
      if (node.arguments.length >= 2) {
        const optionsArg = node.arguments[1];
        if (optionsArg && optionsArg.type === AST_NODE_TYPES.ObjectExpression) {
          const methodProperty = optionsArg.properties.find(
            (
              prop: TSESTree.ObjectLiteralElementLike
            ): prop is TSESTree.Property =>
              prop.type === AST_NODE_TYPES.Property &&
              prop.key.type === AST_NODE_TYPES.Identifier &&
              prop.key.name === "method"
          );

          if (!methodProperty) {
            reasons.push("no method specified (defaults to GET)");
            confidence = "high"; // fetch defaults to GET, so this is high confidence
          } else if (
            methodProperty.value.type === AST_NODE_TYPES.Literal &&
            typeof methodProperty.value.value === "string" &&
            methodProperty.value.value.toUpperCase() === "GET"
          ) {
            reasons.push("explicit GET method");
            confidence = "high";
          } else if (
            methodProperty.value.type === AST_NODE_TYPES.Literal &&
            typeof methodProperty.value.value === "string" &&
            ["POST", "PUT", "PATCH", "DELETE"].includes(
              methodProperty.value.value.toUpperCase()
            )
          ) {
            // Not a data fetching call - it's a mutation
            return {
              isDataFetching: false,
              confidence: "high",
              reasons: ["mutation method"],
            };
          }

          // Check for headers that suggest data fetching
          const headersProperty = optionsArg.properties.find(
            (
              prop: TSESTree.ObjectLiteralElementLike
            ): prop is TSESTree.Property =>
              prop.type === AST_NODE_TYPES.Property &&
              prop.key.type === AST_NODE_TYPES.Identifier &&
              prop.key.name === "headers"
          );

          if (
            headersProperty &&
            headersProperty.value.type === AST_NODE_TYPES.ObjectExpression
          ) {
            const acceptHeader = headersProperty.value.properties.find(
              (
                prop: TSESTree.ObjectLiteralElementLike
              ): prop is TSESTree.Property =>
                prop.type === AST_NODE_TYPES.Property &&
                ((prop.key.type === AST_NODE_TYPES.Identifier &&
                  prop.key.name === "Accept") ||
                  (prop.key.type === AST_NODE_TYPES.Literal &&
                    prop.key.value === "Accept"))
            );

            if (
              acceptHeader &&
              acceptHeader.value.type === AST_NODE_TYPES.Literal &&
              typeof acceptHeader.value.value === "string" &&
              acceptHeader.value.value.includes("application/json")
            ) {
              reasons.push("JSON Accept header");
              confidence = "high"; // JSON Accept header is a strong indicator of data fetching
            }
          }
        }
      }

      const isDataFetching =
        reasons.length > 0 && !reasons.includes("mutation method");
      return { isDataFetching, confidence, reasons };
    }

    // Check if fetch is being used inside useEffect (common anti-pattern)
    function isInsideUseEffect(node: TSESTree.CallExpression): boolean {
      let parent: TSESTree.Node | undefined = node.parent;
      while (parent) {
        if (
          parent.type === AST_NODE_TYPES.CallExpression &&
          parent.callee.type === AST_NODE_TYPES.Identifier &&
          parent.callee.name === "useEffect"
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    // Check if the fetch result is being used for component state
    function isUsedForState(node: TSESTree.CallExpression): boolean {
      let parent: TSESTree.Node | undefined = node.parent;

      // Check if fetch is part of an async function that sets state
      while (
        parent &&
        parent.type !== AST_NODE_TYPES.FunctionDeclaration &&
        parent.type !== AST_NODE_TYPES.ArrowFunctionExpression
      ) {
        parent = parent.parent;
      }

      if (parent) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const functionText = sourceCode.getText(parent);

        // Look for common state-setting patterns
        return (
          functionText.includes("setState") ||
          (functionText.includes("set") && functionText.includes("(")) ||
          functionText.includes("useState") ||
          functionText.includes("dispatch")
        );
      }

      return false;
    }

    return {
      // Track when we enter/exit functions to know context
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.id?.name) {
          const isComponent = isReactComponent(node.id.name);
          const isHook = isCustomHookName(node.id.name);

          if (isComponent || isHook) {
            isInCustomHook = isHook;
            componentOrHookContext = true;
          }
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.id?.name) {
          const isComponent = isReactComponent(node.id.name);
          const isHook = isCustomHookName(node.id.name);

          if (isComponent || isHook) {
            isInCustomHook = isHook;
            componentOrHookContext = true;
          }
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        // For arrow functions, check parent to see if it's assigned to a component/hook-named variable
        const parent = node.parent;
        if (
          parent &&
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier
        ) {
          const isComponent = isReactComponent(parent.id.name);
          const isHook = isCustomHookName(parent.id.name);

          if (isComponent || isHook) {
            isInCustomHook = isHook;
            componentOrHookContext = true;
          }
        }
      },

      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (node.id?.name) {
          const isComponent = isReactComponent(node.id.name);
          const isHook = isCustomHookName(node.id.name);

          if (isComponent || isHook) {
            isInCustomHook = false;
            componentOrHookContext = false;
          }
        }
      },

      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (node.id?.name) {
          const isComponent = isReactComponent(node.id.name);
          const isHook = isCustomHookName(node.id.name);

          if (isComponent || isHook) {
            isInCustomHook = false;
            componentOrHookContext = false;
          }
        }
      },

      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        const parent = node.parent;
        if (
          parent &&
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier
        ) {
          const isComponent = isReactComponent(parent.id.name);
          const isHook = isCustomHookName(parent.id.name);

          if (isComponent || isHook) {
            isInCustomHook = false;
            componentOrHookContext = false;
          }
        }
      },

      // Check fetch calls
      CallExpression(node: TSESTree.CallExpression): void {
        // Only check if we should suggest useSWR in this context
        if (!shouldSuggestUseSwr()) {
          return;
        }

        // Check if this is a fetch call
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "fetch"
        ) {
          const fetchAnalysis = isDataFetchingCall(node);

          if (fetchAnalysis.isDataFetching) {
            const isInEffect = isInsideUseEffect(node);
            const isForState = isUsedForState(node);

            // Higher priority for fetch calls that are clearly better suited for useSWR
            if (
              fetchAnalysis.confidence === "high" ||
              isInEffect ||
              isForState
            ) {
              context.report({
                node,
                messageId: "preferUseSWROverFetch",
                data: {
                  context: isInCustomHook ? "custom hook" : "component",
                },
              });
            } else if (fetchAnalysis.confidence === "medium") {
              context.report({
                node,
                messageId: "suggestUseSWRPattern",
                data: {
                  context: isInCustomHook ? "custom hook" : "component",
                },
              });
            }
          }
        }
      },
    };
  },
});
