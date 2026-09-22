"""Measure worst-case text contrast over the hero photograph.

Reads a screenshot of the hero *background* (copy hidden) and reports the
lightest pixels in the region the headline occupies. The lightest background is
the worst case for light text, so the reported ratio is a floor, not an average.

Usage: python analyse_hero_contrast.py <hero-bg.png> <text-hex>
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def _lin(c: float) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2

    path = Path(sys.argv[1])
    text_rgb = hex_to_rgb(sys.argv[2])
    text_l = luminance(*text_rgb)

    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()

    # Sample a grid rather than every pixel — this is a large area and we only
    # need the extremes, which a dense grid will find.
    step = max(1, min(w, h) // 120)
    lums: list[tuple[float, tuple[int, int, int]]] = []
    for y in range(0, h, step):
        for x in range(0, w, step):
            rgb = px[x, y]
            lums.append((luminance(*rgb), rgb))

    lums.sort(key=lambda t: t[0])
    darkest = lums[0]
    lightest = lums[-1]
    mean_l = sum(l for l, _ in lums) / len(lums)

    def ratio(bg_l: float) -> float:
        hi, lo = max(text_l, bg_l), min(text_l, bg_l)
        return (hi + 0.05) / (lo + 0.05)

    print(f"region       {w}x{h}px, {len(lums)} samples")
    print(f"text colour  #{sys.argv[2].lstrip('#')}  luminance {text_l:.4f}")
    print()
    print(f"darkest bg   rgb{darkest[1]}  L={darkest[0]:.4f}  contrast {ratio(darkest[0]):.2f}")
    print(f"mean bg      L={mean_l:.4f}                  contrast {ratio(mean_l):.2f}")
    print(f"lightest bg  rgb{lightest[1]}  L={lightest[0]:.4f}  contrast {ratio(lightest[0]):.2f}  <- worst case")
    print()

    worst = ratio(lightest[0])
    print(f"worst-case contrast {worst:.2f}:1  ->  {'PASS' if worst >= 4.5 else 'FAIL'} for 4.5:1 body text")
    return 0 if worst >= 4.5 else 1


if __name__ == "__main__":
    sys.exit(main())
