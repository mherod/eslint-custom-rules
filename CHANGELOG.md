# Changelog

## 2026-04-04

### New Features

- Added a resect-backed refactor surface in `@mherod/eslint-plugin-custom/refactors`
  for symbol renames, Zod schema renames, and file moves across the project graph.
- `prefer-direct-imports` now resolves real leaf modules and can split mixed
  barrel imports into direct imports.
- `no-long-relative-imports` now offers canonical import fixes when a stable
  alias, workspace import, or shorter relative path exists.
- Added `no-unresolvable-imports` for import, export, dynamic import, require,
  and mock calls that TypeScript cannot resolve.

## 2026-03-18

### New Features

- **no-non-serializable-props:** Added auto-fix for Date props
  passed to Client Components. `new Date()` is now automatically
  converted to `new Date().toISOString()` when running
  `eslint --fix`. IDE suggestion fixes offer both
  `.toISOString()` (string) and `.getTime()` (number)
  conversions. Heuristic date-named props (e.g.
  `createdDate={user.createdAt}`) also receive suggestion
  fixes. The error message now specifically advises converting
  Dates rather than using the generic non-serialisable warning.
