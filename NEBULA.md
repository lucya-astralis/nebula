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

**Mist: which kind of thing, not which state.** Grey icons everywhere made a
screen of cards read as one flat surface — *"etwas mehr farbe rein, wir haben
icons nicht umsonst"*, and then *"nicht alles akzent"* (user, 2026-09-24). Four
separate hues were tried (teal/rose/orange/violet, then lilacs, then saturated
orchid/magenta/sky/violet) and every set fought the language — *"das beißt
sich komplett mit nebula"*. The answer came from Nebula itself: *"der silber
farbverlauf in überschriften find ich ganz gut"*. So identity gets **one tint,
not a palette**:

| Token | Value | What |
|---|---|---|
| `--mist` | `#B4BCDF` | the title silver (`--title-a` → `--title-b`) leaning a little toward `--acc` |
| `--mist-1` … `-4` | `#D8DDF3` `#ADB6D8` `#858FBE` `#5F6AA3` | the same, light to dark, for ranked chart parts |

It goes on **the glyph** that says what a heading, a row or a place is about,
and on **the marks of a chart** — never on text, a surface, a border or a
control, and never to say *on*, *selected* or *wrong*: that is still `--acc`
and the three statuses. Mist sits between the silver of the chrome and the
accent, so a coloured icon reads as part of the ground's family and the
accent stays the only thing that *pops*. The kind tokens (`--glyph-album`,
`--glyph-tag`, `--glyph-time`, `--glyph-machine`) stay, keyed on the glyph in
one CSS table, and all point at `--mist`: meaning is carried by the glyph's
shape, and the tokens are the place to split a kind off if a validated reason
ever comes.

**A chart gets one family, not a rainbow.** A ring or a stacked bar has
several parts, and the tempting move is a hue per part — *"kein kunterbunt"*
(user, 2026-09-24). A chart takes the mist ramp (`--ramp-<kind>-1` to `-4`,
all aliases of `--mist-1` … `-4`) and gives its largest part the lightest
step, so the ranking reads in the colour. Past four parts the rest is one
neutral `--ramp-other`, never a fifth step. A share and its remainder
(tagged / untagged) is one step against `--ramp-other`. The legend beside the
chart names every part with its figure, so no slice is told by colour alone.
Columns fall like the title: `--mist-1` at the top to `--mist-4` at the base,
and a bar the same way, deep at its root to light at its end.

**Three palettes, one switch.** *"man soll auswählen können"* (user,
2026-09-24): the tint is a choice, made once per site on
`<html data-palette>`, and every variant is a pure token redefinition
(rule 6) — nothing else in the sheet knows which one is on.

| `data-palette` | What it redefines |
|---|---|
| `mist` (default) | nothing: the `:root` values above |
| `silver` | `--mist` `#BDBDC5` and its ramp `#E7E7F0` `#BDBDC5` `#94949D` `#6E6E76` — the title silver itself, no lean |
| `stardust` | each `--glyph-<kind>` and `--ramp-<kind>-*` directly: album `#BDAFD9` (lilac), tag `#D0A2B6` (rosé), time `#98BCDC` (blue), machine `#BCBDC7` (neutral) — four silvers, each with a faint cast |

All three stay near the title silver's lightness and far below the
accent's chroma, so none of them can be mistaken for state.

**When a ring and when bars.** A ring answers *what share* for a whole of two
to five parts. More parts, or a question of *how many* rather than *what
share*, is ranked bars; a question of *when* is columns over time.

**`hidden` wins.** `[hidden]{ display:none !important; }` is in the base, and
it is the one `!important` in the sheet. Every component here sets its own
display — `.btn` is inline-flex, `.field` is flex, `.seg` is inline-flex — and
each of them beats a bare attribute selector on specificity, which leaves an
element the markup calls hidden sitting on screen with its controls still in
the tab order. The attribute already means this; the sheet only makes it true.

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
| `--pane` / `--pane-scrolled` | The app bar — always present, spans the viewport. **Deep black**, and the deeper step for once content is under it |
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

**`--pane` is the one exception, and it is deep black on purpose.** It does not
take the top of the ladder, and its fill carries no hue at all —
`rgba(0,0,0,.86)` over `--blur-1`. Two things put colour into a bar: a hue in
the fill, and saturation in the blur behind it. `--pane` was once
`rgba(6,6,10,.72)` over `--blur-3` (`saturate(165%)`) and had both — 28% of a
re-saturated wallpaper is enough to tint the bar whatever the album behind it
is, and `6,6,10` is a blue step that rule 1 does not allow in the ground ramp
anyway. The bar spans the viewport on every screen: it is the frame the whole
page is read inside, and a frame that changes colour per album has stopped
being furniture. *"header bars sollen tiefschwarz bleiben, da andere Farben
hier einfach was kaputt machen"* (user, 2026-09-07).

It is still glass — the wallpaper moves behind it — but it reads black under
every accent. `--pane-scrolled` is the deeper step for a bar with content
underneath. That is **not** the darker fill this rule forbids: that one is
reaching for opacity because a surface will not *read*, and the answer to that
is still more blur or the `-hi` step. This is a state cue on the one surface
the language holds to black, and it goes deeper rather than lighter, because
black is the whole point of `--pane`.

**A pane is a fill, a blur and a hairline — no bevel, no gloss.** No lit top
edge, no wash falling down its face. Those two marks are what make translucency
read as Aero: a raised, moulded sheet with a thickness to it. They also argue
with rule 2 — a bevel is a soft edge drawn on a hard one, and square corners and
a bevel are contradictory claims about the same object. What this language means
by glass is a **flat plane with the depth behind it**, out of focus. All of the
depth is in the blur; none of it is in the surface.

**A divider is a hairline, not a gap over a lighter fill — unless every cell
is opaque.** The trick of laying rows or cells on a `--line` background with a
one-hair gap draws each rule once and is tempting. It holds only while every
cell paints an opaque fill (`--surface`, `--bg-2`): then the `--line` shows in
the gaps and nowhere else. Over glass, or over a row with no fill at all, the
9% white shows *through* every cell, and the whole block turns into a lighter
box floating on the page — depth from a lighter fill, by accident.
`.stack` did exactly this: a `.set` row has no fill and `.panel` is
`--glass-hi`. It is one pane now (`--glass`, the blur, one hairline round it)
with `border-top` between its rows. *"diese hellen boxen passen gar nicht
rein"* (user, 2026-09-24).

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
| Set pieces | `--mark-split`, `--boot-fade` | the two durations that are not transitions: the mark's hover split, and the fade a page leaves on |
| Depth | `--blur-1/2/3` | the rule-3 ladder |
| Elevation | `--shadow-1/2`, `--glow-acc`, `--ring-acc` | things that genuinely float |
| Shape | `--radius`, `--hair`, `--page-pad`, `--bp-narrow`, `--tap`, `--door-w` | one border width, one gutter, one breakpoint, one touch target, one sign-in card |

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

Nothing back means the app is speaking the language. `nebula.css` itself
returns three lines, and each of them is a stated exception: the two
`calc(…px * var(--display-scale))` sizes, because a display face brings its
own idea of how much of the em it inks, and the `16px` on the door's field,
which is a threshold iOS Safari enforces (see below).

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

## The door — how a sign-in window behaves

A sign-in window is not a seventh rule. It is the six rules applied to the one
screen every visitor sees first and that covers nothing, and it is written down
because every part of it was decided once and should never be decided again.
The reference is the console's door: `aperture/console/templates/login.html`,
`static/login.js`, and the `THE DOOR` block in `static/style.css`. A new app's
door behaves exactly like it — and does not redraw it: `nebula.css` carries
`.login-body`, `.login__card` and the rest, so what an app writes is the
markup, the script, and nothing else.

### What it is

- **Its own document, not a modal.** Nothing of the app renders before there is
  a session to render it for: no tree, no counts, no paths, no names. An overlay
  on the app has already loaded the thing it is guarding. HTML routes that meet
  a missing session answer `303 → /login`; API routes answer `401` JSON, never
  the form — a `fetch()` that receives a login page renders a stylesheet into a
  table.
- **The same room.** The door wears the app's own backdrop (`.site-bg`, the same
  `<picture>` with the wide and square cut) under the same wallpaper tokens.
  Signing in is walking through a door in the same building, not a lobby
  someone else built.
- **One card, centred.** `100dvh` grid, `place-items: center`, the card capped
  at a readable width (420px), `--page-pad`-class gutter around it so it never
  touches a phone's edge. The card is `--glass` + `--glass-blur` + one `--hair`
  of `--line` and `--radius` — a pane like every other (rule 3), **not**
  `--overlay`: it does not float over anything, it *is* the page.
- **Progressive enhancement.** A real `<form method="post">` with a real
  `<button type="submit">`. Without the script the browser still posts it. The
  script only makes it better: post JSON, keep the page, put the answer next to
  the field. A wrong password never costs a navigation.

### What is on it, top to bottom

| Part | Voice / token | Why |
|---|---|---|
| The mark + wordmark lockup, with the **version** | `.brand-text`, `.brand-sub` | Behind a password the footer is unreachable, and the version is the first thing to check when the tool behaves unlike its notes |
| Title — "Sign in" | sans, `--fs-text-lg`, 700 | A heading in the reading voice, never the display face (rule 4) |
| **Why you are here**, when the app knows | `.login__why`: `--acc` left rule over a faint accent fill, text in `--text` | The accent never sits on its own tint (rule 1). Not `role="alert"` — it answers a question, it does not interrupt |
| One line on what this door guards | `--text-dim`, `--fs-text-sm` | Reading copy bottoms out at `--text-dim` |
| Field label | mono, uppercase, tracked, `--label` | Furniture (rule 4). A real `<label for>` |
| The field, with the reveal inside it | input reset, 16px | The 16px is the iOS zoom threshold (rule 5's exception) |
| Caps Lock status | amber, mono | Amber, not red: it is the reason a refusal is *about* to happen |
| The refusal | `--red` + a glyph, `role="alert"` | The one red message on the door. Never hue alone (rule 6) |
| One `.btn--primary` — the one that commits | glyph + word | Exactly one primary per row |
| The way back if the password is lost | `--text-ghost` over a hairline, the command in mono | A door without a "lost the key" note is a wall |

Nothing else. No "remember me" (the session lifetime is the server's decision,
not a checkbox's), no social buttons, no decorative illustration, no marketing.
*If a mark states no fact, delete it.*

### The reason line is an allowlist

The query string is attacker-controlled and the door is **unauthenticated**, so
nothing from it is ever echoed. `?reason=` only picks a key from a fixed table
(`timeout`, `signout`, `expired`, `password`); an unknown key says nothing at
all. Each text names the cause and what happens now — *"That session had been
idle for 30 minutes, so it ended."* — because landing on a sign-in page without
an explanation reads as the tool having thrown you out.

**No `next=` parameter.** An app with one URL gains nothing from it and gets an
open-redirect sink. What is lost across the door is *which screen you were on*,
and that is remembered on the app's side (a one-shot note in `sessionStorage`,
written just before the app sends you to the door, read once on the way back).

### Behaviour, state by state

| State | What the door does |
|---|---|
| **First frame** | The card is simply there. **No entrance animation**, and the field has `autofocus`: this screen covers no wait, and the field is meant to be typed into on the first frame. An entrance on a door is a delay with a costume on |
| **Typing** | Nothing moves. Caps Lock is read on `keydown` *and* `keyup` (so the hint appears on the keystroke that turns it on) and hidden on `blur`. It is `role="status"`, wired into the field's `aria-describedby` |
| **Reveal** | A real `<button type="button">` in the tab order — `aria-pressed`, `aria-controls`, eye / eye-slash glyph + the word Show/Hide as separate nodes. Focus returns to the field **with the caret where it was**. Its hover repaints, so it sits behind `(hover: hover)` |
| **Enter** | Handled outright (`requestSubmit()`), not left to implicit submission, which some webviews and automation drop. Skip it while `isComposing` (IME input) |
| **In flight** | The submit button is `disabled`; the label does not change and nothing spins. A spinner for a sub-second request is a flicker |
| **Refused** | The server's own sentence goes into the `role="alert"` line, the field is **selected and focused** so the next attempt is simply typing again. **No shake**, no red border flash: the words and the glyph carry it |
| **Locked out** | Throttled server-side (a few free tries, then exponential backoff to a cap) and answered `429` + `Retry-After`. The door **counts down**: field and button disabled, button label `Locked — 12s`, ticking once a second, and on zero everything re-enables and the field takes focus. A lockout shown once and then left standing reads as *broken*. Read the header first, the number in the body second (a proxy may eat the header), a fixed fallback last |
| **No answer** | *"The app did not answer. Is it still running?"* — a network failure is not a wrong password and must never be worded like one |
| **Success** | The card **leaves under its own power**, then the page is replaced — see Motion. `location.replace()`, never `assign()`: the door has no place in the history that Back walks through |

### Motion

The door has exactly **three** movements, and all of them come off tokens:

1. **The mark's hover split** — the same one the app bar's mark does: the two
   colour copies pull apart and snap back in `steps(4, end)` over
   `--mark-split`, animated with `translate` (never `transform`, Step 4.4),
   behind `(hover: hover)`, and off under reduced motion with the mark left
   whole. **The door does not play the boot build.** The full build belongs to
   the boot screen, which covers a real wait; the door covers none.
2. **The Caps Lock / error lines appear** — by `hidden` toggling. No slide, no
   fade: a line that animates in is a line you read late.
3. **The exit** — on success the card goes to `opacity: 0` over `--boot-fade`
   with `--ease`, and `scale: .97` with `--ease-out`, `pointer-events: none`;
   the navigation fires when that transition has finished. Its purpose is to
   turn a document swap into a hand-off: the boot screen on the other side
   picks the mark up, and there is no white flash in between. The transition
   is declared on the **resting** `.login__card`, so it runs the same way
   every time.

Under `prefers-reduced-motion` the exit keeps the fade and drops the scale; if
the script sees reduced motion it navigates immediately. Under `.fx-lite` /
reduced transparency the card's surface goes opaque through the token
redefinitions like every other `--glass` (rule 6) — the door has no fallback of
its own, because it has no surface of its own.

What the door never does: an entrance, a shake, a pulsing button, a typing
effect, a progress bar, a background that reacts to the field, a success tick
before the navigation. Every one of those is a delay or a decoration on the
screen people see most often and want to leave soonest.

### Password managers and phones

- `autocomplete="current-password"` on the field, and — when the app has one
  nameless account — an **offscreen** (not `display:none`, which managers
  ignore) `readonly`, `tabindex="-1"`, `aria-hidden` field with
  `autocomplete="username"` carrying a fixed account name. Without it most
  managers will not offer to save the credential at all.
- `required` on the field and `novalidate` on the form: the script words the
  refusal, not the browser's own bubble.
- `viewport-fit=cover`, `100dvh`, 16px on the input, a 44px submit target. The
  card scrolls with the page on a short phone; it is never fixed-height.

---

## The controls the sheet now owns

Three of these were invented twice before they were written down, which is the
sign that they belong here rather than in an app.

### A switch is not a segmented control

`.seg` answers *pick one of these*. `.switch` answers *is this on* — and it is
the other half of every settings screen. On is a **state**, so on is the
accent, as a fill with `--on-acc` on the knob. It is a real
`<button role="switch" aria-checked>`, and the word beside it (`.switch__word`)
says On or Off, because hue alone never says anything (rule 6).

A setting whose two states are not *on* and *off* — three modes, two views — is
a `.seg`, not a switch with a clever label.

### A meter states a number

Rule 1 licences the accent for progress fills; `.meter` is the fill. The value
arrives as a custom property (`--p`), set through the CSSOM, because a strict
CSP drops an inline `style` attribute silently (step 4.5). The figure goes
**next to** the bar and `aria-valuenow` goes **on** it: a bar with no number is
a mood, and a screen reader reads the attribute, never a width.

### A toast reports; it does not mark a state

So its leading edge is `--chrome`, not the accent — the question "does this
carry state?" has the answer *no*. The variants (`--ok`, `--amb`, `--error`)
are statuses, the same licence `.field__error` has, and each carries a glyph as
well as its colour.

Two things a toast is not allowed to be: the only place an outcome is shown —
a message that vanishes has not told anyone who was reading something else —
and an error that needs a decision. That is a `.dlg`.

### The mark is markup, not an image

`.mark` is eight `<path>`s in a `viewBox`, twice more when it carries the
ghosts. An `<img>` is a closed document and no stylesheet of ours can reach
inside it, which is the whole reason: the bar and the door split the wing into
its two colour flanks on hover, and the boot screen draws it piece by piece.
The two ghost hexes are **not** palette colours and never appear on a surface,
a label or a control — only on a copy of the mark itself.

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
   **On an image?** → `--scrim`. **Is it the app bar?** → `--pane`, which is
   deep black and stays deep black. **A menu or dialog?** → `--overlay`.
   Never an opaque fill, and never a bevel.
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
| `.mark` (`--nav`, `--door`, `--foot`) | The house wing as inline SVG, with the chromatic split on hover. Never an `<img>`: nothing outside a closed document can draw it |
| `.avatar` (`--sm`, `--lg`, `--btn`) | Who this is, in a square. Carries no accent unless it is a control that is open |
| `.switch` / `.switch-wrap` / `.switch__word` | One setting, on or off — the other half of `.seg`. On is an accent FILL, and the word beside it says which |
| `.meter` / `.meter__fill` | How much of something there is. The fill is the one progress the accent is for; the value rides `--p` through the CSSOM |
| `.set` / `.set__ico` / `.set__text` / `.set__aside` | The setting row: icon, name and a line of prose, then the controls. Lives in a `.stack` |
| `.tbl` / `.tbl-wrap` | Rows of facts in the two voices; a `.num` column goes mono and tabular |
| `.dlg` / `.dlg__head` / `.dlg__body` / `.dlg__foot` | A `<dialog>` on `--overlay`. A question, not a screen |
| `.toast` / `.toasts` | That happened. Its edge is `--chrome`, because reporting is not a state; `--ok` / `--amb` / `--error` are statuses |
| `.rail` / `.rail__nav` | The sections of one app, standing still. The current one is marked on its leading edge, and on its bottom edge once the rail is a strip |
| `.login-body` / `.login__card` / … | The door — see its own chapter above |
| `.u-nocase` | Rule 4's tool: data inside furniture that is cased |
| `.u-offscreen` | In the tree and in a password manager's reach, out of the eye's way |
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
- [ ] **If the app has a door**, walk it: wrong password (field selected, alert
      read out, no shake), Caps Lock on, reveal and back (caret kept), four
      wrong tries (countdown runs and re-enables), server stopped (no-answer
      wording), then success (card leaves, Back does not return to the door).
      Tamper with `?reason=` — nothing from it may appear on the page.
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
   Aero, and it argues with rule 2. --pane is the exception to the
   ladder: DEEP BLACK, no hue in the fill and --blur-1 behind it, so
   the app bar never takes an album's colour.
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

A sign-in window ("the door") is its own document, never a modal: one
--glass card on the app's own backdrop, mark + version, an allowlisted
reason line (never echo the query string, no next=), one field with an
in-field reveal, Caps Lock status, a role="alert" refusal with a glyph,
one primary button. No entrance animation, no shake, no spinner; a 429
counts down from Retry-After; success fades the card (--boot-fade, scale
.97) and then location.replace()s. The sheet carries its CSS
(.login-body/.login__*), so an app writes the markup and the script.
Details: NEBULA.md, "The door".

Colour: --acc is STATE only; --ok/--amb/--red are statuses; --mist
(#B4BCDF, the title silver toward --acc) and its ramp --mist-1..4 are
IDENTITY, on kind-glyphs and chart marks only; --glyph-* and --ramp-* alias it.

The sheet also owns: .mark (the wing as inline SVG, splits on hover —
never an <img>), .avatar, .switch (on/off; .seg is pick-one-of-these),
.meter (--p through the CSSOM, and a figure beside the bar), .set (the
settings row), .tbl, .dlg, .toast (edge is --chrome: reporting is not a
state), .rail, .u-nocase, .u-offscreen. Do not rebuild any of them.
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
