# Build Diagnostics (Frontend UI Reset)

Date: 2025-08-18
Branch: feat/ui-reset-nuke

## Observed Issue

Running `npm run build` inside `frontend/` produces a build directory containing only:

```
build/
  icons/
  manifest.json
  service-worker.js
```

Missing expected CRA artifacts:

```
build/index.html
build/static/js/*.js
build/static/css/*.css
```

(Note: `public/index.html` exists but is not copied; JS bundles not emitted.)

## Hypotheses

1. Custom `config-overrides.js` interfering? (Currently only modifies optimization & devtool—should NOT remove HtmlWebpackPlugin or MiniCssExtractPlugin.)
2. Environment variables causing CRA to skip HTML emission (e.g., `INLINE_RUNTIME_CHUNK=false` does not do this; unlikely).
3. External cleanup script (none found under `frontend/scripts`).
4. A prior manual removal or partial copy step in CI copying only PWA assets.
5. Build aborted silently before emit (but exit code 0) → plugin chain misconfigured / html plugin removed by some other config patch not in repo.

## Quick Verification Steps

- Run plain CRA without overrides: temporarily rename `config-overrides.js` and rebuild.
- Inspect webpack config by dumping `JSON.stringify(config, null, 2)` inside override to ensure `plugins` includes `HtmlWebpackPlugin`.
- Confirm no `.env` file sets `SKIP_PREFLIGHT_CHECK` or unusual overrides.

## Recommended Remediation

1. Add debug log in `config-overrides.js` to list plugin names.
2. If HtmlWebpackPlugin missing, re-add manually:

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
config.plugins.push(
  new HtmlWebpackPlugin({ inject: true, template: paths.appHtml })
);
```

(Need access to CRA `paths` util—may require `react-app-rewired` context.) 3. If plugins present, check if output path redirected or `fs` writes intercepted (unlikely here). 4. After recovery, run `npm run size:snapshot` to produce real metrics JSON (instead of status=missing).

## Added Guard

`size-snapshot.js` now writes `size-snapshot.json` with `{ source: "missing" }` when no JS files found, preventing silent failure.

## Next Actions (Suggested)

- Implement plugin debug (optional PR) and rebuild.
- Capture snapshot again.
- Close diagnostic once bundle appears.

---

Prepared automatically as part of build diagnostics task.

## Update 2025-08-18 (Instrumentation Attempt)

Added fallback `HtmlWebpackPlugin` injection + plugin name logging in `config-overrides.js`.
Result: Build output unchanged (still only icons/manifest/service-worker). This suggests:

- Either webpack compilation stage that produces JS is being skipped entirely
- Or output path is being overridden elsewhere and then only PWA assets copied back
- Or a multi-package layout confusion (looking at the wrong build directory)

### Next Deep-Dive Plan (Not Yet Executed)

1. Dump full `config` to `webpack-config-dump.json` inside override for inspection.
2. Force error if `entry` or `output.filename` missing.
3. Inspect `stats` object via custom plugin `compiler.hooks.done.tap('DumpStats', ...)`.
4. Search for any "build" or copy scripts outside `frontend` that could replace the folder after finalize.

If further action desired, execute the deep-dive plan and re-run build.

## Update 2025-08-18 (No-Op Override Test)

Replaced `config-overrides.js` with pass-through. Result unchanged (no JS/CSS emitted). This implies root cause is not in previous override customization.

### New Hypotheses

- `react-scripts` patched / partially removed (corrupted install).
- Custom CRA eject remnants or deletion of emitted assets by an external process (post build hook outside repo context).
- Build actually writing to a different directory due to environment variable `BUILD_PATH` (none found) or working directory confusion— but output PWA files still appear in expected place.

### Next Remediation Options

1. Fresh dependency reinstall: delete `frontend/node_modules` + lockfile, reinstall.
2. Create minimal reproduction: new CRA app in sibling folder and compare build output.
3. Direct webpack invocation (dump config) using `npx react-scripts build --verbose` (if available) and capture logs.
4. Search global repo for `fs.unlink` or `rimraf` patterns that target `build/static`.

Decision needed: proceed with reinstall & diff or pivot to Android-only packaging using existing android embedded bundle.

## Update 2025-08-18 (Clean Reinstall SUCCESS)

Actions Performed:

- Deleted `frontend/node_modules`, `package-lock.json`, and prior `build/`.
- Ran fresh `npm install` (all previously missing dev dependencies restored).
- Executed `npm run build`.

Outcome:

```
build/
  index.html (present, 1.06 KB)
  asset-manifest.json
  manifest.json
  service-worker.js
  static/
    js/main.bd59ee2f.js (50.76 kB gzip)
    js/main.bd59ee2f.js.map
    css/main.d157794e.css (3.28 kB gzip)
    css/main.d157794e.css.map
  icons/...
```

Root Cause Assessment:

- Likely corrupted prior install (missing several dev deps; HtmlWebpackPlugin or related parts effectively inert) leading to partial emission limited to previously copied PWA assets.
- Reinstall restored full CRA build pipeline.

Next Steps:

1. Commit (if needed) any lockfile changes produced by reinstall.
2. Run `npm run size:snapshot` to generate accurate bundle metrics JSON now that assets exist.
3. Proceed with Android `npx cap copy` / `sync` to embed updated web assets.
4. (Optional) Add a CI safeguard step: verify presence of `build/index.html` and at least one `build/static/js/*.js` after build; fail if absent.

Safeguard Proposal (pseudo):

```bash
node -e "const fs=require('fs');if(!fs.existsSync('build/index.html')||!fs.existsSync('build/static/js')){console.error('ERROR: Build incomplete');process.exit(1)}"
```

Status: ISSUE RESOLVED.

## Update 2025-08-18 (Post-Recovery Safeguards)

Implemented automated safeguards and metrics capture:

- Added `scripts/verify-build.js` to assert presence of `index.html`, `static/js` directory, and at least one JS bundle of reasonable size (>10KB).
- Added npm script `verify:build` to run the verification.
- Ran `npm run size:snapshot` producing real snapshot:

```
size-snapshot.json
{
  "generatedAt": "2025-08-18T19:02:04.515Z",
  "source": "web-build",
  "files": [ { "file": "main.bd59ee2f.js", "bytes": 160602 } ],
  "totalBytes": 160602
}
```

Recommendation for CI (add after build step):

```jsonc
// package.json (frontend) excerpt
"scripts": {
  "build": "react-scripts build",
  "verify:build": "node scripts/verify-build.js"
}
```

CI YAML snippet (example):

```yaml
- name: Build frontend
  run: npm run build --workspace=frontend
- name: Verify build artifacts
  run: npm run verify:build --workspace=frontend
- name: Size snapshot (optional)
  run: npm run size:snapshot --workspace=frontend
```

Safeguards ACTIVE. No further anomalies detected.

## Update 2025-08-18 (Release Automation & Mobile Sync)

Added end-to-end release helper to streamline web + mobile pipeline:

Steps encapsulated by `npm run release:mobile` (frontend):

1. `npm run build`
2. `npm run verify:build`
3. `npm run size:snapshot`
4. `npm run bundle:budget` (fails if main > default 225KB unless overridden by `BUNDLE_MAX_KB`)
5. `npx cap copy` (copies fresh assets into Android native layer)

Post-run manual options:

- `npx cap open android` (inspect / run in Android Studio)
- `cd frontend/android && gradlew assembleDebug` (verified successful build)

Rationale:

- Ensures no stale assets shipped to mobile
- Early failure surface for missing build artifacts or bloat
- Single command for predictable reproducible mobile packaging

Next potential enhancements:

- Add `--platform=android|ios|all` flag support in script
- Integrate Playwright smoke test before capacitor copy
- Archive `size-snapshot.json` and APK as CI artifacts

Status: Release pipeline operational.
