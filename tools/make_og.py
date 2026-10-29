"""Social share images (1200x630) from real NIDA photography + the original logo."""
import os
from PIL import Image, ImageOps
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW=os.path.join(ROOT,'raw'); OUT=os.path.join(ROOT,'public','assets','img','og'); os.makedirs(OUT,exist_ok=True)
FOREST=(8,59,30)
logo=Image.open(os.path.join(RAW,'2024_09_footer.png')).convert('RGBA')
def make(name, src):
    im=Image.open(os.path.join(RAW,src)).convert('RGB'); im.draft('RGB',(2400,1300))
    im=ImageOps.fit(im,(1200,630),Image.LANCZOS,centering=(0.5,0.4))
    # forest-green wash, stronger on the left, using only the brand forest colour
    grad=Image.new('L',(1200,630))
    for x in range(1200):
        a=int(235-150*(x/1200))
        for y in range(0,630,630): pass
        grad.paste(a,(x,0,x+1,630))
    im=Image.composite(Image.new('RGB',(1200,630),FOREST),im,grad)
    l=logo.copy(); l.thumbnail((420,200),Image.LANCZOS)
    im.paste(l,(72,630-72-l.height),l)
    im.save(os.path.join(OUT,name),quality=86)
make('og-default.jpg','2024_12_nida60_54180651746_o.jpg')
make('og-about.jpg','2024_12_nida235_54181088070_o.jpg')
make('og-awards.jpg','2024_12_54181090995_52c665fc4d_z.jpg')
make('og-awardees.jpg','2026_03_54974585902_e66217992d_z.jpg')
make('og-editions.jpg','2024_10_Copy-of-NIDA10.webp')
make('og-gallery.jpg','2024_10_Copy-of-NIDA111.jpeg')
make('og-nomination.jpg','2026_03_54974590162_5567030e7f_z.jpg')
print('ok')
