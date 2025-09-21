import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-lodash-uniq-over-set";

type MessageIds = "preferLodashUniq" | "preferLodashUniqBy";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer lodash-es uniq/uniqBy over Set for array deduplication for cleaner syntax",
    },
    schema: [],
    messages: {
      preferLodashUniq:
        "Prefer lodash-es uniq() over Set for array deduplication. Use: import { uniq } from 'lodash-es'; return uniq(array);",
      preferLodashUniqBy:
        "Prefer lodash-es uniqBy() over Set for array deduplication with property access. Use: import { uniqBy } from 'lodash-es'; return uniqBy(array, 'property');",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    // Track if lodash-es is imported
    let hasLodashImport = false;
    let lodashImportNode: TSESTree.ImportDeclaration | null = null;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value === "lodash-es") {
          hasLodashImport = true;
          lodashImportNode = node;
        }
      },

      // Pattern 1: new Set() followed by Array.from()
      // e.g., Array.from(new Set(array))
      CallExpression(node: TSESTree.CallExpression) {
        // Check for Array.from(new Set(...))
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "Array" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "from" &&
          node.arguments.length > 0
        ) {
          const firstArg = node.arguments[0];

          // Check if first argument is new Set(...)
          if (
            firstArg &&
            firstArg.type === "NewExpression" &&
            firstArg.callee.type === "Identifier" &&
            firstArg.callee.name === "Set" &&
            firstArg.arguments.length > 0
          ) {
            context.report({
              node,
              messageId: "preferLodashUniq",
              fix(fixer) {
                const fixes: unknown[] = [];

                // Add lodash import if not present
                if (!hasLodashImport && sourceCode.ast.body.length > 0) {
                  const firstNode = sourceCode.ast.body[0];
                  if (firstNode) {
                    fixes.push(
                      fixer.insertTextBefore(
                        firstNode,
                        "import { uniq } from 'lodash-es';\n"
                      )
                    );
                  }
                } else if (hasLodashImport && lodashImportNode) {
                  // Add uniq to existing import
                  const importSpecifiers = lodashImportNode.specifiers
                    .filter(
                      (s): s is TSESTree.ImportSpecifier =>
                        s.type === "ImportSpecifier"
                    )
                    .map((s) => (s.imported as TSESTree.Identifier).name);

                  if (
                    !importSpecifiers.includes("uniq") &&
                    lodashImportNode.specifiers.length > 0
                  ) {
                    const lastSpecifier = lodashImportNode.specifiers.at(-1);
                    if (lastSpecifier) {
                      fixes.push(
                        fixer.insertTextAfter(lastSpecifier, ", uniq")
                      );
                    }
                  }
                }

                // Replace Array.from(new Set(...)) with uniq(...)
                const setArgument =
                  firstArg && "arguments" in firstArg
                    ? firstArg.arguments[0]
                    : undefined;
                if (setArgument) {
                  const setArgumentText = sourceCode.getText(setArgument);
                  fixes.push(
                    fixer.replaceText(node, `uniq(${setArgumentText})`)
                  );
                }

                return fixes;
              },
            });
          }
        }

        // Check for [...new Set(...)]
        if (
          node.type === "CallExpression" &&
          node.callee.type === "Identifier" &&
          node.arguments.length === 0
        ) {
          // This will be handled by SpreadElement visitor
        }
      },

      // Pattern 2: Spread operator with new Set
      // e.g., [...new Set(array)] or [...new Set([...arr1, ...arr2])]
      ArrayExpression(node: TSESTree.ArrayExpression) {
        // Check if this array has exactly one element which is a spread of new Set
        if (
          node.elements.length === 1 &&
          node.elements[0]?.type === "SpreadElement"
        ) {
          const spreadElement = node.elements[0];
          if (
            spreadElement.argument.type === "NewExpression" &&
            spreadElement.argument.callee.type === "Identifier" &&
            spreadElement.argument.callee.name === "Set" &&
            spreadElement.argument.arguments.length > 0
          ) {
            // Check if the Set argument is an array with spreads (like [...arr1, ...arr2])
            const setArg = spreadElement.argument.arguments[0];
            const isArrayWithSpreads =
              setArg?.type === "ArrayExpression" &&
              setArg.elements.some((el) => el?.type === "SpreadElement");

            // Report with additional context if it's a complex array merge
            const messageId = isArrayWithSpreads
              ? "preferLodashUniq"
              : "preferLodashUniq";

            context.report({
              node,
              messageId,
              fix(fixer) {
                const fixes: unknown[] = [];

                // Add lodash import if not present
                if (!hasLodashImport && sourceCode.ast.body.length > 0) {
                  const firstNode = sourceCode.ast.body[0];
                  if (firstNode) {
                    fixes.push(
                      fixer.insertTextBefore(
                        firstNode,
                        "import { uniq } from 'lodash-es';\n"
                      )
                    );
                  }
                } else if (hasLodashImport && lodashImportNode) {
                  // Add uniq to existing import
                  const importSpecifiers = lodashImportNode.specifiers
                    .filter(
                      (s): s is TSESTree.ImportSpecifier =>
                        s.type === "ImportSpecifier"
                    )
                    .map((s) => (s.imported as TSESTree.Identifier).name);

                  if (
                    !importSpecifiers.includes("uniq") &&
                    lodashImportNode.specifiers.length > 0
                  ) {
                    const lastSpecifier = lodashImportNode.specifiers.at(-1);
                    if (lastSpecifier) {
                      fixes.push(
                        fixer.insertTextAfter(lastSpecifier, ", uniq")
                      );
                    }
                  }
                }

                // Replace [...new Set(...)] with uniq(...)
                const setExpression = spreadElement.argument;
                if (
                  setExpression.type === "NewExpression" &&
                  setExpression.arguments.length > 0
                ) {
                  const setArgument = setExpression.arguments[0];
                  const setArgumentText = sourceCode.getText(setArgument);
                  fixes.push(
                    fixer.replaceText(node, `uniq(${setArgumentText})`)
                  );
                }

                return fixes;
              },
            });
          }
        }

        // Also check for array expressions that contain spreads of new Set among other elements
        // e.g., [someItem, ...new Set(arr), otherItem]
        // Only check if we have multiple elements (single element case is handled above)
        if (node.elements.length > 1) {
          for (const element of node.elements) {
            if (
              element?.type === "SpreadElement" &&
              element.argument.type === "NewExpression" &&
              element.argument.callee.type === "Identifier" &&
              element.argument.callee.name === "Set" &&
              element.argument.arguments.length > 0
            ) {
              // Report but don't auto-fix complex cases with multiple elements
              context.report({
                node: element,
                messageId: "preferLodashUniq",
                // No auto-fix for complex multi-element arrays
              });
            }
          }
        }
      },

      // Pattern 3: Manual Set iteration pattern
      // const set = new Set(); for (...) { set.add(...) } return Array.from(set)
      BlockStatement(node: TSESTree.BlockStatement) {
        const statements = node.body;

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];

          // Look for: const uniqueItems = new Set()
          if (
            stmt &&
            stmt.type === "VariableDeclaration" &&
            stmt.declarations.length === 1 &&
            stmt.declarations[0].init?.type === "NewExpression" &&
            (stmt.declarations[0].init.callee as any).type === "Identifier" &&
            (stmt.declarations[0].init.callee as any).name === "Set" &&
            stmt.declarations[0].id.type === "Identifier"
          ) {
            const setVarName = stmt.declarations[0].id.name;

            // Look for subsequent for loop that adds to the set
            let hasForLoop = false;
            let propertyName: string | null = null;

            for (let j = i + 1; j < statements.length; j++) {
              const nextStmt = statements[j];

              // Check for for...of or for...in loop
              if (
                nextStmt &&
                (nextStmt.type === "ForOfStatement" ||
                  nextStmt.type === "ForInStatement") &&
                "body" in nextStmt &&
                nextStmt.body.type === "BlockStatement"
              ) {
                // Check if the loop body contains set.add()
                const hasSetAdd = nextStmt.body.body.some((loopStmt: any) => {
                  if (loopStmt.type === "IfStatement") {
                    // Check for conditional add pattern
                    const consequent = loopStmt.consequent;
                    if (
                      consequent.type === "BlockStatement" &&
                      consequent.body.length > 0
                    ) {
                      return consequent.body.some((innerStmt: any) => {
                        if (
                          innerStmt.type === "ExpressionStatement" &&
                          innerStmt.expression.type === "CallExpression" &&
                          innerStmt.expression.callee.type ===
                            "MemberExpression" &&
                          innerStmt.expression.callee.object.type ===
                            "Identifier" &&
                          innerStmt.expression.callee.object.name ===
                            setVarName &&
                          innerStmt.expression.callee.property.type ===
                            "Identifier" &&
                          innerStmt.expression.callee.property.name === "add"
                        ) {
                          // Check if adding a property
                          const addArg = innerStmt.expression.arguments[0];
                          if (
                            addArg?.type === "MemberExpression" &&
                            addArg.property.type === "Identifier"
                          ) {
                            propertyName = addArg.property.name;
                          }
                          return true;
                        }
                        return false;
                      });
                    }
                  } else if (
                    loopStmt.type === "ExpressionStatement" &&
                    loopStmt.expression.type === "CallExpression" &&
                    loopStmt.expression.callee.type === "MemberExpression" &&
                    loopStmt.expression.callee.object.type === "Identifier" &&
                    loopStmt.expression.callee.object.name === setVarName &&
                    loopStmt.expression.callee.property.type === "Identifier" &&
                    loopStmt.expression.callee.property.name === "add"
                  ) {
                    // Check if adding a property
                    const addArg = loopStmt.expression.arguments[0];
                    if (
                      addArg?.type === "MemberExpression" &&
                      addArg.property.type === "Identifier"
                    ) {
                      propertyName = addArg.property.name;
                    }
                    return true;
                  }
                  return false;
                });

                if (hasSetAdd) {
                  hasForLoop = true;
                  break;
                }
              }
            }

            // Look for return Array.from(set) or return [...set]
            if (hasForLoop) {
              for (let k = i + 1; k < statements.length; k++) {
                const returnStmt = statements[k];

                if (
                  returnStmt &&
                  returnStmt.type === "ReturnStatement" &&
                  returnStmt.argument
                ) {
                  // Check for Array.from(set)
                  if (
                    returnStmt.argument.type === "CallExpression" &&
                    returnStmt.argument.callee.type === "MemberExpression" &&
                    returnStmt.argument.callee.object.type === "Identifier" &&
                    returnStmt.argument.callee.object.name === "Array" &&
                    returnStmt.argument.callee.property.type === "Identifier" &&
                    returnStmt.argument.callee.property.name === "from" &&
                    returnStmt.argument.arguments[0]?.type === "Identifier" &&
                    returnStmt.argument.arguments[0].name === setVarName
                  ) {
                    context.report({
                      node: stmt,
                      messageId: propertyName
                        ? "preferLodashUniqBy"
                        : "preferLodashUniq",
                    });
                    break;
                  }

                  // Check for [...set]
                  if (
                    returnStmt.argument.type === "ArrayExpression" &&
                    returnStmt.argument.elements.length === 1 &&
                    returnStmt.argument.elements[0]?.type === "SpreadElement" &&
                    returnStmt.argument.elements[0].argument.type ===
                      "Identifier" &&
                    returnStmt.argument.elements[0].argument.name === setVarName
                  ) {
                    context.report({
                      node: stmt,
                      messageId: propertyName
                        ? "preferLodashUniqBy"
                        : "preferLodashUniq",
                    });
                    break;
                  }
                }
              }
            }
          }
        }
      },
    };
  },
});
