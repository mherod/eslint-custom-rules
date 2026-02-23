import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-direct-imports";

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
      // Using a real file that exists in apps/main-web
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { Button } from "@/components/ui/button";',
    },
    {
      // Using a real path but non-existent component - should be ignored
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { NonExistentComponent } from "@/components/ui";',
    },
    {
      code: 'import { AdminNavigationButton } from "@/components/admin/common/buttons/admin-navigation-button";',
    },
    {
      code: 'import { Button } from "@/components/ui/button";',
    },
    {
      code: 'import { cn } from "@/lib/utils/cn";',
    },
    {
      // Multiple imports from matching file
      code: 'import { Card, CardHeader } from "@/components/ui/card";',
    },
    {
      // Using a real path but component is NOT exported by the suggested file
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { buttonVariants } from "@/components/ui/card";',
    },
    {
      // Non-component import from non-generic path
      code: 'import { formatDate } from "@/lib/date-formatters";',
    },
    {
      code: 'import { something } from "external-package";',
    },
    {
      // Lenient match for acronyms (TikTok -> tik-tok vs tiktok)
      code: 'import { TikTokIcon } from "@/components/icons/tiktok-icon";',
    },
    {
      // Lenient match for acronyms (YouTube -> you-tube vs youtube)
      code: 'import { YouTubeIcon } from "@/components/icons/youtube-icon";',
    },
    {
      // Server actions exemption
      code: 'import { getCreatorsByIdsAction } from "@/app/admin/creators/actions";',
    },
    {
      // Type-only imports should be ignored
      code: 'import type { User } from "@/types";',
    },
    {
      code: 'import { type Button } from "@/components/ui";',
    },
    {
      code: 'import { type AdminNavigationButton, type AdminLink } from "@/components/admin/common/buttons";',
    },
    {
      // Hooks are whitelisted as barrels because they are client-safe
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { useTransitionRouter } from "@/hooks";',
    },
    {
      // Multiple hooks from barrel should be valid
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { useTransitionRouter, useSWRAdminCreators } from "@/hooks";',
    },
    {
      // The specific case reported by the user
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/components/geo/geo-display.tsx",
      code: 'import {\n  useGeoFlag,\n  useHasGeoData,\n  useVercelGeoStore,\n} from "@/hooks";',
    },
  ],
  invalid: [
    {
      // Component from generic barrel - should fix because button.tsx exists in apps/main-web
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
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
      // Multiple components - should fix if both exist
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { Button, Input } from "@/components/ui";',
      output:
        'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";',
      errors: [
        {
          messageId: "preferDirectImport",
        },
        {
          messageId: "preferDirectImport",
        },
      ],
    },
    {
      // Component from generic barrel
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { AdminNavigationButton } from "@/components/admin/common/buttons";',
      output:
        'import { AdminNavigationButton } from "@/components/admin/common/buttons/AdminNavigationButton";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "AdminNavigationButton",
            source: "@/components/admin/common/buttons",
            kebabName: "AdminNavigationButton",
          },
        },
      ],
    },
    {
      // Component from non-generic barrel (Strict Component Check)
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { AddCreatorDialog } from "@/components/admin/creators";',
      output:
        'import { AddCreatorDialog } from "@/components/admin/creators/AddCreatorDialog";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "AddCreatorDialog",
            source: "@/components/admin/creators",
            kebabName: "AddCreatorDialog",
          },
        },
      ],
    },
    {
      // Mixed value and type imports - should only fix value import
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
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
      // Partial move - one stays, one moves
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
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
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
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
    {
      // Multiple specifiers - split into different files
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { AdminDataTable, AdminEmptyState } from "@/components/admin/common";',
      output:
        'import { AdminDataTable } from "@/components/admin/common/admin-data-table";\nimport { AdminEmptyState } from "@/components/admin/common/admin-empty-state";',
      errors: [
        { messageId: "preferDirectImport" },
        { messageId: "preferDirectImport" },
      ],
    },
    {
      // Acronym match from barrel
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { TikTokIcon } from "@/components/icons";',
      output: 'import { TikTokIcon } from "@/components/icons/tiktok-icon";',
      errors: [
        {
          messageId: "preferDirectImport",
          data: {
            name: "TikTokIcon",
            source: "@/components/icons",
            kebabName: "tiktok-icon",
          },
        },
      ],
    },
    {
      // Aliased import in a partial move
      filename:
        "/Users/matthewherod/Development/plugg-platform/apps/main-web/app/admin/page.tsx",
      code: 'import { AdminDataTable as DataTable, nonExistent } from "@/components/admin/common";',
      output:
        'import { nonExistent } from "@/components/admin/common";\nimport { AdminDataTable as DataTable } from "@/components/admin/common/admin-data-table";',
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
