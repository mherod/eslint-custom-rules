import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-barrel-file-imports";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("no-barrel-file-imports", rule, {
  valid: [
    // Packages designed for tree-shaking at root — named imports are fine
    `import { Check, X, ArrowRight } from 'lucide-react';`,
    `import { IconHome } from '@tabler/icons-react';`,
    `import { House, Star } from '@phosphor-icons/react';`,
    // Subpath imports are safe — only the root barrel is flagged
    `import Button from '@mui/material/Button';`,
    `import { Dialog } from '@radix-ui/react-dialog/src/Dialog';`,
    // Type-only imports are always safe
    `import type { ButtonProps } from '@mui/material';`,
    // Side-effect-only imports are a separate concern
    `import 'rxjs';`,
    // Unrelated packages
    `import { useState } from 'react';`,
    `import { clsx } from 'clsx';`,
    `import merge from 'lodash-es/merge';`,
    // react-icons subpath that ends with a path separator is safe
    `import { FaArrowRight } from 'react-icons/fa/index';`,
  ],
  invalid: [
    // @mui/material barrel
    {
      code: `import { Button, TextField } from '@mui/material';`,
      errors: [
        { messageId: "noBarrelImport", data: { package: "@mui/material" } },
      ],
    },
    // @mui/icons-material barrel
    {
      code: `import { Home } from '@mui/icons-material';`,
      errors: [
        {
          messageId: "noBarrelImport",
          data: { package: "@mui/icons-material" },
        },
      ],
    },
    // react-icons root barrel
    {
      code: `import { FaArrowRight } from 'react-icons';`,
      errors: [
        { messageId: "noBarrelImport", data: { package: "react-icons" } },
      ],
    },
    // react-icons subpath barrel (e.g. react-icons/fa is itself a barrel)
    {
      code: `import { FaArrowRight } from 'react-icons/fa';`,
      errors: [
        { messageId: "noBarrelImport", data: { package: "react-icons/fa" } },
      ],
    },
    // @radix-ui/react-* (regex pattern)
    {
      code: `import { Dialog, DialogContent } from '@radix-ui/react-dialog';`,
      errors: [
        {
          messageId: "noBarrelImport",
          data: { package: "@radix-ui/react-dialog" },
        },
      ],
    },
    {
      code: `import { Popover } from '@radix-ui/react-popover';`,
      errors: [
        {
          messageId: "noBarrelImport",
          data: { package: "@radix-ui/react-popover" },
        },
      ],
    },
    // rxjs barrel
    {
      code: `import { Observable, Subject } from 'rxjs';`,
      errors: [{ messageId: "noBarrelImport", data: { package: "rxjs" } }],
    },
    // ramda barrel
    {
      code: `import { map, filter } from 'ramda';`,
      errors: [{ messageId: "noBarrelImport", data: { package: "ramda" } }],
    },
  ],
});
