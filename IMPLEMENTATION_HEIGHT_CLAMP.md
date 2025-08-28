# Task Row Deterministic Height & Line Clamp Implementation

## Goals

- Predictable row height with or without subtitle.
- Enforced typography: Title 16/22, Subtitle 14/20.
- No accidental 3 visible lines via cascade.
- Accessible (min 56px tap area), stable layout (no post-render jumps).

## Approach

1. Added CSS custom properties in `:root`:
   - `--gt-title-fs:16px`, `--gt-title-lh:22px`, `--gt-sub-fs:14px`, `--gt-sub-lh:20px`, gap + padding tokens.
2. Single canonical block for `.gt-row` now sets logical line counts:
   - Default (no-sub): `--title-lines:2`, `--sub-lines:0`.
   - `.has-sub`: `--title-lines:1`, `--sub-lines:1`.
   - `.no-sub`: redundant explicit clarity for future overrides.
3. Deterministic min-height calculation variable `--_calc-min-h` composed from line heights + padding + conditional gap.
4. Clamp strategy:
   - Title & subtitle use `display:-webkit-box` + `line-clamp` + `-webkit-line-clamp` bound to the dynamic vars.
   - Subtitle hidden (`display:none`) in `.no-sub` to avoid stray empty space.
5. Internal vertical gap applied only when `.has-sub` (via margin-bottom on title) so row math stays simple.
6. Text button (`.gt-textButton`) owns vertical padding (`--gt-pad-b`) so the outer row padding remains horizontal only.
7. SafeSubtext remains inert; still rendered as `<span>` with id for `aria-describedby`.

## JS Changes (TaskRow.jsx)

- `hasSub` logic tightened: trims and checks length.
- Row classes now include either `has-sub` or `no-sub` (mutually exclusive) plus `is-completed` when applicable.
- `aria-describedby` only when a subtitle exists.

## Tests

- `task-typography-height.spec.ts` validates line clamp counts and min-height stability.
- Existing hit-area test ensures interaction model unaffected.

## CI Guards

- `check-gt-duplication.sh` ensures selector proliferation for `.gt-row|.gt-title|.gt-subtitle` stays under threshold.
- Existing deprecated-class gate prevents reintroduction of legacy wrappers.

## Edge Cases & Notes

- If OS / user agent forces larger default fonts, row may exceed calculated min-height; that's acceptable (min not max).
- Future accessibility enhancement could shift line-height tokens to `em` units; current px approach chosen for pixel parity.
- Subtitle emphasis tags are inert reset to prevent visual dominance.

## Next Enhancements (Optional)

- RTL specific visual test for height parity.
- Visual regression snapshots for 1-line vs 2-line vs 1+1 scenarios.
- Lower duplication threshold once legacy comments are purged.
