import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-long-relative-imports";

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
      code: 'import { something } from "./local";',
    },
    {
      code: 'import { something } from "../parent";',
    },
    {
      code: 'import { something } from "../../grandparent";',
    },
    {
      code: 'import { something } from "../../../greatgrandparent";', // 3 levels (default limit)
    },
    {
      code: 'import { something } from "@/components/ui/button";',
    },
    {
      code: 'import { something } from "@plugg/server-data";',
    },
    // Custom limit
    {
      code: 'import { something } from "../../../../four-levels";',
      options: [{ maxDepth: 4 }],
    },
  ],
  invalid: [
    {
      code: 'import { something } from "../../../../too-deep";', // 4 levels (default limit is 3)
      errors: [
        {
          messageId: "noLongRelativeImports",
          data: { depth: 3 },
        },
      ],
    },
    {
      code: 'import { something } from "../../../../../way-too-deep";',
      errors: [
        {
          messageId: "noLongRelativeImports",
          data: { depth: 3 },
        },
      ],
    },
    // Custom limit
    {
      code: 'import { something } from "../../../depth-3";',
      options: [{ maxDepth: 2 }],
      errors: [
        {
          messageId: "noLongRelativeImports",
          data: { depth: 2 },
        },
      ],
    },
  ],
});
