#!/usr/bin/env python3
"""Build the web derivatives of the premium artwork package.

Source (never modified, never renamed):  assets/artwork/premium/**.png
Output (what the app references):        assets/artwork/web/**.webp

The originals are 1–3 MB PNGs (1254–1774 px); the app shows them at 40–640 px,
so each file is resized to the largest size it is ever drawn at (×2–3 for
retina), trimmed to its alpha box where it has one, cut out from its flat
background where it has none, and saved as WebP. Nothing is upscaled and
aspect ratios are kept. Requires Pillow + numpy only.

    python3 scripts/build-premium-artwork.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/artwork/premium'
OUT = ROOT / 'assets/artwork/web'


def save(im, rel, quality):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p, 'WEBP', quality=quality, method=6)
    print(f'{rel:44s} {im.size[0]}x{im.size[1]}  {p.stat().st_size // 1024} KB')


def fit_width(im, width):
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def alpha_bbox(im, pad=0):
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 8)
    return (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + 1 + pad), min(im.height, ys.max() + 1 + pad))


def square(im, size, margin=0.06):
    """Trimmed RGBA icon centred on a transparent square canvas."""
    im = im.crop(alpha_bbox(im))
    inner = round(size * (1 - 2 * margin))
    s = min(inner / im.width, inner / im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas


def cut_out_flat_background(im, thresh=48):
    """Flood-fill the flat backdrop from the edges → alpha; soft 1px edge."""
    rgb = im.convert('RGB')
    marker = rgb.copy()
    w, h = marker.size
    for xy in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3), (w // 2, 2), (w // 2, h - 3), (2, h // 2), (w - 3, h // 2)]:
        ImageDraw.floodfill(marker, xy, (255, 0, 255), thresh=thresh)
    a = np.array(marker)
    bg = (a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255)
    alpha = Image.fromarray(((~bg) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out


def rounded_icon(im, radius_ratio=0.258):
    """App-icon artwork drawn on black: keep the rounded square, drop the rest."""
    rgb = im.convert('RGB')
    a = np.array(rgb)
    ys, xs = np.where(a.max(axis=2) > 20)
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    mask = Image.new('L', rgb.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=round((box[2] - box[0]) * radius_ratio), fill=255)
    out = rgb.convert('RGBA')
    out.putalpha(mask.filter(ImageFilter.GaussianBlur(0.8)))
    return out.crop((box[0], box[1], box[2] + 1, box[3] + 1))


def app_icon(im, radius_ratio=0.225):
    """App icon painted on white: the rounded square with transparent corners."""
    rgb = im.convert('RGB')
    a = np.array(rgb)
    ys, xs = np.where(a.min(axis=2) < 235)
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    mask = Image.new('L', rgb.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=round((box[2] - box[0]) * radius_ratio), fill=255)
    out = rgb.convert('RGBA')
    out.putalpha(mask.filter(ImageFilter.GaussianBlur(0.8)))
    return out.crop((box[0], box[1], box[2] + 1, box[3] + 1))


def full_bleed(icon):
    """Square platform icon (Apple touch / maskable): the OS rounds the corners
    itself, so each transparent corner is filled with the colour just inside it."""
    w, h = icon.size
    bg = Image.new('RGB', icon.size)
    d = ImageDraw.Draw(bg)
    k = round(w * 0.12)
    for (x0, y0, x1, y1), (sx, sy) in [((0, 0, w // 2, h // 2), (k, k)), ((w // 2, 0, w, h // 2), (w - k, k)),
                                       ((0, h // 2, w // 2, h), (k, h - k)), ((w // 2, h // 2, w, h), (w - k, h - k))]:
        d.rectangle((x0, y0, x1, y1), fill=icon.convert('RGB').getpixel((sx, sy)))
    bg.paste(icon, (0, 0), icon)
    return bg


def save_png(im, rel):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p, 'PNG', optimize=True)
    print(f'{rel:44s} {im.size[0]}x{im.size[1]}  {p.stat().st_size // 1024} KB')


def main():
    # Screen heroes (4:3, cropped by CSS to the phone hero): 1200 px is 3× the 390 px column.
    for n in ['000001', '000002', '000003', '000005']:
        save(fit_width(Image.open(SRC / f'heroes/{n}.png').convert('RGB'), 1200), f'heroes/{n}.webp', 82)
    # Keşif Haritası ground (2:1): the torn sheet is painted on plain white —
    # the white becomes transparent so the sheet lies on the CSS parchment.
    ground = cut_out_flat_background(Image.open(SRC / 'maps/000006.png'), thresh=14)
    save(fit_width(ground, 1500), 'maps/000006.webp', 84)
    # Wooden plank: trim to the plank, ~3:1, used as a 9-slice border-image.
    plank = Image.open(SRC / 'ui/000007.png').convert('RGBA')
    save(fit_width(plank.crop(alpha_bbox(plank, 6)), 720), 'ui/000007.webp', 90)
    # Achievement badge: trimmed, drawn at 64–120 px.
    badge = Image.open(SRC / 'badges/000008.png').convert('RGBA')
    save(fit_width(badge.crop(alpha_bbox(badge, 8)), 360), 'badges/000008.webp', 88)
    # Companion character: cut out of its flat cream backdrop, drawn at 70–160 px.
    char = cut_out_flat_background(Image.open(SRC / 'characters/000004.png'))
    save(fit_width(char.crop(alpha_bbox(char, 10)), 480), 'characters/000004.webp', 88)
    # Daily routine icons: transparent squares, drawn at 40–56 px (192 = 3× 64).
    for p in sorted((SRC / 'icons/daily').glob('*.png')):
        save(square(Image.open(p).convert('RGBA'), 192), f'icons/daily/{p.stem}.webp', 86)
    # Little Explorer identity: the rounded app icon without its black canvas.
    save(fit_width(rounded_icon(Image.open(SRC / 'icons/little-explorer/icon-02.png')), 192), 'icons/little-explorer/icon-02.webp', 88)
    # App icons (content/appIcons.js): a 192 px rounded PNG per icon for the
    # Ayarlar picker and the favicon; the default (calendar) also gets the
    # platform sizes — 180 Apple touch icon, 512 manifest "any" + maskable.
    for n in ['calendar', 'dinosaur', 'growth']:
        ic = app_icon(Image.open(SRC / f'app-icons/{n}.png'))
        save_png(ic.resize((192, 192), Image.LANCZOS), f'app-icons/{n}-192.png')
        if n == 'calendar':
            save_png(ic.resize((512, 512), Image.LANCZOS), f'app-icons/{n}-512.png')
            fb = full_bleed(ic)
            save_png(fb.resize((180, 180), Image.LANCZOS), f'app-icons/{n}-180.png')
            save_png(fb.resize((512, 512), Image.LANCZOS), f'app-icons/{n}-maskable-512.png')


if __name__ == '__main__':
    main()
