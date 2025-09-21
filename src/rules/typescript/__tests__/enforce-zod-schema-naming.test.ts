import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-zod-schema-naming";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
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
    // Valid Zod schema naming
    "const FormSchema = z.object({});",
    "const UserFormSchema = z.object({});",
    "const FeaturedDealSchema = z.object({});",
    "const CreateUserFormSchema = z.object({});",

    // Valid with chained methods
    "const FormSchema = z.object({}).required();",
    "const UserSchema = z.string().min(1);",
    "const NumberSchema = z.number().positive();",

    // Valid with imported Zod methods
    "const FormSchema = object({});",
    "const StringSchema = string();",

    // Valid with complex schemas
    "const ComplexSchema = z.union([z.string(), z.number()]);",
    "const ArraySchema = z.array(z.string());",

    // Non-Zod variables should be ignored
    "const someVariable = 'not a schema';",
    "const userForm = createForm();",
    "const data = fetchData();",
  ],
  invalid: [
    // Invalid: not PascalCase
    {
      code: "const formSchema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "formSchema" },
        },
      ],
    },
    {
      code: "const user_form_schema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "user_form_schema" },
        },
      ],
    },

    // Invalid: missing Schema suffix
    {
      code: "const Form = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "Form" },
        },
      ],
    },
    {
      code: "const UserForm = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "UserForm" },
        },
      ],
    },

    // Invalid: just 'Schema'
    {
      code: "const Schema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "Schema" },
        },
      ],
    },

    // Invalid: starts with lowercase
    {
      code: "const formDataSchema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "formDataSchema" },
        },
      ],
    },

    // Invalid: with chained methods
    {
      code: "const userForm = z.object({}).required();",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "userForm" },
        },
      ],
    },

    // Invalid: with imported Zod methods
    {
      code: "const userForm = object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "userForm" },
        },
      ],
    },

    // Invalid: complex schemas
    {
      code: "const complexType = z.union([z.string(), z.number()]);",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "complexType" },
        },
      ],
    },

    // Invalid: array schemas
    {
      code: "const stringArray = z.array(z.string());",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "stringArray" },
        },
      ],
    },
  ],
});
