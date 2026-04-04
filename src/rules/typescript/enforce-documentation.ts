import type { TSESLint } from "@typescript-eslint/utils";
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  getJsDocComment,
  isComplexType,
  isComponentName,
  isExportedVariable,
  isHookName,
} from "../utils/common";

/**
 * Extracts parameter names from a function node for JSDoc generation.
 */
function getParamNames(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
): string[] {
  return node.params
    .map((param) => {
      if (param.type === AST_NODE_TYPES.Identifier) {
        return param.name;
      }
      if (
        param.type === AST_NODE_TYPES.AssignmentPattern &&
        param.left.type === AST_NODE_TYPES.Identifier
      ) {
        return param.left.name;
      }
      if (
        param.type === AST_NODE_TYPES.RestElement &&
        param.argument.type === AST_NODE_TYPES.Identifier
      ) {
        return `...${param.argument.name}`;
      }
      return null;
    })
    .filter((name): name is string => name !== null);
}

/**
 * Generates a JSDoc stub comment for a given function or type.
 */
function generateJsDocStub(
  name: string,
  params: string[],
  hasReturn: boolean,
  indent: string
): string {
  const lines: string[] = [
    `${indent}/**`,
    `${indent} * Description of ${name}.`,
  ];

  for (const param of params) {
    lines.push(`${indent} * @param ${param} - Description.`);
  }

  if (hasReturn) {
    lines.push(`${indent} * @returns Description.`);
  }

  lines.push(`${indent} */`);
  return `${lines.join("\n")}\n`;
}

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
    fixable: "code",
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
    const filename = context.filename;
    const sourceCode = context.sourceCode;

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
        const isExported =
          node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
          node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration;
        const jsDocComment =
          getJsDocComment(node, sourceCode) ||
          (isExported && node.parent
            ? getJsDocComment(node.parent, sourceCode)
            : null);

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

          const insertTarget =
            node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
            node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
              ? node.parent
              : node;
          const params = getParamNames(node);
          const hasReturn = node.returnType !== undefined;
          const col = insertTarget.loc.start.column;
          const indent = " ".repeat(col);

          context.report({
            node,
            messageId,
            data: { name: functionName },
            fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
              fixer.insertTextBefore(
                insertTarget,
                generateJsDocStub(functionName, params, hasReturn, indent)
              ),
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

            const fnNode = node.init as
              | TSESTree.ArrowFunctionExpression
              | TSESTree.FunctionExpression;
            const varDecl = node.parent;
            const insertTarget =
              varDecl?.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
                ? varDecl.parent
                : (varDecl ?? node);
            const params = getParamNames(fnNode);
            const hasReturn = fnNode.returnType !== undefined;
            const col = insertTarget.loc.start.column;
            const indent = " ".repeat(col);

            context.report({
              node,
              messageId,
              data: { name: functionName },
              fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                fixer.insertTextBefore(
                  insertTarget,
                  generateJsDocStub(functionName, params, hasReturn, indent)
                ),
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
        const isExported =
          node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration;
        const jsDocComment =
          getJsDocComment(node, sourceCode) ||
          (isExported && node.parent
            ? getJsDocComment(node.parent, sourceCode)
            : null);

        if (isExported && !jsDocComment && isComplexType(node.typeAnnotation)) {
          const insertTarget =
            node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
              ? node.parent
              : node;
          const col = insertTarget.loc.start.column;
          const indent = " ".repeat(col);

          context.report({
            node,
            messageId: "missingTypeDocumentation",
            data: { name: typeName },
            fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
              fixer.insertTextBefore(
                insertTarget,
                generateJsDocStub(typeName, [], false, indent)
              ),
          });
        }
      },

      // Interfaces
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        const interfaceName = node.id.name;
        const isExported =
          node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration;
        const jsDocComment =
          getJsDocComment(node, sourceCode) ||
          (isExported && node.parent
            ? getJsDocComment(node.parent, sourceCode)
            : null);

        if (isExported && !jsDocComment) {
          const insertTarget =
            node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
              ? node.parent
              : node;
          const col = insertTarget.loc.start.column;
          const indent = " ".repeat(col);

          context.report({
            node,
            messageId: "missingTypeDocumentation",
            data: { name: interfaceName },
            fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
              fixer.insertTextBefore(
                insertTarget,
                generateJsDocStub(interfaceName, [], false, indent)
              ),
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
      (node.returnType ? isComplexType(node.returnType.typeAnnotation) : false)
    );
  }
  return false;
}
