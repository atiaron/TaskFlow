# Contributing Guide

## Canonical Task Text Structure

Use a single, canonical text container for any task row or task-like item:

```
<div class="gt-row">
  <div class="gt-text">
    <div class="gt-title">Title</div>
    <div class="gt-subtitle">Optional subtitle…</div>
  </div>
  <!-- star / check controls -->
</div>
```

### Class Naming (gt-\* namespace)

- `gt-text` : (container) wraps title + subtitle only.
- `gt-title` : primary task title (no margin-bottom; vertical rhythm controlled via adjacent selector).
- `gt-subtitle` : secondary line (clamped, subdued). A temporary alias `.gt-sub` remains for a short deprecation window.

### Deprecated (do not introduce)

| Old                             | Replace With   |
| ------------------------------- | -------------- |
| `.gt-title-wrap`                | `.gt-text`     |
| `.gt-lines`                     | `.gt-text`     |
| `.task-text-container`          | `.gt-text`     |
| `.gt-sub` (direct usage in JSX) | `.gt-subtitle` |

A temporary CSS alias exists for the deprecated wrappers for 1 release cycle. Remove them once all legacy code paths are migrated.

## Vertical Rhythm

Spacing between title and subtitle is driven exclusively by:

```
.gt-title + .gt-subtitle:not(:empty) { margin-top: var(--sub-gap-default); }
```

Density variants adjust this via wrapper classes: `density-compact`, `density-default`, `density-comfy`.

Do not apply custom margins directly on `.gt-title` or `.gt-subtitle`.

## Subtitle HTML Safety

All rich subtitle rendering must go through `SafeSubtext` which sanitizes and only outputs whitelisted tags. Do not use `dangerouslySetInnerHTML` elsewhere for subtitles.

## Completed State

Completed rows add `.is-completed` to `.gt-row`; styling (muted colors, line-through) is centralized in `base.css` under the unified block. Do not restyle completed states ad-hoc in components.

## Adding New UI Classes

1. Prefer extending tokens in `theme.css`.
2. Add a single consolidated rule block near existing canonical blocks instead of scattered overrides.
3. Avoid introducing a parallel container to `gt-text` unless a new semantic group (e.g., metadata cluster) is truly distinct.

## CI Gate (Recommended)

A simple script can fail the build if deprecated classes reappear:

```bash
# tools/check-deprecated-classes.sh
set -e
if git grep -nE 'gt-title-wrap|gt-lines|task-text-container' -- 'frontend/src'; then
  echo '❌ Deprecated task text container class detected. Use .gt-text.' >&2
  exit 1
fi
exit 0
```

Integrate this in your pipeline before build.

## Stylelint Pattern

Enforce canonical naming:

```json
{
  "rules": {
    "selector-class-pattern": [
      "^(gt-(row|text|title|subtitle|star|check)(--[a-z0-9-]+)?|google-tasks-wrapper)$",
      {
        "resolveNestedSelectors": true,
        "message": "Use canonical gt-* classes (gt-text, gt-title, gt-subtitle)."
      }
    ]
  }
}
```

## Pull Request Checklist

- [ ] No deprecated container classes used.
- [ ] Subtitle sanitized via `SafeSubtext` (if HTML).
- [ ] No duplicated `.gt-title` / `.gt-subtitle` rule blocks added.
- [ ] Design tokens updated instead of hard-coded values.

Thanks for contributing!
