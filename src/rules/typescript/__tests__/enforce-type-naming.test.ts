import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-type-naming";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // PascalCase type alias with an allowed role suffix (two members stays
    // below the prefer-interface threshold)
    "type UserProfileProps = { name: string; age: number; };",

    // PascalCase interface large enough to stay an interface
    "interface UserAccountInterface { id: string; name: string; email: string; createdAt: string; }",

    // PascalCase enum with the Enum suffix
    "enum StatusEnum { Active = 'active', Inactive = 'inactive' }",
  ],
  invalid: [
    // camelCase type alias
    {
      code: "type userProfile = string;",
      errors: [{ messageId: "typeAliasMustBePascalCase" }],
    },
    // Complex type alias without an allowed suffix that should also be an
    // interface (>2 property members)
    {
      code: "type UserProfile = { name: string; age: number; email: string; phone: string; };",
      errors: [
        { messageId: "typeAliasShouldEndWithType" },
        { messageId: "preferInterfaceOverType" },
      ],
    },
    // camelCase interface
    {
      code: "interface userAccountInterface { id: string; name: string; email: string; createdAt: string; }",
      errors: [{ messageId: "interfaceMustBePascalCase" }],
    },
    // Enum missing the Enum suffix
    {
      code: "enum Status { Active = 'active' }",
      errors: [{ messageId: "enumShouldEndWithEnum" }],
    },
  ],
});
