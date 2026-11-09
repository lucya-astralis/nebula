# Nebula changelog

Nebula is **copied** into every app, not linked. So a copy can only be moved
forward by someone who knows what changed. This file is that record. The
version is in the first line of `nebula.css` and in `--nebula-version`.

```bash
python tools/nebula_lint.py --version path/to/app/static/nebula.css
```

That says which version a copy is and how far it is behind this one.

Versions follow semver for a stylesheet:

| Bump | When |
|---|---|
| **major** | an app has to react: a token removed or re-meant, a component that looks or measures differently, a cascade rule that changes who wins |
| **minor** | something new to opt into: a token, a component, a utility |
| **patch** | a fix that makes a component do what it already promised |

---

## 2.1.0 — 2026-11-09

New components for the screens around the content. Nothing an app already
uses changes, so a 2.0 copy can be replaced as it is.

### Added

- **`.empty`**: an empty state, saying what would be here, why it is not,
  and the one thing to do about it. `.empty--sm` is the same without the
  frame, for an empty table or list.
- **`.skel`** (`--text`, `--title`, `--block`, `--avatar`): a loading
  skeleton in the shape of what is coming. The container carries
  `aria-busy="true"` and the blocks `aria-hidden`. The sweep is the new set
  piece `--skel-sweep` (1.6s) and stops for reduced motion and under Lite.
- **`.tip-host` + `.tip`**: a tooltip as a real element, `role="tooltip"` and
  referenced by `aria-describedby`. It shows on hover after `--dur-3` and on
  keyboard focus at once. `.tip--below` flips it.
- **`.crumbs`**: breadcrumbs. The current step is `aria-current="page"` in
  `--text`, and each step truncates on its own.
- **`.pager`**: pagination. The current page is the solid `--acc-deep` face,
  and `.pager__range` gives the range in the number voice. The range takes
  its own line below 620px.
- **`.drop`**: a file drop zone, a `<label>` round a real file input, with
  `.is-over` as the dragging state and `.drop__list` for the chosen files.
  This is the sheet's one dashed border, and the exception is written next
  to it.
- **`.tbl th[aria-sort]` + `.tbl__sort`**: sortable table heads, painted from
  `aria-sort`.
- **Token:** `--skel-sweep`.
- **Forced colours:** the new parts have system borders, and the current
  page, the dragging state and the sorted column take `Highlight`.

### Changed

- `nebula_lint.py` no longer counts a zero duration (`0s`, `0ms`) as an
  off-scale value. Zero is not a size.

---

## 2.0.0 — 2026-11-09

The look moved from a console toward a desktop application. The cascade got
an order, the platform took over what scripts used to do, the page got
depth, and colour beyond the accent arrived, with a hard border around it.
**Read *Breaking* before replacing a 1.x copy.** Most items are one search
and a look in the browser.

### Breaking

Each item says what you will see after dropping 2.0 into a 1.x app, and what
to do about it.

**1. The cascade has layers, and your app now always wins.**
Nebula is in `@layer nebula.tokens, nebula.base, nebula.components,
nebula.gates, nebula.utilities`. An app sheet left unlayered beats every
Nebula rule, whatever its specificity.

- *You will see:* an app rule that used to lose to a more specific Nebula rule
  now wins. Generic rules are the usual suspects: `a { … }`, `button { … }`,
  `input { … }`, `.wrap p { … }`, a reset.
- *Do:* look for generic element rules in the app sheet and scope them, for
  example `.app-content a`, or delete what Nebula already does. To put some
  app rules deliberately *under* Nebula, declare `@layer app, nebula;` before
  both sheets and write those rules in `@layer app { … }`.
- *Also:* `[hidden] { display:none !important }` is now a layered `!important`,
  so it beats an app's unlayered `!important`. That is what `hidden` means.

**2. The chrome speaks the interface voice, not mono caps.**
Labels, buttons, tabs, menu rows, meta lines and badges are Space Grotesk 500
in sentence case. They are no longer JetBrains Mono, uppercase and tracked.
Four tokens carry the voice: `--ui-font`, `--ui-case`, `--ui-weight` and
`--num-font`. The chrome scale changed with it:

| Token | 1.x | 2.0 |
|---|---|---|
| `--fs-chrome-xs` | `9.5px` | `11.5px` |
| `--fs-chrome-sm` | `10.5px` | `12.5px` |
| `--fs-chrome-md` | `12px` | `13px` |
| `--fs-chrome-xl` | `20px` | `22px` |
| `--tr-chrome-xs` | `.24em` | `.02em` |
| `--tr-chrome-sm` | `.18em` | `.01em` |
| `--tr-chrome-md` | `.14em` | `.005em` |
| `--tr-chrome-lg` | `.10em` | `0em` |
| `--tr-chrome-xl` | `.04em` | `-.01em` |
| `--tr-num` | `.06em` | `.01em` |

- *You will see:* Nebula's own components change voice. **App rules that
  wrote the old voice by hand** (`font-family:var(--mono)` together with
  `text-transform:uppercase`) are now the only console caps on the screen.
  Anything sized with `--fs-chrome-*` is about 2px larger, so look at fixed
  widths: badges, narrow table columns, a bar that was exactly full.
- *Do:* in every app rule that has `text-transform:uppercase` (except a
  display-face wordmark), change `var(--mono)` to `var(--ui-font)` and
  `uppercase` to `var(--ui-case)`, and add `font-weight:var(--ui-weight)`.
  Measured values take `font-family:var(--num-font);
  font-variant-numeric:tabular-nums`. Mono stays for real code: tokens, hex,
  key hints, paths.
- *To keep the old voice for a while,* redefine the tokens on `:root`:
  ```css
  :root{
    --ui-font:var(--mono); --ui-case:uppercase; --ui-weight:400; --num-font:var(--mono);
    --fs-chrome-xs:9.5px; --fs-chrome-sm:10.5px; --fs-chrome-md:12px; --fs-chrome-xl:20px;
    --tr-chrome-xs:.24em; --tr-chrome-sm:.18em; --tr-chrome-md:.14em;
    --tr-chrome-lg:.10em; --tr-chrome-xl:.04em; --tr-num:.06em;
  }
  ```

**3. Buttons.**
`.btn` labels are `--text` (they were `--text-dim`), with a hairline in
`--line-strong` and one row height: `min-height:34px` (`.btn--sm`: 32px).
**`.btn--primary` is a solid `--acc-deep` face with white text**; it was an
accent tint with an accent border. `.btn--ghost` is `--text-dim` (it was
`--text-ghost`).

- *You will see:* the committing button stands out; rows built to a fixed
  height may grow.
- *Do:* check that each row still has **one** `.btn--primary`. Two solid
  buttons side by side shout.

**4. `.set`, `.kv` and `.hud` answer to their pane, not the window.**
`.stack` and `.panel` are query containers (`container: pane / inline-size`),
and so is `.hud` (`hud`). The narrow steps moved out of the 760px media
query:

| Component | Narrow step |
|---|---|
| `.set` (controls drop to their own line) | pane ≤ 560px |
| `.kv` (stacks) | pane ≤ 420px |
| `.hud` (tighter corners and bars) | hud ≤ 560px |

- *You will see:* a settings stack in a side column now reflows on a wide
  screen, as it always should have. **A `.set` outside a `.stack`, or a
  `.kv` outside a `.panel`, no longer stacks on a phone.**
- *Do:* wrap those in the pane they belong to. A container must not be
  sized by its content, so a `.stack` or `.panel` in an `auto` grid track,
  an inline-block or a shrink-to-fit flex item needs a width, or it
  collapses to nothing.

**5. Tints are relative colour; the browser floor rose.**
Every tint, ring and glow is `oklch(from var(--acc) l c h / a)` instead of
`rgba(var(--acc-rgb), a)`, and the same goes for the chrome, label and
status colours. Setting `--acc` alone now retints everything. The `-rgb`
triplets are still defined, but Nebula no longer reads them.

- *You will see:* nothing, in a current browser. In a browser without
  relative colour syntax (before Chrome 119, Safari 18 or Firefox 128),
  tints, rings and glows disappear.
- *Do:* if the app themes the accent, setting `--acc` is now enough. Keep
  setting `--acc-rgb` only if your own sheet still reads it.

**6. Cross-document view transitions are on.**
Every page wearing the sheet opts into `@view-transition { navigation:auto }`
(only for `prefers-reduced-motion: no-preference`), and `.nav` carries
`view-transition-name: nebula-bar`.

- *You will see:* same-origin page changes crossfade, and the bar holds still.
- *Do:* nothing. To opt out, put `@view-transition { navigation:none }` in the
  app sheet. Only one element per page may carry `nebula-bar`.

**7. The accent left places that carry no state.**
`.eyebrow > i` and `.panel h2 > i` are `--mist` (they were `--acc`). The bar's
bottom hairline (`.nav::after`) is `--chrome` (it was the accent).

- *Do:* nothing, unless the app copied the old colour into its own rules. In
  that case, the same applies there.

**8. Elevation and the backdrop.**

| Token | 1.x | 2.0 |
|---|---|---|
| `--shadow-1` | `0 2px 10px rgba(0,0,0,.35)` | `0 2px 0 rgba(0,0,0,.35), 0 18px 40px -14px rgba(0,0,0,.80)` |
| `--shadow-2` | `0 18px 44px rgba(0,0,0,.55)` | `0 18px 44px rgba(0,0,0,.55), 0 4px 12px rgba(0,0,0,.35)` |

- `.stack` and `.card` carry `--shadow-0`. A hovered card rises `--lift`
  (3px) onto `--blur-3`. The door is `--shadow-1`. A dialog's backdrop is
  `--blur-2`. The bar casts `--shadow-bar` once scrolled.
- The backdrop: **`--wallpaper-grid` is removed**, and the grid with it. The
  ground has a neutral key light (`--wallpaper-light`) and a vignette
  (`--wallpaper-vignette`), and the picture moves with a slight parallax
  (`--depth-drift`, `--depth-range`). `.site-bg::before` is no longer used.
- *Do:* delete any `--wallpaper-grid` the app sets, since it does nothing
  now. To keep the 1.x ground, set `--wallpaper-light`,
  `--wallpaper-vignette` to `transparent` and `--depth-drift: 0`.

**9. Text wrapping.**
Headings and titles have `text-wrap: balance`; `p`, `li`, `dd`, `figcaption`
and `blockquote` have `text-wrap: pretty`. Line breaks change in places,
usually for the better.

**10. Smaller things that may show.**

- `@keyframes dlg-in` and `toast-in` are gone. Dialogs and toasts enter and
  leave through `@starting-style` transitions. An app that reused those names
  has to bring its own.
- The bar's scrolled state is driven by a scroll timeline. `.nav--scrolled`
  still works and is the fallback; only bind a scroll listener when
  `CSS.supports('animation-timeline: scroll()')` is false.
- The forced-colours gate now actually wins over components. In 1.x it sat
  above them and lost to `.btn--primary`. In Windows high contrast mode the
  active controls now really take `Highlight`.
- The rail paints `aria-current="location"` as well as `"page"`.

### Added

- **Tokens:** `--nebula-version`, `--ui-font`, `--ui-case`, `--ui-weight`,
  `--num-font`, `--shadow-0`, `--shadow-bar`, `--lift`, `--wallpaper-light`,
  `--wallpaper-vignette`, `--depth-drift`, `--depth-range`, and the kind
  palette `--hue-teal`, `--hue-sky`, `--hue-lime`, `--hue-rose`,
  `--hue-peach`, `--hue-sand`.
- **The kind palette, with a border.** `.hue-*` gives a colour to an
  **identity** (`.avatar`, `.mark`) or a **category** (`.tag`), and to nothing
  else. The selector is `:is(.avatar, .tag, .mark).hue-*`, so on a card it
  does nothing, and the linter flags it in markup.
- **`.menu[popover]` inside `.menu-host`**, opened by `popovertarget` and
  placed by anchor positioning with flip fallbacks. The old `[hidden]` menu
  still works.
- **`.fold`**: a native `<details>` that animates to `height: auto`
  (`::details-content` plus `interpolate-size`).
- **`.nav__progress`**: an opt-in reading line on the bar, driven by a scroll
  timeline.
- **`.u-reveal`**: a block that settles in as it enters, off for reduced
  motion, under Lite and without support.
- **`.section__head--numbered` + `[data-sections]`**: counter-drawn chapter
  numerals on the title's baseline.
- **`interpolate-size: allow-keywords`** on `:root`.
- **`tools/nebula_lint.py`**: rules 1, 2, 3 and 5, the CSP rule, the kind
  border in markup, and `--version` for copies.

### 1.x and earlier

These versions were not numbered, and a copy carries no version line. Every
copy made before 2026-11-09 is one, and `--version` reports it as
`unversioned (1.x)`. They had already drifted apart from each other before
2.0, so read a 1.x copy as "somewhere before 2.0", not as one known state.
