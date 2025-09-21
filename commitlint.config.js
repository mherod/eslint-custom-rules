/** @type {import('@commitlint/types').UserConfig} */

// Configuration constants
const SUBJECT_MAX_LENGTH = 72;
const BODY_MAX_LINE_LENGTH = 100;
const FOOTER_MAX_LINE_LENGTH = 100;

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New features
        "fix", // Bug fixes
        "docs", // Documentation changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactoring
        "test", // Test changes
        "chore", // Maintenance tasks
        "ci", // CI/CD changes
        "perf", // Performance improvements
        "build", // Build system changes
        "revert", // Revert commits
      ],
    ],
    "subject-case": [2, "always", "sentence-case"],
    "subject-max-length": [2, "always", SUBJECT_MAX_LENGTH],
    "body-max-line-length": [2, "always", BODY_MAX_LINE_LENGTH],
    "footer-max-line-length": [2, "always", FOOTER_MAX_LINE_LENGTH],
  },
};
