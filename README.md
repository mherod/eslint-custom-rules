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

This package provides five specialised plugins with 76 rules total:

- **`@mherod/typescript`** (5 rules) - TypeScript-specific rules for better type safety and code patterns
- **`@mherod/react`** (44 rules) - React and Next.js rules for component patterns and SSR/CSR separation
- **`@mherod/vue`** (1 rule) - Vue.js rules for composition API best practices and reactivity patterns
- **`@mherod/general`** (14 rules) - General code organisation rules (imports, naming, etc.)
- **`@mherod/security`** (12 rules) - Security-focused rules to prevent common vulnerabilities

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

#### Available Rules (44 rules)

**Server/Client Separation:**
- `enforce-admin-separation` - Isolates admin-only functionality
- `enforce-server-client-separation` - Prevents server code in client components
- `enforce-use-server-vs-server-only` - Enforces correct use of "use server" vs server-only imports
- `no-async-server-component-in-client` - Prevents async server components imported in client files
- `no-conflicting-directives` - Prevents conflicting "use client" and "use server" directives
- `no-context-provider-in-server-component` - Prevents Context providers in server components
- `no-event-handlers-to-client-props` - Prevents passing event handlers to client components
- `no-internal-fetch-in-server-component` - Warns against internal fetch calls in server components
- `no-react-hooks-in-server-component` - Prevents React hooks in server components
- `no-use-client-in-layout` - Prevents "use client" directive in layout files
- `no-use-client-in-page` - Prevents "use client" directive in page files
- `no-use-params-in-client-component` - Prevents use of params in client components
- `no-use-state-in-async-component` - Prevents useState in server components
- `prevent-environment-poisoning` - Enforces proper server-only/client-only imports
- `require-use-client-for-client-named-files` - Requires "use client" in files with client naming conventions
- `require-use-client-for-react-hooks` - Requires "use client" in files using client-only React hooks

**Directives and Caching:**
- `no-parenthesized-use-cache` - Prevents parenthesized "use cache" expressions
- `no-reexports-in-use-server` - Prevents re-exports in "use server" files
- `no-request-access-in-use-cache` - Prevents request-time data access in "use cache" functions
- `require-directive-first` - Requires directives to be the first statement in a file

**React Patterns:**
- `enforce-component-patterns` - Enforces consistent component patterns
- `no-jsx-logical-and` - Prevents `&&` in JSX (use ternary instead)
- `prefer-async-page-component` - Prefers async page components
- `prefer-await-params-in-page` - Requires await for params in page components
- `prefer-react-destructured-imports` - Use destructured React imports
- `suggest-server-component-pages` - Suggests server components for pages

**Next.js Navigation:**
- `prefer-link-over-router-push` - Use Link component over router.push
- `prefer-next-navigation` - Use Next.js navigation over window.location
- `prefer-search-params-over-state` - Use URL search params over component state for shareable UI state

**Data Fetching:**
- `no-sequential-data-fetching` - Warns against sequential data fetching
- `no-waterfall-chains` - Prevents waterfall request chains
- `prefer-cache-api` - Use Next.js Cache API
- `prefer-reusable-swr-hooks` - Create reusable SWR hooks
- `prefer-ui-promise-handling` - Handle promises properly in UI
- `prefer-use-hook-for-promise-props` - Use hooks for promise props
- `prefer-use-swr-over-fetch` - Use SWR for data fetching
- `use-after-for-non-blocking` - Use `after()` for non-blocking operations

**Re-render and Bundle Optimization:**
- `no-lazy-state-init` - Flags `useState(fn())` — should be `useState(() => fn())` (auto-fixable)
- `no-usememo-for-primitives` - Flags `useMemo` returning a provably-primitive value
- `prefer-dynamic-import-for-heavy-libs` - Suggests `next/dynamic` for heavy packages
- `prefer-start-transition-for-server-actions` - Use `startTransition` for server action calls

**Serialization and Props:**
- `no-non-serializable-props` - Prevents non-serializable props across the server/client boundary

**Code Quality:**
- `no-dynamic-tailwind-classes` - Prevents dynamic Tailwind class generation (auto-fixable)
- `no-unstable-math-random` - Prevents Math.random() in React components

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

#### Available Rules (14 rules)

- `enforce-file-naming` - Enforces consistent file naming conventions
- `enforce-import-order` - Enforces consistent import ordering (external → internal → relative)
- `no-debug-comments` - Flags TODO, FIXME, HACK, and other debug comments
- `no-deprecated-declarations` - Warns on usage of deprecated APIs and patterns
- `no-import-type-queries` - Prevents `import type` queries (strict only)
- `no-long-relative-imports` - Warns against deeply nested relative imports
- `prefer-date-fns` - Prefer date-fns library over native Date methods
- `prefer-date-fns-over-date-operations` - Use date-fns for date arithmetic and formatting
- `prefer-direct-imports` - Prefer direct module imports over barrel file re-exports
- `prefer-lodash-es-imports` - Prefer lodash-es imports over lodash for tree-shaking
- `prefer-lodash-uniq-over-set` - Use lodash uniq over Set for array deduplication
- `prefer-ufo-with-query` - Use ufo library's `withQuery` for URL query manipulation
- `prefer-zod-default-with-catch` - Use `.default().catch()` pattern for Zod defaults
- `prefer-zod-url` - Use `z.string().url()` for URL validation

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
    "@mherod/security/enforce-security-patterns": "error",
    "@mherod/security/no-hardcoded-secrets": "error",
    "@mherod/security/no-sql-injection": "error",
    "@mherod/security/no-unsafe-eval": "error"
  }
}
```

#### Available Rules (12 rules)

- `enforce-security-patterns` - Comprehensive security pattern enforcement
- `no-hardcoded-secrets` - Prevents hardcoded API keys, tokens, and passwords
- `no-log-secrets` - Prevents logging sensitive data
- `no-sql-injection` - Detects SQL injection vulnerabilities
- `no-unsafe-eval` - Prevents use of `eval()` and `Function()` constructor
- `no-unsafe-innerHTML` - Prevents use of `dangerouslySetInnerHTML` and `innerHTML`
- `no-unsafe-redirect` - Prevents open redirect vulnerabilities
- `no-unsafe-template-literals` - Warns against unsafe template literal interpolation
- `no-unstable-math-random` - Prevents Math.random() for security-sensitive operations
- `no-weak-crypto` - Prevents use of weak cryptographic algorithms
- `require-auth-validation` - Requires authentication validation in protected routes
- `require-rate-limiting` - Requires rate limiting on API endpoints

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