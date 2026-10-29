#!/usr/bin/env python3
"""Square head-and-shoulders crops of awardee portraits for the home page globe.
Crop = (centre x as a fraction of width, centre y as a fraction of height, side as a fraction of width).
Run from the site folder: python3 tools/make_faces.py"""
from PIL import Image
import os
CROPS = {
    'morin-oluwole': (.45, .45, .86),
    'rasheedat-ajibade': (.48, .24, .56),
    'kachi-nwanna': (.52, .40, .76),
    'cynthia-asije': (.48, .40, .62),
    'hassan-aliyu': (.53, .37, .48),
    'juliana-olayinka': (.50, .47, .80),
    'chidiebere-ikejemba': (.52, .46, .80),
    'tolulope-ayeni': (.48, .47, .80),
    'adeola-adeleye-fasubaa': (.50, .45, .80),
    'akinloye-bamigboye': (.52, .42, .80),
}
SRC = 'public/assets/img/awardees/{}-594.webp'
OUT = 'public/assets/img/awardees/face'
os.makedirs(OUT, exist_ok=True)
for slug, (cx, cy, s) in CROPS.items():
    im = Image.open(SRC.format(slug)).convert('RGB')
    w, h = im.size
    side = s * w
    x0 = max(0, min(w - side, cx * w - side / 2)); y0 = max(0, min(h - side, cy * h - side / 2))
    face = im.crop((round(x0), round(y0), round(x0 + side), round(y0 + side)))
    for px in (120, 240):
        face.resize((px, px), Image.LANCZOS).save(f'{OUT}/{slug}-{px}.webp', quality=82, method=6)
print('Wrote', len(CROPS), 'face crops to', OUT)
