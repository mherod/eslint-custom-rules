import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-cache-api";

type MessageIds = "routeSegmentConfig";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce using Cache API over route segment configs for Next.js 16 compatibility",
    },
    fixable: "code",
    schema: [],
    messages: {
      routeSegmentConfig:
        "Route segment config '{{name}}' is incompatible with Next.js 16 Cache Components. Use the Cache API instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ExportNamedDeclaration(node): void {
        if (
          !node.declaration ||
          node.declaration.type !== AST_NODE_TYPES.VariableDeclaration
        ) {
          return;
        }

        for (const declaration of node.declaration.declarations) {
          if (
            declaration.id.type === AST_NODE_TYPES.Identifier &&
            ["revalidate", "dynamic", "dynamicParams"].includes(
              declaration.id.name
            )
          ) {
            context.report({
              node: declaration,
              messageId: "routeSegmentConfig",
              data: { name: declaration.id.name },
              fix(fixer) {
                const src = context.sourceCode.getText();
                const end = node.range[1];
                const removeEnd =
                  end < src.length && src[end] === "\n" ? end + 1 : end;
                return fixer.removeRange([node.range[0], removeEnd]);
              },
            });
          }
        }
      },
    };
  },
});
