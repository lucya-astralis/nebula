#!/usr/bin/env python3
"""Write the Nebula error pages from one table.

    python3 errors/build.py

Every page is a static document a web server can hand out as-is: no
template engine at request time, nothing to render. They are generated
only so the bar, the mark, the meta line and the colophon are written
once — twenty hand-kept copies of an eight-path SVG drift the first time
someone touches one of them.

Edit the table below, re-run, commit the HTML.
"""
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Where the folder is served from. An error page is answered AT THE URL
# THAT FAILED (/a/b/c/missing), so every relative path in it would resolve
# against the wrong directory. <base> pins them. An app that serves the
# set from somewhere else changes this one value.
BASE = "/errors/"

MARK_PATHS = [
    "M112,148L260,217L409.69,379.66L467.26,264.53L400,222.08L400,204.02L0,0L112,148Z",
    "M964,0L564,204.02L564,222.08L496.74,264.53L554.31,379.66L704,217L852,148L964,0Z",
    "M172.93,266.68L315.8,308.65L247.36,234.28L59.81,146.84L172.93,266.68Z",
    "M904.19,146.84L716.64,234.28L648.2,308.65L791.07,266.68L904.19,146.84Z",
    "M289.78,367.82L400.19,400.35L343.4,338.64L191.3,293.96L289.78,367.82Z",
    "M772.7,293.96L620.6,338.64L563.81,400.35L674.22,367.82L772.7,293.96Z",
    "M518,67L415,100L403,120L454,122L421,210.5L482,249L543,210.5L538,85L518,67Z",
    "M482,282L544.5,407L482,543L419.5,407L482,282Z",
]

# code, reason phrase, class line, scene, scene name (catalogue), title, lead,
# actions. Actions: home | back | retry | signin. The first one is the
# primary — exactly one per row.
PAGES = [
    ("400", "Bad request", "4xx · Client", "parse", "Parser",
     "That request didn't parse.",
     "Something your browser sent was malformed — a broken link, a mangled "
     "form, a cookie gone stale. Sending the same thing again won't help; "
     "starting over will.",
     ["home", "back"]),
    ("401", "Unauthorized", "4xx · Client", "iris", "Iris",
     "This door opens when you sign in.",
     "The page is here, but it only opens for a session, and this request "
     "didn't bring one. Sign in, then come back to it.",
     ["signin", "home"]),
    ("403", "Forbidden", "4xx · Client", "field", "Force field",
     "You can see it from here. You can't go in.",
     "You're known, but this place isn't open to your account. If you think "
     "it should be, ask whoever runs it — signing in again won't change the "
     "answer.",
     ["home", "back"]),
    ("404", "Not found", "4xx · Client", "radar", "Radar",
     "Nothing at these coordinates.",
     "The address was searched and nothing answered. It may have moved, "
     "been renamed, or never existed — the link that brought you here might "
     "be older than the page.",
     ["home", "back"]),
    ("405", "Method not allowed", "4xx · Client", "drum", "Drum",
     "Right address, wrong kind of request.",
     "This page exists but doesn't take the method that was used. That is "
     "usually a form or a script knocking on the wrong door, not something "
     "you did.",
     ["home", "back"]),
    ("408", "Request timeout", "4xx · Client", "clock", "Dial",
     "The server stopped waiting.",
     "Your request took longer to arrive than the server was willing to "
     "wait — usually a slow or interrupted connection. Trying again is safe.",
     ["retry", "home"]),
    ("410", "Gone", "4xx · Client", "dust", "Dust",
     "This was here. It's gone for good.",
     "Not lost, not moved — removed on purpose, and nothing replaced it. "
     "Links to it won't come back to life; you can let the bookmark go.",
     ["home", "back"]),
    ("413", "Content too large", "4xx · Client", "press", "Overflow",
     "That's more than this server takes in one go.",
     "What you tried to send is over the size limit. Make it smaller — "
     "fewer files at once, or a lighter version — and send it again.",
     ["back", "home"]),
    ("429", "Too many requests", "4xx · Client", "bucket", "Rate gate",
     "Easy — that was a lot of requests.",
     "You've hit the rate limit. Nothing is broken; the server needs a "
     "moment. The button wakes up when the cool-down is over.",
     ["retry", "home"]),
    ("500", "Internal server error", "5xx · Server", "tesseract", "Tesseract",
     "Something broke on our side.",
     "The server hit a fault it didn't expect while working on your "
     "request. It isn't you. Trying again often works; if it keeps "
     "happening, it's ours to fix.",
     ["retry", "home"]),
    ("502", "Bad gateway", "5xx · Server", "gateway", "Broken link",
     "The server behind this one answered nonsense.",
     "This server passed your request on and got back a reply it couldn't "
     "use. Usually the service behind it is restarting — give it a moment.",
     ["retry", "home"]),
    ("503", "Service unavailable", "5xx · Server", "eclipse", "Eclipse",
     "Down for maintenance. Back soon.",
     "The service is switched off on purpose for a little while — an "
     "update, a move, some care. Nothing you did, nothing you lost.",
     ["retry", "home"]),
    ("504", "Gateway timeout", "5xx · Server", "sonar", "Sonar",
     "We called the server behind this one. No answer.",
     "This server waited for the service it depends on and gave up before "
     "it replied. It may be overloaded or still starting — try again in a "
     "moment.",
     ["retry", "home"]),
    # ---- the odd ones ---------------------------------------------------
    ("418", "I'm a teapot", "4xx · RFC 2324", "teapot", "Teapot",
     "I'm a teapot. I don't do coffee.",
     "This server is, permanently and on principle, a teapot. It was asked "
     "to brew coffee and has declined. Drag the pot to turn it.",
     ["home", "back"]),
    ("420", "Enhance your calm", "4xx · Unofficial", "breathe", "Breath",
     "Enhance your calm.",
     "An old rate-limit code from early Twitter, and good advice besides. "
     "Breathe with the square for a moment, then try again.",
     ["retry", "home"]),
    ("450", "Blocked by parental controls", "4xx · Unofficial", "mosaic", "Mosaic",
     "Blocked by parental controls.",
     "A content filter on this network or device decided this page isn't "
     "for you. It isn't ours to switch off — ask whoever manages the filter.",
     ["home", "back"]),
    ("451", "Unavailable for legal reasons", "4xx · RFC 7725", "redact", "Redaction",
     "Unavailable for legal reasons.",
     "This content can't be shown here because of a legal demand. The "
     "number is a nod to Fahrenheit 451 — the temperature at which paper "
     "burns.",
     ["home", "back"]),
    ("701", "Meh", "7xx · Unofficial", "droop", "Droop",
     "Meh.",
     "From the unofficial 7xx list of developer errors. The server got your "
     "request and just… couldn't be bothered. Move the pointer; it perks up "
     "for a second.",
     ["home", "back"]),
    ("999", "Request denied", "9xx · Non-standard", "hole", "Event horizon",
     "Past the last code there is.",
     "999 isn't in any standard — some sites send it to turn away automated "
     "traffic. Either way, this request crossed a horizon, and nothing comes "
     "back from there.",
     ["home", "back"]),
]

STANDARD = [p for p in PAGES if p[0] in
            {"400", "401", "403", "404", "405", "408", "410", "413", "429",
             "500", "502", "503", "504"}]
ODD = [p for p in PAGES if p not in STANDARD]


def mark(cls, ghosts):
    def svg(piece_cls):
        paths = "".join(f'<path class="{piece_cls}" d="{d}"/>' for d in MARK_PATHS)
        return f'<svg class="mark__svg" viewBox="0 0 964 543" focusable="false">{paths}</svg>'
    out = f'<span class="mark {cls}" aria-hidden="true">{svg("piece")}'
    if ghosts:
        for g in ("r", "b"):
            out += f'<span class="mark__ghost mark__ghost--{g}">{svg("piece piece--ghost")}</span>'
    return out + "</span>"


def head(title, description):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="robots" content="noindex">
<base href="{BASE}">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description)}">
<link rel="preload" href="../assets/fonts/SpaceGrotesk-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/JetBrainsMono-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="../assets/logo/lucya_logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="../nebula.css">
<link rel="stylesheet" href="../fa-icons.css">
<link rel="stylesheet" href="errors.css">
<script src="errors.js" defer></script>
</head>"""


BACKDROP = """<div class="site-bg" aria-hidden="true">
  <picture>
    <source media="(max-width: 760px)" srcset="../assets/img/nova-square.svg">
    <img src="../assets/img/nova-wide-16-9.svg" alt="" decoding="async">
  </picture>
</div>
<canvas class="err__fx" aria-hidden="true"></canvas>"""


def bar(sub, here=False):
    current = ' aria-current="page"' if here else ""
    return f"""<nav class="nav" aria-label="Site">
  <div class="nav__inner">
    <a class="nav__brand" href="/">
      {mark("mark--nav", ghosts=True)}
      <span class="brand-text">
        <span class="brand-name">lucya</span>
        <span class="brand-sub">{sub}</span>
      </span>
    </a>
    <a class="btn btn--ghost btn--sm err__all" href="./"{current}><i class="fa fa-table-cells" aria-hidden="true"></i><span class="t">All codes</span></a>
  </div>
</nav>"""


def foot(meta):
    return f"""<footer class="foot">
  <div class="foot__inner">
    <span class="foot__brand">{mark("mark--foot", ghosts=False)}<span class="foot__wordmark">lucya</span></span>
    <span class="foot__meta">{meta}</span>
  </div>
</footer>"""


ACTIONS = {
    "home":   ('<a class="btn{p}" href="/"><i class="fa fa-house" aria-hidden="true"></i> Home</a>'),
    "back":   ('<button class="btn{p}" type="button" data-back hidden><i class="fa fa-chevron-left" aria-hidden="true"></i> Back</button>'),
    "retry":  ('<button class="btn{p}" type="button" data-retry hidden><i class="fa fa-clock-rotate-left" aria-hidden="true"></i> <span data-retry-label>Try again</span></button>'),
    "signin": ('<a class="btn{p}" href="/login" data-open><i class="fa fa-arrow-right" aria-hidden="true"></i> Sign in</a>'),
}


def actions(keys):
    out = []
    for i, k in enumerate(keys):
        out.append(ACTIONS[k].format(p=" btn--primary" if i == 0 else ""))
    return "\n        ".join(out)


# What a scene puts into the DOM besides the canvas: readouts, and the two
# scenes whose subject is text or a control.
def stage(fx):
    hud = '<p class="err__hud" data-hud aria-hidden="true"></p>'
    if fx == "redact":
        words = ("Following a demand received under the laws of your region, "
                 "the content at this address has been withheld. The demand, its "
                 "author and its scope are themselves subject to the same "
                 "restriction.").split()
        body = " ".join(f'<span class="w">{escape(w)}</span>' for w in words)
        return f"""<div class="err__notice" aria-hidden="true">
            <p class="err__notice-head"><span>Notice</span><span>Ref · withheld</span></p>
            <p class="err__notice-body">{body}</p>
            <p class="err__notice-foot"><span>Paper ignites</span><span>451 °F · 233 °C</span></p>
          </div>
          {hud}"""
    if fx == "mosaic":
        return f"""<div class="err__lock">
            <i class="fa fa-shield-halved" aria-hidden="true"></i>
            <p class="err__lock-t">Content filter</p>
            <span class="switch-wrap">
              <span class="switch__word" aria-hidden="true">On</span>
              <button class="switch" type="button" role="switch" aria-checked="true" aria-label="Content filter (managed by your administrator)" disabled></button>
            </span>
          </div>
          {hud}"""
    return hud


def wait(fx):
    if fx == "bucket":
        return """
        <div class="err__wait">
          <p class="err__wait-top" aria-hidden="true"><span>Cool-down</span><b data-wait-n>—</b></p>
          <span class="meter" role="meter" aria-label="Cool-down remaining" aria-valuemin="0" aria-valuemax="30" aria-valuenow="30" data-wait><span class="meter__fill"></span></span>
        </div>"""
    if fx == "breathe":
        return """
        <div class="err__wait" aria-hidden="true">
          <p class="err__wait-top"><span data-breath-phase>Breathe in</span><b data-breath-n>—</b></p>
          <span class="meter" data-wait><span class="meter__fill"></span></span>
        </div>"""
    return ""


def digits(code):
    return "".join(f'<span class="d">{c}</span>' for c in code)


def page(p):
    code, reason, cls, fx, _name, title, lead, acts = p
    klass, phrase = cls.split(" · ")
    body_cls = "err"
    if fx == "tesseract":
        body_cls += " err--tear"
    if fx == "droop":
        body_cls += " err--meh"
    extra = ' data-retry-after="30"' if fx == "bucket" else ""
    return f"""{head(f"{code} — {reason}", f"{code} {reason}. {title}")}
<body class="{body_cls}" data-fx="{fx}"{extra}>

{BACKDROP}

{bar(f"Error <b>{code}</b>")}

<main class="err__main">
  <div class="err__copy">
    <p class="section__doc">
      <span>Status <b>{code}</b></span>
      <span>{escape(reason)}</span>
      <span>Class <b>{klass}</b> {escape(phrase)}</span>
      <span data-now-wrap hidden>At <b><time data-now></time></b></span>
    </p>
    <p class="err__code" aria-hidden="true" data-text="{code}">{digits(code)}</p>
    <h1 class="editorial-title">{escape(title)}</h1>
    <p class="err__lead">{escape(lead)}</p>{wait(fx)}
    <div class="err__acts">
        {actions(acts)}
    </div>
  </div>
  <div class="err__stage">
          {stage(fx)}
  </div>
</main>

{foot(f"Status {code}")}

</body>
</html>
"""


def tile(p):
    code, reason, cls, fx, name, title, _lead, _acts = p
    return f"""      <li class="card err-tile">
        <a href="{code}.html">
          <span class="err-tile__face">
            <span class="err-tile__n">{code}</span>
            <span class="err-tile__fx">{escape(name)}</span>
          </span>
          <span class="card__cap">
            <span class="card__meta"><span>{escape(reason)}</span><span>{escape(cls)}</span></span>
            <span class="card__name">{escape(title)}</span>
          </span>
        </a>
      </li>"""


def catalogue():
    std = "\n".join(tile(p) for p in STANDARD)
    odd = "\n".join(tile(p) for p in ODD)
    return f"""{head("Error pages — Nebula", "Every error page in the Nebula set, each with its own scene.")}
<body class="err" data-fx="stars">

{BACKDROP}

{bar("Error pages", here=True)}

<main class="err-cat">
  <header class="err-cat__head">
    <p class="section__doc">
      <span>Set <b>{len(PAGES)}</b> pages</span>
      <span>Standard <b>{len(STANDARD)}</b></span>
      <span>Odd <b>{len(ODD)}</b></span>
    </p>
    <h1 class="editorial-title editorial-title--hero">When it goes wrong.</h1>
    <p class="err__lead">
      An error page is the one screen with nothing else on it, so each of
      these gets a scene — drawn from the tokens, so an app's accent repaints
      it, and with a still frame for anyone who asked their system for less
      motion. Open one; most of them answer the pointer.
    </p>
  </header>

  <section aria-labelledby="std">
    <h2 class="eyebrow" id="std"><i class="fa fa-layer-group" aria-hidden="true"></i> The standard set <span class="eyebrow__n">{len(STANDARD)}</span></h2>
    <ul class="card-grid">
{std}
    </ul>
  </section>

  <section aria-labelledby="odd">
    <h2 class="eyebrow" id="odd"><i class="fa fa-star" aria-hidden="true"></i> The odd ones <span class="eyebrow__n">{len(ODD)}</span></h2>
    <ul class="card-grid">
{odd}
    </ul>
  </section>
</main>

{foot("Nebula · error pages")}

</body>
</html>
"""


def main():
    for p in PAGES:
        (HERE / f"{p[0]}.html").write_text(page(p), encoding="utf-8")
    (HERE / "index.html").write_text(catalogue(), encoding="utf-8")
    print(f"wrote {len(PAGES)} pages and the catalogue to {HERE}")


if __name__ == "__main__":
    main()
