import { ESLintUtils } from "@typescript-eslint/utils";

export const RULE_NAME = "no-debug-comments";

type MessageIds = "debugComment" | "incompleteMarker" | "thinkingComment";

type Options = [];

/**
 * Patterns that indicate "thinking out loud" developer notes
 * These should never be committed to production code
 */
const THINKING_PATTERNS = [
  /\/\/\s*But wait/i,
  /\/\/\s*Should I/i,
  /\/\/\s*Maybe I/i,
  /\/\/\s*I think/i,
  /\/\/\s*I'm not sure/i,
  /\/\/\s*I should probably/i,
  /\/\/\s*I will just/i,
  /\/\/\s*Is .* static or dynamic\?/i,
  /\/\/\s*That contradicts/i,
  /\/\/\s*Removed\?/i,
  /\/\/.*!!+\?+/, // Multiple exclamation/question marks like !!?? anywhere in comment
  /\/\/(?:.*[^?])?\?\?\?/, // Three or more consecutive question marks (avoid matching ternary ??)
];

/**
 * Patterns that indicate incomplete cleanup from refactoring
 */
const INCOMPLETE_MARKER_PATTERNS = [
  /\/\/\s*\.\.\.\s*\w+/, // "// ... something" - ellipsis followed by text (e.g., "// ... rest of code")
  /\/\/\s*Unused but/i,
  /\/\/\s*Renamed to avoid/i,
  /\/\/\s*Fallback to .* if undefined/i, // "// Fallback to default if undefined (shouldn't happen in [lang])"
  /\/\/\s*TODO:\s*remove/i,
  /\/\/\s*FIXME:\s*cleanup/i,
  /\/\/\s*HACK:/i,
  /\/\/\s*XXX:/i,
];

/**
 * Patterns that indicate debug code left behind
 */
const DEBUG_PATTERNS = [
  /\/\/\s*DEBUG:/i,
  /\/\/\s*TEMP:/i,
  /\/\/\s*TEMPORARY:/i,
  /\/\/\s*DELETE ME\b/i, // Word boundary to avoid matching "Delete metadata"
  /\/\/\s*REMOVE ME\b/i, // Word boundary to avoid matching "Remove method"
  /\/\/\s*console\.log/i, // Commented-out console.log
];

function getPatternCategory(
  text: string
): { category: MessageIds; pattern: string } | null {
  for (const pattern of THINKING_PATTERNS) {
    if (pattern.test(text)) {
      return { category: "thinkingComment", pattern: pattern.source };
    }
  }
  for (const pattern of INCOMPLETE_MARKER_PATTERNS) {
    if (pattern.test(text)) {
      return { category: "incompleteMarker", pattern: pattern.source };
    }
  }
  for (const pattern of DEBUG_PATTERNS) {
    if (pattern.test(text)) {
      return { category: "debugComment", pattern: pattern.source };
    }
  }
  return null;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow debug comments, thinking notes, and incomplete markers in production code",
    },
    schema: [],
    messages: {
      debugComment:
        "Debug comment detected. Remove before committing: {{ text }}",
      incompleteMarker:
        "Incomplete cleanup marker detected. This indicates unfinished refactoring: {{ text }}",
      thinkingComment:
        'Developer "thinking out loud" comment detected. Remove before committing: {{ text }}',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(): void {
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          // Only check line comments (not block comments in JSDoc)
          if ((comment.type as string) !== "Line") {
            continue;
          }

          const commentText = `//${comment.value}`;
          const match = getPatternCategory(commentText);

          if (match) {
            context.report({
              loc: comment.loc,
              messageId: match.category,
              data: {
                text:
                  comment.value.trim().slice(0, 50) +
                  (comment.value.length > 50 ? "..." : ""),
              },
            });
          }
        }
      },
    };
  },
});
