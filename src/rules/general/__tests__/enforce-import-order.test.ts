import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../enforce-import-order";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Correct order: external -> internal -> relative (sorted alphabetically)
    {
      code: `
        import lodash from 'lodash';
        import React from 'react';
        import { useState } from 'react';

        import { api } from '@/api/client';
        import { helper } from '@/utils/helper';

        import { sibling } from '../sibling';
        import { local } from './local';
      `,
    },
    // Only external imports (sorted)
    {
      code: `
        import lodash from 'lodash';
        import React from 'react';
      `,
    },
    // Only relative imports (sorted - '../' before './')
    {
      code: `
        import { sibling } from '../sibling';
        import { local } from './local';
      `,
    },
    // Single import
    {
      code: `import React from 'react';`,
    },
  ],
  invalid: [
    // Wrong order: relative before external (also missing empty line)
    {
      code: `
        import { sibling } from '../sibling';
        import React from 'react';
      `,
      errors: [
        {
          messageId: "wrongOrder",
        },
        {
          messageId: "missingEmptyLine",
        },
      ],
    },
    // Wrong order: internal before external (also missing empty line)
    {
      code: `
        import { helper } from '@/utils/helper';
        import React from 'react';
      `,
      errors: [
        {
          messageId: "wrongOrder",
        },
        {
          messageId: "missingEmptyLine",
        },
      ],
    },
    // Wrong order: relative before internal (multiple issues - 3 errors)
    {
      code: `
        import { helper } from '@/utils/helper';
        import { sibling } from '../sibling';
        import React from 'react';
      `,
      errors: [
        {
          messageId: "wrongOrder",
        },
        {
          messageId: "missingEmptyLine",
        },
        {
          messageId: "missingEmptyLine",
        },
      ],
    },
    // Missing empty line between groups (rule doesn't autofix)
    {
      code: `
        import React from 'react';
        import { helper } from '@/utils/helper';
      `,
      errors: [
        {
          messageId: "missingEmptyLine",
        },
      ],
    },
    {
      code: `
        import { helper } from '@/utils/helper';
        import { sibling } from '../sibling';
      `,
      errors: [
        {
          messageId: "missingEmptyLine",
        },
      ],
    },
    // Extra empty line within group (but this triggers unsorted first)
    {
      code: `
        import React from 'react';

        import lodash from 'lodash';
      `,
      errors: [
        {
          messageId: "unsortedImports",
        },
      ],
    },
    // Unsorted imports within external group
    {
      code: `
        import lodash from 'lodash';
        import React from 'react';
        import axios from 'axios';

        import { helper } from '@/utils/helper';
      `,
      errors: [
        {
          messageId: "unsortedImports",
        },
      ],
    },
    // Unsorted imports within internal group
    {
      code: `
        import React from 'react';

        import { helper } from '@/utils/helper';
        import { api } from '@/api/client';
      `,
      errors: [
        {
          messageId: "unsortedImports",
        },
      ],
    },
    // Unsorted imports within relative group ('./' before '../')
    {
      code: `
        import React from 'react';

        import { local } from './local';
        import { sibling } from '../sibling';
      `,
      errors: [
        {
          messageId: "unsortedImports",
        },
      ],
    },
  ],
});
