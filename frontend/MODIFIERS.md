## Title Modifiers (BEM‑Lite Contract)

Base element: `gt-title`

Design modifiers (static visual variants):

| Class                 | Purpose                                         | Tokens Consumed                                                       |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `gt-title--primary`   | Emphasized title (e.g. starred / key task)      | `--title-primary-color`, `--title-primary-weight`                     |
| `gt-title--secondary` | Default secondary weight (non‑starred baseline) | `--title-secondary-color`, `--title-secondary-weight`                 |
| `gt-title--muted`     | De‑emphasized / low priority                    | `--title-muted-color`, `--title-muted-weight`                         |
| `gt-title--danger`    | Destructive / warning context                   | `--title-danger-color`, `--title-danger-weight`                       |
| `gt-title--link`      | Interactive link style                          | `--title-link-color`, `--title-link-weight`, `--title-link-underline` |

Dynamic states are expressed with `is-*` on the row or element (e.g. `is-completed`, `is-on`). They must NOT replace design modifiers.

Precedence: state overrides modifiers (e.g. `.gt-row.is-completed .gt-title`).

Validation:

1. Stylelint enforces naming pattern (`gt-*` + optional `--modifier` OR `is-*`).
2. `scripts/verify-modifiers.js` fails CI if a modifier is used in code without a CSS rule OR without its base `gt-title` class.

Usage example:

```jsx
<span className="gt-title gt-title--primary">Important Task</span>
```

Do not use a modifier alone:

```jsx
// ❌ Wrong
<span className="gt-title--primary">Missing base</span>
```

Future extension: additional block/element modifiers will follow the same contract.
