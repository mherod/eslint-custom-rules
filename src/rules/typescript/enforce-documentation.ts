import type { TSESLint } from "@typescript-eslint/utils";
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  getJsDocComment,
  isComplexReturnType,
  isComplexType,
  isComponentName,
  isExportedFunction,
  isExportedInterface,
  isExportedType,
  isExportedVariable,
  isHookName,
} from "../utils/common";

export const RULE_NAME = "enforce-documentation";

type MessageIds =
  | "missingJSDocForPublicFunction"
  | "missingJSDocForComponent"
  | "missingJSDocForHook"
  | "missingJSDocForApiRoute"
  | "missingJSDocForUtility"
  | "missingParamDescription"
  | "missingReturnDescription"
  | "missingExampleUsage"
  | "missingTypeDocumentation"
  | "incompleteJSDoc";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce consistent documentation patterns using JSDoc",
    },
    schema: [],
    messages: {
      missingJSDocForPublicFunction:
        "Public function '{{name}}' should have JSDoc documentation",
      missingJSDocForComponent:
        "Component '{{name}}' should have JSDoc documentation describing its purpose and props",
      missingJSDocForHook:
        "Hook '{{name}}' should have JSDoc documentation describing its purpose and return value",
      missingJSDocForApiRoute:
        "API route '{{name}}' should have JSDoc documentation describing endpoints and responses",
      missingJSDocForUtility:
        "Utility function '{{name}}' should have JSDoc documentation for reusability",
      missingParamDescription:
        "Parameter '{{param}}' in '{{function}}' should have description in JSDoc",
      missingReturnDescription:
        "Function '{{name}}' should have @returns description in JSDoc",
      missingExampleUsage:
        "Complex function '{{name}}' should include @example in JSDoc",
      missingTypeDocumentation:
        "Type '{{name}}' should have JSDoc documentation explaining its purpose",
      incompleteJSDoc:
        "JSDoc for '{{name}}' is incomplete - missing {{missing}}",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    const isComponentFile = filename.includes("/components/");
    const isHookFile = filename.includes("/hooks/");
    const isApiFile = filename.includes("/api/");
    const isUtilFile =
      filename.includes("/utils/") || filename.includes("/lib/");

    return {
      // Function declarations
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (!node.id) {
          return;
        }

        const functionName = node.id.name;
        const isExported = isExportedFunction(node);
        const jsDocComment = getJsDocComment(node, sourceCode);

        // Check if public function needs JSDoc
        if (isExported && !jsDocComment) {
          let messageId: MessageIds = "missingJSDocForPublicFunction";

          if (isComponentFile && isComponentName(functionName)) {
            messageId = "missingJSDocForComponent";
          } else if (isHookFile && isHookName(functionName)) {
            messageId = "missingJSDocForHook";
          } else if (isApiFile) {
            messageId = "missingJSDocForApiRoute";
          } else if (isUtilFile) {
            messageId = "missingJSDocForUtility";
          }

          context.report({
            node,
            messageId,
            data: { name: functionName },
          });
        }

        // Validate JSDoc completeness if it exists
        if (jsDocComment) {
          validateJsDocCompleteness(context, node, jsDocComment, functionName);
        }
      },

      // Arrow function expressions in variable declarations
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          (node.init?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            node.init?.type === AST_NODE_TYPES.FunctionExpression)
        ) {
          const functionName = node.id.name;
          const isExported = isExportedVariable(node);
          const jsDocComment = getJsDocComment(node, sourceCode);

          if (isExported && !jsDocComment) {
            let messageId: MessageIds = "missingJSDocForPublicFunction";

            if (isComponentFile && isComponentName(functionName)) {
              messageId = "missingJSDocForComponent";
            } else if (isHookFile && isHookName(functionName)) {
              messageId = "missingJSDocForHook";
            } else if (isUtilFile) {
              messageId = "missingJSDocForUtility";
            }

            context.report({
              node,
              messageId,
              data: { name: functionName },
            });
          }

          if (jsDocComment) {
            validateJsDocCompleteness(
              context,
              node,
              jsDocComment,
              functionName
            );
          }
        }
      },

      // Type aliases
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        const typeName = node.id.name;
        const isExported = isExportedType(node);
        const jsDocComment = getJsDocComment(node, sourceCode);

        if (isExported && !jsDocComment && isComplexType(node.typeAnnotation)) {
          context.report({
            node,
            messageId: "missingTypeDocumentation",
            data: { name: typeName },
          });
        }
      },

      // Interfaces
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        const interfaceName = node.id.name;
        const isExported = isExportedInterface(node);
        const jsDocComment = getJsDocComment(node, sourceCode);

        if (isExported && !jsDocComment) {
          context.report({
            node,
            messageId: "missingTypeDocumentation",
            data: { name: interfaceName },
          });
        }
      },
    };
  },
});

function validateJsDocCompleteness(
  context: TSESLint.RuleContext<MessageIds, []>,
  node: TSESTree.Node,
  jsDocComment: string,
  functionName: string
): void {
  const missing: string[] = [];

  // Check for parameters documentation
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration &&
    node.params.length > 0
  ) {
    const hasParamTags = /@param/.test(jsDocComment);
    if (!hasParamTags) {
      missing.push("@param tags");
    }
  }

  // Check for return documentation
  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.returnType) {
    const hasReturnTag = /@returns?/.test(jsDocComment);
    if (!hasReturnTag) {
      missing.push("@returns tag");
    }
  }

  // Check for example in complex functions
  if (isComplexFunction(node)) {
    const hasExample = /@example/.test(jsDocComment);
    if (!hasExample) {
      missing.push("@example");
    }
  }

  if (missing.length > 0) {
    context.report({
      node,
      messageId: "incompleteJSDoc",
      data: {
        name: functionName,
        missing: missing.join(", "),
      },
    });
  }
}

function isComplexFunction(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    // Consider a function complex if it has multiple parameters or complex return type
    return (
      node.params.length > 2 ||
      (node.returnType ? isComplexReturnType(node.returnType) : false)
    );
  }
  return false;
}
