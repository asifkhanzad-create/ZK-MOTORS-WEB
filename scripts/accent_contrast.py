"""Explore candidate accent ramps for the ZK Motors site.

This is the *exploration* tool — it compares hypothetical ramps against the
live background colours. For the authoritative pass/fail check of the palette
actually in use, run `python scripts/verify_theme.py` instead.

The background colours are read from globals.css rather than hard-coded, so
this cannot drift out of step when the palette changes.

The accent has to clear three demanding roles at once:
  1. accent-400 as a BUTTON FILL with ink-950 text on top   -> >= 4.5:1
  2. accent-300 as EYEBROW TEXT on the ink-950 dark section -> >= 4.5:1
  3. accent-700 as EYEBROW TEXT on the bone-50 light section-> >= 4.5:1
Plus accent-400 as a focus ring / small glyph on dark -> >= 3:1
"""

from __future__ import annotations

import re
from pathlib import Path


def load_tokens() -> dict[str, str]:
    css = (Path(__file__).resolve().parents[1] / "src" / "app" / "globals.css").read_text(
        encoding="utf-8"
    )
    block = re.search(r"@theme\s*\{(.*?)\n\}", css, re.S)
    if not block:
        raise SystemExit("Could not find an @theme block in globals.css")
    return {
        name: value
        for name, value in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", block.group(1))
        if re.fullmatch(r"#[0-9a-fA-F]{6}", value.strip())
    }


_TOKENS = load_tokens()
INK_950 = _TOKENS["--color-ink-950"]
INK_900 = _TOKENS["--color-ink-900"]
INK_850 = _TOKENS["--color-ink-850"]
BONE_50 = _TOKENS["--color-bone-50"]
WHITE = "#ffffff"


def srgb_to_lin(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return (
        0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)
    )


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def verdict(ratio: float, target: float) -> str:
    return "PASS" if ratio >= target else "FAIL"


PALETTES = {
    "Brass gold (previous)": {
        "300": "#f0c77e",
        "400": "#e3ac52",
        "500": "#ce8f2e",
        "700": "#7d5318",
    },
    "Refined red": {
        "300": "#f0a3a0",
        "400": "#dd5f5a",
        "500": "#c0392b",
        "700": "#7a1f18",
    },
    "Deep crimson red": {
        "300": "#ef9a96",
        "400": "#d23f38",
        "500": "#a82a24",
        "700": "#6d1a15",
    },
    "Burnt orange / copper": {
        "300": "#f0b98a",
        "400": "#dd8b4e",
        "500": "#c26a24",
        "700": "#744010",
    },
    "Emerald / racing green": {
        "300": "#7fd1b0",
        "400": "#35a97d",
        "500": "#1f8a63",
        "700": "#0f5038",
    },
    "Champagne / warm platinum": {
        "300": "#e8dcc4",
        "400": "#d6c49f",
        "500": "#bda87c",
        "700": "#746548",
    },
    "Sapphire / cobalt": {
        "300": "#9dc0f0",
        "400": "#5b8fd6",
        "500": "#3a6fbd",
        "700": "#1e3f70",
    },
}

HEADER = (
    f"{'palette':<28} {'400 fill+ink text':>18} {'300 on dark':>13} "
    f"{'700 on light':>13} {'400 ring on dark':>17}  overall"
)
print(HEADER)
print("-" * len(HEADER))

for name, ramp in PALETTES.items():
    c400_text = contrast(ramp["400"], INK_950)
    c300_dark = contrast(ramp["300"], INK_950)
    c700_light = contrast(ramp["700"], BONE_50)
    c400_ring = contrast(ramp["400"], INK_950)

    ok = (
        c400_text >= 4.5 and c300_dark >= 4.5 and c700_light >= 4.5 and c400_ring >= 3.0
    )

    print(
        f"{name:<28} {c400_text:>11.2f} {verdict(c400_text, 4.5):>6} "
        f"{c300_dark:>7.2f} {verdict(c300_dark, 4.5):>5} "
        f"{c700_light:>7.2f} {verdict(c700_light, 4.5):>5} "
        f"{c400_ring:>11.2f} {verdict(c400_ring, 3.0):>5}  "
        f"{'OK' if ok else 'needs work'}"
    )

print()
print("Accent as a fill with WHITE text instead of near-black (button variant B):")
print("-" * 70)
for name, ramp in PALETTES.items():
    r400 = contrast(ramp["400"], WHITE)
    r500 = contrast(ramp["500"], WHITE)
    print(
        f"{name:<28} 400 vs white: {r400:>5.2f} {verdict(r400, 4.5):>5}   "
        f"500 vs white: {r500:>5.2f} {verdict(r500, 4.5):>5}"
    )
