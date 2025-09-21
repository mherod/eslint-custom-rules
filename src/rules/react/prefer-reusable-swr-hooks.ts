import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-reusable-swr-hooks";

type MessageIds = "preferReusableSwrHook" | "suggestCustomHook";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Encourage creating reusable custom hooks when using useSWR with complex logic",
    },
    schema: [],
    messages: {
      preferReusableSwrHook:
        "Consider extracting this useSWR logic into a reusable custom hook. Complex SWR configurations should be encapsulated in custom hooks for better reusability and testing.",
      suggestCustomHook:
        "This useSWR usage could benefit from being extracted into a custom hook named 'use{{suggestedName}}' for better reusability.",
    },
    // No auto-fix as this requires manual refactoring
  },
  defaultOptions: [],
  create(context) {
    // Track if we're inside a component (not already in a custom hook)
    let isInCustomHook = false;
    let currentFunctionName = "";

    // Check if a function name looks like a custom hook
    function isCustomHookName(name: string): boolean {
      return name.startsWith("use") && name.length > 3;
    }

    // Check if useSWR usage is complex enough to warrant a custom hook
    function isComplexUseSwr(node: TSESTree.CallExpression): {
      isComplex: boolean;
      complexity: string[];
      suggestedName: string;
    } {
      const complexityFactors: string[] = [];
      let suggestedName = "";

      // Check arguments
      const args = node.arguments;
      if (args.length >= 2) {
        // Check for complex key function
        const keyArg = args[0];
        if (
          keyArg &&
          (keyArg.type === "ArrowFunctionExpression" ||
            keyArg.type === "FunctionExpression" ||
            (keyArg.type === "CallExpression" &&
              keyArg.callee.type === "Identifier"))
        ) {
          complexityFactors.push("complex key function");
        }

        // Check for complex fetcher function
        const fetcherArg = args[1];
        if (
          fetcherArg &&
          (fetcherArg.type === "ArrowFunctionExpression" ||
            fetcherArg.type === "FunctionExpression")
        ) {
          const fetcherBody = fetcherArg.body;
          if (
            fetcherBody.type === "BlockStatement" &&
            fetcherBody.body.length > 3
          ) {
            complexityFactors.push("complex fetcher logic");
          }
        }

        // Check for extensive configuration options
        if (args.length >= 3) {
          const configArg = args[2];
          if (configArg && configArg.type === "ObjectExpression") {
            const properties = configArg.properties;
            if (properties.length >= 4) {
              complexityFactors.push("extensive configuration");
            }

            // Check for specific complex configurations
            const propertyNames = properties
              .filter(
                (prop): prop is TSESTree.Property => prop.type === "Property"
              )
              .map((prop) => {
                if (prop.key.type === "Identifier") {
                  return prop.key.name;
                }
                return "";
              })
              .filter(Boolean);

            if (
              propertyNames.some((name) =>
                [
                  "onError",
                  "onSuccess",
                  "onErrorRetry",
                  "refreshInterval",
                ].includes(name)
              )
            ) {
              complexityFactors.push("complex event handlers");
            }

            if (propertyNames.includes("dedupingInterval")) {
              complexityFactors.push("custom caching configuration");
            }
          }
        }
      }

      // Generate suggested hook name based on context
      const parent = node.parent;
      if (parent && parent.type === "VariableDeclarator") {
        // Handle simple identifier
        if (parent.id.type === "Identifier") {
          const varName = parent.id.name;
          if (varName.includes("data") || varName.includes("Data")) {
            suggestedName = varName.replace(/data|Data/gi, "").toLowerCase();
          }
        }
        // Handle object destructuring pattern
        else if (parent.id.type === "ObjectPattern") {
          // Find the first property
          const firstProp = parent.id.properties[0];
          if (
            firstProp &&
            firstProp.type === "Property" &&
            firstProp.key.type === "Identifier"
          ) {
            const varName = firstProp.key.name;
            if (varName.includes("data") || varName.includes("Data")) {
              suggestedName = varName.replace(/data|Data/gi, "").toLowerCase();
            }
          }
        }
      }

      // Try to use current function/component name
      if (!suggestedName && currentFunctionName) {
        if (currentFunctionName.includes("Component")) {
          suggestedName = currentFunctionName.replace("Component", "Data");
        } else if (currentFunctionName.includes("Page")) {
          suggestedName = currentFunctionName.replace("Page", "Data");
        } else {
          suggestedName = `${currentFunctionName}Data`;
        }
      }

      // Fallback: try to infer from key if it's a string
      if (
        !suggestedName &&
        args[0] &&
        args[0].type === "Literal" &&
        typeof args[0].value === "string"
      ) {
        const key = args[0].value as string;
        const keyParts = key.split("/").filter(Boolean);
        if (keyParts.length > 0) {
          const lastPart = keyParts.at(-1);
          if (lastPart) {
            suggestedName = lastPart.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          }
        }
      }

      if (!suggestedName) {
        suggestedName = "CustomData";
      }

      // Capitalize first letter for hook name
      suggestedName =
        suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1);

      return {
        isComplex: complexityFactors.length >= 2,
        complexity: complexityFactors,
        suggestedName,
      };
    }

    return {
      // Track when we enter/exit functions to know if we're in a custom hook
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (node.id?.name) {
          currentFunctionName = node.id.name;
          isInCustomHook = isCustomHookName(node.id.name);
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression) {
        if (node.id?.name) {
          currentFunctionName = node.id.name;
          isInCustomHook = isCustomHookName(node.id.name);
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        // For arrow functions, check parent to see if it's assigned to a hook-named variable
        const parent = node.parent;
        if (
          parent &&
          parent.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          currentFunctionName = parent.id.name;
          isInCustomHook = isCustomHookName(parent.id.name);
        }
      },

      "FunctionDeclaration:exit"() {
        isInCustomHook = false;
        currentFunctionName = "";
      },

      "FunctionExpression:exit"() {
        isInCustomHook = false;
        currentFunctionName = "";
      },

      "ArrowFunctionExpression:exit"() {
        isInCustomHook = false;
        currentFunctionName = "";
      },

      // Check useSWR calls
      CallExpression(node: TSESTree.CallExpression) {
        // Only check if we're not already in a custom hook
        if (isInCustomHook) {
          return;
        }

        // Check if this is a useSWR call
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "useSWR"
        ) {
          const complexity = isComplexUseSwr(node);

          if (complexity.isComplex) {
            context.report({
              node,
              messageId: "preferReusableSwrHook",
              data: {
                suggestedName: complexity.suggestedName,
              },
            });
          } else if (node.arguments.length >= 2) {
            // Only suggest custom hook for more complex fetchers (not simple inline functions)
            const fetcherArg = node.arguments[1];
            if (
              fetcherArg &&
              (fetcherArg.type === "ArrowFunctionExpression" ||
                fetcherArg.type === "FunctionExpression")
            ) {
              // Check if the fetcher is complex enough to warrant extraction
              let isComplexFetcher = false;

              if (
                fetcherArg.type === "ArrowFunctionExpression" &&
                fetcherArg.body.type === "BlockStatement"
              ) {
                // Multi-line arrow function
                isComplexFetcher = fetcherArg.body.body.length > 1;
              } else if (
                fetcherArg.type === "FunctionExpression" &&
                fetcherArg.body.type === "BlockStatement"
              ) {
                // Function expression with multiple statements
                isComplexFetcher = fetcherArg.body.body.length > 1;
              } else if (
                fetcherArg.type === "ArrowFunctionExpression" &&
                fetcherArg.body.type === "CallExpression"
              ) {
                // Check if it's a complex chain like fetch().then().then()
                let callExpr = fetcherArg.body;
                let chainLength = 0;
                while (
                  callExpr.type === "CallExpression" &&
                  callExpr.callee.type === "MemberExpression"
                ) {
                  chainLength++;
                  if (callExpr.callee.object.type === "CallExpression") {
                    callExpr = callExpr.callee.object;
                  } else {
                    break;
                  }
                }
                isComplexFetcher = chainLength > 1; // fetch().then() is simple, fetch().then().then() suggests complexity
              }

              if (isComplexFetcher) {
                context.report({
                  node,
                  messageId: "suggestCustomHook",
                  data: {
                    suggestedName: complexity.suggestedName,
                  },
                });
              }
            }
          }
        }
      },
    };
  },
});
