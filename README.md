# nebula/

The design language of lucya.systems, as a thing you can open.

Two audiences, one folder:

- **A person** opens `index.html` and gets an interactive specimen book — the
  app shell, the component set, and four switches that break one rule each so
  the page shows what a rule is *for* instead of asserting it.
- **Claude** reads [`NEBULA.md`](NEBULA.md), which is the same content as
  instructions, and copies [`nebula.css`](nebula.css) as the base sheet for a
  new app.

## Run it

```bash
python -m http.server 8123 --directory nebula
```

Then open <http://localhost:8123>. It is also wired into
`.claude/launch.json` as the **nebula** configuration.

Opening `index.html` straight off disk works too, except that the fonts and the
icon font need an origin, so both fall back.

## What is in here

| File | |
|---|---|
| `NEBULA.md` | **The instructions.** Read this before writing CSS for a lucya.systems app. |
| `nebula.css` | **The language, portable.** Tokens, base, and every component in the showcase. Copy it verbatim into a new app; its own sheet loads after. |
| `index.html` | The showcase: eight chapters, from the app shell to the build guide. |
| `showcase.css` | Only the documentation scaffolding around the specimens. Not part of the language. |
| `showcase.js` | The labs. Also carries `nebulaAccent()`, a byte-identical JS port of the gallery's `_accent_shades()` — verified against the Python for eight inputs. |
| `icons.css` | **Nebula Icons**, generated: the `@font-face` and one `.ni-*` class per icon. Adding a class not listed in it renders nothing; draw the icon in `assets/fonts/build.py` and re-run it. |
| `assets/fonts/` | Static per-weight woff2 instances (Space Grotesk, JetBrains Mono), the display face, and the house faces drawn by `build.py`: Nebula Wordmark (the logo face, drawn from the eagle's three angles: 2:1, 1:2 and 1:1), Nebula Mono, Nebula Display and Nebula Icons. Rebuild with `pip install fonttools brotli skia-pathops` and `python3 assets/fonts/build.py`. |
| `fonts/` | The fontset specimen: both house faces, the icon set, and a switch that swaps the chrome voice on real components. |
| `assets/logo/` | Two files, on purpose: the current lucya.systems mark (the same one `gallery.cfg` serves as `logo-new.svg`, tracked as `configurator/app/static/logo/lucya_logo.svg`), and `gallery-mark.svg`, the unbranded default for an app that has configured no logo. The combined lettering SVG in `app/static/logo/` is **not** here — it has the previous drawing of the bird baked into it. The footer lockup is composed instead: the mark, plus the wordmark as type in the display face. |
| `assets/img/nova-*.svg` | The house artwork, wide and square — the same two cuts the configurator serves, and the pair an app's `wallpaper` / `wallpaper_mobile` is. Vector: the whole backdrop is 8 KB and costs nothing to paint. |
| `assets/img/plate-*.svg` | Abstract stand-ins for photographs. Deliberately **not** the operator's own pictures: `photos/` and `thumbnails/` are gitignored, so a committed showcase cannot borrow from them. |
| `errors/` | **The error pages.** Nineteen codes, each with its own scene drawn from the tokens, and a catalogue at `errors/index.html`. Generated from one table: edit `errors/build.py`, run `python3 errors/build.py`. Served from the folder root, because every page pins `<base href="/errors/">`. |

## The six rules, in one screen

1. **Black ground, grey furniture, one accent.** `--acc` marks *state* and
   nothing else; furniture is `--chrome` or `--label`. The accent never sits on
   its own tint.
2. **Square corners, always.** `--radius: 0`.
3. **Depth from blur, not darkness.** Six surfaces — `--glass` / `--scrim` /
   `--pane` / `--overlay` — over a drained backdrop, each with a step off the
   `--blur-1..3` ladder. A pane that does not read gets more blur, never a
   darker fill. A pane is a fill, a blur and a hairline: **no bevel, no gloss.**
4. **Mono, tracked, uppercase = the chrome around the content.** Space Grotesk,
   sentence case = everything a person reads.
5. **Measure is rationed like colour.** Every size, space, duration and blur
   comes off a named scale. A raw `px` is the same mistake as a raw hex.
6. **The environment can overrule the look.** Blur, translucency, motion and
   hover are capabilities. Every fallback is reached by redefining tokens,
   never by overriding rules.

Rules 1–4 say what a thing looks like. Rules 5 and 6 are what make it a
*language* rather than a look: a look is copied by eye and drifts the first time
someone eyeballs a padding; a scale and a set of declared fallbacks can be
inherited.

## Keeping it honest

The two production instances of this language are
[`app/static/style.css`](../app/static/style.css) (the gallery) and
[`configurator/app/static/style.css`](../configurator/app/static/style.css).
They deploy as separate images and can never share a mount, so a change to the
language has to be made in **both** — and, if it is a rule rather than a value,
here as well.
