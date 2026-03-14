import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../enforce-admin-separation";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("enforce-admin-separation", rule, {
  valid: [
    // Admin file importing shared UI components via alias
    {
      code: `
        import { Button } from "@/components/ui/button";
        import { Dialog } from "@/components/ui/dialog";
      `,
      filename: "/src/app/admin/brands/brand-form-dialog.tsx",
    },
    // Admin file importing shared lib via alias
    {
      code: `
        import { sbaApi } from "@/lib/api";
        import { useBrand } from "@/lib/brand-context";
      `,
      filename: "/src/app/admin/brands/page.tsx",
    },
    // Admin file importing shared hooks
    {
      code: `
        import { useAuth } from "@/hooks/use-auth";
      `,
      filename: "/src/app/admin/settings/page.tsx",
    },
    // Admin file importing shared utils
    {
      code: `
        import { formatDate } from "@/utils/date";
      `,
      filename: "/src/app/admin/reports/page.tsx",
    },
    // Config file — not admin or public
    {
      code: `
        import { defineConfig } from "vitest/config";
      `,
      filename: "/vitest.config.ts",
    },
    // Shared file — rule skips entirely
    {
      code: `
        import { something } from "@/components/admin/special";
      `,
      filename: "/src/lib/utils.ts",
    },
    // Public file calling non-admin functions
    {
      code: `
        deleteItem();
        restoreSession();
        configureApp();
      `,
      filename: "/src/app/page.tsx",
    },
    // Admin file importing from another admin file
    {
      code: `
        import { AdminTable } from "./admin-table";
      `,
      filename: "/src/app/admin/users/page.tsx",
    },
  ],
  invalid: [
    // Public file importing admin component via alias
    {
      code: `
        import { AdminPanel } from "@/components/admin/panel";
      `,
      filename: "/src/app/page.tsx",
      errors: [{ messageId: "publicImportingAdmin" }],
    },
    // Public file calling admin utility function
    {
      code: `
        adminDeleteUser("123");
      `,
      filename: "/src/app/page.tsx",
      errors: [{ messageId: "adminUtilInPublic" }],
    },
  ],
});
