import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-react-destructured-imports";

type MessageIds = "preferDestructuredImport" | "suggestDestructuredImport";
type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer destructured imports from 'react' instead of using the React namespace",
    },
    schema: [],
    messages: {
      preferDestructuredImport:
        "Prefer destructured imports over React namespace. Import '{{memberName}}' directly from 'react'.",
      suggestDestructuredImport:
        "Consider importing '{{memberName}}' directly from 'react' instead of using React.{{memberName}}.",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    let hasReactImport = false;
    let reactImportNode: TSESTree.ImportDeclaration | null = null;
    const existingDestructuredImports: Set<string> = new Set();

    // Common React members that are frequently used
    const commonReactMembers = new Set([
      "useState",
      "useEffect",
      "useContext",
      "useCallback",
      "useMemo",
      "useRef",
      "useReducer",
      "useLayoutEffect",
      "useImperativeHandle",
      "createContext",
      "forwardRef",
      "memo",
      "Component",
      "PureComponent",
      "Fragment",
      "createElement",
      "cloneElement",
    ]);

    return {
      // Track React imports
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (node.source.value === "react") {
          hasReactImport = true;
          reactImportNode = node;

          // Track existing destructured imports
          if (node.specifiers) {
            for (const specifier of node.specifiers) {
              if (
                specifier.type === AST_NODE_TYPES.ImportSpecifier &&
                specifier.imported.type === AST_NODE_TYPES.Identifier
              ) {
                existingDestructuredImports.add(specifier.imported.name);
              }
            }
          }
        }
      },

      // Check for React.* usage
      MemberExpression(node: TSESTree.MemberExpression): void {
        // Look for React.something patterns
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === "React" &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          hasReactImport
        ) {
          const memberName = node.property.name;

          // Skip if already destructured
          if (existingDestructuredImports.has(memberName)) {
            return;
          }

          // Determine message severity based on how common the member is
          const messageId = commonReactMembers.has(memberName)
            ? "preferDestructuredImport"
            : "suggestDestructuredImport";

          context.report({
            node,
            messageId,
            data: {
              memberName,
            },
            fix(fixer) {
              if (!reactImportNode) {
                return null;
              }

              // Find the React import and add the member to destructured imports
              const importText = sourceCode.getText(reactImportNode);

              // Check if there's already a default import (React)
              const hasDefaultImport = reactImportNode.specifiers?.some(
                (spec) => spec.type === AST_NODE_TYPES.ImportDefaultSpecifier
              );

              // Check if there are already destructured imports
              const hasDestructuredImports = reactImportNode.specifiers?.some(
                (spec) => spec.type === AST_NODE_TYPES.ImportSpecifier
              );

              let newImportText: string;

              if (hasDefaultImport && !hasDestructuredImports) {
                // React from 'react' -> React, { memberName } from 'react'
                newImportText = importText.replace(
                  /import\s+React\s+from\s+['"]react['"];?/,
                  `import React, { ${memberName} } from 'react';`
                );
              } else if (hasDefaultImport && hasDestructuredImports) {
                // React, { existing } from 'react' -> React, { existing, memberName } from 'react'
                newImportText = importText.replace(
                  /\{\s*([^}]+)\s*\}/,
                  (_match: string, existingImports: string) => {
                    const imports = existingImports
                      .split(",")
                      .map((imp: string) => imp.trim());
                    if (!imports.includes(memberName)) {
                      imports.push(memberName);
                    }
                    return `{ ${imports.join(", ")} }`;
                  }
                );
              } else if (!hasDefaultImport && hasDestructuredImports) {
                // { existing } from 'react' -> { existing, memberName } from 'react'
                newImportText = importText.replace(
                  /\{\s*([^}]+)\s*\}/,
                  (_match: string, existingImports: string) => {
                    const imports = existingImports
                      .split(",")
                      .map((imp: string) => imp.trim());
                    if (!imports.includes(memberName)) {
                      imports.push(memberName);
                    }
                    return `{ ${imports.join(", ")} }`;
                  }
                );
              } else {
                // No existing imports, create new destructured import
                newImportText = `import { ${memberName} } from 'react';`;
              }

              return [
                // Replace the import
                fixer.replaceText(reactImportNode, newImportText),
                // Replace React.memberName with just memberName
                fixer.replaceText(node, memberName),
              ];
            },
          });
        }
      },
    };
  },
});
