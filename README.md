# @mherod/eslint-plugin-custom

A modular ESLint plugin providing specialized rule sets for TypeScript, React/Next.js, and general code quality. Each category can be used independently or combined based on your project needs.

## Installation

```bash
npm install --save-dev @mherod/eslint-plugin-custom
# or
yarn add -D @mherod/eslint-plugin-custom
# or
pnpm add -D @mherod/eslint-plugin-custom
```

### Requirements

- Node.js >= 18.0.0
- ESLint ^8.0.0 or ^9.0.0
- TypeScript ^5.0.0 (for TypeScript projects)
- @typescript-eslint/parser ^8.0.0 (for TypeScript projects)

## Available Plugins

This package provides five specialised plugins:

- **`@mherod/typescript`** - TypeScript-specific rules for better type safety and code patterns
- **`@mherod/react`** - React and Next.js rules for component patterns and SSR/CSR separation
- **`@mherod/vue`** - Vue.js rules for composition API best practices and reactivity patterns
- **`@mherod/general`** - General code organisation rules (imports, naming, etc.)
- **`@mherod/security`** - Security-focused rules to prevent common vulnerabilities

## Quick Start

### Modern Flat Config (ESLint 9+)

```js
// eslint.config.js
import typescript from '@mherod/eslint-plugin-custom/typescript';
import react from '@mherod/eslint-plugin-custom/react';
import vue from '@mherod/eslint-plugin-custom/vue';
import general from '@mherod/eslint-plugin-custom/general';
import security from '@mherod/eslint-plugin-custom/security';

export default [
  // Use all plugins with recommended settings
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    plugins: {
      '@mherod/typescript': typescript,
      '@mherod/react': react,
      '@mherod/vue': vue,
      '@mherod/general': general,
      '@mherod/security': security,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...vue.configs.recommended.rules,
      ...general.configs.recommended.rules,
      ...security.configs.recommended.rules,
    },
  },
];
```

### ✅ ESLint 9 Compatibility

This plugin is fully compatible with ESLint 9's flat config format. **No workarounds or special configuration required!**

The plugin exports the correct structure for both ESM and CommonJS environments:

```js
// ✅ ESM imports work correctly
import reactPlugin from '@mherod/eslint-plugin-custom/react';

export default [
  {
    plugins: {
      '@mherod/react': reactPlugin, // Direct usage - no .default needed
    },
    rules: {
      '@mherod/react/no-dynamic-tailwind-classes': 'warn',
    },
  },
];
```

**Fixed Issues (v1.2.0+):**
- ❌ `Dynamic require of "eslint/use-at-your-own-risk" is not supported`
- ❌ `Could not find "rule-name" in plugin "@mherod/react"`
- ❌ Requiring `.default` access to plugin object

All rules are now properly exported and accessible without workarounds.

## Plugin Configuration Guides

### TypeScript Plugin

Focuses on TypeScript best practices, API patterns, and code documentation.

#### Flat Config (ESLint 9+)

```js
// eslint.config.js
import typescriptPlugin from '@mherod/eslint-plugin-custom/typescript';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@mherod/typescript': typescriptPlugin,
    },
    rules: {
      // Recommended rules
      '@mherod/typescript/enforce-typescript-patterns': 'warn',
      '@mherod/typescript/enforce-zod-schema-naming': 'warn',
      '@mherod/typescript/no-empty-function-implementations': 'warn',

      // Or use preset
      ...typescriptPlugin.configs.recommended.rules,

      // Or strict mode
      ...typescriptPlugin.configs.strict.rules,
    },
  },
];
```

#### Legacy Config (.eslintrc)

```json
{
  "plugins": ["@mherod/typescript"],
  "rules": {
    "@mherod/typescript/enforce-typescript-patterns": "warn",
    "@mherod/typescript/enforce-zod-schema-naming": "warn",
    "@mherod/typescript/no-empty-function-implementations": "warn"
  }
}
```

#### Available Rules

- `enforce-api-patterns` - Enforces consistent API endpoint patterns
- `enforce-documentation` - Requires JSDoc comments for public APIs
- `enforce-typescript-patterns` - General TypeScript best practices
- `enforce-zod-schema-naming` - Consistent naming for Zod schemas
- `no-empty-function-implementations` - Prevents empty function bodies
- `prefer-lodash-uniq-over-set` - Use lodash for array deduplication

### React/Next.js Plugin

Specialised rules for React components and Next.js applications, including server/client component separation.

#### Flat Config (ESLint 9+)

```js
// eslint.config.js
import reactPlugin from '@mherod/eslint-plugin-custom/react';

export default [
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      '@mherod/react': reactPlugin,
    },
    rules: {
      // Critical Next.js App Router rules
      '@mherod/react/no-use-state-in-async-component': 'error',
      '@mherod/react/no-event-handlers-to-client-props': 'error',
      '@mherod/react/prevent-environment-poisoning': 'error',
      '@mherod/react/enforce-server-client-separation': 'error',

      // Or use preset
      ...reactPlugin.configs.recommended.rules,
    },
  },
];
```

#### Legacy Config (.eslintrc)

```json
{
  "plugins": ["@mherod/react"],
  "rules": {
    "@mherod/react/no-use-state-in-async-component": "error",
    "@mherod/react/no-event-handlers-to-client-props": "error",
    "@mherod/react/prevent-environment-poisoning": "error"
  }
}
```

#### Available Rules

**Server/Client Separation:**
- `no-use-state-in-async-component` - Prevents useState in server components
- `no-event-handlers-to-client-props` - Prevents passing event handlers to client components
- `prevent-environment-poisoning` - Enforces proper server-only/client-only imports
- `enforce-server-client-separation` - Prevents server code in client components
- `enforce-admin-separation` - Isolates admin-only functionality

**React Patterns:**
- `enforce-component-patterns` - Enforces consistent component patterns
- `prefer-react-destructured-imports` - Use destructured React imports
- `suggest-server-component-pages` - Suggests server components for pages

**Next.js Navigation:**
- `prefer-next-navigation` - Use Next.js navigation over window.location
- `prefer-link-over-router-push` - Use Link component over router.push

**Data Fetching:**
- `prefer-use-swr-over-fetch` - Use SWR for data fetching
- `prefer-reusable-swr-hooks` - Create reusable SWR hooks
- `prefer-ui-promise-handling` - Handle promises properly in UI

**Code Quality:**
- `no-unstable-math-random` - Prevents Math.random() in React components
- `no-dynamic-tailwind-classes` - Prevents dynamic Tailwind class generation (auto-fixable)
  - Detects template literals, concatenation, ternary operators in className
  - Configuration: `allowedDynamicClasses: string[]`, `allowConditionalClasses: boolean`
  - Auto-fixes to use clsx/cn utilities when possible

### General Plugin

Code organisation and quality rules applicable to any JavaScript/TypeScript project.

#### Flat Config (ESLint 9+)

```js
// eslint.config.js
import generalPlugin from '@mherod/eslint-plugin-custom/general';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@mherod/general': generalPlugin,
    },
    rules: {
      '@mherod/general/enforce-import-order': 'warn',
      '@mherod/general/enforce-file-naming': 'warn',
      '@mherod/general/prefer-date-fns-over-date-operations': 'warn',

      // Or use preset
      ...generalPlugin.configs.recommended.rules,
    },
  },
];
```

#### Legacy Config (.eslintrc)

```json
{
  "plugins": ["@mherod/general"],
  "rules": {
    "@mherod/general/enforce-import-order": "warn",
    "@mherod/general/enforce-file-naming": "warn"
  }
}
```

#### Available Rules

- `enforce-import-order` - Enforces consistent import ordering (external → internal → relative)
- `enforce-file-naming` - Enforces consistent file naming conventions
- `prefer-date-fns-over-date-operations` - Use date-fns for date operations

### Security Plugin

Security-focused rules to prevent common vulnerabilities and enforce secure coding patterns.

#### Flat Config (ESLint 9+)

```js
// eslint.config.js
import securityPlugin from '@mherod/eslint-plugin-custom/security';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@mherod/security': securityPlugin,
    },
    rules: {
      '@mherod/security/enforce-security-patterns': 'error',

      // Or use preset
      ...securityPlugin.configs.recommended.rules,
    },
  },
];
```

#### Legacy Config (.eslintrc)

```json
{
  "plugins": ["@mherod/security"],
  "rules": {
    "@mherod/security/enforce-security-patterns": "error"
  }
}
```

#### Available Rules

- `enforce-security-patterns` - Comprehensive security pattern enforcement (checks for eval, innerHTML, SQL injection patterns, etc.)

### Vue.js Plugin

Modern Vue 3 composition API best practices and reactivity pattern enforcement.

#### Flat Config (ESLint 9+)

```js
// eslint.config.js
import vuePlugin from '@mherod/eslint-plugin-custom/vue';

export default [
  {
    files: ['**/*.vue', '**/*.ts', '**/*.js'],
    plugins: {
      '@mherod/vue': vuePlugin,
    },
    rules: {
      // Reactivity best practices
      '@mherod/vue/prefer-to-value': 'warn',

      // Or use preset
      ...vuePlugin.configs.recommended.rules,
    },
  },
];
```

#### Legacy Config (.eslintrc)

```json
{
  "plugins": ["@mherod/vue"],
  "rules": {
    "@mherod/vue/prefer-to-value": "warn"
  }
}
```

#### Available Rules

- `prefer-to-value` - Prefer `toValue()` over `.value` or `unref()` for unwrapping refs
  - Detects `ref.value` access patterns
  - Detects `unref(ref)` calls
  - Detects `isRef(x) ? x.value : x` patterns
  - Auto-fixes to use `toValue()` from Vue 3.3+
  - Optional auto-import capability

## Complete Setup Examples

### Next.js App Router Project

```js
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from '@mherod/eslint-plugin-custom/react';
import generalPlugin from '@mherod/eslint-plugin-custom/general';
import securityPlugin from '@mherod/eslint-plugin-custom/security';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      '@mherod/react': reactPlugin,
      '@mherod/general': generalPlugin,
      '@mherod/security': securityPlugin,
    },
    rules: {
      // TypeScript ESLint rules
      '@typescript-eslint/no-unused-vars': 'error',

      // React/Next.js rules
      ...reactPlugin.configs.strict.rules,

      // General rules
      ...generalPlugin.configs.recommended.rules,

      // Security rules
      ...securityPlugin.configs.strict.rules,
    },
  },
];
```

### TypeScript Node.js Project

```js
// eslint.config.js
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import typescriptPlugin from '@mherod/eslint-plugin-custom/typescript';
import generalPlugin from '@mherod/eslint-plugin-custom/general';
import securityPlugin from '@mherod/eslint-plugin-custom/security';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@mherod/typescript': typescriptPlugin,
      '@mherod/general': generalPlugin,
      '@mherod/security': securityPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.strict.rules,
      ...generalPlugin.configs.strict.rules,
      ...securityPlugin.configs.strict.rules,
    },
  },
];
```

### Vue 3 Application

```js
// eslint.config.js
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import vuePlugin from '@mherod/eslint-plugin-custom/vue';
import typescriptPlugin from '@mherod/eslint-plugin-custom/typescript';
import generalPlugin from '@mherod/eslint-plugin-custom/general';

export default [
  js.configs.recommended,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@mherod/vue': vuePlugin,
      '@mherod/typescript': typescriptPlugin,
      '@mherod/general': generalPlugin,
    },
    rules: {
      ...vuePlugin.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      ...generalPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@mherod/vue': vuePlugin,
      '@mherod/typescript': typescriptPlugin,
      '@mherod/general': generalPlugin,
    },
    rules: {
      ...vuePlugin.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      ...generalPlugin.configs.recommended.rules,
    },
  },
];
```

### Using All Rules (Backward Compatibility)

If you want to use all rules with the original namespace:

```js
// eslint.config.js
import customPlugin from '@mherod/eslint-plugin-custom';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@mherod/custom': customPlugin,
    },
    rules: {
      ...customPlugin.configs.recommended.rules,
      // Or individual rules
      '@mherod/custom/no-use-state-in-async-component': 'error',
    },
  },
];
```

## Configuration Presets

Each plugin provides two configuration presets:

- **`recommended`** - Balanced set of rules for most projects
- **`strict`** - Stricter rules for maximum code quality

```js
// Use recommended preset
...reactPlugin.configs.recommended.rules

// Use strict preset
...reactPlugin.configs.strict.rules
```

## Migration Guide

### From Legacy to Flat Config

**Before (.eslintrc.json):**
```json
{
  "plugins": ["@mherod/custom"],
  "rules": {
    "@mherod/custom/no-use-state-in-async-component": "error"
  }
}
```

**After (eslint.config.js):**
```js
import customPlugin from '@mherod/eslint-plugin-custom';

export default [
  {
    plugins: {
      '@mherod/custom': customPlugin,
    },
    rules: {
      '@mherod/custom/no-use-state-in-async-component': 'error',
    },
  },
];
```

### Using Category-Specific Plugins

Instead of using all rules, import only what you need:

```js
// Before - all rules
import customPlugin from '@mherod/eslint-plugin-custom';

// After - specific categories
import reactPlugin from '@mherod/eslint-plugin-custom/react';
import vuePlugin from '@mherod/eslint-plugin-custom/vue';
import typescriptPlugin from '@mherod/eslint-plugin-custom/typescript';
```

## TypeScript Support

This plugin is written in TypeScript and provides full type definitions. When using TypeScript, you'll get autocomplete for rule names and configurations.

```ts
import type { Linter } from 'eslint';
import reactPlugin from '@mherod/eslint-plugin-custom/react';

const config: Linter.FlatConfig[] = [
  {
    plugins: {
      '@mherod/react': reactPlugin,
    },
    rules: {
      // Full TypeScript support with autocomplete
      '@mherod/react/no-use-state-in-async-component': 'error',
    },
  },
];

export default config;
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Watch mode for development
npm run build        # Build all plugins
npm run clean        # Clean build output

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Check for linting issues
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # TypeScript type checking

# Git Hooks
npm run commitlint   # Check commit messages (Conventional Commits)
npm run prepublishOnly  # Full build and test before publishing
```

### Package Exports

The package provides multiple entry points:

```javascript
// Main plugin (all rules)
import customPlugin from '@mherod/eslint-plugin-custom';

// Category-specific plugins
import typescriptPlugin from '@mherod/eslint-plugin-custom/typescript';
import reactPlugin from '@mherod/eslint-plugin-custom/react';
import vuePlugin from '@mherod/eslint-plugin-custom/vue';
import generalPlugin from '@mherod/eslint-plugin-custom/general';
import securityPlugin from '@mherod/eslint-plugin-custom/security';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Commit Message Format

This project uses Conventional Commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## License

MIT

## Author

Matthew Herod