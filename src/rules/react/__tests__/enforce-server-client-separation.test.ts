import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../enforce-server-client-separation";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("enforce-server-client-separation", rule, {
  valid: [
    // Server component (app/page.tsx) with server import — allowed
    {
      code: `import { prisma } from "@prisma/client";`,
      filename: "/src/app/page.tsx",
    },
    // Client component with client import — allowed
    {
      code: `"use client";\nimport { motion } from "framer-motion";`,
      filename: "/src/components/animated.tsx",
    },
    // Client component with dynamic client import — allowed
    {
      code: `"use client";\nconst motion = await import("framer-motion");`,
      filename: "/src/components/animated.tsx",
    },
    // Server component with dynamic server import — allowed
    {
      code: `const prisma = await import("@prisma/client");`,
      filename: "/src/app/page.tsx",
    },
    // Type-only static import in client — allowed (erased at compile time)
    {
      code: `"use client";\nimport type { User } from "firebase-admin";`,
      filename: "/src/components/profile.tsx",
    },
    // Dynamic import with non-literal source — skipped
    {
      code: `"use client";\nconst mod = await import(someVariable);`,
      filename: "/src/components/dynamic.tsx",
    },
    // Server component with require() of server module — allowed
    {
      code: `const prisma = require("@prisma/client");`,
      filename: "/src/app/page.tsx",
    },
    // Client component with require() of client module — allowed
    {
      code: `"use client";\nconst motion = require("framer-motion");`,
      filename: "/src/components/animated.tsx",
    },
    // require() with non-literal argument — skipped
    {
      code: `"use client";\nconst mod = require(someVariable);`,
      filename: "/src/components/dynamic.tsx",
    },
  ],
  invalid: [
    // Client component with static server import — blocked
    {
      code: `"use client";\nimport { prisma } from "@prisma/client";`,
      filename: "/src/components/bad.tsx",
      errors: [{ messageId: "clientImportingServerModule" }],
    },
    // Client component with dynamic server import — blocked
    {
      code: `"use client";\nconst prisma = await import("@prisma/client");`,
      filename: "/src/components/bad.tsx",
      errors: [{ messageId: "clientImportingServerModule" }],
    },
    // Server component (components/) with static client import — blocked
    {
      code: `import { motion } from "framer-motion";`,
      filename: "/src/components/server-widget.tsx",
      errors: [{ messageId: "serverImportingClientModule" }],
    },
    // Server component (components/) with dynamic client import — blocked
    {
      code: `const motion = await import("framer-motion");`,
      filename: "/src/components/server-widget.tsx",
      errors: [{ messageId: "serverImportingClientModule" }],
    },
    // Client component with require() of server module — blocked
    {
      code: `"use client";\nconst prisma = require("@prisma/client");`,
      filename: "/src/components/bad.tsx",
      errors: [{ messageId: "clientImportingServerModule" }],
    },
    // Server component with require() of client module — blocked
    {
      code: `const motion = require("framer-motion");`,
      filename: "/src/components/server-widget.tsx",
      errors: [{ messageId: "serverImportingClientModule" }],
    },
  ],
});
