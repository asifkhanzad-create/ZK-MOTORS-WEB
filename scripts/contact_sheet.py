"""Build a labelled contact sheet from a list of images.

Usage: python contact_sheet.py <out.jpg> <img1> <img2> ...
Used to review many candidate photos in a single image.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int):
    for name in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def montage(paths, out, cols=4, cell=(400, 280), label_h=24):
    rows = (len(paths) + cols - 1) // cols
    width = cols * cell[0]
    height = rows * (cell[1] + label_h)

    sheet = Image.new("RGB", (width, height), (18, 19, 21))
    draw = ImageDraw.Draw(sheet)
    font = load_font(15)

    for index, path in enumerate(paths):
        row, col = divmod(index, cols)
        x = col * cell[0]
        y = row * (cell[1] + label_h)

        try:
            image = Image.open(path).convert("RGB")
            image.thumbnail(cell, Image.LANCZOS)
            ox = x + (cell[0] - image.width) // 2
            oy = y + (cell[1] - image.height) // 2
            sheet.paste(image, (ox, oy))
        except Exception as exc:  # noqa: BLE001 - report and continue
            draw.text((x + 8, y + 8), f"ERR {exc}", fill=(255, 90, 90), font=font)

        draw.text(
            (x + 6, y + cell[1] + 3),
            os.path.basename(path),
            fill=(238, 238, 240),
            font=font,
        )

    sheet.save(out, quality=88)
    print(f"wrote {out} {sheet.size}")


if __name__ == "__main__":
    montage(sys.argv[2:], sys.argv[1])
