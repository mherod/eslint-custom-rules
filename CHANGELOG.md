# Changelog

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
