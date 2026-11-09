#!/usr/bin/env python3
"""nebula_lint - the six rules, checked by a machine instead of by memory.

NEBULA.md says every rule can be checked: rule 1 by counting, rules 2 and 5
by grep, rule 3 by reading the token block, rule 6 by toggling a switch in
the OS. This is the part of that which a script can do, so a sheet that
drifts is caught at commit time rather than by the next person to look.

    python tools/nebula_lint.py nebula.css
    python tools/nebula_lint.py ../app/static/style.css index.html

No dependencies. Exit status 1 when anything is found, so it can sit in a
pre-commit hook or a CI step as it is.

    python tools/nebula_lint.py --version ../app/static/nebula.css

checks COPIES instead: which Nebula version each one is (the header line
and --nebula-version must agree), against the nebula.css next to this
script. CHANGELOG.md says how to move a copy forward.

What it checks
  rule-1  a raw hex colour outside a :root token block - colour is a
          token, and a hex in a component is a second palette
  rule-2  a border-radius that is not 0, var(--radius) or 50%
  rule-3  backdrop-filter without its -webkit- twin (Safari still ships
          only the prefixed property, and a pane without it is a flat
          translucent box over an unblurred backdrop) - and the reverse
  rule-5  a raw px in padding / margin / gap / font-size / letter-spacing,
          and a raw duration in a transition or an animation
  csp     a style="" attribute in HTML, which a strict CSP drops silently
  rule-1  (HTML) a .hue-* kind colour on anything but an avatar, a tag
          or a mark - kinds are for identities and categories only

An exception is written where it is made, on the same line, with a reason:

    font-size:16px; /* nebula-allow: px - iOS zoom threshold */

Kinds: hex, radius, px, duration, webkit, style. A bare allow without a
reason is still an allow; the reason is for the next reader, not for this
script. `calc(… * var(--display-scale))` is allowed without a marker,
because a display face brings its own idea of how much of the em it inks.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path

ALLOW = re.compile(r"nebula-allow:\s*([a-z, ]+)")
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RAW_PX = re.compile(r"(?<![\w.-])\d*\.?\d+px\b")
RAW_TIME = re.compile(r"(?<![\w.-])\d*\.?\d+m?s\b")
SPACING_PROPS = re.compile(r"^(padding|margin|gap|row-gap|column-gap|font-size|letter-spacing)(-[a-z-]+)?$")
MOTION_PROPS = re.compile(r"^(transition|animation)(-duration|-delay)?$")
RADIUS_OK = {"0", "var(--radius)", "50%"}
KIND_CLASS = re.compile(r'class="([^"]*\bhue-[a-z]+[^"]*)"')
KIND_OWNERS = {"avatar", "tag", "mark"}


@dataclass
class Finding:
    path: str
    line: int
    rule: str
    message: str

    def __str__(self) -> str:
        return f"{self.path}:{self.line}  {self.rule:<6}  {self.message}"


def allows_by_line(text: str) -> dict[int, set[str]]:
    """Marker comments, read before comments are stripped."""
    out: dict[int, set[str]] = {}
    for n, line in enumerate(text.splitlines(), 1):
        m = ALLOW.search(line)
        if m:
            out[n] = {k.strip() for k in m.group(1).split(",") if k.strip()}
    return out


def strip_comments(text: str) -> str:
    """Blank out /* … */ but keep every newline, so line numbers hold."""
    return re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), text, flags=re.S)


def walk(text: str):
    """Yield (block_prelude_stack, declarations) for every rule block.

    declarations is a list of (line, property, value). Deliberately small:
    it understands nesting (@layer, @media, @supports, @container), which
    is all this sheet and its apps use, and nothing else.
    """
    stack: list[tuple[str, list]] = [("", [])]
    buf, buf_line, line = "", 0, 1
    for ch in text:
        if ch == "\n":
            line += 1
        if ch == "{":
            stack.append((buf.strip(), []))
            buf = ""
        elif ch in ";}":
            decl = buf.strip()
            if ":" in decl and not decl.startswith("@"):
                prop, _, value = decl.partition(":")
                stack[-1][1].append((buf_line, prop.strip().lower(), value.strip()))
            buf = ""
            if ch == "}" and len(stack) > 1:
                prelude, decls = stack.pop()
                yield [p for p, _ in stack] + [prelude], decls
        else:
            if not buf.strip() and not ch.isspace():
                buf_line = line
            buf += ch


def lint_css(path: Path) -> list[Finding]:
    raw = path.read_text(encoding="utf-8")
    allow = allows_by_line(raw)
    found: list[Finding] = []

    def ok(n: int, kind: str) -> bool:
        return kind in allow.get(n, set())

    for preludes, decls in walk(strip_comments(raw)):
        selector = preludes[-1]
        in_tokens = selector.startswith(":root") or selector.startswith("html[") or selector.startswith(".fx-lite")
        in_keyframes = any(p.startswith("@keyframes") for p in preludes)
        props = {p for _, p, _ in decls}

        for n, prop, value in decls:
            # rule 1 - colour is a token
            if not in_tokens and not prop.startswith("--") and HEX.search(value) and not ok(n, "hex"):
                found.append(Finding(str(path), n, "rule-1", f"raw hex in `{prop}` - make it a token ({HEX.search(value).group(0)})"))
            # rule 2 - square
            if prop == "border-radius" and value not in RADIUS_OK and not ok(n, "radius"):
                found.append(Finding(str(path), n, "rule-2", f"border-radius:{value} - corners are var(--radius)"))
            # rule 5 - measure
            if SPACING_PROPS.match(prop) and RAW_PX.search(value) and "--display-scale" not in value and not ok(n, "px"):
                found.append(Finding(str(path), n, "rule-5", f"raw px in `{prop}:{value}` - take it off the scale"))
            if MOTION_PROPS.match(prop) and not in_keyframes and any(float(re.sub(r"m?s$", "", t)) != 0 for t in RAW_TIME.findall(value)) and not ok(n, "duration"):
                found.append(Finding(str(path), n, "rule-5", f"raw duration in `{prop}` - use --dur-* or a named set piece"))

        # rule 3 - the blur needs both spellings
        if decls:
            first = decls[0][0]
            if "backdrop-filter" in props and "-webkit-backdrop-filter" not in props and not ok(first, "webkit"):
                line = next(n for n, p, _ in decls if p == "backdrop-filter")
                found.append(Finding(str(path), line, "rule-3", "backdrop-filter without -webkit-backdrop-filter (Safari)"))
            if "-webkit-backdrop-filter" in props and "backdrop-filter" not in props and not ok(first, "webkit"):
                line = next(n for n, p, _ in decls if p == "-webkit-backdrop-filter")
                found.append(Finding(str(path), line, "rule-3", "-webkit-backdrop-filter without backdrop-filter"))
    return found


def lint_html(path: Path) -> list[Finding]:
    found: list[Finding] = []
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if re.search(r"\sstyle\s*=", line) and "nebula-allow: style" not in line:
            found.append(Finding(str(path), n, "csp", "style=\"\" attribute - a strict CSP drops it; set a custom property from script"))
        # rule 1 - a kind colour belongs to an identity or a category only
        for m in KIND_CLASS.finditer(line):
            classes = set(m.group(1).split())
            if any(c.startswith("hue-") for c in classes) and not classes & KIND_OWNERS:
                found.append(Finding(str(path), n, "rule-1", "a .hue-* on something that is not an avatar, a tag or a mark - kind colours are for identities and categories only"))
    return found


REFERENCE = Path(__file__).resolve().parent.parent / "nebula.css"
HEADER_VERSION = re.compile(r"NEBULA\s+(\d+\.\d+\.\d+)")
TOKEN_VERSION = re.compile(r"--nebula-version\s*:\s*[\"'](\d+\.\d+\.\d+)[\"']")
# nebula.js says it twice as well: its header, and the VERSION it exports
JS_VERSION = re.compile(r"var\s+VERSION\s*=\s*[\"'](\d+\.\d+\.\d+)[\"']")
REFERENCE_JS = REFERENCE.with_suffix(".js")


def sheet_version(path: Path) -> tuple[str | None, str | None]:
    """(header version, in-file version) of a copy: --nebula-version for the
    sheet, VERSION for nebula.js. None where absent."""
    text = path.read_text(encoding="utf-8")
    head = HEADER_VERSION.search(text[:400])
    token = (JS_VERSION if path.suffix == ".js" else TOKEN_VERSION).search(text)
    return (head.group(1) if head else None, token.group(1) if token else None)


def as_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(x) for x in v.split("."))


def check_versions(paths: list[str]) -> int:
    """--version: which Nebula each copy is, against the one next to this
    script. Exit 1 when a copy is behind, unversioned, or disagrees with
    itself; 0 when every copy is current."""
    ref_head, ref_token = sheet_version(REFERENCE)
    if ref_head is None or ref_head != ref_token:
        print(f"{REFERENCE}: reference is inconsistent (header {ref_head}, token {ref_token})")
        return 2
    if REFERENCE_JS.exists():
        js_head, js_token = sheet_version(REFERENCE_JS)
        if js_head != ref_head or js_token != ref_head:
            print(f"{REFERENCE_JS}: says {js_head}/{js_token}, the sheet says {ref_head} - they ship together, bump both")
            return 2
    print(f"reference  {ref_head}  {REFERENCE}")
    worst = 0
    for arg in paths:
        p = Path(arg)
        if not p.exists():
            print(f"{arg}: no such file", file=sys.stderr)
            return 2
        head, token = sheet_version(p)
        if head is None and token is None:
            print(f"{arg}: unversioned (1.x) - behind {ref_head}; read CHANGELOG.md from 1.x on")
            worst = 1
        elif head != token:
            print(f"{arg}: header says {head}, --nebula-version says {token} - the copy was edited by hand")
            worst = 1
        elif as_tuple(head) < as_tuple(ref_head):
            major = as_tuple(head)[0] < as_tuple(ref_head)[0]
            print(f"{arg}: {head} - behind {ref_head}"
                  + (" (a MAJOR step: read Breaking in CHANGELOG.md)" if major else " (no breaking change)"))
            worst = 1
        elif as_tuple(head) > as_tuple(ref_head):
            print(f"{arg}: {head} - AHEAD of the reference {ref_head}; the reference is the one to update")
            worst = 1
        else:
            print(f"{arg}: {head} - current")
    return worst


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__.strip().split("\n\n")[1])
        return 2
    if argv[0] == "--version":
        return check_versions(argv[1:] or [str(REFERENCE)])
    findings: list[Finding] = []
    for arg in argv:
        p = Path(arg)
        if not p.exists():
            print(f"{arg}: no such file", file=sys.stderr)
            return 2
        findings += lint_html(p) if p.suffix in {".html", ".htm"} else lint_css(p)
    for f in findings:
        print(f)
    files = len(argv)
    if findings:
        print(f"\n{len(findings)} finding(s) in {files} file(s).")
        return 1
    print(f"Clean: {files} file(s) speak the language.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
