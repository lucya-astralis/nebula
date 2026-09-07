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

## The six rules

Everything in `nebula.css` is one of these. If a decision is not obviously one
of them, it is probably a decision that should not be made.

Rules 1–4 are about what a thing looks like. Rules 5 and 6 are about what it
*measures* and what happens when the machine cannot deliver it — and they exist
because the first four were being enforced by memory. Every rule here can be
checked: rule 1 by counting, rule 2 and rule 5 by `grep`, rule 3 by reading the
token block, rule 6 by toggling a switch in the OS.

### 1. Black ground, grey furniture, ONE accent

`--acc` marks **state** and nothing else. Nothing in the ground ramp carries a
hue: `--bg` is `#000000`, every surface and the whole text ramp are neutral
greys. Colour appears once, on purpose.

| Token | What wears it |
|---|---|
| `--acc` `#616EF3` | Links, focus, active / selected / open, featured marks, progress fills, live counters, the one glyph in front of a section label |
| `--acc-deep` | The single face that carries **white** text |
| `--acc-soft` | The lifted step: hover faces under black text |
| `--on-acc` | What goes **on top of** an `--acc` fill |
| `--chrome` `#e8e8ee` | Furniture that reacts: hovers, corner brackets, HUD strokes |
| `--label` `#b8b8c2` | Furniture that sits still: section labels, counts, badges, measured values |

`#5865F2` is the **brand** hex — the value a config supplies, the colour the
wordmark is drawn in. It is not used raw. Like any hand-typed accent it goes
through the derivation (step 5) and comes out as `--acc` `#616EF3`, one step
lifted. See step 5 for why the reference surface changed and what it bought.

**The accent never sits on its own tint.** On an accent fill or an accent-tinted
face, the label is `--on-acc` or `--text`; the accent is carried by the fill and
the border instead. Accent-on-accent-tint was the lowest contrast in the whole
sheet (4.14:1) and it was on `.btn--primary`, the most important control in any
row. A white label on a violet-lit face reads *more* primary, not less.

**The text ramp has a floor, and it is measured.** Anything a person reads
clears **4.5:1** against `--surface` *and* against the `--glass-hi` composite;
furniture that is not read as language clears 3:1. `--text-ghost` is a **ghost**
— a placeholder, a disabled label, de-emphasised furniture. It is not a colour
for text that has to be read; reading copy bottoms out at `--text-dim`. It used
to be `#6b6b73`, which was 3.65:1 on `--surface` and was carrying help text,
placeholders and the *unselected* segments of a segmented control.

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

Six tokens are the whole surface scale:

| Token | For |
|---|---|
| `--glass` / `--glass-hi` | Panes over the page: fields, buttons, cards, panels |
| `--scrim` / `--scrim-hi` | Chips laid **on** a picture, where the backdrop is whatever the image happens to be there |
| `--pane` | The app bar — always present, spans the viewport |
| `--overlay` | Menus and dialogs — they must read over **any** content |

It used to be four, and `.nav` and `.menu` carried hand-typed fills and their
own `backdrop-filter`. That made this rule's central promise — *redefine the
tokens and every surface retunes, nothing else has to know* — **false for the
two panes an app shows on every screen**: on weak hardware the bar and every
dropdown kept their blur. If a surface is not spelled as a token, it is not in
the system.

The blur is a **ladder**, `--blur-1` to `--blur-3`, so "give it more blur" is an
actual move rather than advice. A surface that is not reading gets **more blur
or the `-hi` step, never a darker fill**.

**A pane is a fill, a blur and a hairline — no bevel, no gloss.** No lit top
edge, no wash falling down its face. Those two marks are what make translucency
read as Aero: a raised, moulded sheet with a thickness to it. They also argue
with rule 2 — a bevel is a soft edge drawn on a hard one, and square corners and
a bevel are contradictory claims about the same object. What this language means
by glass is a **flat plane with the depth behind it**, out of focus. All of the
depth is in the blur; none of it is in the surface.

**`--pane` and `--overlay` go fully opaque when the blur is gone**, and the two
glass steps do not. What is behind a card is the wallpaper; what is behind the
app bar is the page, scrolling. Translucency without a blur to average it is not
glass, it is a smear. A pass that raised every surface's opacity was rejected outright:
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

- **JetBrains Mono, uppercase, tracked** — the furniture *around*
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

**The token name carries the voice.** `--fs-chrome-*` is the mono voice,
`--fs-text-*` is the sans voice, and each `--fs-chrome-N` has exactly one
`--tr-chrome-N` that goes with it. Reaching for the wrong one is then visible in
the source, not only on screen. Tracking **falls as size rises** — that is a
formula, not a preference: the reason to track is optical, and small caps need
air that large caps do not.

### 5. Measure is rationed like colour

Every size, space, duration and blur comes off a named scale. A raw `px` in an
app sheet is the same mistake as a raw hex.

| Scale | Tokens | For |
|---|---|---|
| Space | `--s-0` … `--s-10` | 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96. `--s-0` is a *bezel*, not a space; `--s-9` / `--s-10` are page rhythm |
| Chrome type | `--fs-chrome-xs/sm/md/lg` | 9.5, 10.5, 12, 14 |
| Content type | `--fs-text-sm/md/lg/xl`, `--fs-title` | 12, 13, 15, 18, clamp |
| Tracking | `--tr-chrome-*`, `--tr-text`, `--tr-title`, `--tr-head`, `--tr-num`, `--tr-display` | paired to the size |
| Motion | `--dur-1/2/3`, `--ease`, `--ease-out` | .15s state, .25s movement, .35s settle |
| Depth | `--blur-1/2/3` | the rule-3 ladder |
| Elevation | `--shadow-1/2`, `--glow-acc`, `--ring-acc` | things that genuinely float |
| Shape | `--radius`, `--hair`, `--page-pad`, `--bp-narrow` | one border width, one gutter, one breakpoint |

Before this block existed the sheet carried 23 distinct paddings, 13 gaps, 13
font sizes and 14 tracking values, every one hand-typed. So "the same as the
gallery" was something you had to *remember* rather than something you could
*reference*, and a third app could only drift. Ten sizes between 9px and 15px is
not a hierarchy anyone perceives — 10px and 10.5px are noise that reads as
inconsistency.

The check is a grep, the same way rule 1's is a count:

```bash
grep -oE '(padding|gap|margin|font-size|letter-spacing):[^;]*[0-9]+px' app.css
```

Nothing back means the app is speaking the language. `nebula.css` itself returns
nothing.

**The one exception, and it is not a size.** `font-size: 16px` on a text input
is the threshold under which iOS Safari zooms the page on focus, leaving the
layout scrolled sideways with no way back. That figure is a **behaviour**, not
a type size: it does not come off the scale, and snapping it to the nearest
step (`--fs-text-lg`, 15px) re-arms the zoom. Both apps carry it, both carry
the comment saying why, and a rule-5 pass that does not know about it will
silently break the phone layout — this one did, in the configurator, and the
grep is what found it again. If a number in a sheet is a threshold something
else enforces, write the reason next to it and leave it raw.

### 6. The environment can overrule the look

Blur, translucency, motion and hover are **capabilities, not guarantees**. Each
has a declared fallback, and every one of them is reached by **redefining
tokens** — never by overriding component rules. That is the only reason a
component can be written once and still be correct on a four-year-old phone, in
Windows high-contrast mode, and for a visitor who has asked the OS for less.

| Gate | What it redefines |
|---|---|
| `.fx-lite` | JS-detected weak hardware / data saver. The six surfaces, opaque; the blur ladder off |
| `prefers-reduced-transparency` | The same, but it lands **before first paint** — a script-set class never can |
| `prefers-contrast: more` | `--line`, `--line-strong`, `--text-ghost`, `--text-dim` |
| `forced-colors: active` | Hands the palette to the OS and gives every surface a real `CanvasText` border |
| `prefers-reduced-motion` | Durations to nothing, `scroll-behavior` to auto |
| `hover: none` | Keeps the movement, drops every repainting hover |

`forced-colors` matters more here than in most systems: the entire depth model
is translucency plus hairlines, and the OS compositor discards both. A page that
says nothing about it renders as unseparated text on one flat ground.

**Never signal state with hue alone.** A status dot carries a word next to it; a
field error carries a glyph as well as the red.

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
5. **Does it sit on the page?** → `--glass` (`--glass-hi` if it is read).
   **On an image?** → `--scrim`. **Is it the app bar?** → `--pane`. **A menu or
   dialog?** → `--overlay`. Never an opaque fill, and never a bevel.
6. **Does it have corners?** → they are square.
7. **Did you type a number?** → it comes off a scale in rule 5, or it does not
   go in.
8. **Does it depend on blur, translucency, motion or hover?** → say what it does
   without them, in tokens.

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
| `.tag` / `.tag-bar` | Filter chips. A **control**: ship it as `<button type="button">` with `aria-pressed`, never a `<span>` |
| `.tag--static` | A tag that is a *label*, not a control — a read-only qualifier. Not a button: a focus stop that does nothing is worse than none |
| `.u-glass` / `.u-scrim` | Rule 3 as one reusable move, for an element the vocabulary does not cover |
| `.chrome-voice` | Rule 4's mono voice as one class, for the same reason |
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
7. **Every control is reachable from a keyboard, and says what it is.** A chip
   that cannot be focused is a filter half the visitors cannot use. The class
   is what the sheet paints; `aria-pressed` / `aria-selected` is what a screen
   reader reads — a toggle carries **both**, kept in step by the same handler.
   One focus ring for the whole system, and never remove one without giving one
   back.
8. **If a mark states no fact, delete it.** Dashed "stamp" chips, decorative
   index numerals and untranslated slug ornaments were all removed for carrying
   no information.
9. **One config vocabulary.** If the app is themable, the knobs are `accent`,
   `wallpaper`, `wallpaper_tint`, `wallpaper_dim` and the display face — the
   same names, resolved through the same album → site → built-in tiers. The
   backdrop ships in two cuts, wide and square, served through one `<picture>`
   — that pair is what `wallpaper` / `wallpaper_mobile` is.
10. **The marks.** The house mark is `logo-new.svg` (tracked as
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

**The reference surface is `--surface`, not `--bg`.** This is the one real bug
the derivation had: it measured against `#000000` and stopped the moment it
cleared it — but the accent is almost never *on* `#000`. It is a link inside a
`.panel`, an active `.menu__option`, the glyph in front of an `.eyebrow`, every
one of them on `--surface` or a step above. `#5865F2` clears 4.56:1 on `#000`
and only **4.19:1** on `--surface`, so the whole 4.5 margin was spent before the
colour was used. Measuring against the surface it actually sits on lifts the
built-in one step, `#5865F2` → `#616EF3`, and that one step is the difference
between a promise and a rounding error.

```python
SURFACE = (0x0e, 0x0e, 0x10)   # --surface: the ground accent TEXT sits on

def accent_shades(rgb):
    # --acc: small text on a PANEL and a fill under --on-acc label text. Both
    # readings want luminance, so a too-dark colour is LIFTED (and said so).
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in rgb])
    acc_l = l
    while acc_l < 0.97 and contrast(hls_rgb(h, acc_l, s), SURFACE) < 4.5:
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
- [ ] `grep -oE '(padding|gap|margin|font-size|letter-spacing):[^;]*[0-9]+px' new.css`
      — nothing back, except thresholds that carry their reason in a comment
      next to them (the 16px input, above). (Rule 5.)
- [ ] **Every `--fs-*` token matches the voice of the thing it sizes.** A rule
      that only overrides a size — a desktop type-scale block is all of these —
      says nothing about its own voice, so it is the easy place to land a
      `--fs-text-*` on a mono eyebrow. Check it against what the browser
      computes, not against what the rule looks like.
- [ ] No opaque fill on a floating surface, and **no bevel**: no
      `inset 0 1px 0 rgba(255,255,255,…)`, no gloss gradient down a pane.
- [ ] **Tab through the whole screen.** Every control is reachable, the ring is
      visible on each, and every toggle carries `aria-pressed` /
      `aria-selected` alongside its class.
- [ ] **Turn the environment against it**: `.fx-lite`, reduced transparency,
      reduced motion, more contrast, forced colours, and a 375px viewport. Each
      should be a token change, not a broken screen.
- [ ] Phone check: blur off, hovers gated, no variable font, no `local()`,
      touch targets at 44px.
- [ ] No `text-transform` on anything carrying data.
- [ ] No state signalled by hue alone — a dot has a word, an error has a glyph.
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
Do not fork the token block; your sheet loads after it and adds only
what is genuinely new.

Six rules:
1. Black ground, grey furniture, ONE accent (--acc). The accent marks
   STATE only: links, focus, active/selected/open, featured, live.
   Furniture is --chrome (hovers, brackets, HUD strokes) or --label
   (static mono furniture: labels, counts, badges, measured values).
   Before colouring something purple, ask whether it carries state.
   The accent never sits on its own tint: on an accent fill the label
   is --on-acc or --text. Reading copy bottoms out at --text-dim;
   --text-ghost is a ghost, not a text colour.
2. Square corners, always. --radius: 0. Only round things opt out.
3. Depth from blur, not darkness. Six surfaces: --glass/-hi (panes),
   --scrim/-hi (chips on a picture), --pane (the app bar), --overlay
   (menus). Each with a step off --blur-1..3. A pane that does not read
   gets more blur or the -hi step, never a darker fill. A pane is a
   fill, a blur and a hairline: NO bevel, NO gloss gradient — that is
   Aero, and it argues with rule 2.
4. Mono, uppercase, tracked = the chrome AROUND the content. Space
   Grotesk, sentence case = everything a person reads. The display face
   is the wordmark's voice and never a heading's. Use --fs-chrome-* vs
   --fs-text-*: the token name carries the voice.
5. Measure is rationed like colour. Every size, space, duration and
   blur comes off a named scale (--s-*, --fs-*, --tr-*, --dur-*,
   --blur-*). A raw px is the same mistake as a raw hex. Check with:
   grep -oE '(padding|gap|margin|font-size):[^;]*[0-9]+px' app.css
6. The environment can overrule the look. Blur, translucency, motion
   and hover are capabilities. Reach every fallback by REDEFINING
   TOKENS, never by overriding rules: .fx-lite,
   prefers-reduced-transparency, prefers-contrast, forced-colors,
   prefers-reduced-motion, (hover: none).

Also: no local() in @font-face and no variable fonts (static per-weight
woff2); assume a strict CSP so no inline style attributes; never
text-transform data (names, paths, queries); every control is a real
focusable element carrying aria-pressed/aria-selected next to its
class; never signal state with hue alone.
```

---

## Ownership

The colours, the wordmark and the logo belong to whoever runs the app. The six
rules do not — an app with a different accent and a different mark is still
Nebula, and an app with square corners and a black ground that spends purple on
its labels is not.

Nor is one that hand-types its spacing. Rules 5 and 6 are the ones that make
this a *language* rather than a look: a look can be copied by eye, and will
drift the first time someone eyeballs a padding. A scale and a set of declared
fallbacks can be inherited.
