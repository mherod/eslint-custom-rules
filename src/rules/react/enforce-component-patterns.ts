import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  isComponentName,
  isComponentPath,
  isHookName,
  isHookPath,
} from "../utils/common";

export const RULE_NAME = "enforce-component-patterns";

type MessageIds =
  | "componentMustBePascalCase"
  | "componentMustHavePropsInterface"
  | "hookMustHaveExplicitReturnType"
  | "componentMustBeExported"
  | "componentShouldUseReactImport"
  | "componentMustUseForwardRef"
  | "componentShouldUseMemo"
  | "componentShouldHaveDisplayName";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce consistent component architecture patterns",
    },
    schema: [],
    messages: {
      componentMustBePascalCase:
        "Component '{{name}}' must use PascalCase naming convention",
      componentMustHavePropsInterface:
        "Component '{{name}}' should have a props interface defined",
      hookMustHaveExplicitReturnType:
        "Hook '{{name}}' must have an explicit return type annotation",
      componentMustBeExported:
        "Component '{{name}}' must be exported (default or named export)",
      componentShouldUseReactImport:
        "Component files should import React or use React namespace",
      componentMustUseForwardRef:
        "Component '{{name}}' that accepts ref prop must use React.forwardRef",
      componentShouldUseMemo:
        "Component '{{name}}' with expensive computations should use React.memo",
      componentShouldHaveDisplayName:
        "Component '{{name}}' should have a displayName property for debugging",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isComponentFile = isComponentPath(filename);
    const isHookFile = isHookPath(filename);

    if (!(isComponentFile || isHookFile)) {
      return {};
    }

    const sourceCode = context.getSourceCode();
    let hasReactImport = false;
    const componentDeclarations: string[] = [];
    const hookDeclarations: string[] = [];
    const exportedNames: string[] = [];

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const importSource = node.source.value;

        if (typeof importSource === "string" && importSource === "react") {
          hasReactImport = true;
        }
      },

      // Function declarations
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (!node.id) {
          return;
        }

        const functionName = node.id.name;

        if (isComponentFile && isComponentName(functionName)) {
          componentDeclarations.push(functionName);
          validateComponentDeclaration(context, node, functionName);
        }

        if (isHookFile && isHookName(functionName)) {
          hookDeclarations.push(functionName);
          validateHookDeclaration(context, node, functionName);
        }
      },

      // Arrow function expressions assigned to variables
      VariableDeclarator(node: TSESTree.VariableDeclarator): void {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          (node.init?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            node.init?.type === AST_NODE_TYPES.FunctionExpression)
        ) {
          const functionName = node.id.name;

          if (isComponentFile && isComponentName(functionName)) {
            componentDeclarations.push(functionName);
            validateComponentDeclaration(context, node, functionName);
          }

          if (isHookFile && isHookName(functionName)) {
            hookDeclarations.push(functionName);
            validateHookDeclaration(context, node, functionName);
          }
        }
      },

      // Export declarations
      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration): void {
        if (node.declaration.type === AST_NODE_TYPES.Identifier) {
          exportedNames.push(node.declaration.name);
        }
      },

      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (
          node.declaration?.type === AST_NODE_TYPES.FunctionDeclaration &&
          node.declaration.id
        ) {
          exportedNames.push(node.declaration.id.name);
        }

        if (node.declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const declarator of node.declaration.declarations) {
            if (declarator.id.type === AST_NODE_TYPES.Identifier) {
              exportedNames.push(declarator.id.name);
            }
          }
        }

        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            if (specifier.type === AST_NODE_TYPES.ExportSpecifier) {
              const exportedName =
                specifier.exported.type === AST_NODE_TYPES.Identifier
                  ? specifier.exported.name
                  : "";
              if (exportedName) {
                exportedNames.push(exportedName);
              }
            }
          }
        }
      },

      "Program:exit"(): void {
        // Check if component file has React import
        if (isComponentFile && !hasReactImport) {
          context.report({
            node: sourceCode.ast,
            messageId: "componentShouldUseReactImport",
          });
        }

        // Check if components are exported
        for (const componentName of componentDeclarations) {
          if (!exportedNames.includes(componentName)) {
            context.report({
              node: sourceCode.ast,
              messageId: "componentMustBeExported",
              data: { name: componentName },
            });
          }
        }
      },
    };
  },
});

function validateComponentDeclaration(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator,
  componentName: string
): void {
  // Check PascalCase naming
  if (!isComponentName(componentName)) {
    context.report({
      node,
      messageId: "componentMustBePascalCase",
      data: { name: componentName },
    });
  }

  // Check for props interface
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    const params = node.params;
    if (params.length > 0) {
      const propsParam = params[0];
      if (
        propsParam?.type === AST_NODE_TYPES.Identifier &&
        !propsParam.typeAnnotation
      ) {
        context.report({
          node,
          messageId: "componentMustHavePropsInterface",
          data: { name: componentName },
        });
      }
    }
  }
}

function validateHookDeclaration(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator,
  hookName: string
): void {
  // Check for explicit return type
  let hasReturnType = false;

  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    hasReturnType = !!node.returnType;
  } else if (
    node.type === AST_NODE_TYPES.VariableDeclarator &&
    node.id.type === AST_NODE_TYPES.Identifier
  ) {
    hasReturnType = !!node.id.typeAnnotation;
  }

  if (!hasReturnType) {
    context.report({
      node,
      messageId: "hookMustHaveExplicitReturnType",
      data: { name: hookName },
    });
  }
}
