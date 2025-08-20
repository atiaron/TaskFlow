# טבלת טוקנים מורחבת (טיוטה 2025)

קטגוריות עיקריות: Color, Surface, Elevation, Spacing, Typography, Motion, Layout, Component Specific, Feedback, State, Gestures.

## 1. Color (ממופים ל-existing או דורשים הרחבה)

| Token                   | Purpose           | Notes                 |
| ----------------------- | ----------------- | --------------------- |
| --color-primary         | Action primary    | קיים                  |
| --color-primary-variant | Hover / tonal     | חדש (mix 90%)         |
| --color-accent          | Secondary accent  | קיים כ-accent         |
| --color-danger          | Errors            | map to --v-danger-fg  |
| --color-warning         | Warnings          | map to --v-warning-fg |
| --color-success         | Success           | map to --v-success-fg |
| --color-info            | Informational     | map to --v-info-fg    |
| --color-bg-alt          | Alternate surface | חדש                   |
| --color-overlay         | Overlays semi     | rgba(32,33,36,.42)    |

## 2. Surface / Containers

| Token             | Usage                           |
| ----------------- | ------------------------------- |
| --surface-level-1 | Base card                       |
| --surface-level-2 | Raised card                     |
| --surface-tonal   | Subtle emphasis (tonal variant) |
| --surface-muted   | Muted backgrounds (lists)       |
| --surface-danger  | Destructive container           |
| --surface-warning | Warning background              |

## 3. Elevation / Shadows

(Existing: --gt-shadow-level-1..3, --gt-shadow-floating) + הרחבות
| Token | Purpose |
|-------|---------|
| --elev-card | alias level-1 |
| --elev-popover | level-2 |
| --elev-dialog | level-3 |
| --elev-floating | floating |
| --elev-focus-ring | focus shadow expansion |

## 4. Spacing (4pt Grid)

| Token     | Scale |
| --------- | ----- |
| --space-0 | 0px   |
| --space-1 | 4px   |
| --space-2 | 8px   |
| --space-3 | 12px  |
| --space-4 | 16px  |
| --space-5 | 20px  |
| --space-6 | 24px  |
| --space-7 | 28px  |
| --space-8 | 32px  |
| --space-9 | 40px  |

## 5. Typography

| Token           | Purpose             |
| --------------- | ------------------- |
| --font-title-lg | Headline local card |
| --font-title-md | Section heading     |
| --font-body-md  | Primary body        |
| --font-body-sm  | Secondary body      |
| --font-code-sm  | Inline code         |
| --font-mono     | Monospace base      |

## 6. Motion / Transitions

| Token                     | Purpose                          |
| ------------------------- | -------------------------------- |
| --motion-duration-fast    | 120ms                            |
| --motion-duration-normal  | 200ms                            |
| --motion-duration-slow    | 340ms                            |
| --motion-curve-standard   | cubic-bezier(.4,0,.2,1)          |
| --motion-curve-emphasized | cubic-bezier(.3,0,0,1)           |
| --motion-curve-bounce     | cubic-bezier(.68,-0.55,.27,1.55) |
| --motion-spring-stiffness | 300 (JS hint)                    |
| --motion-spring-damping   | 30 (JS hint)                     |

## 7. Layout / Radius

| Token         | Purpose |
| ------------- | ------- |
| --radius-xs   | 4px     |
| --radius-sm   | 6px     |
| --radius-md   | 10px    |
| --radius-lg   | 16px    |
| --radius-xl   | 24px    |
| --radius-pill | 999px   |

## 8. Component Specific (Samples)

| Token                   | Component                |
| ----------------------- | ------------------------ |
| --dt-\*                 | DateTimePicker           |
| --task-row-\*           | TaskRowModern            |
| --tabs-indicator-height | Tabs indicator thickness |
| --sheet-snap-top        | BottomSheet snap top px  |
| --sheet-snap-mid        | BottomSheet mid px       |
| --fab-size              | FAB dimension            |
| --fab-radius            | FAB radius               |
| --fab-elev              | FAB elevation            |

## 9. Feedback / States

| Token                    | Purpose                  |
| ------------------------ | ------------------------ |
| --state-hover-bg         | Generic hover layer      |
| --state-pressed-bg       | Pressed feedback         |
| --state-focus-ring       | Focus outline color      |
| --state-disabled-opacity | Disabled element opacity |
| --state-loading-opacity  | Loading placeholder      |

## 10. Gestures / Swipe (RTL aware)

| Token                     | Purpose                      |
| ------------------------- | ---------------------------- |
| --swipe-distance-min      | threshold base               |
| --swipe-distance-delete   | destructive trigger          |
| --swipe-backdrop-complete | background gradient complete |
| --swipe-backdrop-star     | background gradient star     |
| --swipe-backdrop-delete   | background gradient delete   |

## 11. Badges / Chips

| Token              | Purpose            |
| ------------------ | ------------------ |
| --badge-radius     | radius             |
| --badge-font-size  | size               |
| --badge-gap        | gap between badges |
| --badge-pad-inline | padding-x          |
| --badge-pad-block  | padding-y          |
| --chip-radius      | chip radius        |
| --chip-gap         | gap in cluster     |

## 12. Meta / Expandable Content

| Token                  | Purpose        |
| ---------------------- | -------------- |
| --meta-lines-collapsed | base clamp     |
| --meta-lines-expanded  | expanded clamp |
| --meta-anim-dur        | animation time |
| --meta-anim-ease       | easing         |

## 13. Accessibility / Focus

| Token                  | Purpose             |
| ---------------------- | ------------------- |
| --focus-ring-color     | primary ring        |
| --focus-ring-width     | width               |
| --focus-ring-offset    | offset              |
| --focus-outline-danger | error element focus |

## 14. Density

| Token                  | Purpose            |
| ---------------------- | ------------------ |
| --density-scale        | scale factor       |
| --density-row-height   | row height dynamic |
| --density-control-size | icon/control size  |

## 15. Dark Mode Overrides (names reserved)

| Token                   | Purpose          |
| ----------------------- | ---------------- |
| --color-bg-dark         | base dark bg     |
| --color-surface-dark    | elevated surface |
| --color-text-dark       | primary text     |
| --color-text-muted-dark | secondary text   |
| --state-hover-bg-dark   | hover layer      |

## 16. Reserved Future

| Token                  | Purpose                   |
| ---------------------- | ------------------------- |
| --ai-hint-bg           | AI suggestions background |
| --ai-hint-ring         | AI highlight focus        |
| --predictive-slot-bg   | predictive placeholder    |
| --predictive-slot-anim | animation timing          |

---

המסמך מהווה בסיס – אינטגרציה בפועל: הוספה הדרגתית ל-`theme.css` לפי צורך, מניעת ניפוח לא נחוץ.
