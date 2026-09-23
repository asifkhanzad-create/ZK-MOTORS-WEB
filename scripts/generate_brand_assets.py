"""Generate ZK Motors brand assets: favicon set + Open Graph social preview.

Run:  python scripts/generate_brand_assets.py

Outputs:
  src/app/icon.png           512x512  (Next.js picks this up as the favicon)
  src/app/apple-icon.png     180x180
  public/og-image.jpg        1200x630 (social preview)

These are raster assets, so they do NOT follow the CSS tokens automatically.
Whenever the palette or typeface changes in src/app/globals.css, re-run this
script or the favicon and social preview will silently drift out of date.

Montserrat is a variable font, so a single file covers every weight via
Pillow's set_variation_by_name(). The file is downloaded once and cached.
"""

from __future__ import annotations

import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
APP = os.path.join(ROOT, "src", "app")
FONT_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".font-cache")

FONT_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/"
    "Montserrat%5Bwght%5D.ttf"
)
FONT_CANDIDATES = [
    os.path.join(FONT_CACHE, "Montserrat-Variable.ttf"),
    "C:/Users/AKZADROON/.workbuddy-ai/binaries/fonts/Montserrat-Variable.ttf",
]

# --- Palette: mirrors the @theme block in src/app/globals.css ---------------
# These are literals on purpose. Raster output cannot read CSS custom
# properties, so every one of them has to be updated by hand when @theme
# changes — and then this script re-run. Nothing will tell you they drifted.
INK = (36, 36, 36)  # ink-950  #242424
BONE = (250, 250, 249)  # bone-50  #fafaf9
BONE_MUTED = (169, 176, 187)  # muted-dark #a9b0bb
ACCENT_LIGHT = (122, 203, 255)  # accent-300 #7acbff
ACCENT_MID = (27, 143, 212)  # accent-500 #1b8fd4


def font_path() -> str:
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    os.makedirs(FONT_CACHE, exist_ok=True)
    target = os.path.join(FONT_CACHE, "Montserrat-Variable.ttf")
    print(f"downloading Montserrat -> {target}")
    urllib.request.urlretrieve(FONT_URL, target)
    return target


def load_font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    """weight is a Montserrat variation name, e.g. 'Regular', 'SemiBold', 'Bold'."""
    font = ImageFont.truetype(font_path(), size)
    try:
        font.set_variation_by_name(weight)
    except Exception as exc:  # noqa: BLE001 - fall back to the default instance
        print(f"warning: could not set weight {weight!r} ({exc}); using default")
    return font


def vertical_gradient(size: tuple[int, int], top: tuple, bottom: tuple) -> Image.Image:
    """Small gradient image scaled up — cheaper than per-pixel work."""
    width, height = size
    strip = Image.new("RGB", (1, height))
    for y in range(height):
        ratio = y / max(height - 1, 1)
        strip.putpixel(
            (0, y),
            tuple(round(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3)),
        )
    return strip.resize((width, height), Image.BILINEAR)


def make_mark(size: int, radius_ratio: float = 0.22) -> Image.Image:
    """The ZK monogram tile. Must stay in step with components/layout/Wordmark.tsx.

    The gradient deliberately stops at accent-500 rather than accent-600: the
    dark ink monogram only holds contrast down to that point (4.3:1), and going
    darker would leave the lower half of the tile illegible.
    """
    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    gradient = vertical_gradient((size, size), ACCENT_LIGHT, ACCENT_MID).convert("RGBA")

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255
    )

    mark.paste(gradient, (0, 0), mask)

    draw = ImageDraw.Draw(mark)
    font = load_font("ExtraBold", int(size * 0.46))
    text = "ZK"
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=INK)

    return mark


def build_og_image() -> None:
    width, height = 1200, 630
    canvas = Image.new("RGB", (width, height), INK)

    # Photo on the right, faded into the background on its left edge.
    photo_path = os.path.join(PUBLIC, "vehicles", "hero-showroom.jpg")
    if os.path.exists(photo_path):
        panel_w = 620
        photo = Image.open(photo_path).convert("RGB")
        scale = max(panel_w / photo.width, height / photo.height)
        photo = photo.resize(
            (round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS
        )
        left = (photo.width - panel_w) // 2
        top = (photo.height - height) // 2
        photo = photo.crop((left, top, left + panel_w, top + height))

        # fade mask: transparent at left, opaque from ~50%
        mask = Image.new("L", (panel_w, height), 0)
        mask_px = mask.load()
        for x in range(panel_w):
            ratio = x / (panel_w * 0.5)
            value = 255 if ratio >= 1 else int(255 * (ratio**1.4))
            for y in range(height):
                mask_px[x, y] = value

        canvas.paste(photo, (width - panel_w, 0), mask)

        # darken the photo so overlaid text stays legible
        scrim = Image.new("RGB", (panel_w, height), INK)
        canvas.paste(
            Image.blend(canvas.crop((width - panel_w, 0, width, height)), scrim, 0.28),
            (width - panel_w, 0),
            mask,
        )

    draw = ImageDraw.Draw(canvas)

    # Brand mark + wordmark
    mark_size = 76
    mark = make_mark(mark_size)
    canvas.paste(mark, (80, 74), mark)

    font_word = load_font("Bold", 40)
    draw.text((80 + mark_size + 20, 88), "ZK Motors", font=font_word, fill=BONE)

    # Eyebrow — accent blue, matching the section eyebrows on the site.
    # Names the showroom's town only. It used to read
    # "TRUSTED CAR DEALERSHIP · WAH CANTT & TAXILA", which read as a service
    # boundary; the business is not confined to those two towns.
    font_eyebrow = load_font("SemiBold", 20)
    draw.text(
        (80, 214),
        "TRUSTED USED-CAR DEALERSHIP  ·  WAH CANTT",
        font=font_eyebrow,
        fill=ACCENT_LIGHT,
    )

    # Headline
    font_head = load_font("Bold", 62)
    draw.text((80, 258), "Find a Car You'll", font=font_head, fill=BONE)
    draw.text((80, 328), "Love to Drive", font=font_head, fill=BONE)

    # Supporting line
    font_sub = load_font("Regular", 26)
    draw.text(
        (80, 424),
        "Buy, sell and exchange quality used cars",
        font=font_sub,
        fill=BONE_MUTED,
    )

    # No accent rule here on purpose — the short coloured dash that used to sit
    # at y=496 read as filler. Whitespace does the separating instead.

    font_foot = load_font("Regular", 22)
    draw.text(
        (80, 508),
        "Call or WhatsApp to arrange a viewing",
        font=font_foot,
        fill=BONE_MUTED,
    )

    out = os.path.join(PUBLIC, "og-image.jpg")
    canvas.save(out, quality=90, optimize=True)
    print(f"wrote {out} {canvas.size}")


def main() -> None:
    icon = make_mark(512)
    icon_path = os.path.join(APP, "icon.png")
    icon.save(icon_path)
    print(f"wrote {icon_path} {icon.size}")

    apple = make_mark(180)
    apple_path = os.path.join(APP, "apple-icon.png")
    apple.save(apple_path)
    print(f"wrote {apple_path} {apple.size}")

    build_og_image()


if __name__ == "__main__":
    main()
