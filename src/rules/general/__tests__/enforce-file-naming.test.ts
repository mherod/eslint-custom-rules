import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-file-naming";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Components - PascalCase (traditional convention)
    {
      code: "export const Component = () => null;",
      filename: "/src/components/UserProfile.tsx",
    },
    {
      code: "export const Component = () => null;",
      filename: "/src/components/UserCard.tsx",
    },
    {
      code: "export const Component = () => null;",
      filename: "components/Button.tsx",
    },
    // Components - kebab-case (Next.js / community convention)
    {
      code: "export const Component = () => null;",
      filename: "/src/components/user-profile.tsx",
    },
    {
      code: "export const Component = () => null;",
      filename: "/components/admin/admin-sidebar.tsx",
    },
    {
      code: "export const Component = () => null;",
      filename: "/components/ui/brand-selector.tsx",
    },
    // Utils - kebab-case
    {
      code: "export const util = () => null;",
      filename: "/src/utils/string-utils.ts",
    },
    {
      code: "export const util = () => null;",
      filename: "/src/utils/date-helpers.ts",
    },
    // API routes - kebab-case
    {
      code: "export default function handler() {}",
      filename: "/src/app/api/user-profile/route.ts",
    },
    {
      code: "export default function handler() {}",
      filename: "/pages/api/get-users.ts",
    },
    // Hooks - camelCase with use prefix
    {
      code: "export const useUserProfile = () => null;",
      filename: "/src/hooks/useUserProfile.ts",
    },
    {
      code: "export const useFetchData = () => null;",
      filename: "/src/hooks/useFetchData.ts",
    },
    // Pages - kebab-case (legacy pages directory)
    {
      code: "export default function Page() {}",
      filename: "/src/pages/user-profile.tsx",
    },
    // Lib - kebab-case
    {
      code: "export const lib = () => null;",
      filename: "/src/lib/auth-utils.ts",
    },
    // Actions - kebab-case
    {
      code: "export const action = () => null;",
      filename: "/src/actions/user-actions.ts",
    },
    // Types - kebab-case
    {
      code: "export type User = {};",
      filename: "/src/types/user-types.ts",
    },
    // Special Next.js files - should be skipped
    {
      code: "export default function Page() {}",
      filename: "/src/app/page.tsx",
    },
    {
      code: "export default function Layout() {}",
      filename: "/src/app/layout.tsx",
    },
    {
      code: "export default function Loading() {}",
      filename: "/src/app/loading.tsx",
    },
    {
      code: "export default function Error() {}",
      filename: "/src/app/error.tsx",
    },
    // Config files - should be skipped
    {
      code: "const config = {}; export default config;",
      filename: "/next.config.ts",
    },
  ],
  invalid: [
    // Components - invalid naming (camelCase is neither PascalCase nor kebab-case)
    {
      code: "export const Component = () => null;",
      filename: "/src/components/userProfile.tsx",
      errors: [
        {
          messageId: "componentShouldBePascalCaseOrKebabCase",
        },
      ],
    },
    // Utils - invalid naming
    {
      code: "export const util = () => null;",
      filename: "/src/utils/stringUtils.ts",
      errors: [
        {
          messageId: "utilsShouldBeKebabCase",
        },
      ],
    },
    {
      code: "export const util = () => null;",
      filename: "/src/utils/StringUtils.ts",
      errors: [
        {
          messageId: "utilsShouldBeKebabCase",
        },
      ],
    },
    // API routes - invalid naming (must not be route.ts as that's a special file)
    {
      code: "export default function handler() {}",
      filename: "/pages/api/userProfile.ts",
      errors: [
        {
          messageId: "apiShouldBeKebabCase",
        },
      ],
    },
    // Hooks - invalid naming
    {
      code: "export const hook = () => null;",
      filename: "/src/hooks/use-user-profile.ts",
      errors: [
        {
          messageId: "hooksShouldBeCamelCase",
        },
      ],
    },
    {
      code: "export const hook = () => null;",
      filename: "/src/hooks/UseUserProfile.ts",
      errors: [
        {
          messageId: "hooksShouldBeCamelCase",
        },
      ],
    },
    {
      code: "export const hook = () => null;",
      filename: "/src/hooks/user-profile.ts",
      errors: [
        {
          messageId: "hooksShouldBeCamelCase",
        },
      ],
    },
    // Pages - invalid naming (legacy)
    {
      code: "export default function Page() {}",
      filename: "/src/pages/UserProfile.tsx",
      errors: [
        {
          messageId: "pagesShouldBeKebabCase",
        },
      ],
    },
    // Lib - invalid naming
    {
      code: "export const lib = () => null;",
      filename: "/src/lib/authUtils.ts",
      errors: [
        {
          messageId: "libShouldBeKebabCase",
        },
      ],
    },
    // Actions - invalid naming
    {
      code: "export const action = () => null;",
      filename: "/src/actions/userActions.ts",
      errors: [
        {
          messageId: "actionsShouldBeKebabCase",
        },
      ],
    },
    // Types - invalid naming
    {
      code: "export type User = {};",
      filename: "/src/types/userTypes.ts",
      errors: [
        {
          messageId: "typesShouldBeKebabCase",
        },
      ],
    },
  ],
});
