import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-unsafe-inner-html";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-unsafe-inner-html", rule, {
  valid: [
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;",
    },
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: purify.sanitize(html) }} />;",
    },
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;",
    },
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: escapeHtml(html) }} />;",
    },
    {
      code: `const el = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;`,
    },
    {
      code: "const el = <div>safe</div>;",
    },
  ],
  invalid: [
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: html }} />;",
      errors: [
        {
          messageId: "noUnsafeInnerHTML",
          suggestions: [
            {
              messageId: "wrapWithSanitize",
              output:
                "const el = <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;",
            },
          ],
        },
      ],
    },
    {
      code: "const el = <div dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;",
      errors: [
        {
          messageId: "noUnsafeInnerHTML",
          suggestions: [
            {
              messageId: "wrapWithSanitize",
              output:
                "const el = <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(JSON.stringify(data)) }} />;",
            },
          ],
        },
      ],
    },
    {
      code: "const el = <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;",
      errors: [
        {
          messageId: "noUnsafeInnerHTML",
          suggestions: [
            {
              messageId: "wrapWithSanitize",
              output:
                "const el = <script dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(JSON.stringify(data)) }} />;",
            },
          ],
        },
      ],
    },
  ],
});
