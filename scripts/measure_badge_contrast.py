"""Measure a status badge's text contrast against the crop behind it.

Takes a PNG produced by `qa/measure-badge.mjs` — a screenshot clipped exactly to
the badge element — and reports the worst-case contrast between the badge's text
colour and the background pixels inside that box.

Why this exists: the badge sits on top of vehicle photography, so its backdrop
is not a token and cannot be checked by `verify_theme.py`. The Prado photo has a
bright overcast sky in the top-left corner, exactly where the badge sits.

Usage: python scripts/measure_badge_contrast.py <crop.png> <#rrggbb>
"""

import sys

from PIL import Image


def luminance(pixel) -> float:
    def channel(value: float) -> float:
        value /= 255
        return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4

    r, g, b = pixel[:3]
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast(a, b) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else "screenshots/inspect/badge-crop.png"
    text_hex = sys.argv[2] if len(sys.argv) > 2 else "#6fdc9b"

    text = tuple(int(text_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))

    image = Image.open(path).convert("RGB")

    # The badge is `rounded-full`, so the screenshot clipped to its bounding box
    # has the photo showing through all four corners. Sampling the raw crop
    # therefore measures the *sky*, not the badge — the first version of this
    # script reported 1.62:1 for a badge that was actually fine. Inset by half
    # the height horizontally (the end-cap radius) and a few pixels vertically
    # (the 1px border) so every sampled pixel is genuinely inside the pill.
    width, height = image.size
    pad_x = height // 2
    pad_y = 3
    box = (pad_x, pad_y, width - pad_x, height - pad_y)
    if box[2] <= box[0] or box[3] <= box[1]:
        print("crop is too small to inset — increase the clip size")
        return 1

    pixels = list(image.crop(box).getdata())

    # Glyph anti-aliasing blends text into backdrop, so "brightest pixel" and
    # "darkest pixel" are both unreliable: the brightest is always a glyph edge
    # and the darkest is always a glyph core. The meaningful question is
    # different — what colour is the badge's own background, and does the text
    # clear 4.5:1 against it? The badge background is the most common colour in
    # the interior, because the scrim makes it near-uniform.
    counts = {}
    for pixel in pixels:
        counts[pixel] = counts.get(pixel, 0) + 1
    background, occurrences = max(counts.items(), key=lambda item: item[1])

    # Count near-matches too. JPEG compression spreads one flat colour across
    # dozens of adjacent shades, so an exact-equality count reports 14% for an
    # interior that is visually uniform and fires a spurious warning.
    tolerance = 8
    near = sum(
        count
        for pixel, count in counts.items()
        if all(abs(c - b) <= tolerance for c, b in zip(pixel, background))
    )

    worst = contrast(text, background)
    share = near / len(pixels)

    print(f"crop              {width}x{height} px")
    print(f"sampled region    {box}  ({len(pixels)} px, pill interior only)")
    print(f"text colour       {text_hex}  L={luminance(text):.4f}")
    print(f"badge background  {background}  L={luminance(background):.4f}")
    print(f"                  ({occurrences} exact px, {share:.0%} within +/-{tolerance})")
    print()
    print(f"text contrast     {worst:5.2f}:1")
    print()
    if share < 0.75:
        print(
            f"WARNING — only {share:.0%} of the interior matches the background "
            "colour; the badge may be sitting on a high-contrast part of the photo."
        )
    print("PASS" if worst >= 4.5 else "FAIL", "— needs 4.5:1 for text this size")
    return 0 if worst >= 4.5 else 1


if __name__ == "__main__":
    sys.exit(main())
