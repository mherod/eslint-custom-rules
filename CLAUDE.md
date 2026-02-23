# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) and developers when working with code in this repository. It contains everything needed to start contributing on day one.

## Repository Overview

This is a custom ESLint plugin (`@mherod/eslint-plugin-custom`) containing custom linting rules for TypeScript, React/Next.js, Vue.js, and general development practices. The plugin provides rules for enforcing code patterns, security practices, and architectural constraints.

### Key Features
- **Modular Architecture**: Five category-specific plugins that can be used independently
- **TypeScript First**: Written in TypeScript with full type definitions
- **Auto-fixable Rules**: Many rules provide automatic fixes
- **Framework Support**: Specialized rules for React/Next.js and Vue.js
- **ESLint 9 Support**: Both flat config and legacy config formats supported
- **Comprehensive Testing**: 44 test suites with 731 tests covering major rules

## Quick Start for New Developers

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- Git
- A code editor with ESLint support (VS Code recommended)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd eslint-custom-rules

# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests to verify setup
npm test

# Start development mode with watch
npm run dev
```

### VS Code Setup

Install recommended extensions:
- ESLint (dbaeumer.vscode-eslint)
- TypeScript and JavaScript Language Features (built-in)

## Development Commands

```bash
# Build the plugin
pnpm build

# Development mode with watch
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint         # Check for linting issues
pnpm lint:fix     # Auto-fix linting issues

# Clean build output
pnpm clean

# Commit linting (checks commit messages)
pnpm commitlint

# Prepare for publishing (runs clean, build, typecheck, and tests)
pnpm prepublishOnly

# Run a specific test file — use pnpm exec jest, NOT npx jest
pnpm exec jest src/rules/__tests__/[rule-name].test.ts

# List all test files jest can discover
pnpm exec jest --listTests
```

## Architecture

### Plugin Structure

The plugin is organized into five category-specific plugins, each with its own entry point:

```
src/
├── index.ts        # Combined plugin (backward compatibility)
├── typescript.ts   # TypeScript-specific rules
├── react.ts        # React/Next.js rules
├── vue.ts          # Vue.js rules
├── general.ts      # General code organization
├── security.ts     # Security patterns
└── rules/          # Rule implementations
    ├── typescript/
    ├── react/
    ├── vue/
    ├── general/
    └── security/
```

Each plugin exports:
- `rules` - The rule implementations
- `configs.recommended` - Balanced rule set
- `configs.strict` - Stricter rule set
- Both legacy and flat config formats

### Rule Organization

Rules are organized by category in subdirectories:
```
src/rules/
├── typescript/     # TypeScript-specific rules (5 rules)
│   ├── enforce-api-patterns.ts
│   ├── enforce-documentation.ts
│   ├── enforce-typescript-patterns.ts
│   ├── enforce-zod-schema-naming.ts
│   ├── no-empty-function-implementations.ts
│   └── __tests__/  # Test files for TypeScript rules
├── react/         # React/Next.js rules (27 rules)
│   ├── enforce-admin-separation.ts
│   ├── enforce-component-patterns.ts
│   ├── enforce-server-client-separation.ts
│   ├── no-context-provider-in-server-component.ts
│   ├── no-dynamic-tailwind-classes.ts
│   ├── no-event-handlers-to-client-props.ts
│   ├── no-internal-fetch-in-server-component.ts
│   ├── no-non-serializable-props.ts
│   ├── no-react-hooks-in-server-component.ts
│   ├── no-sequential-data-fetching.ts
│   ├── no-unstable-math-random.ts
│   ├── no-use-client-in-layout.ts
│   ├── no-use-client-in-page.ts
│   ├── no-use-params-in-client-component.ts
│   ├── no-use-state-in-async-component.ts
│   ├── prefer-async-page-component.ts
│   ├── prefer-await-params-in-page.ts
│   ├── prefer-cache-api.ts
│   ├── prefer-link-over-router-push.ts
│   ├── prefer-next-navigation.ts
│   ├── prefer-react-destructured-imports.ts
│   ├── prefer-reusable-swr-hooks.ts
│   ├── prefer-ui-promise-handling.ts
│   ├── prefer-use-hook-for-promise-props.ts
│   ├── prefer-use-swr-over-fetch.ts
│   ├── prevent-environment-poisoning.ts
│   ├── suggest-server-component-pages.ts
│   └── __tests__/  # Test files for React rules
├── general/       # General code organization (7 rules)
│   ├── enforce-file-naming.ts
│   ├── enforce-import-order.ts
│   ├── prefer-date-fns.ts
│   ├── prefer-date-fns-over-date-operations.ts
│   ├── prefer-lodash-es-imports.ts
│   ├── prefer-lodash-uniq-over-set.ts
│   ├── prefer-ufo-with-query.ts
│   └── __tests__/  # Test files for general rules
├── security/      # Security-focused rules (1 rule)
│   ├── enforce-security-patterns.ts
│   └── __tests__/  # Test files for security rules
├── vue/          # Vue.js rules (1 rule)
│   ├── prefer-to-value.ts
│   └── __tests__/  # Test files for Vue rules
├── utils/        # Shared utility functions
│   ├── ast-helpers.ts    # AST traversal and node checking utilities
│   └── common.ts         # Common patterns, naming conventions, file patterns
└── index.ts      # Central export for all rules
```

### Utility Functions

The project includes shared utility modules in `src/rules/utils/`:

#### AST Helpers (`ast-helpers.ts`)
Utility functions for working with AST nodes:
- `isReactHookCall(node)` - Check if a node is a React hook call
- `isCallingFunction(node, functionName)` - Check if calling a specific function
- `isMethodCall(node, objectName, methodName)` - Check if calling a method on an object
- `isPropertyAccess(node, objectName, propertyName)` - Check property access
- `getFunctionName(node)` - Get function name from various declaration types
- `hasDecorator(node, decoratorName)` - Check for specific decorators
- `getLiteralValue(node)` - Extract literal values from nodes
- `hasReturnStatement(node)` - Check if function has return statement
- `getVariableDeclarations(node)` - Get all variable declarations in scope
- `isInsideNode(node, parentType, maxDepth)` - Check if inside specific parent
- `getParentOfType(node, parentType, maxDepth)` - Get closest parent of type
- `isImportFrom(node, moduleName)` - Check if import is from specific module
- `getImportedNames(node)` - Get imported names from import declaration
- `isDynamicTemplateLiteral(node)` - Check if template literal has expressions
- `getIdentifiers(node)` - Get all identifiers in an expression
- `isFunctionEmpty(node)` - Check if function body is empty

#### Common Utilities (`common.ts`)
Common patterns and helpers:
- **Naming Patterns**: `NAMING_PATTERNS` (COMPONENT, HOOK, CAMEL_CASE, PASCAL_CASE, KEBAB_CASE, SNAKE_CASE)
- **File Patterns**: `FILE_PATTERNS` (COMPONENT, HOOK, API, UTIL, TEST, STYLE)
- **HTTP Methods**: `HTTP_METHODS` constant array
- **Database Objects**: `DATABASE_OBJECTS` constant array
- **Protected Routes**: `PROTECTED_ROUTE_PATTERNS` constant array
- `isComponentName(name)` - Check component naming convention
- `isHookName(name)` - Check hook naming convention
- `isComponentPath(filename)` - Check if file path is component
- `isHookPath(filename)` - Check if file path is hook
- `isApiRoute(filename)` - Check if file is API route
- `isUtilityFile(filename)` - Check if file is utility/library
- `isTestFile(filename)` - Check if file is test file
- `isHttpMethod(functionName)` - Check if function name is HTTP method
- `isDatabaseObject(objectName)` - Check if object is database-related
- `isProtectedRoute(routeName)` - Check if route is protected
- `isExportedFunction(node)` - Check if function is exported
- `isExportedVariable(node)` - Check if variable is exported
- `isExportedType(node)` - Check if type alias is exported
- `isExportedInterface(node)` - Check if interface is exported
- `isComplexType(typeAnnotation)` - Check if type is complex
- `isComplexReturnType(returnType)` - Check if return type is complex
- `getJsDocComment(node, sourceCode)` - Get JSDoc comment for node
- `isAsyncFunction(node)` - Check if function is async
- `getRouteName(filename)` - Extract route name from filename
- `getFilename(context)` - Get filename from ESLint context

### Entry Points

The package exports multiple entry points via package.json exports field:
- Main: `@mherod/eslint-plugin-custom` (all rules)
- TypeScript: `@mherod/eslint-plugin-custom/typescript`
- React: `@mherod/eslint-plugin-custom/react`
- Vue: `@mherod/eslint-plugin-custom/vue`
- General: `@mherod/eslint-plugin-custom/general`
- Security: `@mherod/eslint-plugin-custom/security`

## Development Workflow

### Creating a New Rule

1. **Choose the appropriate category** (typescript/react/vue/general/security)

2. **Create the rule file**:
```typescript
// src/rules/[category]/my-new-rule.ts
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/mherod/eslint-plugin-custom/tree/main/docs/rules/${name}.md`
);

export const myNewRule = createRule({
  name: 'my-new-rule',
  meta: {
    type: 'problem', // or 'suggestion' or 'layout'
    docs: {
      description: 'Description of what the rule does',
      recommended: 'warn',
    },
    fixable: 'code', // if rule provides fixes
    schema: [], // for rule options
    messages: {
      myError: 'Error message with {{placeholder}}',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // AST visitor functions
      Identifier(node) {
        context.report({
          node,
          messageId: 'myError',
          data: { placeholder: 'value' },
          fix(fixer) {
            // return fixer.replaceText(node, 'fixed');
          },
        });
      },
    };
  },
});
```

3. **Create the test file**:
```typescript
// src/rules/[category]/__tests__/my-new-rule.test.ts
import { RuleTester } from '@typescript-eslint/rule-tester';
import myNewRule from '../my-new-rule';

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
});

ruleTester.run('my-new-rule', myNewRule, {
  valid: [
    {
      code: 'const valid = true;',
    },
  ],
  invalid: [
    {
      code: 'const invalid = true;',
      errors: [{ messageId: 'myError' }],
      output: 'const fixed = true;', // if fixable
    },
  ],
});
```

4. **Export from rules/index.ts**:
```typescript
// src/rules/index.ts
import myNewRule from "./[category]/my-new-rule";

export const rules = {
  "my-new-rule": myNewRule,
  // ... other rules
};
```

5. **Add to category plugin**:
```typescript
// src/[category].ts
import myNewRule from "./rules/[category]/my-new-rule";

export const [category]Rules = {
  "my-new-rule": myNewRule,
  // ... other rules
};

export const [category]Plugin = {
  rules: [category]Rules,
  configs: {
    recommended: {
      plugins: ["@mherod/[category]"],
      rules: {
        "@mherod/[category]/my-new-rule": "warn",
      },
    },
    strict: {
      plugins: ["@mherod/[category]"],
      rules: {
        "@mherod/[category]/my-new-rule": "error",
      },
    },
  },
};

// Support for flat config
export const [category]Configs = {
  recommended: {
    plugins: {
      "@mherod/[category]": [category]Plugin,
    },
    rules: {
      "@mherod/[category]/my-new-rule": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/[category]": [category]Plugin,
    },
    rules: {
      "@mherod/[category]/my-new-rule": "error",
    },
  },
};

export default [category]Plugin;
```

6. **Add to main plugin exports** (if needed):
```typescript
// src/index.ts
export { default as [category]Plugin, [category]Rules, [category]Configs } from "./[category]";
```

6. **Run tests**:
```bash
npm test src/rules/[category]/__tests__/my-new-rule.test.ts
```

**Note**: The main plugin (`src/index.ts`) already re-exports all category plugins, so step 5 is usually sufficient unless you need to modify the main plugin structure.

### Rule Export Pattern

Rules follow a consistent export pattern:
1. **Rule files** use default export: `export default createRule({ ... })`
2. **Rules index** (`src/rules/index.ts`) imports and re-exports all rules in a single object for the main plugin
3. **Category plugins** (`src/[category].ts`) import from rules directory and create plugin objects with configs
4. **Main index** (`src/index.ts`) re-exports all category plugins for backward compatibility

This pattern allows:
- Individual rule usage (if needed)
- Category-specific plugins with their own namespaces
- Combined plugin (all rules) for backward compatibility
- Both legacy and flat config support automatically

### Rule Export Pattern

Rules follow a consistent export pattern:
1. **Rule files** use default export: `export default createRule({ ... })`
2. **Rules index** imports and re-exports all rules in a single object
3. **Category plugins** import from rules directory and create plugin objects with configs
4. **Main index** re-exports all category plugins for backward compatibility

This pattern allows:
- Individual rule usage (if needed)
- Category-specific plugins
- Combined plugin (all rules)
- Both legacy and flat config support

### Testing Best Practices

- Always include both valid and invalid test cases
- Test auto-fixes with `output` property
- Test error messages and locations
- Include edge cases and different code styles
- Test with different parser options if needed
- Use descriptive test case names

**DO**: Use `pnpm exec jest --listTests` to verify jest discovers your test file before debugging discovery issues. Jest finds files by `testMatch` glob, not by `--testPathPattern` — if a file doesn't show in `--listTests`, the file path or glob doesn't match.

**DON'T**: Use `pnpm test -- --testPathPattern="a|b"` with a pipe to run multiple patterns — the shell may interpret `|` as a pipe operator. Instead run `pnpm exec jest --listTests` first, then run `pnpm test` for the full suite.

**DON'T**: Add JSX test cases to a `RuleTester` configured without `ecmaFeatures: { jsx: true }`. Tests with `<Component />` syntax will fail with "Parsing error: '>' expected". Either add JSX parser options or remove JSX test cases from rules that don't need JSX parsing.

**DON'T**: Write `invalid` test cases where the rule logic cannot statically prove the condition. For example, a rule that flags `useMemo` returning a provably-primitive value cannot flag `useMemo(() => a || b, [])` when `a` and `b` are plain `Identifier` nodes — their types are unknown at parse time. Move such cases to `valid` with a comment explaining the limitation.

Example test structure:
```typescript
ruleTester.run('rule-name', rule, {
  valid: [
    // Code that should NOT trigger the rule
    'valid code here',
    {
      code: 'more complex valid code',
      parserOptions: { ecmaVersion: 2022 },
    },
  ],
  invalid: [
    // Code that SHOULD trigger the rule
    {
      code: 'invalid code here',
      errors: [
        {
          messageId: 'errorId',
          line: 1,
          column: 1,
        },
      ],
      output: 'fixed code here', // if rule is fixable
    },
  ],
});
```

## Build Configuration

### TypeScript Configuration (tsconfig.json)
- **Target**: ES2021
- **Module**: CommonJS
- **Module Resolution**: Node
- **Strict Mode**: Enabled with all strict checks
- **Strict Checks Enabled**:
  - `strictNullChecks`: true
  - `noImplicitAny`: true
  - `noImplicitReturns`: true
  - `noImplicitThis`: true
  - `noFallthroughCasesInSwitch`: true
  - `noUncheckedIndexedAccess`: true
  - `exactOptionalPropertyTypes`: true
- **Source Maps**: Declaration maps enabled (`declarationMap: true`)
- **Declaration Files**: Generated for both CommonJS and ESM
- **ES Module Interop**: Enabled
- **Skip Lib Check**: Enabled for faster compilation
- **Include**: `src/**/*.ts`, `src/**/*.tsx`
- **Exclude**: `dist`, `node_modules`, `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`

### Build Tool (tsup.config.ts)
- **Build Tool**: `tsup` v8.1.0
- **Output Formats**: Both CommonJS (.js) and ES Modules (.mjs)
- **Target**: Node 18+
- **TypeScript Declarations**: Enabled (.d.ts and .d.mts files)
- **Source Maps**: Enabled for debugging (.js.map and .mjs.map)
- **Entry Points**:
  - Main plugin: `src/index.ts`
  - Category plugins: `src/typescript.ts`, `src/react.ts`, `src/vue.ts`, `src/general.ts`, `src/security.ts`
  - Individual rules: `src/rules/**/!(*.test).ts` (all rule files except tests)
- **External Dependencies**: @typescript-eslint/utils, @typescript-eslint/parser, eslint, typescript
- **Build Output**: `dist/` directory with organized plugin and rule files

### Jest Configuration (jest.config.js)
- **Test Framework**: Jest v29.7.0
- **Test Environment**: Node.js
- **TypeScript Support**: ts-jest v29.2.2
- **Test Locations**: 
  - `**/__tests__/**/*.test.(ts|tsx)` - Tests in __tests__ directories
  - `**/*.(test|spec).(ts|tsx)` - Tests with .test or .spec suffix
- **Coverage**:
  - Enabled with collection from `src/**/*.{ts,tsx}`
  - Excludes: declaration files, test files, index files
  - Reports: text, lcov, html
- **Module Name Mapper**: Maps @typescript-eslint/rule-tester for proper module resolution

## Code Quality

### Linting Rules Applied to This Project
- TypeScript strict mode
- Explicit function return types required
- No explicit `any` types
- No unsafe operations
- No unused variables (except those prefixed with `_`)
- Comprehensive type safety checks
- **DO**: Use `interface` definitions instead of `type` aliases for object shapes (enforced by Biome)

### Commit Message Format
Uses Conventional Commits with commitlint:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks
- `ci:` CI/CD changes
- `perf:` Performance improvements
- `build:` Build system changes
- `revert:` Revert commits

Example: `feat: Add new rule for enforcing import order`

### Pre-commit Hooks
Configured with **Lefthook** (v1.13.1):

**Pre-commit Hook:**
- Runs `npx ultracite fix` on staged files
- File patterns: `*.js`, `*.jsx`, `*.ts`, `*.tsx`, `*.json`, `*.jsonc`, `*.css`
- Automatically stages fixed files

**Commit-msg Hook:**
- Runs `npx commitlint --edit` to validate commit messages
- Enforces Conventional Commits format

### Linting & Formatting

**Biome Configuration** (`biome.jsonc`):
- Extends: `ultracite/core` preset (DO: Use `ultracite/core` for v7+, NOT `ultracite`)
- **Linter Rules**:
  - Performance: `noBarrelFile`, `useTopLevelRegex`, `noNamespaceImport` (all off)
  - Complexity: `noExcessiveCognitiveComplexity` (max 30), `noForEach` (off)
  - Suspicious: `noExplicitAny` (error)
  - Style: `useNamingConvention` (strictCase: false), `noNestedTernary`, `noMagicNumbers`, `useCollapsedIf` (all off)
- **Overrides**:
  - Test files: Relaxed rules (noExplicitAny off, noUndeclaredVariables off)
  - Specific files: Allow explicit any for complex rules
  - ESLint config files: Filename convention disabled

**Commitlint Configuration** (`commitlint.config.js`):
- Extends: `@commitlint/config-conventional`
- **Rules**:
  - `type-enum`: feat, fix, docs, style, refactor, test, chore, ci, perf, build, revert
  - `subject-case`: sentence-case
  - `subject-max-length`: 72 characters
  - `body-max-line-length`: 100 characters
  - `footer-max-line-length`: 100 characters

## Common Tasks

### Running the Plugin Locally

1. **Build the plugin**:
```bash
npm run build
```

2. **Link for local testing**:
```bash
npm link
```

3. **In your test project**:
```bash
npm link @mherod/eslint-plugin-custom
```

4. **Configure ESLint** in your test project:
```javascript
// eslint.config.js
import customPlugin from '@mherod/eslint-plugin-custom';

export default [{
  plugins: {
    '@mherod/custom': customPlugin,
  },
  rules: {
    '@mherod/custom/your-rule': 'error',
  },
}];
```

### Debugging Rules

1. **Add console.log in rule implementation**:
```typescript
create(context) {
  return {
    Identifier(node) {
      console.log('Node:', node);
      // rule logic
    },
  };
}
```

2. **Run tests with Node debugging**:
```bash
node --inspect-brk node_modules/.bin/jest src/rules/__tests__/your-rule.test.ts
```

3. **Use VS Code debugger**:
   - Set breakpoints in rule or test files
   - Run "Debug: Jest Current File" from command palette

### Publishing Process

1. **Ensure all tests pass**:
```bash
npm test
npm run typecheck
npm run lint
```

2. **Update version**:
```bash
npm version patch|minor|major
```

3. **Build and publish**:
**DO**: Use 1Password CLI to get the OTP for npm publishing.
```bash
npm run prepublishOnly
# Get OTP from 1Password (item: Npmjs)
npm publish --otp=$(op item get Npmjs --otp)
```

## Troubleshooting

### Common Issues and Solutions

#### Build Errors
- **Issue**: TypeScript compilation errors
- **Solution**: Run `npm run typecheck` to see detailed errors, ensure all types are properly imported

#### Test Failures
- **Issue**: RuleTester parser errors
- **Solution**: Ensure parser options match the code being tested, check for syntax errors in test code

#### Rule Not Found
- **Issue**: "Definition for rule was not found"
- **Solution**: Verify rule is exported from both rules/index.ts and the appropriate category plugin file

#### Auto-fix Not Working
- **Issue**: Rule has `fixable: 'code'` but fixes aren't applied
- **Solution**: Ensure fix function returns a valid fixer operation, test with `output` property

### Development Tips

1. **Use TypeScript strict mode** - Catches many bugs at compile time
2. **Write tests first** - TDD approach helps design better rules
3. **Keep rules focused** - Each rule should do one thing well
4. **Provide helpful error messages** - Include context and suggestions
5. **Make rules fixable when possible** - Improves developer experience
6. **Document edge cases** - In tests and rule descriptions
7. **Use existing utilities** - Check @typescript-eslint/utils for helpers

## Available Rules

### TypeScript Rules (`@mherod/typescript`)
All rules available in the `@mherod/typescript` plugin:

- `enforce-api-patterns` - Consistent API endpoint patterns and naming conventions
- `enforce-documentation` - Requires JSDoc comments for public APIs and exported functions
- `enforce-typescript-patterns` - General TypeScript best practices and patterns
- `enforce-zod-schema-naming` - Consistent naming conventions for Zod schemas
- `no-empty-function-implementations` - Prevents empty function bodies

**Configuration Presets:**
- `recommended`: `enforce-typescript-patterns`, `enforce-zod-schema-naming`, `no-empty-function-implementations` (all warn)
- `strict`: All rules enabled (most as error, `enforce-documentation` as warn)

### React/Next.js Rules (`@mherod/react`)
All rules available in the `@mherod/react` plugin:

**Server/Client Separation:**
- `no-use-state-in-async-component` - Prevents useState in server components (error)
- `no-event-handlers-to-client-props` - Prevents passing event handlers to client components (error)
- `prevent-environment-poisoning` - Enforces proper server-only/client-only imports (error)
- `enforce-server-client-separation` - Prevents server code in client components (error)
- `enforce-admin-separation` - Isolates admin-only functionality (error)
- `no-context-provider-in-server-component` - Prevents Context providers in server components
- `no-react-hooks-in-server-component` - Prevents React hooks in server components
- `no-internal-fetch-in-server-component` - Warns against internal fetch calls in server components
- `no-use-client-in-layout` - Prevents "use client" directive in layout files (error)
- `no-use-client-in-page` - Prevents "use client" directive in page files (error)
- `no-use-params-in-client-component` - Prevents use of params in client components (error)

**Component Patterns:**
- `enforce-component-patterns` - Enforces consistent component patterns (warn/error)
- `prefer-react-destructured-imports` - Use destructured React imports (warn/error)
- `suggest-server-component-pages` - Suggests server components for pages (warn)
- `prefer-async-page-component` - Prefers async page components (warn)
- `prefer-await-params-in-page` - Requires await for params in page components (error)

**Next.js Navigation:**
- `prefer-next-navigation` - Use Next.js navigation over window.location (warn)
- `prefer-link-over-router-push` - Use Link component over router.push (warn)

**Data Fetching:**
- `prefer-use-swr-over-fetch` - Use SWR for data fetching (warn)
- `prefer-reusable-swr-hooks` - Create reusable SWR hooks (warn)
- `prefer-ui-promise-handling` - Handle promises properly in UI (warn)
- `prefer-cache-api` - Use Next.js Cache API (error)
- `no-sequential-data-fetching` - Warns against sequential data fetching (warn)
- `prefer-use-hook-for-promise-props` - Use hooks for promise props (warn)
- `no-non-serializable-props` - Prevents non-serializable props (error)

**Re-render & Bundle Optimization:**
- `no-lazy-state-init` - Flags `useState(fn())` — should be `useState(() => fn())` to avoid re-running on every render (auto-fixable)
- `no-usememo-for-primitives` - Flags `useMemo` returning a provably-primitive value (number/string/boolean arithmetic) where memoisation overhead exceeds gains
- `prefer-dynamic-import-for-heavy-libs` - Flags static imports of known-heavy packages (recharts, monaco, leaflet, mapbox, d3, react-pdf, etc.) and suggests `next/dynamic`

**Code Quality:**
- `no-dynamic-tailwind-classes` - Prevents dynamic Tailwind class generation (warn/error, auto-fixable)
- `no-unstable-math-random` - Prevents Math.random() in React components (warn/error)

**Configuration Presets:**
- `recommended`: Core rules for Next.js App Router (mostly error level)
- `strict`: All rules enabled with stricter settings

### General Rules (`@mherod/general`)
All rules available in the `@mherod/general` plugin:

- `enforce-import-order` - Consistent import ordering (external → internal → relative) (warn/error)
- `enforce-file-naming` - File naming conventions (warn/error)
- `prefer-date-fns-over-date-operations` - Use date-fns for date operations (warn)
- `prefer-date-fns` - Prefer date-fns library over native Date (warn/error)
- `prefer-lodash-es-imports` - Prefer lodash-es imports over lodash (error)
- `prefer-lodash-uniq-over-set` - Use lodash uniq over Set for array deduplication (warn/error)
- `prefer-ufo-with-query` - Use ufo library's `withQuery` for URL query manipulation (warn/error)

**Configuration Presets:**
- `recommended`: Most rules as warn, `prefer-lodash-es-imports` as error
- `strict`: All rules as error except `prefer-date-fns-over-date-operations` (warn)

### Security Rules (`@mherod/security`)
All rules available in the `@mherod/security` plugin:

- `enforce-security-patterns` - Comprehensive security pattern enforcement (checks for eval, innerHTML, SQL injection patterns, etc.) (error)
- `no-unstable-math-random` - Prevents Math.random() for security-sensitive operations (warn/error)

**Configuration Presets:**
- `recommended`: `enforce-security-patterns` as error, `no-unstable-math-random` as warn
- `strict`: Both rules as error

### Vue.js Rules (`@mherod/vue`)
All rules available in the `@mherod/vue` plugin:

- `prefer-to-value` - Prefer `toValue()` over `.value` or `unref()` for unwrapping refs (auto-fixable, optional auto-import) (warn/error)

**Configuration Presets:**
- `recommended`: `prefer-to-value` as warn
- `strict`: `prefer-to-value` as error

### Complete Rule List (All Categories)
Total: **42 rules** across 5 categories

**TypeScript (5 rules):**
1. enforce-api-patterns
2. enforce-documentation
3. enforce-typescript-patterns
4. enforce-zod-schema-naming
5. no-empty-function-implementations

**React/Next.js (25 rules):**
1. enforce-admin-separation
2. enforce-component-patterns
3. enforce-server-client-separation
4. no-context-provider-in-server-component
5. no-dynamic-tailwind-classes
6. no-event-handlers-to-client-props
7. no-internal-fetch-in-server-component
8. no-non-serializable-props
9. no-react-hooks-in-server-component
10. no-sequential-data-fetching
11. no-unstable-math-random
12. no-use-client-in-layout
13. no-use-client-in-page
14. no-use-params-in-client-component
15. no-use-state-in-async-component
16. prefer-async-page-component
17. prefer-await-params-in-page
18. prefer-cache-api
19. prefer-link-over-router-push
20. prefer-next-navigation
21. prefer-react-destructured-imports
22. prefer-reusable-swr-hooks
23. prefer-ui-promise-handling
24. prefer-use-hook-for-promise-props
25. prefer-use-swr-over-fetch
26. prevent-environment-poisoning
27. suggest-server-component-pages

**General (7 rules):**
1. enforce-file-naming
2. enforce-import-order
3. prefer-date-fns
4. prefer-date-fns-over-date-operations
5. prefer-lodash-es-imports
6. prefer-lodash-uniq-over-set
7. prefer-ufo-with-query

**Security (1 rule):**
1. enforce-security-patterns

**Vue.js (1 rule):**
1. prefer-to-value

## Dependencies

### Production Dependencies
None - this is a dev dependency only plugin

### Peer Dependencies
- `@typescript-eslint/parser`: ^8.0.0 (required for TypeScript projects)
- `eslint`: ^8.0.0 || ^9.0.0 (supports both ESLint 8 and 9)
- `typescript`: ^5.0.0 (required for TypeScript projects)

### Dev Dependencies
- **Core Development**:
  - `typescript`: ^5.5.3
  - `@typescript-eslint/eslint-plugin`: ^8.0.0
  - `@typescript-eslint/parser`: ^8.0.0
  - `@typescript-eslint/rule-tester`: ^8.44.0
  - `@typescript-eslint/utils`: ^8.0.0
  - `eslint`: ^8.57.0

- **Build Tools**:
  - `tsup`: ^8.1.0 (TypeScript bundler)

- **Testing**:
  - `jest`: ^29.7.0
  - `ts-jest`: ^29.2.2
  - `@types/jest`: ^29.5.12

- **Code Quality**:
  - `@biomejs/biome`: ^2.2.4 (Linter and formatter)
  - `ultracite`: ^5.4.3 (Code formatter)

- **Git Hooks**:
  - `lefthook`: ^1.13.1 (Git hooks manager)
  - `husky`: ^9.1.7 (Git hooks)
  - `lint-staged`: ^16.1.6 (Run linters on staged files)
  - `@commitlint/cli`: ^19.8.1
  - `@commitlint/config-conventional`: ^19.8.1

- **Type Definitions**:
  - `@types/eslint`: ^8.56.10
  - `@types/node`: ^20.14.10

### Engine Requirements
- **Node.js**: >=18.0.0

## Package Exports Structure

The package.json exports field provides multiple entry points:

```javascript
{
  ".": {
    types: "./dist/index.d.ts",
    import: "./dist/index.mjs",
    require: "./dist/index.js"
  },
  "./typescript": { /* ... */ },
  "./react": { /* ... */ },
  "./vue": { /* ... */ },
  "./general": { /* ... */ },
  "./security": { /* ... */ }
}
```

Each entry point provides:
- Type definitions (`.d.ts` for CommonJS, `.d.mts` for ESM)
- CommonJS build (`.js`)
- ES Module build (`.mjs`)
- Source maps (`.js.map`, `.mjs.map`)

## Build Output Structure

After running `npm run build`, the `dist/` directory contains:

```
dist/
├── index.{js,mjs,d.ts,d.mts}           # Main plugin (all rules)
├── typescript.{js,mjs,d.ts,d.mts}      # TypeScript plugin
├── react.{js,mjs,d.ts,d.mts}           # React plugin
├── vue.{js,mjs,d.ts,d.mts}             # Vue plugin
├── general.{js,mjs,d.ts,d.mts}         # General plugin
├── security.{js,mjs,d.ts,d.mts}        # Security plugin
└── rules/                               # Individual rule builds
    ├── typescript/
    ├── react/
    ├── general/
    ├── security/
    └── vue/
```

## Test Coverage

Current test files (20 test suites, 315 tests total):
- **TypeScript**: 2 test files (enforce-zod-schema-naming, no-empty-function-implementations)
- **React**: 10 test files (no-dynamic-tailwind-classes, no-event-handlers-to-client-props, no-unstable-math-random, no-use-state-in-async-component, prefer-link-over-router-push, prefer-next-navigation, prefer-react-destructured-imports, prefer-reusable-swr-hooks, prefer-use-swr-over-fetch, suggest-server-component-pages)
- **General**: 6 test files (enforce-file-naming, enforce-import-order, prefer-date-fns, prefer-date-fns-over-date-operations, prefer-lodash-es-imports, prefer-lodash-uniq-over-set, prefer-ufo-with-query)
- **Vue**: 1 test file (prefer-to-value)

**Note**: Many rules still don't have test files yet. When creating new rules, always include comprehensive tests. Remaining rules needing tests:
- **React**: 17 rules (enforce-admin-separation, enforce-component-patterns, enforce-server-client-separation, no-context-provider-in-server-component, no-internal-fetch-in-server-component, no-non-serializable-props, no-react-hooks-in-server-component, no-sequential-data-fetching, no-use-client-in-layout, no-use-client-in-page, no-use-params-in-client-component, prefer-async-page-component, prefer-await-params-in-page, prefer-cache-api, prefer-ui-promise-handling, prefer-use-hook-for-promise-props, prevent-environment-poisoning)
- **TypeScript**: 3 rules (enforce-api-patterns, enforce-documentation, enforce-typescript-patterns)
- **Security**: 1 rule (enforce-security-patterns)

## Common Patterns & Conventions

### Phosphor Icons
1. **Imports**: Use `@phosphor-icons/react` for Client Components ("use client") and `@phosphor-icons/react/ssr` for Server Components (default in App Router).
2. **Styling**: Use `size` prop for dimensions (default 24). Use `className` with Tailwind for colors (e.g., `text-zinc-900 dark:text-zinc-100`). Do NOT use the `color` prop.
3. **Deprecations**: Resolve deprecations by using the new name directly (e.g., `CaretUpDownIcon` instead of `CaretUpDown`), do not use aliases.
4. **Accessibility**: Add `aria-label` to interactive icons; use `aria-hidden="true"` for decorative ones.

## Resources

### Documentation
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [AST Explorer](https://astexplorer.net/) - Explore AST nodes
- [ESLint Rule Documentation](https://eslint.org/docs/latest/developer-guide/working-with-rules)

### Project Files Reference
- [Contributing Guidelines](./CONTRIBUTING.md) - Commit message format and contribution guidelines
- [README](./README.md) - User-facing documentation with installation and usage examples
- [Package.json](./package.json) - Package metadata, dependencies, and scripts
- [tsconfig.json](./tsconfig.json) - TypeScript compiler configuration
- [tsup.config.ts](./tsup.config.ts) - Build configuration
- [jest.config.js](./jest.config.js) - Jest test configuration
- [biome.jsonc](./biome.jsonc) - Biome linter and formatter configuration
- [commitlint.config.js](./commitlint.config.js) - Commit message linting rules
- [lefthook.yml](./lefthook.yml) - Git hooks configuration

## Support

For issues, questions, or contributions:
1. Check existing issues on GitHub
2. Create a new issue with reproduction steps
3. Submit pull requests with tests
4. Follow the commit message format

## License

MIT - See LICENSE file for details

## Author

Matthew Herod