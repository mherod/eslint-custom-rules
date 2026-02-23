import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../require-directive-first";

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
    // File-level: "use client" as first statement
    {
      code: `"use client";
import { useState } from "react";

export function Component() {
  return <div />;
}`,
    },
    // File-level: "use server" as first statement
    {
      code: `"use server";

export async function submitForm(formData: FormData) {
  return { success: true };
}`,
    },
    // File-level: "use cache" as first statement
    {
      code: `"use cache";
import { db } from "./db";

export async function getCachedData() {
  return db.query();
}`,
    },
    // File-level: directive with single quotes
    {
      code: `'use client';
import React from "react";`,
    },
    // Function-level: "use server" as first statement in function
    {
      code: `export async function serverAction() {
  "use server";
  return { success: true };
}`,
    },
    // Function-level: "use server" in arrow function
    {
      code: `const serverAction = async () => {
  "use server";
  return { success: true };
};`,
    },
    // No directive at all (valid)
    {
      code: `import { useState } from "react";

export function Component() {
  return <div />;
}`,
    },
    // Empty file
    {
      code: "",
    },
    // Multiple functions, each with correct directive placement
    {
      code: `export async function action1() {
  "use server";
  return 1;
}

export async function action2() {
  "use server";
  return 2;
}`,
    },
  ],

  invalid: [
    // File-level: "use client" after import
    {
      code: `import { useState } from "react";
"use client";

export function Component() {
  return <div />;
}`,
      errors: [{ messageId: "directiveNotFirst" }],
      output: `"use client";
import { useState } from "react";


export function Component() {
  return <div />;
}`,
    },
    // File-level: "use server" after import
    {
      code: `import { db } from "./db";
"use server";

export async function submitForm() {}`,
      errors: [{ messageId: "directiveNotFirst" }],
      output: `"use server";
import { db } from "./db";


export async function submitForm() {}`,
    },
    // File-level: "use cache" after multiple imports
    {
      code: `import { db } from "./db";
import { cache } from "react";
"use cache";

export async function getCachedData() {}`,
      errors: [{ messageId: "directiveNotFirst" }],
      output: `"use cache";
import { db } from "./db";
import { cache } from "react";


export async function getCachedData() {}`,
    },
    // File-level: directive after a variable declaration
    {
      code: `const x = 1;
"use client";

export function Component() {}`,
      errors: [{ messageId: "directiveNotFirst" }],
      output: `"use client";
const x = 1;


export function Component() {}`,
    },
    // Function-level: "use server" after variable declaration
    // Note: When the fixer removes the directive, it leaves behind the indentation spaces
    {
      code: `export async function serverAction() {
  const data = {};
  "use server";
  return data;
}`,
      errors: [{ messageId: "directiveNotFirstInFunction" }],
      output:
        'export async function serverAction() {\n  "use server";\nconst data = {};\n  \n  return data;\n}',
    },
    // Function-level: "use server" after multiple statements
    {
      code: `export async function serverAction(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  "use server";
  return { name, email };
}`,
      errors: [{ messageId: "directiveNotFirstInFunction" }],
      output:
        'export async function serverAction(formData: FormData) {\n  "use server";\nconst name = formData.get("name");\n  const email = formData.get("email");\n  \n  return { name, email };\n}',
    },
    // Arrow function with misplaced directive
    {
      code: `const action = async () => {
  console.log("start");
  "use server";
  return true;
};`,
      errors: [{ messageId: "directiveNotFirstInFunction" }],
      output:
        'const action = async () => {\n  "use server";\nconsole.log("start");\n  \n  return true;\n};',
    },
    // Function expression with misplaced directive
    {
      code: `const action = async function() {
  const x = 1;
  "use server";
  return x;
};`,
      errors: [{ messageId: "directiveNotFirstInFunction" }],
      output:
        'const action = async function() {\n  "use server";\nconst x = 1;\n  \n  return x;\n};',
    },
  ],
});
