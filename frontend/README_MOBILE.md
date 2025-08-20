# Mobile Release & Debug Guide (Android / Capacitor)

Version: 1.2.0

## Fast Path (Every Time You Ship to Device)

```bash
cd frontend
npm run release:mobile      # build → verify → snapshot → budget → cap copy
cd android
gradlew assembleDebug       # or: npx cap open android (GUI)
```

APK output: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
Install: `adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## One-Time or Occasional

| Action                        | Command                                 |
| ----------------------------- | --------------------------------------- |
| Open in Android Studio        | `npx cap open android`                  |
| Full plugin sync              | `npx cap sync`                          |
| Clean native build            | `cd android && gradlew clean`           |
| Build release APK             | `cd android && gradlew assembleRelease` |
| Build App Bundle (Play Store) | `cd android && gradlew bundleRelease`   |

## Release Script Details

`npm run release:mobile` executes:

1. `npm run build`
2. `npm run verify:build` (ensures index.html + JS bundles)
3. `npm run size:snapshot` (writes build/size-snapshot.json)
4. `npm run bundle:budget` (fails if main bundle > 225KB raw; override via `BUNDLE_MAX_KB`)
5. `npx cap copy` (copies fresh web assets into native)

## Common Scenarios

| Issue                  | Fix                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| App not updating       | Re-run `npm run release:mobile` then reinstall APK                       |
| Missing JS after build | Check `verify:build` output / reinstall deps                             |
| Bundle too large       | Dynamic imports / remove unused libs / raise `BUNDLE_MAX_KB` consciously |
| Offline not working    | Ensure build after SW change; uninstall + reinstall APK                  |

## Recommended Pre-Release Checklist

- [ ] All tasks CRUD works
- [ ] Star / complete / clear & Undo OK
- [ ] Filters (active/completed/starred) correct
- [ ] Dark mode appearance good
- [ ] Offline load (airplane mode) shows cached UI
- [ ] Snackbar + animations functioning
- [ ] Performance acceptable (first paint < 3s mid-range device)

## Versioning & Tagging

After bumping version in `frontend/package.json` + `CHANGELOG.md`:

```bash
git add frontend/package.json CHANGELOG.md
git commit -m "chore(release): v1.2.0"
git tag v1.2.0
```

Push with tags:

```bash
git push origin feat/ui-reset-nuke --tags
```

(Or merge branch first, then tag on main.)

## Adjusting Bundle Budget

```bash
BUNDLE_MAX_KB=200 npm run bundle:budget
```

Select a number that enforces discipline without blocking reasonable new features.

## Troubleshooting Quick Map

| Symptom                       | Step 1                          | Step 2                       | Step 3                    |
| ----------------------------- | ------------------------------- | ---------------------------- | ------------------------- |
| Blank screen                  | Chrome remote inspect           | Check console errors         | Rebuild + cap copy        |
| Old UI persists               | Clear app storage               | Reinstall APK                | `gradlew clean` + rebuild |
| Build fails                   | Delete node_modules & reinstall | Check Node version (>=18)    | Remove custom env vars    |
| Debug build OK, release crash | Enable logcat                   | Compare proguard/R8 settings | Test with minify disabled |

## Next Improvements (Optional)

- Add Playwright smoke step before `cap copy`
- Automate upload to internal testing track
- Integrate Crashlytics / Sentry for runtime errors

Enjoy shipping! 🚀
