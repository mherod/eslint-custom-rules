import { basename, normalize, parse } from "node:path";
import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "enforce-file-naming";

// Constants for regex patterns
const PASCAL_CASE_REGEX = /^[A-Z][a-zA-Z0-9]*$/;
const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const HOOK_NAMING_REGEX = /^use[A-Z][a-zA-Z0-9]*$/;

type MessageIds =
  | "componentShouldBePascalCase"
  | "utilsShouldBeKebabCase"
  | "apiShouldBeKebabCase"
  | "hooksShouldBeCamelCase"
  | "pagesShouldBeKebabCase"
  | "libShouldBeKebabCase"
  | "actionsShouldBeKebabCase"
  | "typesShouldBeKebabCase";

type Options = [];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "problem",
    docs: {
      description: "Enforce consistent file and directory naming conventions",
    },
    schema: [],
    messages: {
      componentShouldBePascalCase:
        "Component files should use PascalCase naming (e.g., 'UserProfile.tsx')",
      utilsShouldBeKebabCase:
        "Utility files should use kebab-case naming (e.g., 'string-utils.ts')",
      apiShouldBeKebabCase:
        "API route files should use kebab-case naming (e.g., 'user-profile.ts')",
      hooksShouldBeCamelCase:
        "Hook files should use camelCase naming starting with 'use' (e.g., 'useUserProfile.ts')",
      pagesShouldBeKebabCase:
        "Page files should use kebab-case naming (e.g., 'user-profile.tsx')",
      libShouldBeKebabCase:
        "Library files should use kebab-case naming (e.g., 'auth-utils.ts')",
      actionsShouldBeKebabCase:
        "Action files should use kebab-case naming (e.g., 'user-actions.ts')",
      typesShouldBeKebabCase:
        "Type definition files should use kebab-case naming (e.g., 'user-types.ts')",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(_node: TSESTree.Program): void {
        const filename = context.getFilename();
        validateFilename(context, filename);
      },
    };
  },
});

function validateFilename(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  filename: string
): void {
  const normalizedPath = normalize(filename);
  const baseName = basename(filename);
  const nameWithoutExt = parse(baseName).name;

  // Skip if it's a special Next.js file
  if (isSpecialNextJsFile(baseName)) {
    return;
  }

  // Skip if it's a config file
  if (isConfigFile(baseName)) {
    return;
  }

  // Components directory
  if (normalizedPath.includes("/components/")) {
    if (!isPascalCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "componentShouldBePascalCase",
      });
    }
    return;
  }

  // Utils directory
  if (normalizedPath.includes("/utils/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "utilsShouldBeKebabCase",
      });
    }
    return;
  }

  // API routes
  if (normalizedPath.includes("/api/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "apiShouldBeKebabCase",
      });
    }
    return;
  }

  // Hooks directory
  if (normalizedPath.includes("/hooks/")) {
    if (!isHookNaming(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "hooksShouldBeCamelCase",
      });
    }
    return;
  }

  // Pages directory (not Next.js app router)
  if (normalizedPath.includes("/pages/") && !normalizedPath.includes("/app/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "pagesShouldBeKebabCase",
      });
    }
    return;
  }

  // Lib directory
  if (normalizedPath.includes("/lib/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "libShouldBeKebabCase",
      });
    }
    return;
  }

  // Actions directory
  if (normalizedPath.includes("/actions/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "actionsShouldBeKebabCase",
      });
    }
    return;
  }

  // Types directory
  if (normalizedPath.includes("/types/")) {
    if (!isKebabCase(nameWithoutExt)) {
      context.report({
        node: context.getSourceCode().ast,
        messageId: "typesShouldBeKebabCase",
      });
    }
    return;
  }
}

function isPascalCase(name: string): boolean {
  // PascalCase: starts with uppercase, can contain numbers
  return PASCAL_CASE_REGEX.test(name);
}

function isKebabCase(name: string): boolean {
  // kebab-case: lowercase with hyphens, can contain numbers
  return KEBAB_CASE_REGEX.test(name);
}

function isHookNaming(name: string): boolean {
  // Hook naming: starts with "use" followed by PascalCase
  return HOOK_NAMING_REGEX.test(name);
}

function isSpecialNextJsFile(filename: string): boolean {
  const specialFiles = [
    "page.tsx",
    "page.ts",
    "layout.tsx",
    "layout.ts",
    "loading.tsx",
    "loading.ts",
    "error.tsx",
    "error.ts",
    "not-found.tsx",
    "not-found.ts",
    "route.ts",
    "middleware.ts",
    "instrumentation.ts",
    "global-error.tsx",
    "global-error.ts",
    "template.tsx",
    "template.ts",
    "head.tsx",
    "head.ts",
    "opengraph-image.tsx",
    "opengraph-image.ts",
    "twitter-image.tsx",
    "twitter-image.ts",
    "icon.tsx",
    "icon.ts",
    "apple-icon.tsx",
    "apple-icon.ts",
    "favicon.ico",
    "sitemap.xml",
    "robots.txt",
    "manifest.json",
    "default.tsx",
    "default.ts",
  ];

  return specialFiles.includes(filename);
}

function isConfigFile(filename: string): boolean {
  const configFiles = [
    "next.config.js",
    "next.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.ts",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.js",
    "vitest.config.ts",
    "tsconfig.json",
    "package.json",
    "eslint.config.js",
    "eslint.config.ts",
    "prettier.config.js",
    "prettier.config.ts",
    "biome.json",
    "turbo.json",
    "tsup.config.ts",
    "vite.config.ts",
    "rollup.config.js",
    "webpack.config.js",
    "babel.config.js",
    "commitlint.config.js",
    "lint-staged.config.js",
    "husky.config.js",
    "renovate.json",
    "dependabot.yml",
    "docker-compose.yml",
    "dockerfile",
    "Dockerfile",
    "Caddyfile",
    "README.md",
    "CHANGELOG.md",
    "LICENSE",
    "CONTRIBUTING.md",
    ".gitignore",
    ".eslintrc.js",
    ".eslintrc.json",
    ".prettierrc",
    ".prettierrc.json",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "globals.css",
    "app.css",
    "styles.css",
    "index.css",
  ];

  return configFiles.includes(filename) || filename.startsWith(".");
}
