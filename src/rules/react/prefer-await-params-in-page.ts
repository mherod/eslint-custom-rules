import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { getFilename } from "../utils/common";

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
    schema: [],
    messages: {
      awaitParams:
        "Props 'params' and 'searchParams' will be Promises in Next.js 15. Await them before accessing properties.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = getFilename(context);

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

function isExported(node: TSESTree.FunctionDeclaration): boolean {
  return (
    node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
    node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
  );
}

// Using any for context type to avoid complex type inference issues
function checkPageProps(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            context.report({
              node: prop,
              messageId: "awaitParams",
            });
          }
        }
      }
    }
  }
  // 2. Check if using named props: function Page(props)
  else if (propsParam && propsParam.type === AST_NODE_TYPES.Identifier) {
    // If the function is not async, any usage of props.params is problematic (cannot be awaited)
    // We can flag the prop declaration itself if we detect usage, or just flag it if it's not async and likely a page.
    // For now, let's flag the function param if `!node.async` and we are fairly sure it's a page component (checked by filename).
    if (!node.async) {
      // We can't be 100% sure they use params, but if they define `props` in a Page,
      // and don't make it async, they are blocking the ability to await params.
      // Next.js 15 basically forces async pages if you use params.
      // Only if they DON'T use params is it safe.
      // But we shouldn't report unless we see usage.
      // Scanning body for `props.params` or `props.searchParams`.
      const propsName = propsParam.name;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const sourceCode = context.getSourceCode();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const text: string = sourceCode.getText(node.body) as string;
      if (
        text.includes(`${propsName}.params`) ||
        text.includes(`${propsName}.searchParams`)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        context.report({
          node: propsParam,
          messageId: "awaitParams",
        });
      }
    }
  }
}
