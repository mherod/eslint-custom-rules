import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-start-transition-for-server-actions";

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

ruleTester.run("prefer-start-transition-for-server-actions", rule, {
  valid: [
    // ==========================================
    // Server actions wrapped in startTransition
    // ==========================================
    {
      name: "Server action imported from .action.ts file wrapped in startTransition",
      code: `
        "use client";
        import { startTransition } from "react";
        import { createPost } from "@/actions/post.action";

        function handleSubmit(formData: FormData) {
          startTransition(async () => {
            await createPost(formData);
          });
        }
      `,
    },
    {
      name: "Server action from /actions/ directory wrapped in startTransition",
      code: `
        "use client";
        import { startTransition } from "react";
        import { updateUser } from "@/lib/actions/user";

        function handleUpdate(formData: FormData) {
          startTransition(async () => {
            await updateUser(formData);
          });
        }
      `,
    },
    {
      name: "Multiple server actions in startTransition",
      code: `
        "use client";
        import { startTransition } from "react";
        import { createPost, updateUser } from "@/actions";

        function handleBatch(formData: FormData) {
          startTransition(async () => {
            await createPost(formData);
            await updateUser(formData);
          });
        }
      `,
    },
    {
      name: "Server action in nested startTransition",
      code: `
        "use client";
        import { startTransition } from "react";
        import { createPost } from "@/actions/post.action";

        function handleComplex(formData: FormData) {
          startTransition(() => {
            startTransition(async () => {
              await createPost(formData);
            });
          });
        }
      `,
    },
    {
      name: "Regular function calls don't need startTransition",
      code: `
        "use client";
        import { updateUI } from "@/utils/ui";

        function handleClick() {
          console.log("clicked");
          updateUI();
        }
      `,
    },
    {
      name: "Non-client component (no use client directive)",
      code: `
        import { createPost } from "@/actions/post.action";

        function handleSubmit(formData: FormData) {
          createPost(formData); // No startTransition needed in server components
        }
      `,
    },
  ],
  invalid: [
    // ==========================================
    // Server actions NOT wrapped in startTransition
    // ==========================================
    {
      name: "ERROR: Server action imported from .action.ts without startTransition",
      code: `
        "use client";
        import { createPost } from "@/actions/post.action";

        function handleSubmit(formData: FormData) {
          createPost(formData);
        }
      `,
      errors: [{ messageId: "serverActionNeedsStartTransition" }],
    },
    {
      name: "ERROR: Server action from /actions/ directory without startTransition",
      code: `
        "use client";
        import { updateUser } from "@/lib/actions/user";

        function handleUpdate(formData: FormData) {
          updateUser(formData);
        }
      `,
      errors: [{ messageId: "serverActionNeedsStartTransition" }],
    },
    {
      name: "ERROR: Multiple server action calls without startTransition",
      code: `
        "use client";
        import { createPost } from "@/actions/post.action";
        import { updateUser } from "@/lib/actions/user";

        function handleBatch(formData: FormData) {
          createPost(formData);
          updateUser(formData);
        }
      `,
      errors: [
        { messageId: "serverActionNeedsStartTransition" },
        { messageId: "serverActionNeedsStartTransition" },
      ],
    },
    {
      name: "ERROR: Server action call with new FormData() argument",
      code: `
        "use client";
        import { createPost } from "@/actions/post.action";

        function MyComponent() {
          return (
            <button onClick={() => createPost(new FormData())}>
              Submit
            </button>
          );
        }
      `,
      errors: [{ messageId: "serverActionNeedsStartTransition" }],
    },
    {
      name: "ERROR: Server action with request parameter pattern",
      code: `
        "use client";
        import { callApi } from "@/actions/api.action";

        function handleApi(request: Request) {
          callApi(request);
        }
      `,
      errors: [{ messageId: "serverActionNeedsStartTransition" }],
    },
  ],
});
