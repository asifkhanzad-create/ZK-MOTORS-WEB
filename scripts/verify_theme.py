"""Verify the real ZK Motors theme by parsing globals.css.

Nothing here is hard-coded to an expected palette: the script reads the
`@theme` block out of src/app/globals.css and checks the foreground/background
pairs that actually exist in the components. If a token is changed and the
resulting combination fails WCAG, this exits non-zero.

WCAG 2.2 thresholds used:
  - normal text  -> 4.5:1
  - large text / non-text UI (focus rings, icons, borders) -> 3:1
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

CSS_PATH = Path(__file__).resolve().parents[1] / "src" / "app" / "globals.css"


def load_tokens(path: Path) -> dict[str, str]:
    css = path.read_text(encoding="utf-8")
    block = re.search(r"@theme\s*\{(.*?)\n\}", css, re.S)
    if not block:
        raise SystemExit(f"Could not find an @theme block in {path}")
    tokens: dict[str, str] = {}
    for name, value in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", block.group(1)):
        value = value.strip()
        if re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            tokens[name] = value
    return tokens


def _lin(c: int) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# (label, foreground token, background token, minimum ratio)
CHECKS: list[tuple[str, str, str, float]] = [
    # --- Primary button: dark label ON the accent fill ---
    ("button label on accent-400 fill", "accent-400", "ink-950", 4.5),
    ("skip-link label on accent-400", "ink-950", "accent-400", 4.5),
    # --- Eyebrows / accent text ---
    ("accent-300 eyebrow on dark section", "accent-300", "ink-950", 4.5),
    ("accent-200 highlight on dark card", "accent-200", "ink-850", 4.5),
    ("accent-700 eyebrow on light section", "accent-700", "bone-50", 4.5),
    ("accent-700 on white card", "accent-700", "bone-50", 4.5),
    # --- Signal red secondary accent (same three roles) ---
    ("signal-400 as fill with dark label", "signal-400", "ink-950", 4.5),
    ("signal-300 on dark section", "signal-300", "ink-950", 4.5),
    ("signal-700 on light section", "signal-700", "bone-50", 4.5),
    # The filled signal button is deeper than signal-400 and carries white text.
    ("signal-500 fill with white label", "signal-500", "#ffffff", 4.5),
    ("signal-600 hover fill with white label", "signal-600", "#ffffff", 4.5),
    ("signal-400 outline border on dark", "signal-400", "ink-950", 3.0),
    # --- Body copy ---
    ("muted-dark body on dark section", "muted-dark", "ink-950", 4.5),
    ("muted-dark body on dark card", "muted-dark", "ink-850", 4.5),
    ("bone-200 body on dark section", "bone-200", "ink-950", 4.5),
    ("bone-50 heading on dark section", "bone-50", "ink-950", 4.5),
    ("muted-light body on light section", "muted-light", "bone-50", 4.5),
    ("ink-950 heading on light section", "ink-950", "bone-50", 4.5),
    ("ink-950 heading on bone-100", "ink-950", "bone-100", 4.5),
    # --- Status badges (text + dot) ---
    ("status-available on dark card", "status-available", "ink-850", 4.5),
    ("status-reserved on dark card", "status-reserved", "ink-850", 4.5),
    ("status-sold on dark card", "status-sold", "ink-850", 4.5),
    # --- Brand action ---
    ("whatsapp label on whatsapp fill", "ink-950", "whatsapp", 4.5),
    # --- Non-text UI: 3:1 ---
    # The focus ring must clear 3:1 on BOTH surfaces, so it uses accent-500
    # rather than the lighter accent-400 fill colour.
    ("focus ring accent-500 on dark", "accent-500", "ink-950", 3.0),
    ("focus ring accent-500 on light", "accent-500", "bone-50", 3.0),
    # Outline buttons must remain identifiable as controls on the dark surface.
    ("outline button border ink-500 on dark", "ink-500", "ink-950", 3.0),
    ("outline button border on light", "ink-400", "bone-50", 3.0),
    # The filled signal button now also appears on a LIGHT band (the /cars
    # closing CTA). Until then signal-500 only ever sat on charcoal, so its
    # boundary against the light section was never checked.
    ("signal-500 fill on light section", "signal-500", "bone-50", 3.0),
    # The hero's Sell CTA is now a filled signal button too, so its edge has to
    # stay legible against the dark hero scrim (worst case = ink-950 under the
    # photograph). Without this the red fill could sit on near-black unnoticed.
    ("signal-500 fill on hero scrim", "signal-500", "ink-950", 3.0),
    # Status badges sit over arbitrary vehicle photography, so their backdrop is
    # the one thing this codebase cannot control. Worst case is a pure-white
    # photo pixel (a white car, an overcast sky). The badge scrim is ink-950 at
    # 95%, which composites to #2f2f2f over white — that is the value checked
    # here. Measured 1.33:1 before the scrim was added, because a 12% tint just
    # inherits whatever is behind it.
    #
    # This constant is DERIVED from the ink-950 token and the alpha in
    # StatusBadge.tsx. Change either one and this must change with it, or the
    # check silently measures a colour the site no longer renders.
    ("available badge over white photo", "status-available", "#2f2f2f", 4.5),
    ("reserved badge over white photo", "status-reserved", "#2f2f2f", 4.5),
    ("sold badge over white photo", "status-sold", "#2f2f2f", 4.5),
]


def main() -> int:
    tokens = load_tokens(CSS_PATH)
    print(f"Reading {CSS_PATH}")
    print(f"Parsed {len(tokens)} colour tokens\n")

    def resolve(name: str) -> str | None:
        """A literal '#rrggbb' is used as-is; anything else is a theme token."""
        if name.startswith("#"):
            return name
        return tokens.get(f"--color-{name}")

    missing = {
        t for _, fg, bg, _ in CHECKS for t in (fg, bg) if resolve(t) is None
    }
    if missing:
        for t in sorted(missing):
            print(f"MISSING TOKEN: --color-{t}")
        return 2

    width = max(len(label) for label, *_ in CHECKS)
    failures = 0

    print(f"{'check':<{width}}  {'ratio':>6}  {'min':>4}  result")
    print("-" * (width + 22))

    for label, fg, bg, minimum in CHECKS:
        fg_hex, bg_hex = resolve(fg), resolve(bg)
        assert fg_hex is not None and bg_hex is not None
        ratio = contrast(fg_hex, bg_hex)
        ok = ratio >= minimum
        if not ok:
            failures += 1
        print(
            f"{label:<{width}}  {ratio:>6.2f}  {minimum:>4.1f}  "
            f"{'pass' if ok else 'FAIL'}   ({fg_hex} on {bg_hex})"
        )

    print()
    if failures:
        print(f"{failures} of {len(CHECKS)} checks FAILED")
        return 1

    print(f"All {len(CHECKS)} checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
