# Frontend Persistence & Key Management

This document defines conventions for **all client-side persistence** (localStorage, sessionStorage, in–memory fallbacks) inside the frontend.

## 1. Core Principles

- **Single abstraction:** All persistence goes through `src/storage/kvStore.js` – no direct `localStorage.getItem/setItem` in feature code.
- **Namespacing:** All keys are prefixed with `tf__` to reduce collision risk and make debugging clearer in DevTools.
- **Versioning:** A schema version key (`tf__kv_version`) allows future migrations. Increment deliberately when performing a structural migration.
- **Explicit serialization:** Use `kv.getJSON / kv.setJSON` for objects; avoid ad‑hoc `JSON.parse` / `JSON.stringify` in feature code.
- **Graceful failure:** Storage calls are wrapped in `try/catch` to survive private mode / quota / security errors.
- **Progressive migration:** Legacy keys can be moved forward with `migrateLegacyKey(oldKey, newKey, transform?)`.

## 2. API Overview (kvStore)

```
kv.get(key: string): string | null
kv.set(key: string, value: string | null): void
kv.getJSON<T>(key: string, fallback?: T): T | null
kv.setJSON<T>(key: string, value: T | null): void
kv.list(prefix?: string): string[]
kv.migrateLegacyKey(oldKey, newKey, transform?)
kv.ensureVersion(currentVersion: number)
```

## 3. Current Reserved Keys

| Logical Domain | Key (after prefix) | Full Key                 | Description                            |
| -------------- | ------------------ | ------------------------ | -------------------------------------- |
| Core           | kv_version         | `tf__kv_version`         | Schema version marker                  |
| Auth           | auth_user          | `tf__auth_user`          | Authenticated user object              |
| Auth           | auth_token         | `tf__auth_token`         | Active auth token / session identifier |
| Auth           | auth_refresh_token | `tf__auth_refresh_token` | Refresh token (if applicable)          |
| Settings       | setting_ui_theme   | `tf__setting_ui_theme`   | User-selected theme                    |
| Settings       | setting_sort_mode  | `tf__setting_sort_mode`  | Task list sort preference              |
| Settings       | setting_lang       | `tf__setting_lang`       | UI language/locale code                |

(Add new keys to this table in PRs touching persistence.)

## 4. Adding a New Persistent Value

1. Define an internal constant for the suffix, e.g. `const K_FOO = 'setting_foo';`
2. Use `const KEY = prefix(K_FOO)` or directly `tf__setting_foo` if consistent with pattern.
3. Decide if value is primitive or object.
4. Read with `kv.get` / `kv.getJSON` inside a `useEffect` or lazy initializer.
5. Expose via React context / hook rather than exporting the raw key.
6. Document in the table above.

## 5. Migrating Legacy Keys

```
import { kv, migrateLegacyKey } from '../storage/kvStore';

migrateLegacyKey('old_raw_key', 'tf__new_namespaced_key', (raw) => transform(raw));
```

- Only call once during provider initialization.
- Provide a transform if type or shape changes.
- Remove old migration code after 1-2 stable releases once confident user base is updated.

## 6. Error Handling & Fallbacks

- All low-level storage access is wrapped; failures return `null` / fallback without throwing.
- Feature code should assume a value may be `null` (e.g. first-run, cleared storage, private mode).
- Avoid blocking rendering while waiting for storage; initialize synchronously when possible.

## 7. Security Considerations

- Never store raw secrets or long‑lived credentials; prefer opaque, revocable tokens.
- Avoid duplicating auth material in multiple keys.
- Sanitize any HTML that originated from or was influenced by stored data before rendering (`sanitizeHtml`).

## 8. Testing Guidelines

- Unit test logic that derives defaults independent of storage.
- For integration tests, mock `kv` methods instead of poking `localStorage` directly.
- Provide a helper to clear relevant keys when resetting test state.

## 9. Future Enhancements (Backlog)

- Pluggable persistence backends (e.g. IndexedDB for large blobs).
- Encryption-at-rest for sensitive subsets (if threat model expands).
- Quota monitoring & telemetry events on write failures.

## 10. Anti-Patterns To Avoid

- Direct `localStorage.*` in components/contexts.
- Storing large (>100KB) JSON blobs without compression or splitting.
- Writing repeatedly inside render cycles (ensure writes are in events/effects).
- Silent shape changes without migration or version bump.

---

Maintainers: Update this file whenever persistence schema changes. Consistency here reduces regressions and simplifies audits.
