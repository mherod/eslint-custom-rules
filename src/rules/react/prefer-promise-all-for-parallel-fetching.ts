import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import {
  hasUseClientDirective,
  normalizePath,
} from "../utils/component-type-utils";

export const RULE_NAME = "prefer-promise-all-for-parallel-fetching";

type MessageIds = "preferPromiseAll";

type Options = [];

/**
 * Collects all Identifier names referenced inside an expression node.
 * Uses an explicit switch over the node types that can appear as await
 * arguments, avoiding untyped Object.keys() traversal.
 */
function collectReferencedNames(
  node: TSESTree.Expression | TSESTree.SpreadElement
): Set<string> {
  const names = new Set<string>();
  visitExpr(node, names);
  return names;
}

function visitExpr(
  node: TSESTree.Expression | TSESTree.SpreadElement,
  out: Set<string>
): void {
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
      out.add(node.name);
      break;
    case AST_NODE_TYPES.CallExpression:
      visitExpr(node.callee, out);
      for (const arg of node.arguments) {
        visitExpr(arg, out);
      }
      break;
    case AST_NODE_TYPES.MemberExpression:
      visitExpr(node.object, out);
      // When computed (e.g. obj[key]), the property is always an Expression.
      // PrivateIdentifier only appears in non-computed positions (#field access),
      // so the cast is safe here.
      if (node.computed) {
        visitExpr(node.property as unknown as TSESTree.Expression, out);
      }
      break;
    case AST_NODE_TYPES.AwaitExpression:
      visitExpr(node.argument, out);
      break;
    case AST_NODE_TYPES.BinaryExpression:
      // BinaryExpression is PrivateInExpression | SymmetricBinaryExpression.
      // PrivateInExpression has left: PrivateIdentifier (`#x in obj`) — skip it.
      if (node.left.type !== AST_NODE_TYPES.PrivateIdentifier) {
        visitExpr(node.left, out);
      }
      visitExpr(node.right, out);
      break;
    case AST_NODE_TYPES.LogicalExpression:
      visitExpr(node.left, out);
      visitExpr(node.right, out);
      break;
    case AST_NODE_TYPES.ConditionalExpression:
      visitExpr(node.test, out);
      visitExpr(node.consequent, out);
      visitExpr(node.alternate, out);
      break;
    case AST_NODE_TYPES.TemplateLiteral:
      for (const expr of node.expressions) {
        visitExpr(expr, out);
      }
      break;
    case AST_NODE_TYPES.SpreadElement:
      visitExpr(node.argument, out);
      break;
    case AST_NODE_TYPES.ArrayExpression:
      for (const el of node.elements) {
        if (el !== null) {
          visitExpr(el, out);
        }
      }
      break;
    case AST_NODE_TYPES.ObjectExpression:
      for (const prop of node.properties) {
        if (prop.type === AST_NODE_TYPES.SpreadElement) {
          visitExpr(prop.argument, out);
        } else {
          visitExpr(prop.value as TSESTree.Expression, out);
        }
      }
      break;
    default:
      // Literals and other leaf nodes have no identifier references
      break;
  }
}

/**
 * Collects all names bound by a destructuring/identifier pattern.
 */
function collectBoundNames(
  pattern: TSESTree.BindingName,
  out: Set<string>
): void {
  if (pattern.type === AST_NODE_TYPES.Identifier) {
    out.add(pattern.name);
  } else if (pattern.type === AST_NODE_TYPES.ObjectPattern) {
    for (const prop of pattern.properties) {
      if (prop.type === AST_NODE_TYPES.RestElement) {
        collectBoundNames(prop.argument as TSESTree.BindingName, out);
      } else {
        collectBoundNames(prop.value as TSESTree.BindingName, out);
      }
    }
  } else if (pattern.type === AST_NODE_TYPES.ArrayPattern) {
    for (const el of pattern.elements) {
      if (el !== null) {
        collectBoundNames(el as TSESTree.BindingName, out);
      }
    }
  }
}

/**
 * Returns names bound by a VariableDeclaration statement.
 */
function boundNamesOf(stmt: TSESTree.VariableDeclaration): Set<string> {
  const names = new Set<string>();
  for (const decl of stmt.declarations) {
    collectBoundNames(decl.id, names);
  }
  return names;
}

interface AwaitedStatement {
  awaitExpr: TSESTree.AwaitExpression;
  bound: Set<string>;
  stmt: TSESTree.VariableDeclaration | TSESTree.ExpressionStatement;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer Promise.all() over sequential awaits for independent data fetches in server components and pages",
    },
    schema: [],
    messages: {
      preferPromiseAll:
        "Sequential awaits detected for independent data fetches. " +
        "Each await blocks the next, creating a performance waterfall where fetch times add up instead of running in parallel. " +
        "Fix: Wrap independent fetches in Promise.all(): " +
        "`const [a, b] = await Promise.all([fetchA(), fetchB()]);` " +
        "If one result feeds into the next fetch as an argument, the sequential order is intentional — this warning does not apply. " +
        "Use Promise.allSettled() when some fetches may fail independently and you want to handle each result separately.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = normalizePath(context.filename);

    // Skip client components — data fetching patterns apply to server-side code
    if (hasUseClientDirective(context.sourceCode)) {
      return {};
    }

    // Target page files, app-directory server components, and server actions
    const isPageFile = /page\.(tsx|jsx|js|ts)$/.test(filename);
    const isInAppDir = filename.includes("/app/");
    const isServerAction =
      filename.includes("/actions/") || filename.includes(".action.");

    if (!(isPageFile || isInAppDir || isServerAction)) {
      return {};
    }

    const functionStack: (
      | TSESTree.FunctionDeclaration
      | TSESTree.ArrowFunctionExpression
      | TSESTree.FunctionExpression
    )[] = [];

    function checkBodyForSequentialAwaits(body: TSESTree.Statement[]): void {
      const awaitedStmts: AwaitedStatement[] = [];

      for (const stmt of body) {
        if (stmt.type === AST_NODE_TYPES.VariableDeclaration) {
          // Only consider the first declarator per statement
          const decl = stmt.declarations[0];
          if (decl?.init?.type === AST_NODE_TYPES.AwaitExpression) {
            awaitedStmts.push({
              stmt,
              awaitExpr: decl.init,
              bound: boundNamesOf(stmt),
            });
          }
        } else if (
          stmt.type === AST_NODE_TYPES.ExpressionStatement &&
          stmt.expression.type === AST_NODE_TYPES.AwaitExpression
        ) {
          awaitedStmts.push({
            stmt,
            awaitExpr: stmt.expression,
            bound: new Set(),
          });
        }
      }

      if (awaitedStmts.length < 2) {
        return;
      }

      // Walk through statements tracking cumulative bound names.
      // When a statement's awaited expression does NOT reference any previously
      // bound name, it is independent and can run in parallel with its predecessor.
      const cumulativeBound = new Set<string>();
      let runStart = 0;
      let runLength = 0;

      for (let i = 0; i < awaitedStmts.length; i++) {
        const current = awaitedStmts[i];
        if (current === undefined) {
          continue;
        }

        if (i === 0) {
          runStart = 0;
          runLength = 1;
          for (const name of current.bound) {
            cumulativeBound.add(name);
          }
          continue;
        }

        const refs = collectReferencedNames(current.awaitExpr);
        const dependsOnPrevious = [...refs].some((name) =>
          cumulativeBound.has(name)
        );

        if (dependsOnPrevious) {
          // Dependency breaks the run — flush
          if (runLength >= 2) {
            const secondInRun = awaitedStmts[runStart + 1];
            if (secondInRun !== undefined) {
              context.report({
                node: secondInRun.stmt,
                messageId: "preferPromiseAll",
              });
            }
          }
          // Reset run to start at this dependent statement
          runStart = i;
          runLength = 1;
          cumulativeBound.clear();
        } else {
          // Continues the independent run
          runLength++;
        }

        for (const name of current.bound) {
          cumulativeBound.add(name);
        }
      }

      // Flush final run
      if (runLength >= 2) {
        const secondInRun = awaitedStmts[runStart + 1];
        if (secondInRun !== undefined) {
          context.report({
            node: secondInRun.stmt,
            messageId: "preferPromiseAll",
          });
        }
      }
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.async) {
          functionStack.push(node);
        }
      },

      "FunctionDeclaration:exit"(node: TSESTree.FunctionDeclaration): void {
        if (
          node.async &&
          functionStack.at(-1) === node &&
          node.body.type === AST_NODE_TYPES.BlockStatement
        ) {
          functionStack.pop();
          // Only check top-level functions (not nested callbacks)
          if (functionStack.length === 0) {
            checkBodyForSequentialAwaits(node.body.body);
          }
        }
      },

      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
        }
      },

      "ArrowFunctionExpression:exit"(
        node: TSESTree.ArrowFunctionExpression
      ): void {
        if (
          node.async &&
          functionStack.at(-1) === node &&
          node.body.type === AST_NODE_TYPES.BlockStatement
        ) {
          functionStack.pop();
          if (functionStack.length === 0) {
            checkBodyForSequentialAwaits(node.body.body);
          }
        }
      },

      FunctionExpression(node: TSESTree.FunctionExpression): void {
        if (node.async) {
          functionStack.push(node);
        }
      },

      "FunctionExpression:exit"(node: TSESTree.FunctionExpression): void {
        if (
          node.async &&
          functionStack.at(-1) === node &&
          node.body.type === AST_NODE_TYPES.BlockStatement
        ) {
          functionStack.pop();
          if (functionStack.length === 0) {
            checkBodyForSequentialAwaits(node.body.body);
          }
        }
      },
    };
  },
});
