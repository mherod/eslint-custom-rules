import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-lodash-es-imports";

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
    // Named imports from lodash-es
    {
      code: `import { merge, debounce } from 'lodash-es';`,
    },
    // Single named import from lodash-es
    {
      code: `import { merge } from 'lodash-es';`,
    },
    // Other packages are fine
    {
      code: `import React from 'react';`,
    },
    {
      code: `import * as utils from './utils';`,
    },
  ],
  invalid: [
    // Import from 'lodash' instead of 'lodash-es'
    {
      code: `import { merge } from 'lodash';`,
      errors: [
        {
          messageId: "preferLodashEs",
        },
      ],
      output: `import { merge } from 'lodash-es';`,
    },
    // Default import from lodash-es
    {
      code: `import _ from 'lodash-es';`,
      errors: [
        {
          messageId: "preferNamedImports",
        },
      ],
    },
    // Namespace import from lodash-es
    {
      code: `import * as _ from 'lodash-es';`,
      errors: [
        {
          messageId: "noFullImport",
        },
      ],
    },
    // Default import from lodash
    {
      code: `import _ from 'lodash';`,
      errors: [
        {
          messageId: "preferLodashEs",
        },
        {
          messageId: "preferNamedImports",
        },
      ],
      output: `import _ from 'lodash-es';`,
    },
    // Namespace import from lodash
    {
      code: `import * as _ from 'lodash';`,
      errors: [
        {
          messageId: "preferLodashEs",
        },
        {
          messageId: "noFullImport",
        },
      ],
      output: `import * as _ from 'lodash-es';`,
    },
    // require('lodash')
    {
      code: `const _ = require('lodash');`,
      errors: [
        {
          messageId: "preferLodashEs",
        },
      ],
      output: `const _ = require('lodash-es');`,
    },
  ],
});
