#!/usr/bin/env python3
"""3:4 crops of NIDA award-night photos (raw/) for the home hero wall.
Reads src/data/hero-wall.json, writes public/assets/img/hero/wall/<id>-<w>.webp
and the real widths to src/data/hero-wall-sizes.json.
Run from the site folder: python3 tools/make_hero_wall.py   (needs Pillow)"""
import json, os
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'public', 'assets', 'img', 'hero', 'wall')
WIDTHS = (300, 450)  # tiles are 116-250px wide on screen; 450 covers 2x screens where the source allows

wall = json.load(open(os.path.join(ROOT, 'src', 'data', 'hero-wall.json')))
os.makedirs(OUT, exist_ok=True)
sizes = {}
for col in wall['columns']:
    for t in col:
        if t['type'] != 'moment':
            continue
        cx, cy, hf = t['crop']
        im = ImageOps.exif_transpose(Image.open(os.path.join(RAW, t['src']))).convert('RGB')
        w, h = im.size
        ch = hf * h
        cw = ch * 3 / 4
        x0 = max(0, min(w - cw, cx * w - cw / 2))
        y0 = max(0, min(h - ch, cy * h - ch / 2))
        crop = im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch)))
        made = []
        # Small crops (the 640px Flickr exports) are saved once at their own width
        for tw in (WIDTHS if crop.width >= 360 else (crop.width,)):
            ow = min(tw, crop.width)  # never upscale
            if made and ow <= made[-1]:
                continue
            oh = round(ow * 4 / 3)
            out = crop.resize((ow, oh), Image.LANCZOS)
            if ow < crop.width:
                out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=45, threshold=2))
            out.save(os.path.join(OUT, f"{t['id']}-{ow}.webp"), 'WEBP', quality=82, method=6)
            made.append(ow)
        sizes[t['id']] = made
# Drop crops from earlier runs that the wall no longer uses
keep = {f"{i}-{w}.webp" for i, ws in sizes.items() for w in ws}
for f in os.listdir(OUT):
    if f.endswith('.webp') and f not in keep:
        os.remove(os.path.join(OUT, f))
json.dump(sizes, open(os.path.join(ROOT, 'src', 'data', 'hero-wall-sizes.json'), 'w'), indent=1)
print('Wrote', len(sizes), 'hero wall crops to', OUT)
