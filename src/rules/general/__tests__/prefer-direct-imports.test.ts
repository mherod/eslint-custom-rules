import * as path from "node:path";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-direct-imports";

// Fixture root: contains tsconfig.json so findProjectRoot() resolves here
// ts-jest runs in CommonJS so we use __dirname (import.meta.dirname is ESM-only)
const FIXTURE_ROOT = path.join(__dirname, "fixtures", "prefer-direct-imports");
// A fake source file inside the fixture root (used as `filename` in test cases)
const FIXTURE_FILE = path.join(FIXTURE_ROOT, "app", "page.tsx");

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    {
      // Already a direct file import — no barrel
      code: 'import { Button } from "@/components/ui/button";',
    },
    {
      // Non-existent component — rule can't find the file, so no error
      filename: FIXTURE_FILE,
      code: 'import { NonExistentComponent } from "@/components/ui";',
    },
    {
      // Direct file import (already pointing at the file)
      code: 'import { AdminNavigationButton } from "@/components/admin/common/buttons/admin-navigation-button";',
    },
    {
      // External package — rule only checks @/ imports
      code: 'import { something } from "external-package";',
    },
    {
      // Type-only imports should be ignored
      code: 'import type { User } from "@/types";',
    },
    {
      // Inline type import from barrel — only type specifiers, no value to move
      code: 'import { type Button } from "@/components/ui";',
    },
    {
      // All type specifiers — nothing to report
      code: 'import { type AdminNavigationButton, type AdminLink } from "@/components/admin/common/buttons";',
    },
    {
      // Hooks barrel is whitelisted
      filename: FIXTURE_FILE,
      code: 'import { useTransitionRouter } from "@/hooks";',
    },
    {
      // Server actions exemption
      code: 'import { getCreatorsByIdsAction } from "@/app/admin/creators/actions";',
    },
    {
      // Non-generic path with no matching file in fixture — should be ignored
      code: 'import { formatDate } from "@/lib/date-formatters";',
    },
  ],
  invalid: [
    {
      // Button exists in fixture as components/ui/button.tsx
      filename: FIXTURE_FILE,
      code: 'import { Button } from "@/components/ui";',
      output: 'import { Button } from "@/components/ui/button";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "Button",
            source: "@/components/ui",
            kebabName: "button",
          },
        },
      ],
    },
    {
      // Both Button and Input exist in fixture
      filename: FIXTURE_FILE,
      code: 'import { Button, Input } from "@/components/ui";',
      output:
        'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";',
      errors: [
        { messageId: "preferDirectImport" },
        { messageId: "preferDirectImport" },
      ],
    },
    {
      // AdminDataTable exists in fixture as components/admin/common/admin-data-table.tsx
      filename: FIXTURE_FILE,
      code: 'import { AdminDataTable } from "@/components/admin/common";',
      output:
        'import { AdminDataTable } from "@/components/admin/common/admin-data-table";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "AdminDataTable",
            source: "@/components/admin/common",
            kebabName: "admin-data-table",
          },
        },
      ],
    },
    {
      // Mixed value and type imports — only value import moves
      filename: FIXTURE_FILE,
      code: 'import { Button, type ButtonProps } from "@/components/ui";',
      output:
        'import { type ButtonProps } from "@/components/ui";\nimport { Button } from "@/components/ui/button";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "Button",
            source: "@/components/ui",
            kebabName: "button",
          },
        },
      ],
    },
    {
      // Partial move — nonExistent stays, Button moves
      filename: FIXTURE_FILE,
      code: 'import { Button, nonExistent } from "@/components/ui";',
      output:
        'import { nonExistent } from "@/components/ui";\nimport { Button } from "@/components/ui/button";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "Button",
            source: "@/components/ui",
            kebabName: "button",
          },
        },
      ],
    },
    {
      // Aliased named import
      filename: FIXTURE_FILE,
      code: 'import { AdminDataTable as DataTable } from "@/components/admin/common";',
      output:
        'import { AdminDataTable as DataTable } from "@/components/admin/common/admin-data-table";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "AdminDataTable",
            source: "@/components/admin/common",
            kebabName: "admin-data-table",
          },
        },
      ],
    },
  ],
});
