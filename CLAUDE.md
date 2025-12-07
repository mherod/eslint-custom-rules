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
- **Comprehensive Testing**: All rules have extensive test coverage

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
npm run build

# Development mode with watch
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint         # Check for linting issues
npm run lint:fix     # Auto-fix linting issues

# Clean build output
npm run clean

# Commit linting (checks commit messages)
npm run commitlint

# Prepare for publishing (runs clean, build, typecheck, and tests)
npm run prepublishOnly

# Run a specific test file
npx jest src/rules/__tests__/[rule-name].test.ts
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
├── typescript/     # TypeScript-specific rules
│   ├── enforce-api-patterns.ts
│   ├── enforce-documentation.ts
│   └── __tests__/
├── react/         # React/Next.js rules
│   ├── no-use-state-in-async-component.ts
│   ├── enforce-server-client-separation.ts
│   └── __tests__/
├── general/       # General code organization
│   ├── enforce-import-order.ts
│   ├── enforce-file-naming.ts
│   └── __tests__/
├── security/      # Security-focused rules
│   ├── enforce-security-patterns.ts
│   └── __tests__/
└── vue/          # Vue.js rules
    ├── prefer-to-value.ts
    └── __tests__/
```

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
import { myNewRule } from '../my-new-rule';

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
export { myNewRule } from './[category]/my-new-rule';
```

5. **Add to category plugin**:
```typescript
// src/[category].ts
import { myNewRule } from './rules/[category]/my-new-rule';

const rules = {
  'my-new-rule': myNewRule,
  // ... other rules
};
```

6. **Run tests**:
```bash
npm test src/rules/[category]/__tests__/my-new-rule.test.ts
```

### Testing Best Practices

- Always include both valid and invalid test cases
- Test auto-fixes with `output` property
- Test error messages and locations
- Include edge cases and different code styles
- Test with different parser options if needed
- Use descriptive test case names

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
- Target: ES2021
- Module: CommonJS
- Strict mode enabled
- Source maps enabled
- Declaration files generated

### Build Tool (tsup.config.ts)
- Uses `tsup` for building
- Outputs both CJS and ESM formats
- Target: Node 18+
- TypeScript declarations enabled
- Source maps enabled for debugging
- Entry points for each plugin category

### Jest Configuration (jest.config.js)
- Test environment: Node
- Uses ts-jest for TypeScript support
- Coverage reporting enabled
- Tests located in `__tests__` directories
- Isolated modules for faster compilation

## Code Quality

### Linting Rules Applied to This Project
- TypeScript strict mode
- Explicit function return types required
- No explicit `any` types
- No unsafe operations
- No unused variables (except those prefixed with `_`)
- Comprehensive type safety checks

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
Configured with Husky and lint-staged:
- Runs Ultracite formatter on staged files
- Ensures code quality before commits
- Automatic formatting with Biome

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
```bash
npm run prepublishOnly
npm publish
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
- `enforce-api-patterns` - Consistent API endpoint patterns
- `enforce-documentation` - JSDoc for public APIs
- `enforce-typescript-patterns` - General TypeScript best practices
- `enforce-zod-schema-naming` - Zod schema naming conventions
- `no-empty-function-implementations` - No empty function bodies
- `prefer-lodash-uniq-over-set` - Use lodash for deduplication

### React/Next.js Rules (`@mherod/react`)
- `no-use-state-in-async-component` - No useState in server components
- `no-event-handlers-to-client-props` - No event handlers to client components
- `prevent-environment-poisoning` - Proper server/client imports
- `enforce-server-client-separation` - Server/client boundary enforcement
- `enforce-admin-separation` - Admin functionality isolation
- `enforce-component-patterns` - Component pattern consistency
- `prefer-react-destructured-imports` - Destructured React imports
- `suggest-server-component-pages` - Server components for pages
- `prefer-next-navigation` - Next.js navigation over window.location
- `prefer-link-over-router-push` - Link component over router.push
- `prefer-use-swr-over-fetch` - SWR for data fetching
- `prefer-reusable-swr-hooks` - Reusable SWR hooks
- `prefer-ui-promise-handling` - Proper promise handling in UI
- `no-dynamic-tailwind-classes` - No dynamic Tailwind class generation

### General Rules (`@mherod/general`)
- `enforce-import-order` - Consistent import ordering
- `enforce-file-naming` - File naming conventions
- `prefer-date-fns-over-date-operations` - Use date-fns for dates

### Security Rules (`@mherod/security`)
- `enforce-security-patterns` - Comprehensive security patterns
- `no-unstable-math-random` - No Math.random() for security

### Vue.js Rules (`@mherod/vue`)
- `prefer-to-value` - Use toValue() for ref unwrapping

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

### Internal Links
- [Contributing Guidelines](./CONTRIBUTING.md)
- [README](./README.md)
- [Package.json](./package.json)

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