# NEBULA — how to build a lucya.systems app

**Read this before writing any CSS for a lucya.systems interface.**

Nebula is the design language every lucya.systems app wears: the
[gallery](../app/static/style.css), the
[configurator](../configurator/app/static/style.css), and whatever comes next.
It is named after the one colour it rations — `#5865F2`, "Nebula Blue".

The living version of this document is the showcase next to it: open
`nebula/index.html` (or `python -m http.server 8123 --directory nebula`) and
every rule below can be run, and broken on purpose, on a real page.

---

## The four rules

Everything in `nebula.css` is one of these. If a decision is not obviously one
of them, it is probably a decision that should not be made.

### 1. Black ground, grey furniture, ONE accent

`--acc` marks **state** and nothing else. Nothing in the ground ramp carries a
hue: `--bg` is `#000000`, every surface and the whole text ramp are neutral
greys. Colour appears once, on purpose.

| Token | What wears it |
|---|---|
| `--acc` `#5865F2` | Links, focus, active / selected / open, featured marks, progress fills, live counters, the one glyph in front of a section label |
| `--acc-deep` | The single face that carries **white** text |
| `--acc-soft` | The lifted step: hover faces under black text |
| `--chrome` `#e8e8ee` | Furniture that reacts: hovers, corner brackets, HUD strokes |
| `--label` `#b8b8c2` | Furniture that sits still: section labels, counts, badges, measured values |

**Before colouring anything purple, ask whether it carries state.** If it
doesn't, it is `--chrome` or `--label`. Painting both groups the accent colour
is exactly what made the page read violet end to end and got the previous
palette thrown out — *"das Lila ist zwar schön, aber es ist etwas viel"*. The
shade was never the problem; how **many** things wore it was.

Status colours (`--amb`, `--red`) are dulled on purpose: neon amber and red on
a black-and-grey page read as an alarm, not as information, and they fight the
accent. `--ok` `#58F298` is the one bright exception, picked off the same
swatch as the accent.

**The quarantine clause.** A module whose colours *mean* something an accent
cannot — upcoming vs. live vs. done, a weather condition, a diff — gets its own
named palette outside the accent system, and that palette is deliberately **not
derived from `--acc`**, so a per-app accent cannot repaint an instrument. The
gallery's trip timeline (`--trip*`) is the one that exists. Nothing outside such
a module may use its colours, and nothing inside it may use `--acc` /
`--chrome` / `--label`.

### 2. Square corners, always

`--radius: 0`. Only genuinely round things — a status dot, a circular button —
opt out with a `border-radius` of their own.

Square is **not** permission for flat coloured tiles, dense uppercase blocks or
slab-on-slab layout. This is not Metro. Depth still comes from rule 3.

Rounding the corners costs more than the corners: the **corner-bracket idiom
stops working**, because a bracket is a fragment of a right angle and there is
no right angle left to quote.

### 3. Depth comes from blur, not from darkness

Four tokens are the whole surface scale:

| Token | For |
|---|---|
| `--glass` / `--glass-hi` + `--glass-blur` | Panes over the page: bars, fields, buttons, menus, cards |
| `--scrim` / `--scrim-hi` + `--scrim-blur` | Chips laid **on** a picture, where the backdrop is whatever the image happens to be there |

A surface that is not reading gets **more blur or the `-hi` step, never a darker
fill**. A pass that raised every surface's opacity was rejected outright:
*"nicht zu dunkle Hintergründe"*. Opaque slabs are legible, but they throw the
backdrop away and turn a page into a stack of black rectangles.

The wallpaper under everything is **atmosphere, not content**: drained by
`--wallpaper-filter` (default `grayscale(.92) brightness(.72) contrast(1.04)`)
so the only saturated things on a screen are the content and the accent. Not
fully grey — a trace of hue keeps it from looking like a broken image. The one
coloured thing over it is `--wallpaper-bloom`, and it belongs to the *tint*: if
an app lets the tint be turned off, that must set the bloom transparent too, or
a backdrop asked for in full colour still has an accent wash sitting on it.
`--wallpaper-shade-top` / `--wallpaper-shade-bot` are the dim over the picture,
as a pair, because the two ends are a real decision.

**The one documented exception: the house artwork.** The default figure above
is for a **photograph**, which introduces a foreign hue that every blurred pane
above it picks up — that cast is what the whole palette pass was about. `nova`
(`designs/nova/`) has no foreign hue to introduce: it is brand art drawn in the
accent's own colour, so draining it removes the one thing it was made to say.
An app that wears nova serves it with the tint **off**, and changes exactly four
token values — none of the rules:

```css
:root{
  --wallpaper-filter: brightness(.95) contrast(1.04);  /* no grayscale; nova
        arrives dark by construction (its gradient falls to #07070d), so the
        photograph's .72 crushed it */
  --wallpaper-shade-top: rgba(0,0,0,0.62);
  --wallpaper-shade-bot: rgba(0,0,0,0.62);   /* FLAT, not .62 -> .82: that ramp
        darkens a photograph towards the footer of a scrolling page, and nova
        already falls off downward on its own — the ramp landed on the artwork's
        own falloff and the bottom half went black */
}
```

The configurator and the showcase both do exactly this. It is a *supported
setting* (`wallpaper_tint = off`), not a departure — and it is what overriding
the language correctly looks like: token values, each with the reason written
next to it, and not one rule touched.

### 4. The mono voice is the chrome; the sans voice is the content

- **JetBrains Mono, uppercase, .16–.24em tracking** — the furniture *around*
  the content: section labels, counts, badges, dates, corner indices, filters,
  sort controls, meta lines, and every measured value (EXIF rows, sizes,
  dimensions). If it is a fact the software knows about itself, it is in this
  voice.
- **Space Grotesk, sentence case** — everything a person *reads*: page titles,
  descriptions, panel bodies, leads, help text, empty states, error copy.
- **The display face (Ethnocentric)** — the wordmark, one big word on a landing
  screen, a 404 numeral. **Never a heading.** It is swappable per deployment,
  which is why every rule that sets display type wraps its size in a `calc()`
  against `--display-scale`: faces disagree wildly about how much of the em
  they ink.

Stripping the first group to sentence sans made a grid *look unfinished*: the
labels stopped separating the furniture from the content and dissolved into it.

**Never `text-transform` data.** Uppercase is for fixed UI words only, never for
a name, path, filename, identifier or a user's own search query —
`Pride_MUC_26` is not `PRIDE_MUC_26`. Casing data is restyling data.

---

## Building a new app

### Step 1 — take the sheet, don't reinvent it

Copy `nebula/nebula.css` and `nebula/assets/fonts/` into the new app's static
directory and link the sheet **first**. It carries the tokens, the base, and
every component in the showcase. The app's own stylesheet loads after it and
adds only what is genuinely new.

```
app/static/
  nebula.css      ← the language: tokens + base + components (copy verbatim)
  app.css         ← this app's own layout and its own components only
  fa-icons.css    ← generated glyph subset, if you use icons
  fonts/          ← static per-weight woff2 instances, never a variable font
```

Do **not** fork the token block. If a value is wrong for every app, it is wrong
in the language and gets fixed there.

### Step 2 — the decision procedure

For every element, in order:

1. **Does it carry state?** Current, selected, open, active, focused, live,
   featured, in progress → `--acc`. Otherwise continue.
2. **Is it interactive furniture?** A hover, a corner bracket, a HUD stroke, a
   frame → `--chrome`.
3. **Is it a static label, count, badge or measured value?** → `--label`, in the
   mono voice, uppercase, tracked.
4. **Is it something a person reads?** → Space Grotesk, sentence case,
   `--text` / `--text-dim` / `--text-ghost`.
5. **Does it sit on the page?** → `--glass`. **On an image?** → `--scrim`. Never
   an opaque fill.
6. **Does it have corners?** → they are square.

### Step 3 — the component vocabulary

Use the names; a new app is then already wearing the language.

| Class | What it is |
|---|---|
| `.nav` / `.nav__inner` / `.nav__brand` / `.nav__search` | The app bar, with the accent hairline on its bottom edge |
| `.section__doc` / `.section__doc-mark` | The meta line of real facts above a heading |
| `.section__head` / `.section__slug .name` | The page heading, white-to-grey gradient |
| `.eyebrow` | A labelled rule over a block — never a filled bar |
| `.btn` (`--primary`, `--ghost`, `--danger`, `--sm`, `--icon`) | Buttons. Exactly one `--primary` per row: the one that commits |
| `.seg` / `.seg__opt` | The segmented control — tabs, language, mode, view: **one idiom for "pick one of these"** |
| `.tag` / `.tag-bar` | Filter chips; active is an accent fill under black text |
| `.field` / `.field__label` / `.field__help` | A form control; the left border is the state channel (accent = set, grey = unset, amber = staged) |
| `.menu` / `.menu__option` | A dropdown; the active row is marked on its leading edge |
| `.card` / `.card-grid` / `.card__img` / `.card__idx` / `.card__cap` | A content tile, with the `--chrome` corner brackets on hover/focus |
| `.stack` / `.panel` / `.kv` | Hairline-separated panels and a key/value readout (`.num` for measured values) |
| `.hud` / `.hud__corner` / `.hud__reticle` / `.hud__bar` | The viewfinder idiom — only where the screen **is** an instrument |
| `.dot` / `.status` | Status marks |
| `.foot` | The colophon |

### Step 4 — the rules that are not about looks

These are all things that were measured, broke, and were fixed. They are part of
the language.

1. **Fonts are static per-weight woff2 instances** built from the variable
   source, and `@font-face` carries **no `local()`**. Instantiating a variable
   face, and searching the installed system fonts once per face, were together
   close to a second of a phone's first layout, under the entrance animations.
   Weight *ranges* (400 → `100 450`, 500 → `451 550`, 600 → `551 650`,
   700 → `651 900`) so a requested weight always lands on exactly one file and
   never on a synthesised bold.
2. **Gate the expensive effects.** One JS check for weak hardware / data saver /
   reduced motion sets `html.fx-lite`, and lite mode **redefines the four
   surface tokens** (more opaque, blur `none`) instead of overriding rules.
   Background video, backdrop blur and long auto-advancing animations all hang
   off that one class.
3. **Gate repainting hovers behind `@media (hover: hover)`.** A colour or border
   `:hover` costs the first tap on a phone: the tap lands as a hover, the
   element repaints, and the visitor has to tap again. On touch keep the
   movement only.
4. **Never animate `transform` in a shared keyframe or an `:active` rule.** A
   centred control already carries its own `translate(-50%,-50%)`, and the
   animation throws it across the screen. Use the independent `translate` /
   `scale` properties — and list every animated property in the `transition`, or
   it does not transition at all.
5. **Assume a strict CSP** (`style-src 'self'`): inline `style` attributes are
   dropped **silently**. Data-driven values ride SVG geometry attributes or
   custom properties set from a stylesheet or from script (CSSOM writes are
   fine) — never an inline attribute you assume will survive.
6. **Hierarchy is typographic.** A section heading is a heading, not a bordered,
   filled strip. Before adding a band, count how many the page already stacks —
   the complaint that killed a previous look was *"das sind so viele Bänder"*.
7. **If a mark states no fact, delete it.** Dashed "stamp" chips, decorative
   index numerals and untranslated slug ornaments were all removed for carrying
   no information.
8. **One config vocabulary.** If the app is themable, the knobs are `accent`,
   `wallpaper`, `wallpaper_tint`, `wallpaper_dim` and the display face — the
   same names, resolved through the same album → site → built-in tiers. The
   backdrop ships in two cuts, wide and square, served through one `<picture>`
   — that pair is what `wallpaper` / `wallpaper_mobile` is.
9. **The marks.** The house mark is `logo-new.svg` (tracked as
   `configurator/app/static/logo/lucya_logo.svg`); `app/static/logo/gallery-mark.svg`
   is the unbranded default for an app that has configured no logo of its own,
   and an app should fall back to it rather than borrow the vendor wordmark.
   After changing the mark's SVG, re-run `python tools/render_logo.py` — the
   terminal CLI uses a rasterised copy, and that script deliberately fails loudly
   on a shape it does not understand.

### Step 5 — the accent derivation, if the app is themable

One colour in, three faces out, by moving only **lightness** along the source
hue until each face clears 4.5:1 against the text it has to carry. This is the
whole reason an accent knob can be exposed to a config file at all: a
hand-typed hex lands with the same guarantees as the built-in colour rather than
as a raw value nobody checked.

The gallery runs it in Python as `_accent_shades()` (`app/main.py`); the
showcase runs a byte-identical port in JS (`nebulaAccent()` in `showcase.js`,
verified against the Python for eight inputs). If you add a third
implementation, verify it the same way.

```python
def accent_shades(rgb):
    # --acc: small text on black AND a fill under black label text. Both
    # readings want luminance, so a too-dark colour is LIFTED (and said so).
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in rgb])
    acc_l = l
    while acc_l < 0.97 and contrast(hls_rgb(h, acc_l, s), BLACK) < 4.5:
        acc_l += 0.02
    # --acc-deep: the one face carrying WHITE text, so it goes the other way.
    # Saturation is capped here alone: at full chroma a mid-lightness hue turns
    # electric, which no other shade of the same colour does.
    deep_s, deep_l = min(s, 0.78), min(acc_l, 0.58)
    while deep_l > 0.12 and contrast(hls_rgb(h, deep_l, deep_s), WHITE) < 4.5:
        deep_l -= 0.02
    return {
        "acc":  hls_rgb(h, acc_l, s),
        "deep": hls_rgb(h, deep_l, deep_s),
        "soft": hls_rgb(h, acc_l + (1 - acc_l) * 0.42, s),
    }
```

### Step 6 — ship checklist

- [ ] **Count the accents on one screen.** More than a handful means furniture
      has been painted with state colour — go back to step 2.
- [ ] `grep -n 'border-radius' new.css` — every hit is `var(--radius)` or a
      genuinely round thing.
- [ ] No opaque fill on a floating surface. Every pane is `--glass` / `--scrim`
      plus a blur.
- [ ] Phone check: blur off, hovers gated, no variable font, no `local()`.
- [ ] No `text-transform` on anything carrying data.
- [ ] Read the screen with the CSS off. If the meta line does not still state
      real facts, it was a decoration bar.
- [ ] If the app has a sibling app, make the change in **both** stylesheets —
      they deploy separately and can never share a mount, so the language only
      stays one language by hand.

---

## The brief, ready to paste

Hand this to Claude at the start of a session that will touch a lucya.systems
interface.

```
This app wears NEBULA, the lucya.systems design language.
Read nebula/NEBULA.md and use nebula/nebula.css as the base sheet.

Four rules:
1. Black ground, grey furniture, ONE accent (--acc, #5865F2). The accent
   marks STATE only: links, focus, active/selected/open, featured, live.
   Furniture is --chrome (hovers, brackets, HUD strokes) or --label (the
   static mono furniture: labels, counts, badges, measured values).
   Before colouring something purple, ask whether it carries state.
2. Square corners, always. --radius: 0. Only round things opt out.
3. Depth from blur, not darkness. Panes are --glass / --scrim + their
   blurs over a drained backdrop. A pane that does not read gets more
   blur, never a darker fill.
4. Mono, uppercase, .16-.24em tracked = the chrome AROUND the content.
   Space Grotesk, sentence case = everything a person reads. The display
   face is the wordmark's voice and never a heading's.

Also: no local() in @font-face and no variable fonts (static per-weight
woff2); gate blur/video/animation behind html.fx-lite; gate repainting
hovers behind @media (hover: hover); assume a strict CSP so no inline
style attributes; never text-transform data (names, paths, queries).
```

---

## Ownership

The colours, the wordmark and the logo belong to whoever runs the app. The four
rules do not — an app with a different accent and a different mark is still
Nebula, and an app with square corners and a black ground that spends purple on
its labels is not.
