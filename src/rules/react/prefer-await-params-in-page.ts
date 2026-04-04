import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import { isExported } from "../utils/common";

export const RULE_NAME = "prefer-await-params-in-page";

type MessageIds = "awaitParams";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce awaiting params and searchParams in Next.js 15+ Pages",
    },
    fixable: "code",
    schema: [],
    messages: {
      awaitParams:
        "Props 'params' and 'searchParams' will be Promises in Next.js 15. Await them before accessing properties.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    // Only check page files
    if (!/page\.(tsx|jsx|js|ts)$/.test(filename)) {
      return {};
    }

    return {
      FunctionDeclaration(node): void {
        if (node.id?.name && isExported(node)) {
          checkPageProps(node, context);
        }
      },
      ExportDefaultDeclaration(node): void {
        const declaration = node.declaration;
        if (
          declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
          declaration.type === AST_NODE_TYPES.FunctionExpression ||
          declaration.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          checkPageProps(declaration, context);
        }
      },
    };
  },
});

/**
 * Checks whether every reference to a variable is used exclusively as a
 * JSX attribute value — the delegation pattern for Partial Prerendering.
 *
 * Example: `<HomeContent searchParams={searchParams} />`
 */
function isOnlyDelegatedAsJsxProp(
  paramName: string,
  body: TSESTree.Node,
  sourceCode: TSESLint.SourceCode
): boolean {
  const scope = sourceCode.getScope(body);
  const variable = scope.set.get(paramName);
  if (!variable || variable.references.length === 0) {
    return false;
  }

  return variable.references.every((ref) => {
    if (ref.isWriteOnly()) {
      return true;
    }
    const id = ref.identifier;
    return (
      id.parent?.type === AST_NODE_TYPES.JSXExpressionContainer &&
      id.parent.parent?.type === AST_NODE_TYPES.JSXAttribute
    );
  });
}

/**
 * Checks whether every usage of `props.params` or `props.searchParams` in
 * the function body is exclusively a JSX attribute value.
 */
function isMemberOnlyDelegatedAsJsxProp(
  propsName: string,
  paramNames: string[],
  body: TSESTree.Node
): boolean {
  let totalRefs = 0;
  let jsxPropRefs = 0;

  function visit(node: TSESTree.Node): void {
    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      !node.computed &&
      node.object.type === AST_NODE_TYPES.Identifier &&
      node.object.name === propsName &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      paramNames.includes(node.property.name)
    ) {
      totalRefs++;
      if (
        node.parent?.type === AST_NODE_TYPES.JSXExpressionContainer &&
        node.parent.parent?.type === AST_NODE_TYPES.JSXAttribute
      ) {
        jsxPropRefs++;
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === "parent") {
        continue;
      }
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object" && "type" in item) {
            visit(item as TSESTree.Node);
          }
        }
      } else if (
        value &&
        typeof value === "object" &&
        "type" in (value as Record<string, unknown>)
      ) {
        visit(value as TSESTree.Node);
      }
    }
  }

  visit(body);
  return totalRefs > 0 && totalRefs === jsxPropRefs;
}

function checkPageProps(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  context: TSESLint.RuleContext<MessageIds, Options>
): void {
  if (node.params.length === 0) {
    return;
  }
  const propsParam = node.params[0];

  // 1. Check if destructuring immediately: function Page({ params })
  if (propsParam && propsParam.type === AST_NODE_TYPES.ObjectPattern) {
    for (const prop of propsParam.properties) {
      if (
        prop.type === AST_NODE_TYPES.Property &&
        prop.key.type === AST_NODE_TYPES.Identifier
      ) {
        if (["params", "searchParams"].includes(prop.key.name)) {
          // Flag if the function is not async, as they CANNOT await it.
          if (!node.async) {
            // Get the local binding name (handles renaming: { params: p })
            const localName =
              prop.value.type === AST_NODE_TYPES.Identifier
                ? prop.value.name
                : prop.key.name;

            // Skip if the param is only passed as a JSX prop (delegation/PPR pattern)
            if (
              isOnlyDelegatedAsJsxProp(localName, node.body, context.sourceCode)
            ) {
              continue;
            }

            context.report({
              node: prop,
              messageId: "awaitParams",
              fix(fixer) {
                return fixer.insertTextBefore(node, "async ");
              },
            });
          }
        }
      }
    }
  }
  // 2. Check if using named props: function Page(props)
  else if (propsParam && propsParam.type === AST_NODE_TYPES.Identifier) {
    if (!node.async) {
      const propsName = propsParam.name;
      const sourceCode = context.sourceCode;
      const text: string = sourceCode.getText(node.body) as string;
      if (
        text.includes(`${propsName}.params`) ||
        text.includes(`${propsName}.searchParams`)
      ) {
        // Skip if the params are only passed as JSX props (delegation/PPR pattern)
        if (
          isMemberOnlyDelegatedAsJsxProp(
            propsName,
            ["params", "searchParams"],
            node.body
          )
        ) {
          return;
        }

        context.report({
          node: propsParam,
          messageId: "awaitParams",
          fix(fixer) {
            return fixer.insertTextBefore(node, "async ");
          },
        });
      }
    }
  }
}
