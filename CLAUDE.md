# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a custom ESLint plugin (`@mherod/eslint-plugin-custom`) containing custom linting rules for TypeScript and React development. The plugin provides rules for enforcing code patterns, security practices, and architectural constraints.

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

# Clean build output
npm run clean

# Run a specific test file
npx jest src/rules/__tests__/[rule-name].test.ts
```

## Architecture

### Plugin Structure

The plugin is organized into five category-specific plugins, each with its own entry point:
- `src/typescript.ts` - TypeScript-specific rules (`@mherod/typescript`)
- `src/react.ts` - React/Next.js rules (`@mherod/react`)
- `src/vue.ts` - Vue.js rules (`@mherod/vue`)
- `src/general.ts` - General code organization (`@mherod/general`)
- `src/security.ts` - Security patterns (`@mherod/security`)
- `src/index.ts` - Combined plugin for backward compatibility (`@mherod/custom`)

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
│   └── __tests__/
├── react/         # React/Next.js rules
│   └── __tests__/
├── general/       # General code organization
│   └── __tests__/
└── security/      # Security-focused rules
    └── __tests__/
```

### Rule Development Pattern

Each rule follows the same structure:
1. Rule file in `src/rules/[category]/[rule-name].ts` using `ESLintUtils.RuleCreator`
2. Test file in `src/rules/[category]/__tests__/[rule-name].test.ts` using `RuleTester`
3. Export from `src/rules/index.ts`
4. Include in appropriate category plugin (`src/[category].ts`)

### Entry Points

The package exports multiple entry points via package.json exports field:
- Main: `@mherod/eslint-plugin-custom` (all rules)
- TypeScript: `@mherod/eslint-plugin-custom/typescript`
- React: `@mherod/eslint-plugin-custom/react`
- General: `@mherod/eslint-plugin-custom/general`
- Security: `@mherod/eslint-plugin-custom/security`

## Build Configuration

- Uses `tsup` for building with both CJS and ESM formats
- Target: Node 18+
- TypeScript declarations currently disabled in tsup.config.ts
- Source maps enabled for debugging

## Testing

Tests use `@typescript-eslint/rule-tester` with Jest. Each test file should:
1. Import the rule and RuleTester
2. Configure RuleTester with TypeScript parser
3. Provide valid and invalid test cases
4. Include fix tests where applicable