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

    // Parse results are runtime values, not schemas — not flagged
    "const trimmedQuery = z.string().trim().parse(query);",
    "const user = UserSchema.parse(input);",
    "const userResult = UserSchema.safeParse(input);",
    "const parsed = z.string().parseAsync(input);",
    "const safeParsed = z.object({}).safeParseAsync(input);",
  ],
  invalid: [
    // Invalid: not PascalCase — suggestion only, autofix disabled
    {
      code: "const formSchema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "formSchema" },
          suggestions: [
            {
              messageId: "renameToPascalCaseWithSchemaSuffix",
              output: "const FormSchema = z.object({});",
            },
          ],
        },
      ],
    },
    {
      code: "const user_form_schema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "user_form_schema" },
          suggestions: [
            {
              messageId: "renameToPascalCaseWithSchemaSuffix",
              output: "const UserFormSchema = z.object({});",
            },
          ],
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
          suggestions: [
            {
              messageId: "renameToPascalCaseWithSchemaSuffix",
              output: "const FormSchema = z.object({});",
            },
          ],
        },
      ],
    },

    // Invalid: just 'Schema' — name resolves to null, no suggestion
    {
      code: "const Schema = z.object({});",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "Schema" },
          suggestions: [],
        },
      ],
    },

    // Invalid: with chained methods (non-parse)
    {
      code: "const userForm = z.object({}).required();",
      errors: [
        {
          messageId: "zodSchemaMustBePascalCaseWithSuffix",
          data: { name: "userForm" },
          suggestions: [
            {
              messageId: "renameToPascalCaseWithSchemaSuffix",
              output: "const UserFormSchema = z.object({}).required();",
            },
          ],
        },
      ],
    },
  ],
});
