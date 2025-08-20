# gt-textButton E2E Coverage

This directory contains `task-text-hit-area.spec.ts`, a focused regression test suite ensuring the canonical text hit area contract for task rows:

## Contract

- A single `button.gt-textButton` wraps both title (`.gt-title`) and subtitle (`.gt-subtitle/.gt-sub`).
- Pointer click anywhere inside the button (including the subtitle vertical region) opens task details.
- Keyboard activation via Enter or Space when the button is focused opens task details.
- Interactive sibling controls (`.gt-star`, `.gt-check`) must NOT open task details when clicked.
- The test suite tolerates missing optional selectors by skipping when required test fixtures are absent (defensive in mixed environments).

## Selectors Observed

- Task row container: `.gt-row`
- Text button: `button.gt-textButton`
- Primary actions not triggering details: `.gt-star`, `.gt-check`
- Details surface (any of): `[data-testid="task-details-sheet"], .task-details, [role="dialog"]`

## CI Notes

- This suite should be lightweight and fast; it relies only on creating minimal tasks via an assumed `[data-testid=create-task-input]` field.
- If the create input is absent (environment variant), tests soft-skip.

## Future Enhancements

- Add explicit assertion of `aria-describedby` linking for subtitle when present.
- Add RTL direction scenario verifying star/check ordering does not affect hit area.
- Inject fixture tasks via API route instead of UI typing for speed once backend test harness is stable.
