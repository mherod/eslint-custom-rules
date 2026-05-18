# CLAUDE.md

Guide for Claude Code and developers contributing to `@mherod/eslint-plugin-custom` — a custom ESLint plugin (75 rules) for TypeScript, React/Next.js, Vue.js, security, and general code organization.

## Quick Start

Prereqs: Node 18+, pnpm, Git.

```bash
pnpm install
pnpm build
pnpm test
```

## Development Commands

```bash
pnpm build              # tsup bundle (cjs + esm + .d.ts)
pnpm dev                # watch mode
pnpm test               # jest
pnpm test:watch
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint --max-warnings 0
pnpm lint:fix
pnpm clean
pnpm commitlint
pnpm prepublishOnly     # clean + build + typecheck + test
pnpm exec jest <path>           # run one test file (NOT npx jest)
pnpm exec jest --listTests      # discover jest's view of test files
```

**DO**: Run `pnpm install` before `typecheck`/`build` when `git status` shows modified `package.json` or `pnpm-lock.yaml`. Dirty lockfiles → "Cannot find type definition" errors.

## Architecture

Five category plugins (`typescript`, `react`, `vue`, `general`, `security`) plus a `shared` rule, all combined into the main plugin. Each category exports `rules`, `configs.recommended` (warn), `configs.strict` (error), and supports both legacy and flat config.

```
src/
├── index.ts                 # combined plugin (re-exports all categories)
├── {typescript,react,vue,general,security}.ts  # per-category plugins
└── rules/
    ├── {typescript,react,vue,general,security,shared}/
    │   ├── <rule-name>.ts
    │   └── __tests__/<rule-name>.test.ts
    └── utils/               # shared helpers (see below)
```

Entry points (`package.json#exports`): `@mherod/eslint-plugin-custom` and `/typescript`, `/react`, `/vue`, `/general`, `/security`.

### Utility Modules (`src/rules/utils/`)

- **`component-type-utils.ts`** — `normalizePath`, `hasDirective(sourceCode, directive)`, `hasUseClientDirective`, `isClientComponent`, `isServerComponent`, `isAppRouterComponent`, `hasAsyncExport`, `isServerOnlyModule`, `isClientOnlyModule`, `isClientOnlyHook`, `isServerEnvVar`.
- **`server-action-utils.ts`** — server action detection.
- **`common.ts`** — `NAMING_PATTERNS`, `FILE_PATTERNS`, `HTTP_METHODS`, `DATABASE_OBJECTS`, `PROTECTED_ROUTE_PATTERNS`; `isComponentName/Path`, `isHookName/Path`, `isApiRoute`, `isUtilityFile`, `isTestFile`, `isHttpMethod`, `isDatabaseObject`, `isProtectedRoute`, `isExportedFunction/Variable/Type/Interface`, `isComplexType/ReturnType`, `getJsDocComment`, `isAsyncFunction`, `getRouteName`, `getFilename`.

## Adding a Rule

1. Create `src/rules/<category>/<kebab-name>.ts` using `ESLintUtils.RuleCreator` (default export). Set `fixable: "code"` only with a real `fix()`; for IDE-only quick fixes set `hasSuggestions: true` and provide `suggest` arrays.
2. Create `src/rules/<category>/__tests__/<kebab-name>.test.ts` with both `valid` and `invalid` cases. Match parser options to the syntax under test.
3. Register in `src/rules/index.ts` (default registry) and in `src/<category>.ts` (rules + recommended/strict configs + flat-config variant).
4. Main `src/index.ts` already re-exports category plugins — no change needed unless you alter the top-level shape.

## Toolchain

- **TypeScript**: ES2021 / CommonJS / Node resolution, full strict mode (`strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, `noImplicitThis`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Source + declaration maps emitted.
- **Build (`tsup`)**: emits CJS + ESM + `.d.ts/.d.mts` for `src/index.ts`, each category file, and every non-test rule. Externals: `@typescript-eslint/utils`, `@typescript-eslint/parser`, `eslint`, `typescript`. Target Node 18+.
- **Jest** (`jest.config.js`): ts-jest, Node env. Test globs: `**/__tests__/**/*.test.(ts|tsx)`, `**/*.(test|spec).(ts|tsx)`. Coverage from `src/**/*.{ts,tsx}` (excludes `.d.ts`, tests, index files).
- **Lefthook** (`lefthook.yml`): pre-commit runs `npx ultracite fix` on staged TS/JS/JSON/JSONC/CSS and stages fixes; commit-msg runs `npx commitlint --edit`.
- **Biome** (`biome.jsonc`): extends `ultracite/core` (NOT `ultracite` — v7+). `noExplicitAny: error`, `noExcessiveCognitiveComplexity: 30`. Test files relax `noExplicitAny`/`noUndeclaredVariables`. DO: use `interface` over `type` for object shapes.
- **Commitlint**: Conventional Commits. Types: feat/fix/docs/style/refactor/test/chore/ci/perf/build/revert. `subject-case: sentence-case`, subject ≤72 chars, body/footer line ≤100.

Engines: Node ≥18. Production deps: none. Peer deps: `@typescript-eslint/parser ^8`, `eslint ^8 || ^9`, `typescript ^5`.

## Running Locally

```bash
pnpm build && pnpm link
# in consumer:
pnpm link @mherod/eslint-plugin-custom
```

Consumer flat config:

```js
import customPlugin from "@mherod/eslint-plugin-custom";
export default [{ plugins: { "@mherod/custom": customPlugin }, rules: { "@mherod/custom/<rule>": "error" } }];
```

## Publishing

```bash
pnpm audit --prod          # zero prod vulns gate; full audit includes dev-only minimatch noise
pnpm build
pnpm publish --access public --otp=$(op item get Npmjs --otp)
```

GitHub Actions `release.yml` needs `secrets.NPM_TOKEN`. If `ENEEDAUTH`, refresh: `AUTH_TOKEN=$(rg '_authToken=(.+)' -o -r '$1' ~/.npmrc); gh secret set NPM_TOKEN --body "$AUTH_TOKEN"`. **DON'T** use the granular-token REST API — it always returns read-only regardless of `readonly: false`; create automation tokens via the npm UI.

## Debugging Rules

`console.log(node)` inside `create()`. To attach a debugger: `node --inspect-brk node_modules/.bin/jest <test>`. In VS Code: "Debug: Jest Current File".

## DO / DON'T (high-signal directives)

### Rule authoring
- **DO** use `context.filename` and `context.sourceCode` — `getFilename()`/`getSourceCode()` are deprecated.
- **DO** use `normalizePath()` from `component-type-utils.ts` instead of inline `filename.replace(/\\/g, "/")`. Use `hasDirective(sourceCode, "use client")` instead of inline AST directive checks.
- **DO** use a per-function scope stack (push on entry, pop on `:exit`) for rules tracking per-function state across nested functions — a module-level variable bleeds counts from inner to outer scopes. Reference: `src/rules/react/no-waterfall-chains.ts`.
- **DO** set `hasSuggestions: true` when reporting `suggest` arrays — ESLint silently drops suggestions otherwise.
- **DO** when switching from `fixable: "code"` to suggest-only, remove `fixable` and add `hasSuggestions`. These flags are independent: `fixable` is for `--fix`, `hasSuggestions` is for IDE quick-fix.
- **DO** annotate `fix()` returns inside `suggest` arrays with `TSESLint.RuleFix`. The project's `explicit-function-return-type` rule requires it.
- **DO** only provide auto-fix for non-serializable prop types with a single safe conversion (Date → `.toISOString()`). Functions/Map/Set/classes have no universal conversion — use `suggest` or diagnostic only.
- **DO** add the import and replace the usage in the same edit when introducing a shared utility — splitting passes causes intermediate TS errors.
- **DO** double-cast `(node as unknown as Record<string, unknown>)[key]` when walking AST nodes by generic key. Always skip `"parent"` to avoid cycles.

### Tests
- **DO** include both `valid` and `invalid` cases, fixable rules also need `output`.
- **DO** run `pnpm exec jest --listTests` to verify jest discovers a test file before debugging discovery; tests are matched by `testMatch` glob.
- **DON'T** add JSX cases to a `RuleTester` configured without `ecmaFeatures: { jsx: true }` — they fail with `Parsing error: '>' expected`.
- **DON'T** write `invalid` cases the rule can't statically prove (e.g. `useMemo(() => a || b, [])` when `a`,`b` are bare `Identifier` nodes of unknown type). Move to `valid` with a comment.
- **DON'T** chain test patterns with `|` in `--testPathPattern` — the shell may pipe.
- **DO** run a fixable-rule test once with deliberately wrong `output` to learn ESLint's actual fix insertion point; ESLint deduplicates overlapping fixes from multiple reports on the same node.

### File conventions
- **DON'T** name rule files with camelCase (e.g. `no-unsafe-innerHTML.ts`). Biome enforces kebab-case → use `no-unsafe-inner-html.ts`.
- **DO** run `pnpm lint` after creating or renaming files; the pre-commit `ultracite fix` catches kebab-case violations but discovering at commit-time wastes a round-trip.
- **DO** when a rule targets `/components/` naming, accept both PascalCase (`UserProfile.tsx`) and kebab-case (`user-profile.tsx`). camelCase remains invalid.

### Rule semantics
- **DO** when evaluating `BARREL_PACKAGES` in `no-barrel-file-imports`, distinguish tree-shakeable root entries from genuine barrels. NOT barrels: `lucide-react`, `@tabler/icons-react`, `@phosphor-icons/react`, `@headlessui/react`. Genuine barrels: `@mui/material`, `@mui/icons-material`, `react-icons/*`, `ramda`, `rxjs`, `react-use`, `@radix-ui/react-*`.
- **DO** when using `resect similar`, evaluate matches by domain/purpose not just structural score. Functions sharing `.some(item => str.includes(item))` over different domains (admin paths vs hook paths vs protected routes) are not real duplicates.

## Phosphor Icons

- Import from `@phosphor-icons/react` in client components, `@phosphor-icons/react/ssr` in server components.
- Size via `size` prop (default 24). Color via Tailwind `className` (e.g. `text-zinc-900 dark:text-zinc-100`) — never the `color` prop.
- Resolve deprecations by using the new name directly (e.g. `CaretUpDownIcon`); no aliases.
- `aria-label` on interactive icons, `aria-hidden="true"` on decorative.

## Resources

ESLint docs <https://eslint.org/docs/latest/>, TypeScript-ESLint <https://typescript-eslint.io/>, AST Explorer <https://astexplorer.net/>. Project config files: `tsconfig.json`, `tsup.config.ts`, `jest.config.js`, `biome.jsonc`, `commitlint.config.js`, `lefthook.yml`. See `CONTRIBUTING.md` and `README.md`.

## License

MIT. Author: Matthew Herod.
