# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-08-18 (Build Recovery & Release Automation)

### Added

- Build artifact verification script (`verify-build.js`) and npm script `verify:build`.
- Bundle size snapshot now populated with real data post-recovery.
- Bundle budget guard script (`bundle-budget.js`) with configurable threshold (`BUNDLE_MAX_KB`).
- Mobile release automation script (`release-mobile.js`) and npm script `release:mobile` (build → verify → snapshot → budget → cap copy).

### Fixed

- Restored missing CRA build outputs (`index.html`, JS & CSS bundles) via clean dependency reinstall after detecting corrupted `node_modules` (missing dev dependencies).

### CI / Tooling

- Frontend CI workflow updated to include build verification and size snapshot steps.
- Deployment workflow enhanced with verification and snapshot (non-blocking if absent).
- Android Capacitor copy integrated into local release procedure.

### Notes

- Current main bundle raw size ~160 KB (gzip ~51 KB) – under default budget (225 KB).
- Future regressions will fail `verify:build` early if core assets absent.
- Use `npm run release:mobile` before generating APK to guarantee fresh embedded assets.

## [1.1.0] - 2025-08-18 (Frontend UI Reset Sprint)

### Added

- Full UI refactor of task module: single state root (`useTasks` + `App.jsx`), presentational components only.
- PWA enhancements (manifest, service worker registration validated for install/offline).
- Local-first persistence with `storage.js` and profile ensure.
- Undo pattern (clear completed + Snackbar with timeout & metrics).
- Dark mode via `prefers-color-scheme` tokens, high-contrast & reduced-motion considerations.
- Accessibility: roles, aria-pressed, keyboard traversal, focus-visible styling, ellipsis with `title` tooltip.
- Metrics instrumentation: task create/complete/star/edit/filter/clear/undo counters + firstTaskAt mark.
- Performance markers (`perfMarkers.js`) and memoization of rows / list.
- Skeleton loading + error & empty states via `DataState` component.
- Quick filter segmented control extraction.
- Overflow test coverage (`App.overflow.test.jsx`).
- Keyboard navigation tests (`App.keyboard.test.jsx`).
- A11y axe tests (`App.a11y.test.jsx`).
- Bundle size baseline hashing script (`size-snapshot.js`) & npm scripts `test:ci`, `size:snapshot`.

### Changed

- Version bump frontend package to 1.1.0.
- Developer guide expanded with new architecture, testing & metrics sections.

### Fixed

- Consistent truncation & sanitize for long titles (max 200 chars).
- Stable Undo after rapid filter switching.
- Focus outlines standardized across themes.

### Removed / Deferred

- Full backend sync for tasks (kept local-first; future remote extension pending).
- Source-map-explorer JSON snapshot (deferred due to interactive install on Windows CI; replaced by hash script).

### Quality Gates Snapshot (End of Sprint)

- Build: CRA production build completes (PWA assets + Android embedded bundle). _Note:_ web `static/js` output minimal in current branch—investigation required if re-enabling full asset emission is desired.
- Tests (unit/RTL): Behavior, overflow, keyboard, a11y all green locally (CI script provided).
- Lint/Typecheck: Root TypeScript build unaffected; frontend uses JS (no TS errors). ESLint default CRA baseline.
- Accessibility: axe tests pass pre & post task creation.
- Performance: Baseline bundle (Android embedded) MD5 `14e2c437aa4ecd42e4da8725c52744a2` (≈160 KB core JS observed earlier in snapshot). Future diffs can compare MD5 & total bytes via `size:snapshot`.

### Known Issues / Follow-ups

- Web build output currently missing standard `static/js` artifacts in `frontend/build` (only icons/manifest/service-worker). The Android embedding still includes JS bundle; root cause may relate to custom build or deployment optimization. Action: restore or document intentional minimal output.
- Add telemetry endpoint for metrics aggregation.
- Consider virtualization for large task lists (>500 rows).
- Potential theme toggle UI (manual light/dark override).

## [1.0.0] - 2024-12-01

Initial documented architecture (services: FirebaseService, SecurityService, PerformanceMonitor, RealTimeSyncService), TypeScript contracts, real-time patterns, and baseline development practices.

---

Changelog format inspired by Keep a Changelog; semantic versioning applied where feasible.
