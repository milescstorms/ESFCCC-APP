"""Draw a "click to play" cover image for a tutorial video.

    python3 make_cover.py "PROVIDERS · VIDEO 03" "Register your program" cover.png
    python3 make_cover.py video-covers.csv      (every cover in the list)

The cover is the Council seal, a small label, the video title and a white
"Click to play" button on a Council-blue background. Sizes are worked out
from the image height, so a cover can be drawn at any shape a video has.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
LOGO = HERE.parent / "assets" / "cccoc-logo.jpg"
FONTS = Path("/usr/share/fonts/opentype/inter")

BLUE_CENTER = (22, 94, 150)
BLUE_EDGE = (12, 56, 100)
LABEL = (170, 202, 232)
NAVY = (15, 61, 107)
PLAY = (26, 111, 189)
WHITE = (255, 255, 255)


def font(weight, px):
    return ImageFont.truetype(str(FONTS / f"Inter-{weight}.otf"), round(px))


def background(w, h):
    # Lighter blue behind the seal and title, darker toward the edges.
    small = Image.new("RGB", (192, max(1, round(192 * h / w))))
    sw, sh = small.size
    cx, cy = sw / 2, sh * 0.44
    reach = (sw * sw + sh * sh) ** 0.5 / 2
    px = small.load()
    for y in range(sh):
        for x in range(sw):
            t = min(1.0, (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / reach)
            t = t * t * (3 - 2 * t)
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(BLUE_CENTER, BLUE_EDGE))
    return small.resize((w, h), Image.BICUBIC).convert("RGBA")


def round_logo(diameter):
    # The logo file has black corners; keep only the circle.
    logo = Image.open(LOGO).convert("RGB")
    side = min(logo.size)
    logo = logo.crop((0, 0, side, side)).resize((diameter, diameter), Image.LANCZOS)
    mask = Image.new("L", (diameter * 4, diameter * 4), 0)
    ImageDraw.Draw(mask).ellipse((6, 6, diameter * 4 - 6, diameter * 4 - 6), fill=255)
    logo.putalpha(mask.resize((diameter, diameter), Image.LANCZOS))
    return logo


def soft_shape(size, box, radius, blur, color, alpha):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def spaced_text(draw, center_x, top, text, fnt, fill, tracking):
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = center_x - total / 2
    for ch, cw in zip(text, widths):
        draw.text((x, top), ch, font=fnt, fill=fill)
        x += cw + tracking


def render_cover(eyebrow, title, width=1920, height=1080):
    u = height / 1080
    cx = width / 2
    img = background(width, height)

    # Seal with a white rim and a soft glow.
    seal = round(380 * u)
    rim = round(10 * u)
    seal_cy = round(292 * u)
    outer = seal + rim * 2
    left, top = round(cx - outer / 2), seal_cy - outer // 2
    img.alpha_composite(soft_shape(img.size, (left - 18 * u, top - 18 * u, left + outer + 18 * u, top + outer + 18 * u),
                                   outer, 28 * u, WHITE, 90))
    ImageDraw.Draw(img).ellipse((left, top, left + outer, top + outer), fill=(244, 247, 251, 255))
    img.alpha_composite(round_logo(seal), (left + rim, top + rim))

    draw = ImageDraw.Draw(img)

    # Small label, e.g. "PROVIDERS · VIDEO 03".
    label_font = font("SemiBold", 38 * u)
    spaced_text(draw, cx, 552 * u, eyebrow.upper(), label_font, LABEL, 6 * u)

    # Title: shrink to fit, then wrap onto two lines if it is still too long.
    max_w = width * 0.86
    size = 96 * u
    title_font = font("Bold", size)
    while draw.textlength(title, font=title_font) > max_w and size > 70 * u:
        size -= 2 * u
        title_font = font("Bold", size)
    lines = [title]
    if draw.textlength(title, font=title_font) > max_w:
        words = title.split()
        best = min(range(1, len(words)), key=lambda i: max(
            draw.textlength(" ".join(words[:i]), font=title_font),
            draw.textlength(" ".join(words[i:]), font=title_font)))
        lines = [" ".join(words[:best]), " ".join(words[best:])]
    line_h = size * 1.12
    title_top = 618 * u - (len(lines) - 1) * line_h / 2
    for i, line in enumerate(lines):
        draw.text((cx, title_top + i * line_h), line, font=title_font, fill=WHITE, anchor="mt")
    title_bottom = title_top + len(lines) * line_h

    # "Click to play" button.
    btn_font = font("Bold", 44 * u)
    btn_text = "Click to play"
    tri = 42 * u
    gap = 20 * u
    pad = 44 * u
    btn_w = pad * 2 + tri * 0.87 + gap + draw.textlength(btn_text, font=btn_font)
    btn_h = 96 * u
    btn_top = max(800 * u, title_bottom + 50 * u)
    bx0, by0 = cx - btn_w / 2, btn_top
    bx1, by1 = bx0 + btn_w, by0 + btn_h
    img.alpha_composite(soft_shape(img.size, (bx0, by0 + 10 * u, bx1, by1 + 10 * u), btn_h / 2, 16 * u, (0, 0, 0), 110))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((bx0, by0, bx1, by1), radius=btn_h / 2, fill=WHITE)
    mid = (by0 + by1) / 2
    tx = bx0 + pad
    draw.polygon([(tx, mid - tri / 2), (tx, mid + tri / 2), (tx + tri * 0.87, mid)], fill=PLAY)
    draw.text((tx + tri * 0.87 + gap, mid), btn_text, font=btn_font, fill=NAVY, anchor="lm")

    return img.convert("RGB")


def render_list(csv_path):
    # One cover per row of video-covers.csv, saved as <folder>/<file> - <title>.png
    import csv
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        out = HERE / row["folder"] / f"{row['file']} - {row['title']}.png"
        out.parent.mkdir(exist_ok=True)
        render_cover(row["label"], row["title"]).save(out, optimize=True)
        print(out.relative_to(HERE))
    print(f"{len(rows)} covers drawn")


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1].endswith(".csv"):
        render_list(sys.argv[1])
    elif len(sys.argv) == 4:
        render_cover(sys.argv[1], sys.argv[2]).save(sys.argv[3], optimize=True)
    else:
        sys.exit(__doc__)
