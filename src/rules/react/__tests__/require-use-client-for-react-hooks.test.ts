import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../require-use-client-for-react-hooks";

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

ruleTester.run("require-use-client-for-react-hooks", rule, {
  valid: [
    {
      name: "Client component with use client directive",
      code: `"use client";\nimport { useRef } from "react";\nexport function Comp() { const ref = useRef(null); return null; }`,
      filename: "/app/components/Comp.tsx",
    },
    {
      name: "Server component using React.use (allowed)",
      code: `import { use } from "react";\nexport function Comp() { const data = use(fetch("/api")); return null; }`,
      filename: "/app/components/ServerComp.tsx",
    },
    {
      name: "Non-TSX hook module without use client",
      code: `import { useState } from "react";\nexport const useThing = () => { const [x] = useState(0); return x; };`,
      filename: "/app/hooks/useThing.ts",
    },
  ],
  invalid: [
    {
      name: "Missing use client with named hook import",
      code: `import { useRef } from "react";\nexport function Comp() { const ref = useRef(null); return null; }`,
      filename: "/app/components/Comp.tsx",
      errors: [{ messageId: "missingUseClientDirective" }],
    },
    {
      name: "Missing use client with React.useState",
      code: `import React from "react";\nexport function Comp() { React.useState(0); return null; }`,
      filename: "/app/components/Comp.tsx",
      errors: [{ messageId: "missingUseClientDirective" }],
    },
    {
      name: "Missing use client with aliased hook imports",
      code: `import { useMemo as useMemoReact, useEffect } from "react";\nexport function Comp() { useMemoReact(() => 1, []); useEffect(() => {}); return null; }`,
      filename: "/app/components/Comp.tsx",
      errors: [
        { messageId: "missingUseClientDirective" },
        { messageId: "missingUseClientDirective" },
      ],
    },
  ],
});
