#!/usr/bin/env python3
"""Nebula Mono and Nebula Display, drawn from one table of skeletons.

Every glyph is a few strokes on a 4 x 6 grid (x 0..4, cap height 6,
x-height 4.5, ascender 6.5, descender -2). A stroke is a polyline; a corner
written (x, y, k) is cut at 45 degrees instead of rounded, because the
language has no radius (rule 2) and a bowl here is a cut box, not a curve.

The two faces are the same skeletons under different parameters:

  Nebula Mono     the chrome voice. 600 units wide, four static weights
                  (400/500/600/700), one stroke width each.
  Nebula Display  the wordmark voice. Wide, one weight, capitals only:
                  lowercase codepoints map onto the capitals.

The grid maps to font units with the stroke inset, so an outer edge always
lands on its metric: a stem on the baseline ends *on* the baseline at every
weight, and only the counters shrink as the weight rises.

    pip install fonttools brotli skia-pathops
    python3 assets/fonts/build.py

writes NebulaMono-{400,500,600,700}.woff2 and NebulaDisplay-400.woff2 next
to this file. Static per-weight instances, never a variable font (NEBULA.md,
step 4, rule 1).
"""

import math
import os

import pathops
from fontTools.agl import UV2AGL
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = "1.000"

# ---------------------------------------------------------------- the grid
CAP, XH, ASC, DSC = 6, 4.5, 6.5, -2

K = 0.8          # the default cut, in chamfer units
D = "dot"        # marker for a square dot


def box(x0, y0, x1, y1, k=K):
    """A closed, cut box: the shape every bowl is made of."""
    return {"closed": True,
            "pts": [(x0, y0, k), (x0, y1, k), (x1, y1, k), (x1, y0, k)]}


def dot(x, y, size=1.25):
    return {"dot": (x, y, size)}


# ------------------------------------------------------------ the skeletons
# Each entry: a list of strokes. An open stroke is a list of points; a point
# with a third value is a cut corner of that size.

G = {}

# capitals
G["A"] = [[(0, 0), (0, 6, 2.0), (4, 6, 2.0), (4, 0)], [(0, 2.6), (4, 2.6)]]
G["B"] = [[(0, 0), (0, 6), (3.3, 6, K), (3.3, 3.1)],
          [(0, 3.1), (4, 3.1, K), (4, 0, K), (0, 0)]]
G["C"] = [[(4, 6), (0, 6, K), (0, 0, K), (4, 0)]]
G["D"] = [[(0, 0), (0, 6), (4, 6, 1.4), (4, 0, 1.4), (0, 0)]]
G["E"] = [[(4, 6), (0, 6), (0, 0), (4, 0)], [(0, 3.1), (3.3, 3.1)]]
G["F"] = [[(4, 6), (0, 6), (0, 0)], [(0, 3.1), (3.3, 3.1)]]
G["G"] = [[(4, 6), (0, 6, K), (0, 0, K), (4, 0), (4, 2.8), (2.1, 2.8)]]
G["H"] = [[(0, 0), (0, 6)], [(4, 0), (4, 6)], [(0, 3.1), (4, 3.1)]]
G["I"] = [[(2, 0), (2, 6)], [(0.6, 6), (3.4, 6)], [(0.6, 0), (3.4, 0)]]
G["J"] = [[(1.2, 6), (4, 6), (4, 0, K), (0, 0, K), (0, 1.8)]]
G["K"] = [[(0, 0), (0, 6)], [(0, 3), (1.5, 3), (4, 6)], [(1.5, 3), (4, 0)]]
G["L"] = [[(0, 6), (0, 0), (4, 0)]]
G["M"] = [[(0, 0), (0, 6), (1, 6), (2, 3.2), (3, 6), (4, 6), (4, 0)]]
G["N"] = [[(0, 0), (0, 6), (4, 0), (4, 6)]]
G["O"] = [box(0, 0, 4, 6)]
G["P"] = [[(0, 0), (0, 6), (4, 6, K), (4, 2.8, K), (0, 2.8)]]
G["Q"] = [box(0, 0, 4, 6), [(2.5, 1.7), (4.2, -0.8)]]
G["R"] = [[(0, 0), (0, 6), (4, 6, K), (4, 3, K), (0, 3)], [(2.3, 3), (4, 0)]]
G["S"] = [[(4, 6), (0, 6, K), (0, 3.1, K), (4, 3.1, K), (4, 0, K), (0, 0)]]
G["T"] = [[(0, 6), (4, 6)], [(2, 6), (2, 0)]]
G["U"] = [[(0, 6), (0, 0, K), (4, 0, K), (4, 6)]]
G["V"] = [[(0, 6), (1.55, 0), (2.45, 0), (4, 6)]]
G["W"] = [[(0, 6), (0, 0), (1, 0), (2, 2.8), (3, 0), (4, 0), (4, 6)]]
G["X"] = [[(0, 6), (4, 0)], [(4, 6), (0, 0)]]
G["Y"] = [[(0, 6), (2, 3)], [(4, 6), (2, 3), (2, 0)]]
G["Z"] = [[(0, 6), (4, 6), (0, 0), (4, 0)]]

# lowercase
G["a"] = [[(0.3, 4.5), (4, 4.5, K), (4, 0)],
          [(4, 2.5), (0, 2.5, 0.6), (0, 0, 0.6), (4, 0)]]
G["b"] = [[(0, 6.5), (0, 0), (4, 0, K), (4, 4.5, K), (0, 4.5)]]
G["c"] = [[(4, 4.5), (0, 4.5, K), (0, 0, K), (4, 0)]]
G["d"] = [[(4, 6.5), (4, 0), (0, 0, K), (0, 4.5, K), (4, 4.5)]]
G["e"] = [[(0, 2.3), (4, 2.3), (4, 4.5, K), (0, 4.5, K), (0, 0, K), (4, 0)]]
G["f"] = [[(4, 6.5), (1.6, 6.5, K), (1.6, 0)], [(0, 4.5), (3.6, 4.5)]]
G["g"] = [[(4, 0), (0, 0, K), (0, 4.5, K), (4, 4.5), (4, -2, K), (0, -2)]]
G["h"] = [[(0, 6.5), (0, 0)], [(0, 4.5), (4, 4.5, K), (4, 0)]]
G["i"] = [[(0.6, 4.5), (2, 4.5), (2, 0)], [(0.4, 0), (3.6, 0)], dot(2, 6.1)]
G["j"] = [[(0.8, 4.5), (3, 4.5), (3, -2, K), (0, -2)], dot(3, 6.1)]
G["k"] = [[(0, 6.5), (0, 0)], [(0, 2.1), (1.4, 2.1), (4, 4.5)], [(1.4, 2.1), (4, 0)]]
G["l"] = [[(0.6, 6.5), (2, 6.5), (2, 0, K), (4, 0)]]
G["m"] = [[(0, 0), (0, 4.5), (4, 4.5, 0.6), (4, 0)], [(2, 4.5), (2, 0)]]
G["n"] = [[(0, 0), (0, 4.5), (4, 4.5, K), (4, 0)]]
G["o"] = [box(0, 0, 4, 4.5)]
G["p"] = [[(0, -2), (0, 4.5), (4, 4.5, K), (4, 0, K), (0, 0)]]
G["q"] = [[(4, -2), (4, 4.5), (0, 4.5, K), (0, 0, K), (4, 0)]]
G["r"] = [[(0, 0), (0, 4.5)], [(0, 4.5), (4, 4.5, K), (4, 3.3)]]
G["s"] = [[(4, 4.5), (0, 4.5, 0.6), (0, 2.3, 0.6), (4, 2.3, 0.6), (4, 0, 0.6), (0, 0)]]
G["t"] = [[(1.6, 6.2), (1.6, 0, K), (4, 0)], [(0, 4.5), (3.8, 4.5)]]
G["u"] = [[(0, 4.5), (0, 0, K), (4, 0)], [(4, 4.5), (4, 0)]]
G["v"] = [[(0, 4.5), (1.55, 0), (2.45, 0), (4, 4.5)]]
G["w"] = [[(0, 4.5), (0, 0), (1, 0), (2, 2.2), (3, 0), (4, 0), (4, 4.5)]]
G["x"] = [[(0, 4.5), (4, 0)], [(4, 4.5), (0, 0)]]
G["y"] = [[(0, 4.5), (0, 0, K), (4, 0)], [(4, 4.5), (4, -2, K), (0, -2)]]
G["z"] = [[(0, 4.5), (4, 4.5), (0, 0), (4, 0)]]
G["germandbls"] = [[(0, 0), (0, 6.5, K), (3.6, 6.5, K), (3.6, 5.1), (1.7, 3.9)],
                   [(1.7, 3.9), (4, 3.9, K), (4, 0, K), (1.7, 0)]]

# figures: cap height, one width, so every count stays tabular
G["zero"] = [box(0, 0, 4, 6), [(2.9, 4.3), (1.1, 1.7)]]
G["one"] = [[(0.5, 4.6), (2, 6), (2, 0)], [(0.4, 0), (3.6, 0)]]
G["two"] = [[(0, 6), (4, 6, K), (4, 3.1, K), (0, 3.1), (0, 0), (4, 0)]]
G["three"] = [[(0, 6), (4, 6, K), (4, 0, K), (0, 0)], [(1.2, 3.1), (4, 3.1)]]
G["four"] = [[(0, 6), (0, 2), (4, 2)], [(3, 4), (3, 0)]]
G["five"] = [[(4, 6), (0, 6), (0, 3.4), (4, 3.4, K), (4, 0, K), (0, 0)]]
G["six"] = [[(4, 6), (0, 6, K), (0, 0, K), (4, 0, K), (4, 3.4, K), (0, 3.4)]]
G["seven"] = [[(0, 6), (4, 6), (1.6, 0)]]
G["eight"] = [box(0.3, 3.1, 3.7, 6), box(0, 0, 4, 3.1)]
G["nine"] = [[(0, 0), (4, 0, K), (4, 6, K), (0, 6, K), (0, 2.6, K), (4, 2.6)]]

# punctuation and symbols
G["period"] = [dot(2, 0)]
G["comma"] = [dot(2, 0), [(2.1, 0.3), (1.4, -1.3)]]
G["colon"] = [dot(2, 0), dot(2, 3.8)]
G["semicolon"] = [dot(2, 0), [(2.1, 0.3), (1.4, -1.3)], dot(2, 3.8)]
G["exclam"] = [[(2, 6), (2, 1.9)], dot(2, 0)]
G["question"] = [[(0, 6), (4, 6, K), (4, 3.2, K), (2, 3.2), (2, 1.9)], dot(2, 0)]
G["quotedbl"] = [[(1.2, 6), (1.2, 4.4)], [(2.8, 6), (2.8, 4.4)]]
G["quotesingle"] = [[(2, 6), (2, 4.4)]]
G["grave"] = [[(1.3, 6.6), (2.6, 5.4)]]
G["hyphen"] = [[(0.6, 2.6), (3.4, 2.6)]]
G["underscore"] = [[(0, -1.2), (4, -1.2)]]
G["plus"] = [[(0.4, 2.6), (3.6, 2.6)], [(2, 0.9), (2, 4.3)]]
G["equal"] = [[(0.4, 1.8), (3.6, 1.8)], [(0.4, 3.4), (3.6, 3.4)]]
G["asterisk"] = [[(0.7, 5.0), (3.3, 2.9)], [(3.3, 5.0), (0.7, 2.9)], [(2, 5.6), (2, 2.3)]]
G["slash"] = [[(0.3, -0.6), (3.7, 6.6)]]
G["backslash"] = [[(3.7, -0.6), (0.3, 6.6)]]
G["bar"] = [[(2, -1.6), (2, 7.2)]]
G["parenleft"] = [[(3.2, 7), (1.4, 7, 1.3), (1.4, -1, 1.3), (3.2, -1)]]
G["parenright"] = [[(0.8, 7), (2.6, 7, 1.3), (2.6, -1, 1.3), (0.8, -1)]]
G["bracketleft"] = [[(3.2, 7), (1.3, 7), (1.3, -1), (3.2, -1)]]
G["bracketright"] = [[(0.8, 7), (2.7, 7), (2.7, -1), (0.8, -1)]]
G["braceleft"] = [[(3.4, 7), (2.0, 7), (2.0, 3.6), (0.7, 3), (2.0, 2.4), (2.0, -1), (3.4, -1)]]
G["braceright"] = [[(0.6, 7), (2.0, 7), (2.0, 3.6), (3.3, 3), (2.0, 2.4), (2.0, -1), (0.6, -1)]]
G["less"] = [[(3.6, 4.6), (0.4, 2.6), (3.6, 0.6)]]
G["greater"] = [[(0.4, 4.6), (3.6, 2.6), (0.4, 0.6)]]
G["asciicircum"] = [[(0.6, 4.2), (2, 6), (3.4, 4.2)]]
G["asciitilde"] = [[(0.3, 2.2), (1.2, 3.2), (2.8, 2.0), (3.7, 3.0)]]
G["numbersign"] = [[(1.0, 0.4), (1.0, 5.6)], [(3.0, 0.4), (3.0, 5.6)],
                   [(0, 1.8), (4, 1.8)], [(0, 4.2), (4, 4.2)]]
G["dollar"] = G["S"] + [[(2, -0.9), (2, 6.9)]]
G["percent"] = [dot(0.7, 5.3, 1.9), [(0.4, 0), (3.6, 6)], dot(3.3, 0.7, 1.9)]
G["ampersand"] = [[(4, 0), (1.2, 3.4), (1.2, 6, 0.6), (3.3, 6, 0.6), (3.3, 4.3), (0, 2.6),
                   (0, 0, 0.6), (2.6, 0), (4, 1.8)]]
# the @'s own a is a solid core: a second box inside the first closes up
# at every weight past 400
G["at"] = [{"fill": [(1.15, 1.35), (2.85, 1.35), (2.85, 4.25), (1.15, 4.25)]}, [(3, 4.4), (3, 1.2)],
           [(3, 1.2), (4, 1.2), (4, 6, K), (0, 6, K), (0, 0, K), (3.6, 0)]]
G["Euro"] = [[(4, 6), (1, 6, K), (1, 0, K), (4, 0)], [(0, 3.6), (2.8, 3.6)], [(0, 2.4), (2.8, 2.4)]]
G["degree"] = [box(1.1, 4.3, 2.9, 6, 0.5)]
G["periodcentered"] = [dot(2, 2.6)]
G["bullet"] = [dot(2, 2.6, 2.4)]
G["endash"] = [[(0, 2.6), (4, 2.6)]]
G["emdash"] = [[(-0.6, 2.6), (4.6, 2.6)]]
G["ellipsis"] = [dot(0.4, 0, 1.1), dot(2, 0, 1.1), dot(3.6, 0, 1.1)]
G["multiply"] = [[(0.8, 1.2), (3.2, 4.0)], [(3.2, 1.2), (0.8, 4.0)]]
G["guilsinglleft"] = [[(2.8, 4), (1.2, 2.6), (2.8, 1.2)]]
G["guilsinglright"] = [[(1.2, 4), (2.8, 2.6), (1.2, 1.2)]]
G["guillemotleft"] = [[(1.8, 4), (0.2, 2.6), (1.8, 1.2)], [(3.8, 4), (2.2, 2.6), (3.8, 1.2)]]
G["guillemotright"] = [[(0.2, 4), (1.8, 2.6), (0.2, 1.2)], [(2.2, 4), (3.8, 2.6), (2.2, 1.2)]]
G["quoteleft"] = [dot(2, 5.0), [(1.8, 5.0), (2.6, 6.3)]]
G["quoteright"] = [dot(2, 6.0), [(2.2, 6.0), (1.4, 4.7)]]
G["quotesinglbase"] = G["comma"]
G["quotedblleft"] = [dot(1.1, 5.0), [(0.9, 5.0), (1.7, 6.3)], dot(2.9, 5.0), [(2.7, 5.0), (3.5, 6.3)]]
G["quotedblright"] = [dot(1.1, 6.0), [(1.3, 6.0), (0.5, 4.7)], dot(2.9, 6.0), [(3.1, 6.0), (2.3, 4.7)]]
G["quotedblbase"] = [dot(1.1, 0), [(1.3, 0), (0.5, -1.3)], dot(2.9, 0), [(3.1, 0), (2.3, -1.3)]]
G["arrowright"] = [[(0, 2.6), (3.2, 2.6)], [(2.3, 4.2), (3.9, 2.6), (2.3, 1.0)]]
G["arrowleft"] = [[(4, 2.6), (0.8, 2.6)], [(1.7, 4.2), (0.1, 2.6), (1.7, 1.0)]]
G["arrowup"] = [[(2, 0), (2, 5.1)], [(0.4, 4.2), (2, 5.8), (3.6, 4.2)]]
G["arrowdown"] = [[(2, 6), (2, 0.9)], [(0.4, 1.8), (2, 0.2), (3.6, 1.8)]]
G["space"] = []

# Display draws its A as the wordmark's wedge, not as Mono's cut box: a
# capital set large next to the mark has to share the mark's stance
DISPLAY_G = {
    "A": [[(0, 0), (2, 6, "tip"), (4, 0)], {"foot": (4, 0, 0, 0, 0, 0.42)}],
    "V": [[(0, 6), (2, 0, "tip"), (4, 6)]],
}

# marks, drawn anywhere: build() seats each one a fixed gap above the
# x-height or the cap height, measured in font units, so a bolder weight
# with a taller dot still clears its letter
MARKS = {
    "dieresis": [dot(0.75, 5.9, 1.1), dot(3.25, 5.9, 1.1)],
    "acute": [[(1.5, 5.4), (2.7, 6.5)]],
    "grave": [[(1.3, 6.5), (2.5, 5.4)]],
    "circumflex": [[(0.8, 5.4), (2, 6.4), (3.2, 5.4)]],
    "tilde": [[(0.6, 5.5), (1.4, 6.3), (2.6, 5.5), (3.4, 6.3)]],
    "ring": [box(1.2, 5.3, 2.8, 6.8, 0.4)],
}

ACCENTED = {
    0x00C4: ("A", "dieresis"), 0x00D6: ("O", "dieresis"), 0x00DC: ("U", "dieresis"),
    0x00E4: ("a", "dieresis"), 0x00F6: ("o", "dieresis"), 0x00FC: ("u", "dieresis"),
    0x00CB: ("E", "dieresis"), 0x00EB: ("e", "dieresis"), 0x00CF: ("I", "dieresis"),
    0x00C9: ("E", "acute"), 0x00E9: ("e", "acute"), 0x00C8: ("E", "grave"), 0x00E8: ("e", "grave"),
    0x00CA: ("E", "circumflex"), 0x00EA: ("e", "circumflex"),
    0x00C1: ("A", "acute"), 0x00E1: ("a", "acute"), 0x00C0: ("A", "grave"), 0x00E0: ("a", "grave"),
    0x00C2: ("A", "circumflex"), 0x00E2: ("a", "circumflex"), 0x00C5: ("A", "ring"), 0x00E5: ("a", "ring"),
    0x00D3: ("O", "acute"), 0x00F3: ("o", "acute"), 0x00D4: ("O", "circumflex"), 0x00F4: ("o", "circumflex"),
    0x00DA: ("U", "acute"), 0x00FA: ("u", "acute"),
    0x00D1: ("N", "tilde"), 0x00F1: ("n", "tilde"),
}
# the dotted i takes its own dot off before a mark sits on it
DOTLESS = {"i": [[(0.6, 4.5), (2, 4.5), (2, 0)], [(0.4, 0), (3.6, 0)]]}
ACCENTED.update({0x00ED: ("dotlessi", "acute"), 0x00EF: ("dotlessi", "dieresis"),
                 0x00EE: ("dotlessi", "circumflex")})
G["dotlessi"] = DOTLESS["i"]

SINGLES = {
    0x00B7: "periodcentered", 0x2022: "bullet", 0x2013: "endash", 0x2014: "emdash",
    0x2026: "ellipsis", 0x00D7: "multiply", 0x2039: "guilsinglleft", 0x203A: "guilsinglright",
    0x00AB: "guillemotleft", 0x00BB: "guillemotright", 0x2018: "quoteleft", 0x2019: "quoteright",
    0x201A: "quotesinglbase", 0x201C: "quotedblleft", 0x201D: "quotedblright",
    0x201E: "quotedblbase", 0x2192: "arrowright", 0x2190: "arrowleft", 0x2191: "arrowup",
    0x2193: "arrowdown", 0x20AC: "Euro", 0x00B0: "degree", 0x00DF: "germandbls", 0x0131: "dotlessi",
    0x00A0: "space",
}


# ------------------------------------------------------------- the stroker
def unit(dx, dy):
    n = math.hypot(dx, dy)
    return (dx / n, dy / n)


def chamfer(pts, closed, cut):
    """Replace each (x, y, k) corner by two points k*cut units back along its legs."""
    out = []
    n = len(pts)
    for i, p in enumerate(pts):
        if len(p) < 3 or not p[2] or (not closed and i in (0, n - 1)):
            out.append(p[:2])
            continue
        if p[2] == TIP:
            out.append(p)
            continue
        x, y, k = p
        prev = pts[i - 1]
        nxt = pts[(i + 1) % n]
        a = unit(prev[0] - x, prev[1] - y)
        b = unit(nxt[0] - x, nxt[1] - y)
        # never cut more than ~45% of either leg
        la = math.hypot(prev[0] - x, prev[1] - y)
        lb = math.hypot(nxt[0] - x, nxt[1] - y)
        c = min(k * cut, 0.45 * la, 0.45 * lb)
        out.append((x + a[0] * c, y + a[1] * c))
        out.append((x + b[0] * c, y + b[1] * c))
    return out


TIP = "tip"   # a corner drawn as a sharp wedge instead of a cut


def flush_ends(pts, h, fixed=()):
    """Pull the free ends of a diagonal in, so that once the end is cut flat
    to the line its outer corner lands exactly where a square stroke's edge
    would: on the corner of the letter's box. The diagonal then runs straight
    into that corner, as Ethnocentric's do, and nothing is left for a clip to
    shave off into a second, vertical facet. Shifts are measured from where
    the end was drawn, and settle over a few passes because each one turns
    the segment a little."""
    orig = [tuple(p) for p in pts]
    pts = list(orig)
    ends = [(0, 1), (len(pts) - 1, len(pts) - 2)]
    for _ in range(6):
        for end, nb in ends:
            e, o = pts[end], pts[nb]
            d = unit(e[0] - o[0], e[1] - o[1])
            if abs(d[0]) < 1e-6 or abs(d[1]) < 1e-6:
                continue
            # the outer edge sits h off the centre line, so a flat cut puts
            # its corner h * (1 + cos) / sin past the end, not h past it
            if abs(d[1]) >= abs(d[0]):    # cut flat to a horizontal line
                shift = h * ((1 + abs(d[0])) / abs(d[1]) - 1)
                pts[end] = (orig[end][0] - math.copysign(shift, d[0]),) + orig[end][1:]
            else:                         # cut flat to a vertical line
                shift = h * ((1 + abs(d[1])) / abs(d[0]) - 1)
                pts[end] = (orig[end][0], orig[end][1] - math.copysign(shift, d[1])) + orig[end][2:]
    return pts


def wedge(pts, h):
    """Move each TIP corner inward along its bisector so the sharp outer
    point it grows lands where the stroke's edge would have been. Returns
    the points and the indices that are wedges."""
    out, tips = [], set()
    n = len(pts)
    for i, p in enumerate(pts):
        if len(p) < 3 or p[2] != TIP:
            out.append(p[:2])
            continue
        a = unit(pts[i - 1][0] - p[0], pts[i - 1][1] - p[1])
        b = unit(pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1])
        bis = (a[0] + b[0], a[1] + b[1])
        half = math.acos(max(-1, min(1, a[0] * b[0] + a[1] * b[1]))) / 2
        k = unit(*bis)
        d = h / math.sin(half) - h
        out.append((p[0] + k[0] * d, p[1] + k[1] * d))
        tips.add(i)
    return out, tips


def intersect(p, d, q, e):
    """Point where p + t*d meets q + s*e (None if parallel)."""
    den = d[0] * e[1] - d[1] * e[0]
    if abs(den) < 1e-9:
        return None
    t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den
    return (p[0] + t * d[0], p[1] + t * d[1])


def end_cut(e, d, h, slant=0.0, butt=False):
    """The two corners of a stroke end at e travelling in d, cut flat to the
    axis it mostly runs along, so a diagonal still ends on the baseline.
    With a slant, a horizontal end is cut along (slant, 1) instead: a
    feather tip, its long edge flush with where a square end would be."""
    nl = (-d[1], d[0])
    left = (e[0] + nl[0] * h, e[1] + nl[1] * h)
    right = (e[0] - nl[0] * h, e[1] - nl[1] * h)
    if butt and abs(d[0]) > 1e-6 and abs(d[1]) > 1e-6:
        # a diagonal that ends on another stroke stops square on its
        # centre line: nothing pokes through the far side
        return left, right
    if abs(d[1]) >= abs(d[0]):
        y = e[1] + math.copysign(h, d[1])
        cutp, cutd = (e[0], y), (1, 0)
    else:
        x = e[0] + math.copysign(h - slant * h, d[0])
        cutp, cutd = (x, e[1]), (slant, 1)
    return intersect(left, d, cutp, cutd), intersect(right, d, cutp, cutd)


def stroke(pts, closed, h, miter=3.0, tips=(), slant=0.0, butt=False):
    """Polygons covering a polyline of half-width h: one quad per segment,
    one wedge per corner. The union happens later in pathops."""
    polys = []
    segs = list(zip(pts, pts[1:] + ([pts[0]] if closed else [])))
    dirs = [unit(b[0] - a[0], b[1] - a[1]) for a, b in segs]
    for i, ((a, b), d) in enumerate(zip(segs, dirs)):
        nl = (-d[1] * h, d[0] * h)
        if not closed and i == 0:
            r, l = end_cut(a, (-d[0], -d[1]), h, slant, butt)
            a_l, a_r = l, r
        else:
            a_l, a_r = (a[0] + nl[0], a[1] + nl[1]), (a[0] - nl[0], a[1] - nl[1])
        if not closed and i == len(segs) - 1:
            b_l, b_r = end_cut(b, d, h, slant, butt)
        else:
            b_l, b_r = (b[0] + nl[0], b[1] + nl[1]), (b[0] - nl[0], b[1] - nl[1])
        polys.append([a_l, b_l, b_r, a_r])
    corners = range(len(segs)) if closed else range(1, len(segs))
    for i in corners:
        d1, d2 = dirs[i - 1], dirs[i]
        v = segs[i][0]
        cross = d1[0] * d2[1] - d1[1] * d2[0]
        if abs(cross) < 1e-9:
            continue
        s = -1 if cross > 0 else 1
        A = (v[0] - s * d1[1] * h, v[1] + s * d1[0] * h)
        B = (v[0] - s * d2[1] * h, v[1] + s * d2[0] * h)
        M = intersect(A, d1, B, d2)
        if M and math.hypot(M[0] - v[0], M[1] - v[1]) <= (40 if i in tips else miter) * h:
            polys.append([v, A, M, B])
        else:
            polys.append([v, A, B])
    return polys


def area(poly):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(poly, poly[1:] + poly[:1])) / 2


# ------------------------------------------------------------- the faces
class Face:
    def __init__(self, family, style, weight, advance, side, cap, stroke_w, cut,
                 display=False, grid=(4, CAP), bottom=0, height=None):
        self.family, self.style, self.weight = family, style, weight
        self.adv, self.side, self.capu, self.w, self.cut = advance, side, cap, stroke_w, cut
        self.display = display
        self.gx, self.gy = grid
        self.bottom = bottom
        self.height = cap if height is None else height
        self.h = stroke_w / 2
        self.miter = 3.0   # past this a corner is bevelled, unless the face clips
        self.slant = 0.0   # horizontal ends: 0 cuts them square
        self.diamond = False   # dots: a square, or the eagle's tail
        self.butt = False      # diagonal ends: flat to the line, or square to the stroke
        self.flush = False     # diagonal ends pulled in so their corner meets the box
        self.gap = 30 + 0.45 * stroke_w   # mark to letter, grows with the dot
        self.uy = (self.height - stroke_w) / self.gy
        # a proportional face passes gx=None: square grid units, and each
        # glyph's advance follows from its own width on that grid
        self.ux = self.uy if self.gx is None else (advance - 2 * side - stroke_w) / self.gx

    def advance_for(self, gw):
        return round(2 * self.side + self.w + gw * self.ux)

    def map(self, x, y):
        """A skeleton point: the grid lives inside the stroke."""
        return (self.side + self.h + x * self.ux, self.bottom + self.h + y * self.uy)

    def map_outer(self, x, y):
        """A fill point: the grid is the ink's own edge."""
        return (self.side + x * (self.adv - 2 * self.side) / self.gx,
                self.bottom + y * self.height / self.gy)

    def outline(self, strokes):
        path = pathops.Path()
        polys = []
        drawn = []    # each stroke's points as stroked, for a foot to measure against
        feet = []
        for s in strokes:
            if isinstance(s, dict) and "foot" in s:
                feet.append(s["foot"])
                continue
            if isinstance(s, dict) and "dot" in s:
                x, y, size = s["dot"]
                cx, cy = self.map(x, y)
                r = self.w * size / 2
                if self.diamond:
                    # the tail of the mark: a rhombus twice as tall as wide
                    ry = 2 * r
                    if y == 0:
                        cy = self.bottom + ry
                    polys.append([(cx, cy - ry), (cx + r, cy), (cx, cy + ry), (cx - r, cy)])
                    continue
                if y == 0:
                    cy = self.bottom + r  # a dot on the baseline sits on it
                polys.append([(cx - r, cy - r), (cx + r, cy - r), (cx + r, cy + r), (cx - r, cy + r)])
                continue
            if isinstance(s, dict) and "fill" in s:
                polys.append([self.map_outer(*p) for p in s["fill"]])
                continue
            if isinstance(s, dict) and "ink" in s:
                polys.append(s["ink"](self))   # an outline built in font units
                continue
            closed = isinstance(s, dict)
            raw = s["pts"] if closed else s
            pts = [self.map(p[0], p[1]) + tuple(p[2:]) for p in raw]
            pts = chamfer(pts, closed, self.cut)
            pts, tips = wedge(pts, self.h)
            if self.flush and not closed and len(pts) > 1:
                pts = flush_ends(pts, self.h)
            drawn.append(pts)
            polys += stroke(pts, closed, self.h, miter=self.miter, tips=tips, slant=self.slant,
                            butt=self.butt)
        for poly in polys:
            if area(poly) < 0:
                poly = poly[::-1]
            path.moveTo(*poly[0])
            for p in poly[1:]:
                path.lineTo(*p)
            path.close()
        out = pathops.simplify(path, fix_winding=True, clockwise=True)
        for f in feet:
            out = pathops.op(out, self.foot(f, drawn), pathops.PathOp.UNION, clockwise=True)
        return out

    def foot(self, spec, drawn):
        """Ethnocentric's A foot: a bar run along the baseline from one leg
        towards the other, its far end cut parallel to that other leg with a
        slit between them, so the wedge and the leg read as two strokes.
        spec = (from_x, to_x, y, stroke index, segment index, slit[, segment
        it grows from]). The bar is also kept inside the outer edge of the leg
        it grows from, so the leg's edge runs straight down past it."""
        x0, x1, y, si, seg, slit = spec[:6]
        grow = spec[6] if len(spec) > 6 else None
        a, b = drawn[si][seg], drawn[si][seg + 1]
        d = unit(b[0] - a[0], b[1] - a[1])
        n = (d[1], -d[0]) if x1 < x0 else (-d[1], d[0])   # towards the bar
        off = self.h + slit * self.w
        o = (a[0] + n[0] * off, a[1] + n[1] * off)
        bar = pathops.Path()
        # square ends: the leg it grows from swallows one, the slit cuts the
        # other; a feather tip here would leave a step against the leg
        poly = stroke([self.map(x0, y), self.map(x1, y)], False, self.h)[0]
        bar.moveTo(*poly[0])
        for p in poly[1:]:
            bar.lineTo(*p)
        bar.close()
        half = pathops.Path()
        far = 6000
        pts = [(o[0] - d[0] * far, o[1] - d[1] * far), (o[0] + d[0] * far, o[1] + d[1] * far)]
        pts += [(pts[1][0] + n[0] * far, pts[1][1] + n[1] * far), (pts[0][0] + n[0] * far, pts[0][1] + n[1] * far)]
        if area(pts) < 0:
            pts = pts[::-1]
        half.moveTo(*pts[0])
        for p in pts[1:]:
            half.lineTo(*p)
        half.close()
        bar = pathops.simplify(bar, fix_winding=True, clockwise=True)
        bar = pathops.op(bar, half, pathops.PathOp.INTERSECTION, clockwise=True)
        if grow is not None:
            a, b = drawn[si][grow], drawn[si][grow + 1]
            d = unit(b[0] - a[0], b[1] - a[1])
            n = (-d[1], d[0]) if x1 < x0 else (d[1], -d[0])   # away from the bar
            o = (a[0] + n[0] * self.h, a[1] + n[1] * self.h)   # the leg's outer edge
            n = (-n[0], -n[1])                                 # keep the inside
            pts = [(o[0] - d[0] * far, o[1] - d[1] * far), (o[0] + d[0] * far, o[1] + d[1] * far)]
            pts += [(pts[1][0] + n[0] * far, pts[1][1] + n[1] * far), (pts[0][0] + n[0] * far, pts[0][1] + n[1] * far)]
            if area(pts) < 0:
                pts = pts[::-1]
            keep = pathops.Path()
            keep.moveTo(*pts[0])
            for p in pts[1:]:
                keep.lineTo(*p)
            keep.close()
            bar = pathops.op(bar, keep, pathops.PathOp.INTERSECTION, clockwise=True)
        return bar

    def glyph(self, strokes):
        pen = TTGlyphPen(None)
        self.outline(strokes).draw(pen)
        return pen.glyph()


def notdef(face):
    pen = TTGlyphPen(None)
    x0, x1 = face.side, face.adv - face.side
    t, w = face.capu, face.w * 0.6
    for (a, b, c, d) in [((x0, 0), (x0, t), (x1, t), (x1, 0))]:
        p = pathops.Path()
        p.moveTo(*a); p.lineTo(*b); p.lineTo(*c); p.lineTo(*d); p.close()
        q = pathops.Path()
        q.moveTo(x0 + w, w); q.lineTo(x1 - w, w); q.lineTo(x1 - w, t - w); q.lineTo(x0 + w, t - w); q.close()
        pathops.op(p, q, pathops.PathOp.DIFFERENCE, clockwise=True).draw(pen)
    return pen.glyph()


def build(face):
    names = {".notdef": notdef(face)}
    cmap = {}

    def add(name, strokes, cps):
        if face.display and name in DISPLAY_G:
            # a wedge's legs are cut flat on the line; trim what they
            # throw past the letter's side
            box_ = pathops.Path()
            pen = box_.getPen()
            pen.moveTo((face.side, 0)); pen.lineTo((face.side, face.capu))
            pen.lineTo((face.adv - face.side, face.capu)); pen.lineTo((face.adv - face.side, 0))
            pen.closePath()
            out = TTGlyphPen(None)
            pathops.op(face.outline(strokes), box_, pathops.PathOp.INTERSECTION,
                       clockwise=True).draw(out)
            names[name] = out.glyph()
        else:
            names[name] = face.glyph(strokes)
        for cp in cps:
            cmap[cp] = name

    for name, strokes in G.items():
        cps = []
        for cp in range(0x20, 0x7F):
            if UV2AGL.get(cp) == name:
                cps.append(cp)
        cps += [cp for cp, n in SINGLES.items() if n == name]
        if face.display and len(name) == 1 and name.islower():
            continue  # display: lowercase reads as the capitals
        if face.display:
            strokes = DISPLAY_G.get(name, strokes)
        add(name, strokes, cps)
    if face.display:
        for c in "abcdefghijklmnopqrstuvwxyz":
            cmap[ord(c)] = c.upper()
        cmap[0x00DF] = "S"  # no capital eszett is drawn; one S stands in
        names.pop("germandbls", None)
        names.pop("dotlessi", None)
        cmap.pop(0x0131, None)

    x_out = round(face.map(0, XH)[1] + face.h)
    for cp, (base, mark) in ACCENTED.items():
        if face.display and (base.islower() or base == "dotlessi"):
            base = "I" if base == "dotlessi" else base.upper()
        name = UV2AGL.get(cp, "uni%04X" % cp)
        top = face.capu if base[0].isupper() else x_out
        mk = face.outline(MARKS[mark])
        dy = top + face.gap - mk.bounds[1]
        merged = pathops.Path()
        face.outline(DISPLAY_G.get(base, G[base]) if face.display else G[base]).draw(merged.getPen())
        mk.draw(TransformPen(merged.getPen(), (1, 0, 0, 1, 0, dy)))
        pen = TTGlyphPen(None)
        pathops.simplify(merged, fix_winding=True, clockwise=True).draw(pen)
        names[name] = pen.glyph()
        cmap[cp] = name

    order = list(names)
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(names)
    metrics = {}
    glyf = fb.font["glyf"]
    for n in order:
        g = glyf[n]
        lsb = g.xMin if g.numberOfContours else 0
        metrics[n] = (face.adv, lsb)
    fb.setupHorizontalMetrics(metrics)
    asc, dsc = 1020, -300
    fb.setupHorizontalHeader(ascent=asc, descent=dsc)
    full = f"{face.family} {face.style}" if face.style != "Regular" else face.family
    ps = f"{face.family.replace(' ', '')}-{face.style}"
    fb.setupNameTable({
        "familyName": face.family,
        "styleName": face.style if face.style in ("Regular", "Bold") else "Regular",
        "typographicFamily": face.family,
        "typographicSubfamily": face.style,
        "uniqueFontIdentifier": f"{ps};{VERSION}",
        "fullName": full,
        "psName": ps,
        "version": f"Version {VERSION}",
        "copyright": "Drawn for the lucya.systems design language (nebula).",
    })
    fb.setupOS2(
        version=4,
        usWeightClass=face.weight,
        sTypoAscender=800, sTypoDescender=-200, sTypoLineGap=320,
        usWinAscent=asc, usWinDescent=-dsc,
        sxHeight=x_out, sCapHeight=face.capu,
        achVendID="LUCY",
        fsSelection=0x80 | (0x20 if face.weight >= 700 else 0x40),
    )
    if not face.display:
        fb.font["OS/2"].panose.bProportion = 9  # monospaced
    fb.setupPost(isFixedPitch=0 if face.display else 1,
                 underlinePosition=-150, underlineThickness=round(face.w * 0.8))
    fb.font["head"].macStyle = 1 if face.weight >= 700 else 0
    return fb.font



# ------------------------------------------------------------------ icons
# Nebula Icons: the same stroker on an 8 x 8 grid, one stroke width, in a
# square em. Line icons, cut corners, no circles, so an icon sits beside a
# Nebula Mono label as one more glyph of the same pen. Names say what the
# icon is for, not what it looks like. Codepoints are assigned in this
# order from U+E000: append new icons at the end, never reorder.

def rect(x0, y0, x1, y1):
    return {"fill": [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]}


def star(cx, cy, ro, ri):
    pts = []
    for i in range(10):
        r = ro if i % 2 == 0 else ri
        a = math.pi / 2 + i * math.pi / 5
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return {"fill": pts}


def closed(*pts):
    return {"closed": True, "pts": list(pts)}


IK = 1.0   # the icons' default cut

ICONS = {
    "home": [[(0, 4.4), (4, 8), (8, 4.4)], [(1.3, 5.2), (1.3, 0), (6.7, 0), (6.7, 5.2)],
             [(3.2, 0), (3.2, 3), (4.8, 3), (4.8, 0)]],
    "grid": [rect(0, 0, 3.5, 3.5), rect(4.5, 0, 8, 3.5), rect(0, 4.5, 3.5, 8), rect(4.5, 4.5, 8, 8)],
    "chevron-left": [[(5.4, 7.6), (1.8, 4), (5.4, 0.4)]],
    "chevron-right": [[(2.6, 7.6), (6.2, 4), (2.6, 0.4)]],
    "chevron-up": [[(0.4, 2.4), (4, 6), (7.6, 2.4)]],
    "chevron-down": [[(0.4, 5.6), (4, 2), (7.6, 5.6)]],
    "arrow-right": [[(0, 4), (6.8, 4)], [(4.2, 7.4), (7.6, 4), (4.2, 0.6)]],
    "arrow-left": [[(8, 4), (1.2, 4)], [(3.8, 7.4), (0.4, 4), (3.8, 0.6)]],
    "arrow-up": [[(4, 0), (4, 6.8)], [(0.6, 4.2), (4, 7.6), (7.4, 4.2)]],
    "arrow-down": [[(4, 8), (4, 1.2)], [(0.6, 3.8), (4, 0.4), (7.4, 3.8)]],
    "turn-up": [[(0, 0.6), (5, 0.6), (5, 7.0)], [(2, 4.8), (5, 7.8), (8, 4.8)]],
    "external": [[(3.4, 8), (0, 8), (0, 0), (8, 0), (8, 4.6)],
                 [(3.6, 4.4), (8, 8)], [(5, 8), (8, 8), (8, 5)]],
    "info": [box(0, 0, 8, 8, IK), dot(4, 5.9, 1.0), [(4, 4.3), (4, 1.6)]],
    "alert": [box(0, 0, 8, 8, IK), [(4, 6.4), (4, 3.6)], dot(4, 2.0, 1.0)],
    "check": [[(0.4, 4), (3, 1.2), (7.6, 6.8)]],
    "close": [[(0.8, 0.8), (7.2, 7.2)], [(7.2, 0.8), (0.8, 7.2)]],
    "history": [[(0, 4.2), (0, 0, IK), (8, 0, IK), (8, 6.4, IK), (1.9, 6.4)],
                [(3.5, 8), (1.9, 6.4), (3.5, 4.8)], [(4.4, 4.2), (4.4, 2.4), (6, 2.4)]],
    "clock": [box(0, 0, 8, 8, IK), [(4, 6.2), (4, 3.6), (6, 3.6)]],
    "search": [box(0, 2.4, 5.6, 8, IK), [(5.05, 2.95), (8, 0)]],
    "layers": [closed((0, 6), (4, 8), (8, 6), (4, 4)), [(0, 4), (4, 2), (8, 4)], [(0, 2), (4, 0), (8, 2)]],
    "chart": [rect(0, 0, 2, 4.4), rect(3, 0, 5, 8), rect(6, 0, 8, 6)],
    "star": [star(4, 4.3, 4.6, 1.9)],
    "images": [box(0, 0, 5.8, 5.8, 0), [(0, 1.4), (2.2, 3.6), (3.4, 2.4), (5.8, 4.6)],
               [(2.2, 8), (8, 8), (8, 2.2)]],
    "image": [box(0, 0, 8, 8, 0), [(0, 1.6), (3, 4.6), (5, 2.6), (8, 5.6)], rect(5.2, 5.8, 6.6, 7.2)],
    "camera": [box(0, 0, 8, 6, 0.8), [(2.2, 6), (3, 7.6), (5, 7.6), (5.8, 6)], box(2.5, 1.3, 5.5, 4.3, 0.6)],
    "shield": [closed((0, 8), (8, 8), (8, 3.2), (4, 0), (0, 3.2)), [(4, 8), (4, 0.4)]],
    "balance": [[(4, 8), (4, 0)], [(1.6, 0), (6.4, 0)], [(0, 6.4), (8, 6.4)],
                closed((1, 6.4), (0, 3.4), (2, 3.4)), closed((7, 6.4), (6, 3.4), (8, 3.4))],
    "shuffle": [[(0, 6.6), (2.4, 6.6), (5.4, 1.4), (6.8, 1.4)], [(0, 1.4), (2.4, 1.4), (5.4, 6.6), (6.8, 6.6)],
                [(6, 8), (7.6, 6.6), (6, 5.2)], [(6, 2.8), (7.6, 1.4), (6, 0)]],
    "text": [[(0, 7.4), (8, 7.4)], [(0, 5), (5.4, 5)], [(0, 2.6), (8, 2.6)], [(0, 0.2), (5.4, 0.2)]],
    "sort": [[(0, 7.2), (8, 7.2)], [(0, 4), (5.4, 4)], [(0, 0.8), (2.8, 0.8)]],
    "tags": [closed((0, 4), (2.6, 7.2), (8, 7.2), (8, 0.8), (2.6, 0.8)), rect(2.2, 3.4, 3.4, 4.6)],
    "route": [[(1, 7), (6.8, 7), (6.8, 4), (1.2, 4), (1.2, 1), (7, 1)], rect(0, 6, 2, 8), rect(6, 0, 8, 2)],
    "tree": [rect(0, 6, 2.6, 8), [(1.3, 6.4), (1.3, 1), (4, 1)], [(1.3, 4), (4, 4)],
             box(4, 0, 8, 2, 0), box(4, 3, 8, 5, 0)],
    "folder": [closed((0, 0), (0, 7.2), (3, 7.2), (3.8, 6.2), (8, 6.2), (8, 0))],
    "folder-open": [[(0, 0), (0, 7.2), (3, 7.2), (3.8, 6.2), (7, 6.2), (7, 4.2)],
                    closed((0, 0), (1.6, 4.2), (8.4, 4.2), (7, 0))],
    "database": [box(0, 0, 8, 8, IK), [(0, 5.3), (8, 5.3)], [(0, 2.7), (8, 2.7)]],
    "download": [[(4, 8), (4, 3.4)], [(1.6, 5.2), (4, 2.6), (6.4, 5.2)], [(0, 2.2), (0, 0), (8, 0), (8, 2.2)]],
    "upload": [[(4, 2.6), (4, 7.2)], [(1.6, 5.4), (4, 8), (6.4, 5.4)], [(0, 2.2), (0, 0), (8, 0), (8, 2.2)]],
    "expand": [[(0, 2.6), (0, 0), (2.6, 0)], [(5.4, 0), (8, 0), (8, 2.6)],
               [(8, 5.4), (8, 8), (5.4, 8)], [(2.6, 8), (0, 8), (0, 5.4)]],
    "eye": [closed((0, 4), (2, 6.8), (6, 6.8), (8, 4), (6, 1.2), (2, 1.2)), rect(3, 3, 5, 5)],
    "eye-off": [closed((0, 4), (2, 6.8), (6, 6.8), (8, 4), (6, 1.2), (2, 1.2)), rect(3, 3, 5, 5),
                [(0.4, 0), (7.6, 8)]],
    "plus": [[(0.6, 4), (7.4, 4)], [(4, 0.6), (4, 7.4)]],
    "minus": [[(0.6, 4), (7.4, 4)]],
    "link": [[(3.2, 7), (0, 7, IK), (0, 1, IK), (3.2, 1)], [(4.8, 7), (8, 7, IK), (8, 1, IK), (4.8, 1)],
             [(2.2, 4), (5.8, 4)]],
    "lock": [box(0, 0, 8, 5, 0), [(1.8, 5), (1.8, 8, 1.2), (6.2, 8, 1.2), (6.2, 5)], [(4, 3.4), (4, 1.6)]],
    "user": [box(2.2, 4.4, 5.8, 8, IK), [(0, 0), (0, 2.8, 1.4), (8, 2.8, 1.4), (8, 0)]],
    "settings": [box(1, 1, 7, 7, 1.8), box(3, 3, 5, 5, 0), [(4, 7), (4, 8)], [(4, 0), (4, 1)],
                 [(0, 4), (1, 4)], [(7, 4), (8, 4)]],
    "trash": [[(0, 6.8), (8, 6.8)], [(2.8, 6.8), (2.8, 8), (5.2, 8), (5.2, 6.8)],
              [(1, 6.8), (1, 0, 0.6), (7, 0, 0.6), (7, 6.8)], [(4, 5), (4, 1.8)]],
    "filter": [closed((0, 8), (8, 8), (5, 4.2), (5, 0.2), (3, 1.4), (3, 4.2))],
    "menu": [[(0, 7), (8, 7)], [(0, 4), (8, 4)], [(0, 1), (8, 1)]],
    "copy": [box(0, 0, 5.6, 5.6, 0), [(2.4, 5.6), (2.4, 8), (8, 8), (8, 2.4), (5.6, 2.4)]],
    "edit": [closed((0, 0), (0, 2.2), (5.6, 7.8), (7.8, 5.6), (2.2, 0)), [(4.2, 6.4), (6.4, 4.2)]],
    "play": [{"fill": [(1.2, 0), (7.6, 4), (1.2, 8)]}],
    "pause": [rect(1, 0, 3.2, 8), rect(4.8, 0, 7, 8)],
    "calendar": [box(0, 0, 8, 7, 0), [(0, 4.8), (8, 4.8)], [(2.2, 8), (2.2, 6)], [(5.8, 8), (5.8, 6)],
                 rect(1.4, 1.2, 3.4, 3.2)],
}

def build_icons(face):
    names = {".notdef": notdef(face)}
    cmap = {}
    for i, (name, strokes) in enumerate(ICONS.items()):
        names[name] = face.glyph(strokes)
        cmap[0xE000 + i] = name
    names["space"] = face.glyph([])
    cmap[0x20] = "space"
    order = list(names)
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(names)
    glyf = fb.font["glyf"]
    fb.setupHorizontalMetrics({n: (face.adv, glyf[n].xMin if glyf[n].numberOfContours else 0)
                               for n in order})
    # the same line box Font Awesome had, so swapping sets cannot move a row
    fb.setupHorizontalHeader(ascent=875, descent=-125)
    fb.setupNameTable({
        "familyName": face.family, "styleName": "Regular",
        "uniqueFontIdentifier": f"NebulaIcons-Regular;{VERSION}",
        "fullName": face.family, "psName": "NebulaIcons-Regular",
        "version": f"Version {VERSION}",
        "copyright": "Drawn for the lucya.systems design language (nebula).",
    })
    fb.setupOS2(version=4, usWeightClass=400, sTypoAscender=875, sTypoDescender=-125,
                sTypoLineGap=0, usWinAscent=875, usWinDescent=125, achVendID="LUCY",
                fsSelection=0x80 | 0x40)
    fb.setupPost(isFixedPitch=1)
    return fb.font


def icons_css():
    rows = "\n".join(f'.ni-{n}{{ --ni:"\\{0xE000 + i:x}"; }}' for i, n in enumerate(ICONS))
    return ICONS_CSS_HEAD + rows + "\n"


ICONS_CSS_HEAD = """/* ==================================================================
   NEBULA ICONS  —  GENERATED FILE, DO NOT EDIT BY HAND
   ==================================================================
   Written by assets/fonts/build.py, together with the font. Every icon
   is drawn there, on the same stroker and the same cut as Nebula Mono;
   add one to ICONS and re-run the script. A class not listed below
   renders nothing.

   <i class="ni ni-home" aria-hidden="true"></i>
   ================================================================== */
@font-face{
  font-family:'Nebula Icons';
  src:url('assets/fonts/NebulaIcons.woff2') format('woff2');
  font-weight:400;
  font-style:normal;
  /* block, not swap: there is no sensible fallback glyph for an icon font,
     and swap would flash the raw private-use codepoint as tofu first */
  font-display:block;
}
.ni{
  font-family:'Nebula Icons';
  font-weight:400;
  font-style:normal;
  font-variant:normal;
  line-height:1;
  display:inline-block;
  text-rendering:auto;
  -webkit-font-smoothing:antialiased;
  /* icons sit beside mono labels that are tracked out; the glyph must not
     inherit that letter-spacing or it drifts off its own box */
  letter-spacing:0;
  text-transform:none;
}
.ni::before{ content:var(--ni); }
/* fixed-width variant: keeps icons in a column (kv lists, menus) aligned */
.ni-fw{ width:1.25em; text-align:center; }

"""


# --------------------------------------------------------------- wordmark
# Nebula Wordmark: the logo face, drawn to sit beside the eagle. Its stance
# is Ethnocentric's (heavy, set tight, counters pressed into slots, the A,
# V, W and M as sharp wedges), but its geometry is the mark's own. The
# mark has four angles and nothing else:
#
#   2:1  (63 deg)   the tail diamond, the steep wing edges
#                   -> W, M and the 7; and every horizontal end is cut
#                      along it, a feather tip
#   4:3  (53 deg)   the outer wing tips
#                   -> A and V: the wedge Ethnocentric's A was liked
#                      for, wide enough that its foot reads as a wedge
#   1:2  (27 deg)   the long top edges of the wings
#                   -> the K's arms
#   1:1  (45 deg)   the cuts across the feather ends
#                   -> every corner that would have been round
#
# and its points are the tail: a rhombus twice as tall as it is wide.
#
# Widths are a system, not a value per letter (grid units, cap = 6):
#   round      O C D G Q U S   7.0   a cut corner eats width; round reads wider
#   straight   H N B P R K T   6.4   the unit everything else is measured from
#              X Y Z, figures  6.4   figures stay tabular
#   wedge      A V             9.4   legs at Ethnocentric's slope, 1.42 (55 deg)
#   Y          Ethnocentric's  rebuilt on its proportions (ethno_y): parallel
#                                    47.6 degree arms into the corners, fork at a third
#   light      E F L J         5.6   open on one side, so a little narrower
#   double     M W             9.0   W: two wedges sharing a leg, 3 + 1.5 + 1.5 + 3;
#                                    M: one 2:1 wedge, 3 + 3, hung between two stems

WK = 1.2      # the cut, in grid units (1:1)


def ethno_y(face):
    """The Y, rebuilt on Ethnocentric's proportions in this face's weight:
    arms whose edges run parallel at 47.6 degrees (the eagle's feather cut)
    straight into the top corners, meeting the stem outside at a third of
    the cap and inside at a little over a half. Returns the outline in font
    units; its ink width follows from the angle and the fork."""
    C, w, m = face.capu, face.w, 1.096            # m: Ethnocentric's arm slope
    fork = 0.332 * C                               # where the arms meet the stem
    half = (C - fork) / m + w / 2                  # half the ink width
    arm = w / math.sin(math.atan(m))               # an arm, measured across the top
    x0 = face.side
    xc = x0 + half
    apex = C - m * (xc - (x0 + arm))
    return [(xc - w / 2, 0), (xc - w / 2, fork), (x0, C), (x0 + arm, C), (xc, apex),
            (x0 + 2 * half - arm, C), (x0 + 2 * half, C), (xc + w / 2, fork), (xc + w / 2, 0)]


def ethno_y_width(face):
    return (2 * ((face.capu - 0.332 * face.capu) / 1.096 + face.w / 2) - face.w) / face.ux
T = TIP
RND, STR, WDG, LGT, DBL = 7.0, 6.4, 9.4, 5.6, 9.0

WORDMARK = {
    "A": (WDG, [[(0, 0), (WDG / 2, 6, T), (WDG, 0)], {"foot": (WDG, 0, 0, 0, 0, 0.42, 1)}]),
    "B": (STR, [[(0, 0), (0, 6), (5.8, 6, 1.0), (5.8, 3.1)], [(0, 3.1), (STR, 3.1, 1.0), (STR, 0, WK), (0, 0)]]),
    "C": (RND, [[(RND, 6), (0, 6, WK), (0, 0, WK), (RND, 0)]]),
    "D": (RND, [closed((0, 0), (0, 6), (RND, 6, WK), (RND, 0, WK))]),
    "E": (LGT, [[(LGT, 6), (0, 6), (0, 0), (LGT, 0)], [(0, 3.1), (4.9, 3.1)]]),
    "F": (LGT, [[(LGT, 6), (0, 6), (0, 0)], [(0, 3.1), (4.9, 3.1)]]),
    "G": (RND, [[(RND, 6), (0, 6, WK), (0, 0, WK), (RND, 0), (RND, 2.9), (3.8, 2.9)]]),
    "H": (STR, [[(0, 0), (0, 6)], [(STR, 0), (STR, 6)], [(0, 3.1), (STR, 3.1)]]),
    "I": (0, [[(0, 0), (0, 6)]]),
    "J": (LGT, [[(LGT, 6), (LGT, 0, WK), (0, 0), (0, 2)]]),
    "K": (STR, [[(0, 0), (0, 6)], [(STR, 6), (0, 3, T), (STR, 0)]]),
    "L": (LGT, [[(0, 6), (0, 0), (LGT, 0)]]),
    "M": (DBL, [[(0, 0), (0, 6), (1.5, 6), (4.5, 0, T), (7.5, 6), (DBL, 6), (DBL, 0)]]),
    "N": (STR, [[(0, 0), (0, 6), (STR, 0), (STR, 6)]]),
    "O": (RND, [box(0, 0, RND, 6, WK)]),
    "P": (STR, [[(0, 0), (0, 6), (STR, 6, 1.0), (STR, 2.6, 1.0), (0, 2.6)]]),
    "Q": (RND, [closed((0, 0, WK), (0, 6, WK), (RND, 6, WK), (RND, 0)), [(4.8, 0), (RND + 1.2, 0)]]),
    "R": (STR, [[(0, 0), (0, 6), (STR, 6, 1.0), (STR, 2.8, 1.0), (0, 2.8)], [(3.6, 2.8), (STR, 0)]]),
    "S": (RND, [[(RND, 6), (0, 6, WK), (0, 3.1, 1.0), (RND, 3.1, 1.0), (RND, 0, WK), (0, 0)]]),
    "T": (STR, [[(0, 6), (STR, 6)], [(STR / 2, 6), (STR / 2, 0)]]),
    "U": (RND, [[(0, 6), (0, 0, WK), (RND, 0, WK), (RND, 6)]]),
    "V": (WDG, [[(0, 6), (WDG / 2, 0, T), (WDG, 6)]]),
    "W": (DBL, [[(0, 6), (3, 0, T), (4.5, 3, T), (6, 0, T), (DBL, 6)]]),
    "X": (6.0, [[(0, 6), (6.0, 0)], [(6.0, 6), (0, 0)]]),
    "Y": (None, [{"ink": ethno_y}]),
    "Z": (STR, [[(0, 6), (STR, 6), (0, 0), (STR, 0)]]),
    "zero": (STR, [box(0, 0, STR, 6, WK)]),
    "one": (2, [[(0, 4.6), (1.8, 6), (1.8, 0)]]),
    "two": (STR, [[(0, 6), (STR, 6, WK), (STR, 3.1, 1.0), (0, 3.1), (0, 0), (STR, 0)]]),
    "three": (STR, [[(0, 6), (STR, 6, WK), (STR, 0, WK), (0, 0)], [(1.6, 3.1), (STR, 3.1)]]),
    "four": (STR, [[(4.8, 0), (4.8, 6, T), (0, 2, T), (STR, 2)]]),
    "five": (STR, [[(STR, 6), (0, 6), (0, 3.2), (STR, 3.2, 1.0), (STR, 0, WK), (0, 0)]]),
    "six": (STR, [[(STR, 6), (0, 6, WK), (0, 0, WK), (STR, 0, WK), (STR, 3.2, 1.0), (0, 3.2)]]),
    "seven": (STR, [[(0, 6), (STR, 6, T), (STR - 3, 0)]]),
    "eight": (STR, [box(0, 3.1, STR, 6, 1.0), box(0, 0, STR, 3.1, WK)]),
    "nine": (STR, [[(0, 0), (STR, 0, WK), (STR, 6, WK), (0, 6, WK), (0, 2.8, 1.0), (STR, 2.8)]]),
    "period": (0, [dot(0, 0, 1.0)]),
    "comma": (0.6, [dot(0, 0, 1.0), [(0.3, 0), (-0.45, -1.5)]]),
    "colon": (0, [dot(0, 0, 1.0), dot(0, 3.4, 1.0)]),
    "hyphen": (3.6, [[(0, 3), (3.6, 3)]]),
    "endash": (5.4, [[(0, 3), (5.4, 3)]]),
    "periodcentered": (0, [dot(0, 2.4, 1.0)]),
    "slash": (3.6, [[(0, -0.6), (3.6, 6.6)]]),
    "exclam": (0, [[(0, 6), (0, 3.4)], dot(0, 0, 1.0)]),
    "question": (LGT, [[(0, 4.4), (0, 6), (LGT, 6, WK), (LGT, 3.8, 1.0), (2.6, 3.8), (2.6, 3.3)], dot(2.6, 0, 1.0)]),
    "quotesingle": (0, [[(0, 6), (0, 4.4)]]),
    "quoteright": (0.6, [[(0.3, 6), (0.3, 5.0), (-0.4, 4.0)]]),
    "plus": (5.4, [[(0, 3), (5.4, 3)], [(2.7, 0.6), (2.7, 5.4)]]),
    "ampersand": (RND, [box(0.8, 3.5, 4.4, 6, 0.7), [(1.3, 3.5), (RND, 0)],
                        [(4.2, 0), (0, 0, WK), (0, 2.4, 0.9), (1.0, 3.5)], [(4.4, 2.6), (RND, 2.6)]]),
}
# Wedges leave a triangle of air beside them. These pairs are kerned until
# their closest approach equals the gap between two straight stems (H|H),
# which is what Ethnocentric does (its YA is -267, AV -310): the A slides
# under the Y's arm. Measured from the outlines in build_wordmark(), so the
# kerning follows the drawing whenever a letter changes.
WORDMARK_KERN_PAIRS = [
    "YA", "AY", "VA", "AV", "WA", "AW", "TA", "AT", "LT", "LY", "LV", "LW",
    "FA", "PA", "KA", "XA", "AX", "VY", "YV", "TY", "YT",
]
WORDMARK_KERN = {}   # filled by build_wordmark(): (left, right) -> units
TRACK = 25           # the lockup's tracking, in font units


def closest(glyf, left, right, dx):
    """Smallest distance between two polygon outlines, right shifted by dx."""
    def segs(name, off):
        g = glyf[name]
        c, s0, out = g.getCoordinates(glyf)[0], 0, []
        for e in g.endPtsOfContours:
            pts = [(x + off, y) for x, y in c[s0:e + 1]]
            s0 = e + 1
            out += list(zip(pts, pts[1:] + pts[:1]))
        return out

    def pd(p, a, b):
        ex, ey = b[0] - a[0], b[1] - a[1]
        t = max(0, min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey or 1)))
        return math.hypot(p[0] - a[0] - t * ex, p[1] - a[1] - t * ey)
    A, B = segs(left, 0), segs(right, dx)
    return min(min(pd(a, *sg) for a, _ in A for sg in B),
               min(pd(b, *sg) for b, _ in B for sg in A))


def auto_kern(glyf, adv):
    norm = closest(glyf, "H", "H", adv["H"] + TRACK)
    for l, r in WORDMARK_KERN_PAIRS:
        # slide in from zero and stop at the first step that reaches the
        # stem gap; past that the outlines cross and a distance means nothing
        k = 0
        while k > -600 and closest(glyf, l, r, adv[l] + k - 5 + TRACK) >= norm:
            k -= 5
        if k:
            WORDMARK_KERN[(l, r)] = k
    WORDMARK_KERN[("Y", "period")] = WORDMARK_KERN[("V", "period")] = -90
    # optical pairs a distance cannot see: the triangle beside a Y against
    # a round letter. Ethnocentric's values, which the Y is built on.
    WORDMARK_KERN.update({
        ("Y", "O"): -100, ("O", "Y"): -100, ("Y", "C"): -100, ("Y", "G"): -100,
        ("Y", "Q"): -100, ("D", "Y"): -100, ("R", "Y"): -110, ("Y", "S"): -73,
        ("S", "Y"): -46, ("C", "Y"): -120, ("E", "Y"): -60, ("U", "Y"): -60, ("Y", "U"): -60,
    })

WORDMARK_MARKS = {
    "dieresis": [dot(-1.4, 0, 0.8), dot(1.4, 0, 0.8)],
    "acute": [[(-0.9, 0), (1.1, 1.4)]],
    "grave": [[(-1.1, 1.4), (0.9, 0)]],
    "circumflex": [[(-1.6, 0), (0, 1.3), (1.6, 0)]],
    "tilde": [[(-2, 0), (-0.8, 1.1), (0.8, 0), (2, 1.1)]],
    "ring": [box(-1, 0, 1, 1.6, 0.3)],
}


def clip_box(face, path, gw, descends=False):
    """Every corner of the wordmark is drawn as a full miter, then the ink
    is cut back to the letter's own box: an acute corner becomes a sharp
    wedge that ends exactly on the baseline, the cap height or the side,
    never a spike past them. Only a glyph that descends (the comma) keeps
    ink below the line."""
    x0, x1 = face.side, face.side + face.w + gw * face.ux
    if gw < 1:   # a dot or a stem: nothing to trim at the sides
        x0, x1 = -2000, 4000
    box_ = pathops.Path()
    pen = box_.getPen()
    pen.moveTo((x0, -600 if descends else 0))
    pen.lineTo((x0, face.capu))
    pen.lineTo((x1, face.capu))
    pen.lineTo((x1, -600 if descends else 0))
    pen.closePath()
    return pathops.op(path, box_, pathops.PathOp.INTERSECTION, clockwise=True)


def clipped(face, strokes, gw, descends=False):
    pen = TTGlyphPen(None)
    clip_box(face, face.outline(strokes), gw, descends).draw(pen)
    return pen.glyph()


def build_wordmark(face):
    names = {".notdef": notdef(face), "space": face.glyph([])}
    adv = {".notdef": face.advance_for(6), "space": round(face.capu * 0.5)}
    cmap = {0x20: "space", 0xA0: "space"}
    for name, (gw, strokes) in WORDMARK.items():
        if gw is None:
            gw = ethno_y_width(face)
        names[name] = clipped(face, strokes, gw, descends=name == "comma")
        adv[name] = face.advance_for(gw)
        for cp in range(0x20, 0x7F):
            if UV2AGL.get(cp) == name:
                cmap[cp] = name
        cmap.update({cp: name for cp, n in SINGLES.items() if n == name})
    for c in "abcdefghijklmnopqrstuvwxyz":
        cmap[ord(c)] = c.upper()   # lowercase is set as the capitals
    cmap[0x00DF] = "S"
    # accented capitals: the mark centred over the letter, a fixed gap up
    for cp, (base, mark) in ACCENTED.items():
        base = "I" if base == "dotlessi" else base.upper()
        name = UV2AGL[ord(chr(cp).upper())]
        if name not in names:
            gw, strokes = WORDMARK[base]
            gw = ethno_y_width(face) if gw is None else gw
            mk = face.outline(WORDMARK_MARKS[mark])
            b = mk.bounds
            cx = face.map(gw / 2, 0)[0]
            dx, dy = cx - (b[0] + b[2]) / 2, face.capu + face.gap - b[1]
            merged = pathops.Path()
            face.outline(strokes).draw(merged.getPen())
            merged = clip_box(face, merged, gw)
            mk.draw(TransformPen(merged.getPen(), (1, 0, 0, 1, dx, dy)))
            pen = TTGlyphPen(None)
            pathops.simplify(merged, fix_winding=True, clockwise=True).draw(pen)
            names[name] = pen.glyph()
            adv[name] = face.advance_for(gw)
        cmap[cp] = name
    order = list(names)
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(names)
    glyf = fb.font["glyf"]
    fb.setupHorizontalMetrics({n: (adv[n], glyf[n].xMin if glyf[n].numberOfContours else 0)
                               for n in order})
    fb.setupHorizontalHeader(ascent=1020, descent=-300)
    from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
    auto_kern(fb.font["glyf"], adv)
    pairs = "\n".join(f"  pos {a} {b} {v};" for (a, b), v in WORDMARK_KERN.items())
    addOpenTypeFeaturesFromString(fb.font, f"feature kern {{\n{pairs}\n}} kern;\n")
    fb.setupNameTable({
        "familyName": face.family, "styleName": "Regular",
        "uniqueFontIdentifier": f"NebulaWordmark-Regular;{VERSION}",
        "fullName": face.family, "psName": "NebulaWordmark-Regular",
        "version": f"Version {VERSION}",
        "copyright": "Drawn for the lucya.systems design language (nebula).",
    })
    fb.setupOS2(version=4, usWeightClass=400, sTypoAscender=800, sTypoDescender=-200,
                sTypoLineGap=320, usWinAscent=1020, usWinDescent=300,
                sCapHeight=face.capu, sxHeight=face.capu, achVendID="LUCY",
                fsSelection=0x80 | 0x40)
    fb.setupPost()
    return fb.font



def write_lockup(font, out, word="LUCYA"):
    """A test lockup: the eagle and the word in Nebula Wordmark, the type
    turned into paths so the file needs no font. The cap height is 0.62 of
    the mark's height and sits on the mark's vertical centre; the gap is
    one third of a cap; tracking is --tr-brand-floor."""
    import re
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen as TP
    mark = open(os.path.join(HERE, "..", "logo", "lucya_logo.svg")).read()
    pieces = re.findall(r'<path[^>]*\sd="([^"]+)"', mark)
    mw, mh = 964, 543
    cap_px = 0.62 * mh
    k = cap_px / 700                     # font units -> svg units
    base = mh / 2 + cap_px / 2           # baseline, cap centred on the mark
    x = mw + cap_px / 3
    glyphs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    paths = []
    prev = None
    for ch in word:
        name = cmap[ord(ch)]
        x += WORDMARK_KERN.get((prev, name), 0) * k
        prev = name
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TP(pen, (k, 0, 0, -k, x, base)))
        paths.append(pen.getCommands())
        x += (hmtx[name][0] + TRACK) * k
    last = cmap[ord(word[-1])]
    width = x - (hmtx[last][0] + TRACK) * k + font["glyf"][last].xMax * k   # to the last ink
    body = "".join(f'<path d="{d}"/>' for d in pieces) + "".join(f'<path d="{d}"/>' for d in paths)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {mh}" '
           f'fill="#fff"><title>lucya</title>{body}</svg>\n')
    with open(out, "w") as fh:
        fh.write(svg)


def faces():
    for weight, w in ((400, 78), (500, 94), (600, 110), (700, 128)):
        style = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}[weight]
        yield f"NebulaMono-{weight}.woff2", Face("Nebula Mono", style, weight,
                                                advance=600, side=68, cap=700,
                                                stroke_w=w, cut=78)
    yield "NebulaDisplay-400.woff2", Face("Nebula Display", "Regular", 400,
                                          advance=1060, side=60, cap=700,
                                          stroke_w=150, cut=150, display=True)


if __name__ == "__main__":
    for filename, face in faces():
        font = build(face)
        font.flavor = "woff2"
        out = os.path.join(HERE, filename)
        font.save(out)
        print(f"{filename:28} {len(font.getGlyphOrder()):4} glyphs  {os.path.getsize(out):6} bytes")
    word_face = Face("Nebula Wordmark", "Regular", 400, advance=0, side=48, cap=700,
                     stroke_w=168, cut=0, grid=(None, CAP))
    word_face.cut = word_face.uy   # cuts are written in grid units
    word_face.miter = 40.0         # full miters; clip_box() trims them
    word_face.slant = 0.5          # feather-tip ends, along the 2:1 of the mark
    word_face.diamond = True       # points are the mark's tail
    word_face.flush = True         # a diagonal runs into the corner; no facet
    font = build_wordmark(word_face)
    font.flavor = "woff2"
    out = os.path.join(HERE, "NebulaWordmark-400.woff2")
    font.save(out)
    print(f"{'NebulaWordmark-400.woff2':28} {len(font.getGlyphOrder()):4} glyphs  {os.path.getsize(out):6} bytes")
    print("  kern", " ".join(f"{a}{b}{v}" for (a, b), v in WORDMARK_KERN.items()))
    write_lockup(font, os.path.join(HERE, "..", "logo", "lucya_lockup_test.svg"))
    print("lucya_lockup_test.svg")
    icon_face = Face("Nebula Icons", "Regular", 400, advance=1000, side=40, cap=700,
                     stroke_w=110, cut=72, grid=(8, 8), bottom=-100, height=920)
    icon_face.butt = True
    font = build_icons(icon_face)
    font.flavor = "woff2"
    out = os.path.join(HERE, "NebulaIcons.woff2")
    font.save(out)
    print(f"{'NebulaIcons.woff2':28} {len(ICONS):4} icons   {os.path.getsize(out):6} bytes")
    css = os.path.join(HERE, "..", "..", "icons.css")
    with open(css, "w") as fh:
        fh.write(icons_css())
    print("icons.css")
