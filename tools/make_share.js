#!/usr/bin/env node
// Builds one 1200 x 630 social share image per honouree (LinkedIn, Facebook, X, WhatsApp)
// from the approved portrait, the original NIDA logo, the brand colours and fonts.
// Output: public/assets/img/og/awardees/<slug>.jpg   Run: npm run share-images
// Needs Playwright with Chromium (npx playwright install chromium) on the machine that runs it.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const awardees = require('../src/data/awardees.json');
const OUT = path.join(ROOT, 'public/assets/img/og/awardees');
fs.mkdirSync(OUT, { recursive: true });
const asset = (p) => 'file://' + path.join(ROOT, 'public', 'assets', p);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const page = (a) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'NIDA Display'; src: url('${asset('fonts/adventor-bold.woff2')}'); font-weight: 700; }
@font-face { font-family: Montserrat; src: url('${asset('fonts/montserrat-latin.woff2')}'); font-weight: 100 900; }
@font-face { font-family: Montserrat; src: url('${asset('fonts/montserrat-latin-ext.woff2')}'); font-weight: 100 900; unicode-range: U+0100-02AF, U+1E00-1EFF; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Montserrat, sans-serif; color: #fff;
  background: linear-gradient(160deg, #083B1E 0%, #184F22 100%); position: relative; }
.ring { position: absolute; border: 1px solid rgba(245,197,102,.22); border-radius: 50%; }
.r1 { width: 900px; height: 900px; right: -260px; top: -140px; } .r2 { width: 620px; height: 900px; right: -120px; top: -140px; }
.gold-rule { position: absolute; left: 0; right: 0; bottom: 0; height: 8px; background: linear-gradient(135deg, #F5C566, #DDBA5C 50%, #C6982F); }
.copy { position: absolute; left: 72px; top: 64px; bottom: 70px; width: 640px; display: flex; flex-direction: column; }
.logo { width: 210px; }
.name { margin-top: 56px; font-family: 'NIDA Display', Montserrat, sans-serif; font-weight: 700; font-size: var(--fs); line-height: 1.06; letter-spacing: -.025em; }
.award { margin-top: 22px; font-size: 26px; font-weight: 600; line-height: 1.3; color: #F5C566; max-width: 600px; }
.edition { margin-top: 10px; font-size: 20px; font-weight: 500; color: rgba(255,255,255,.78); }
.foot { margin-top: auto; font-size: 17px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.72); }
.foot b { color: #fff; font-weight: 600; }
.portrait { position: absolute; right: 80px; top: 58px; width: 372px; height: 472px; border-radius: 999px 999px 4px 4px; overflow: hidden;
  background: ${a.slug === 'propel' ? '#fff' : '#184F22'}; box-shadow: 0 0 0 2px rgba(245,197,102,.75), 0 40px 70px -30px rgba(0,0,0,.6); }
.portrait img { width: 100%; height: 100%; object-fit: ${a.slug === 'propel' ? 'contain' : 'cover'}; object-position: 50% 20%; ${a.slug === 'propel' ? 'padding: 70px;' : ''} }
.star { position: absolute; right: 252px; top: 512px; width: 30px; height: 30px; color: #F5C566; }
</style></head><body>
<div class="ring r1"></div><div class="ring r2"></div>
<div class="copy">
  <img class="logo" src="${asset('img/brand/nida-logo-white.png')}" alt="">
  <h1 class="name">${esc(a.name)}</h1>
  <p class="award">${esc(a.award)}</p>
  <p class="edition">NIDA ${a.year} honouree</p>
  <p class="foot"><b>nida-awards.org</b> · Nigerians in Diaspora Awards</p>
</div>
<div class="portrait"><img src="${asset('img/awardees/' + a.slug + '-594.webp')}" alt=""></div>
<div class="gold-rule"></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  for (const a of awardees) {
    const tmp = path.join(OUT, '_tmp.html');
    fs.writeFileSync(tmp, page(a));
    await p.goto('file://' + tmp);
    await p.evaluate(() => document.fonts.ready);
    // Fit the name: largest size (max 64px) that keeps it within three lines
    await p.evaluate(() => {
      const n = document.querySelector('.name');
      for (let fs = 64; fs >= 34; fs -= 2) {
        n.style.setProperty('--fs', fs + 'px');
        const lines = Math.round(n.getBoundingClientRect().height / (fs * 1.04));
        if (lines <= (fs > 50 ? 2 : 3) && n.scrollWidth <= n.clientWidth + 1) break;
      }
    });
    await p.screenshot({ path: path.join(OUT, a.slug + '.jpg'), type: 'jpeg', quality: 86 });
    fs.unlinkSync(tmp);
  }
  await browser.close();
  console.log(`Wrote ${awardees.length} share images to public/assets/img/og/awardees/`);
})();
