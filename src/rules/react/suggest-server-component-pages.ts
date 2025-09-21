import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "suggest-server-component-pages";

type MessageIds = "useClientInPageFile" | "considerServerComponent";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest converting 'use client' page.tsx files to Server Components with client components at deeper levels",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      useClientInPageFile:
        "App Router page uses 'use client' directive. Consider using a Server Component with client components at deeper levels for better performance and SEO.",
      considerServerComponent:
        "This page.tsx file could benefit from Server Component architecture. Move interactive elements to separate client components and keep the page as a Server Component for optimal performance.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Only check page.tsx files in App Router
    if (!isAppRouterPageFile(filename)) {
      return {};
    }

    let hasUseClientDirective = false;
    let useClientNode: TSESTree.Node | null = null;

    // Check for "use client" directive at the top of the file
    const program = sourceCode.ast;
    if (program.body.length > 0) {
      const firstStatement = program.body[0];
      if (
        firstStatement &&
        firstStatement.type === AST_NODE_TYPES.ExpressionStatement &&
        "expression" in firstStatement &&
        firstStatement.expression.type === AST_NODE_TYPES.Literal &&
        typeof firstStatement.expression.value === "string" &&
        firstStatement.expression.value === "use client"
      ) {
        hasUseClientDirective = true;
        useClientNode = firstStatement;
      }
    }

    // Also check for "use client" in comments (less common but possible)
    const firstToken = sourceCode.getFirstToken(program);
    const comments = sourceCode.getCommentsBefore(firstToken || program);

    for (const comment of comments) {
      if (
        (comment.type as string) === "Line" &&
        comment.value.trim() === "use client"
      ) {
        hasUseClientDirective = true;
        // For comments, we'll report on the program node since we can't report on comments directly
        useClientNode = program;
        break;
      }
    }

    return {
      "Program:exit"(): void {
        if (hasUseClientDirective && useClientNode) {
          context.report({
            node: useClientNode,
            messageId: "useClientInPageFile",
            suggest: [
              {
                messageId: "considerServerComponent",
                fix(fixer): ReturnType<typeof fixer.remove> | null {
                  // If it's a literal "use client", we can suggest removing it
                  if (
                    useClientNode &&
                    useClientNode.type === AST_NODE_TYPES.ExpressionStatement &&
                    "expression" in useClientNode &&
                    useClientNode.expression.type === AST_NODE_TYPES.Literal
                  ) {
                    // Simple removal of the entire statement including semicolon and line
                    const text = sourceCode.getText();
                    const start = useClientNode.range[0];

                    // Find the end of the line including the newline
                    let lineEnd = useClientNode.range[1];
                    while (lineEnd < text.length && text[lineEnd] !== "\n") {
                      lineEnd++;
                    }
                    if (lineEnd < text.length && text[lineEnd] === "\n") {
                      lineEnd++; // Include the newline
                    }

                    return fixer.removeRange([start, lineEnd]);
                  }
                  return null;
                },
              },
            ],
          });
        }
      },
    };
  },
});

function isAppRouterPageFile(filename: string): boolean {
  // Check if it's a page.tsx file in the App Router structure
  // App Router pages are typically in app/ directory and named page.tsx
  const normalizedPath = filename.replace(/\\/g, "/");

  return (
    normalizedPath.includes("/app/") && normalizedPath.endsWith("/page.tsx")
  );
}
