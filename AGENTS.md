# AGENTS.md

Concise guidance for working in `@mherod/eslint-plugin-custom`, a TypeScript ESLint plugin with rule packs for TypeScript, React/Next.js, Vue, General, Security, and Shared rules.

## Setup And Commands

Prerequisites: Node.js >=18, pnpm, Git, ESLint-capable editor.

Use these commands:

```bash
pnpm install
pnpm build
pnpm dev
pnpm test
pnpm test:watch
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm clean
pnpm commitlint
pnpm prepublishOnly
pnpm exec jest src/rules/[category]/__tests__/[rule-name].test.ts
pnpm exec jest --listTests
pnpm audit --prod
```

Use `pnpm exec jest`, not `npx jest`. For test discovery issues, run `pnpm exec jest --listTests` before changing Jest config. Do not use shell pipes in `--testPathPattern`; run full `pnpm test` or pass explicit file paths.

Publishing:

```bash
pnpm build
pnpm publish --access public --otp=$(op item get Npmjs --otp)
AUTH_TOKEN=$(cat ~/.npmrc | rg '_authToken=(.+)' -o -r '$1')
gh secret set NPM_TOKEN --body "$AUTH_TOKEN"
```

Do not create npm granular tokens through `POST /npm/v1/tokens`; use the npm website automation token or the bearer token from local login.

## Architecture

Entry points:

- `src/index.ts` combined plugin
- `src/typescript.ts`
- `src/react.ts`
- `src/vue.ts`
- `src/general.ts`
- `src/security.ts`
- `src/refactors.ts`

Rule folders:

- `src/rules/typescript`
- `src/rules/react`
- `src/rules/vue`
- `src/rules/general`
- `src/rules/security`
- `src/rules/shared`
- `src/rules/utils`

Each category plugin exports `rules`, `configs.recommended`, and `configs.strict` for legacy and flat config users. Package exports must keep CJS, ESM, and type entries aligned in `package.json`.

Build settings:

- `tsconfig.json`: CommonJS, ES2022 target, strict mode, declaration output, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `isolatedModules`.
- `tsup.config.ts`: CJS and ESM output, Node 18 target, declarations, source maps, rule files as individual entries.
- `jest.config.js`: Jest 30 + ts-jest, Node environment, tests under `__tests__` or `*.test.ts(x)`.

## Rule Creation

Use kebab-case filenames. Do not create camelCase rule files. Rule files default-export `ESLintUtils.RuleCreator.withoutDocs(...)` or the established local pattern.

When adding a rule:

1. Add `src/rules/[category]/rule-name.ts`.
2. Add `src/rules/[category]/__tests__/rule-name.test.ts`.
3. Register once in the category manifest (`<CATEGORY>_MANIFEST` in
   `src/<category>.ts`) with the rule module plus optional
   `recommended`/`strict` severities. Rule maps, severity maps, legacy
   configs, flat configs, and the combined registry are all derived from
   the manifest — do not edit `src/rules/index.ts` or duplicate severity
   maps by hand.
4. Run focused Jest, `pnpm typecheck`, `pnpm lint`, and usually `pnpm test`.

Use `interface` for object shapes. Avoid `any`; tests may use relaxed overrides already configured in Biome/ESLint.

If a report uses `suggest`, set `meta.hasSuggestions: true`. Suggestion fixers need explicit `TSESLint.RuleFix` return types and `import type { TSESLint } from "@typescript-eslint/utils"`.

Only add `fix()` when the conversion is unambiguous. For non-serializable prop types, Date can use `.toISOString()`. Functions, Map, Set, and classes should use suggestions or diagnostics, not autofix.

## Testing Rules

Always include valid and invalid cases. Test autofixes with `output`. Test messages, locations, parser options, and edge cases.

For JSX test cases, set parser options with `ecmaFeatures: { jsx: true }`. Do not add JSX to a RuleTester that cannot parse JSX.

Do not write invalid cases the rule cannot statically prove. Example: if identifiers have unknown primitive/object types, keep those cases valid and document the limitation.

Security rules historically had less coverage; add tests when modifying security behavior.

## Shared Utilities

Prefer existing utilities over local copies:

- `normalizePath()` from `src/rules/utils/component-type-utils.ts`
- `hasDirective(sourceCode, "use client" | "use server" | "use cache")`
- `hasUseClientDirective(sourceCode)`
- `isClientComponent`, `isServerComponent`, `isAppRouterComponent`
- `hasAsyncExport`
- `isServerOnlyModule`, `isClientOnlyModule`, `isClientOnlyHook`, `isServerEnvVar`
- `server-action-utils.ts` for server action detection
- `common.ts` naming, file, HTTP method, database, protected-route, JSDoc, export, async, and filename helpers

Use `context.filename` and `context.sourceCode`; do not use deprecated `context.getFilename()` or `context.getSourceCode()`.

When replacing repeated path normalization or directive logic, add the import and replace the usage in the same edit per file.

For rules tracking per-function state across nested functions, use a scope stack. Push on function entry, evaluate and pop on `:exit`. See `src/rules/react/no-waterfall-chains.ts`.

## Project Conventions

Biome/Ultracite:

- Extends `ultracite/core`.
- Filename convention requires kebab-case.
- `noExplicitAny` is an error except configured overrides.
- `noExcessiveCognitiveComplexity` max is 30.

Commit messages use Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`. Subject max is 72 chars and sentence-case rules apply through commitlint.

Lefthook:

- Pre-commit runs `npx ultracite fix` on staged JS/TS/JSON/CSS-style files and stages fixes.
- Commit-msg runs `npx commitlint --edit`.

Do not bypass hooks. Fix lint/type/test failures directly.

## Rule-Specific Notes

Use `normalizePath()` instead of `filename.replace(/\\/g, "/")`.

For `/components/` directory naming, accept both PascalCase (`UserProfile.tsx`) and kebab-case (`user-profile.tsx`). Keep camelCase invalid.

For `BARREL_PACKAGES` in `no-barrel-file-imports.ts`, distinguish tree-shakeable root imports from true barrels. Do not flag `lucide-react`, `@tabler/icons-react`, `@phosphor-icons/react`, or `@headlessui/react`. Keep flagging `@mui/material`, `@mui/icons-material`, `react-icons/*`, `ramda`, `rxjs`, `react-use`, and `@radix-ui/react-*`.

When using duplicate-code tools such as `resect similar`, judge by domain and purpose, not structural score alone. Do not extract helpers for identical shapes that represent different concepts.

Security redirect rules should distinguish unsafe attacker-controlled redirects from internal Next.js navigation.

Route Handlers (`app/**/route.{ts,tsx,js,jsx}`) are not Server Actions. Do not add `"use server"` to them.

## Release And CI

Before publishing or merging, run:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --prod
```

Use `pnpm audit --prod`; full audit includes dev dependency findings that are not shipped.

When pushing commits to remote after all local verification gates pass, use `PUSHPATROL_BYPASS=1` if blocked by organizational PushPatrol pre-push hooks:

```bash
PUSHPATROL_BYPASS=1 git push origin <branch>
```

If GitHub Actions release fails with `ENEEDAUTH`, refresh or set `NPM_TOKEN`.

## Troubleshooting

Build failures: run `pnpm typecheck` and fix TypeScript errors.

Rule not found: verify the rule has a `<CATEGORY>_MANIFEST` entry in `src/<category>.ts`; everything else is derived from it.

Autofix not applying: verify `meta.fixable`, return a valid fixer, and test with `output`.

Parser errors in RuleTester: match parser options to syntax under test.

Lockfile or dependency issues: use pnpm; keep `pnpm-lock.yaml` committed when dependency metadata changes.
