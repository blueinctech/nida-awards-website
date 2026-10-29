"""Turn the original NIDA images (raw/) into web-ready WebP files (public/assets/img/).
Run: python3 tools/optimize_images.py   (needs Pillow)"""
import json, os, re, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'public', 'assets', 'img')

def save(src, dest, width, quality=78):
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.open(os.path.join(RAW, src))
    im = ImageOps.exif_transpose(im)
    im.draft('RGB', (width * 2, width * 2))
    im = im.convert('RGBA' if dest.endswith('.png') else 'RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if dest.endswith('.png'):
        im.save(path, optimize=True)
    else:
        im.save(path, 'WEBP', quality=quality, method=6)
    return im.size

manifest = {}
def rec(key, size):
    manifest[key] = {'w': size[0], 'h': size[1]}

# Brand marks (kept as PNG, unchanged artwork)
for src, dest, w in [
    ('2024_09_footer.png', 'brand/nida-logo-white.png', 726),
    ('2024_09_NIDA-LOGO-2.png', 'brand/nida-logo-green.png', 726),
    ('2024_10_loogo.png', 'brand/fon-logo.png', 301),
    ('2024_10_cropped-FAVICON.png', 'brand/favicon.png', 512),
    ('2024_10_IMAGE.png', 'brand/trophy-gold.png', 200),
    ('2024_11_7.png', 'sponsors/taptap-send.png', 400),
    ('2024_12_CPS-Africa-Logo-Black1.png', 'sponsors/cps-africa.png', 600),
]:
    rec(dest, save(src, dest, w))
# Trim transparent margins around sponsor logos
for dest in ('sponsors/taptap-send.png', 'sponsors/cps-africa.png'):
    path = os.path.join(OUT, dest)
    im = Image.open(path).convert('RGBA')
    im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()).save(path, optimize=True)
for size in (32, 180, 192):
    im = Image.open(os.path.join(RAW, '2024_10_cropped-FAVICON.png')).resize((size, size), Image.LANCZOS)
    im.save(os.path.join(OUT, 'brand', f'favicon-{size}.png'), optimize=True)

# Portraits
portraits = json.load(open(os.path.join(ROOT, 'src', 'data', 'portraits.json')))
for slug, src in portraits.items():
    for w in (360, 594):
        rec(f'awardees/{slug}-{w}.webp', save(src, f'awardees/{slug}-{w}.webp', w, 80))

# Event photography
photos = json.load(open(os.path.join(ROOT, 'src', 'data', 'photos.json')))
for p in photos:
    for w in (640, 1280, 1920):
        dest = f"photos/{p['id']}-{w}.webp"
        im = Image.open(os.path.join(RAW, p['src']))
        if w > im.width and w != 640:
            continue
        rec(dest, save(p['src'], dest, w))

json.dump(manifest, open(os.path.join(ROOT, 'src', 'data', 'manifest.json'), 'w'), indent=1)
print(len(manifest), 'files')
