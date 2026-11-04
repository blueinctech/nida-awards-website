import 'server-only';
import sharp from 'sharp';
import { putFile, randomName } from './storage';
import type { Img } from '../types';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions accept request bodies up to 4.5 MB

const DOC_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'application/pdf': { ext: 'pdf', magic: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  'application/msword': { ext: 'doc', magic: (b) => b.subarray(0, 4).toString('hex') === 'd0cf11e0' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', magic: (b) => b.subarray(0, 4).toString('hex') === '504b0304' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', magic: (b) => b.subarray(0, 4).toString('hex') === '504b0304' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', magic: (b) => b.subarray(0, 4).toString('hex') === '504b0304' },
};
const EXT_TO_DOC: Record<string, string> = Object.fromEntries(Object.entries(DOC_TYPES).map(([m, v]) => [v.ext, m]));

export type Checked = { kind: 'image'; format: string; width: number; height: number } | { kind: 'document'; mime: string; ext: string };

// Identifies a file by its content (not by what the browser says it is).
export async function checkFile(buf: Buffer, filename: string, allow: ('image' | 'document')[]): Promise<Checked> {
  if (!buf.length) throw new Error('The file is empty.');
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error('The file is larger than 4 MB.');
  if (allow.includes('image')) {
    try {
      const meta = await sharp(buf).metadata();
      if (meta.format && ['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format) && meta.width && meta.height) {
        if (meta.width * meta.height > 60e6) throw new Error('The image is too large (over 60 megapixels).');
        return { kind: 'image', format: meta.format, width: meta.width, height: meta.height };
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('The image')) throw e;
    }
  }
  if (allow.includes('document')) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const mime = EXT_TO_DOC[ext];
    if (mime && DOC_TYPES[mime].magic(buf)) return { kind: 'document', mime, ext };
  }
  throw new Error(allow.includes('document') ? 'Use a JPG, PNG or WebP image, or a PDF, Word, Excel or PowerPoint document.' : 'Use a JPG, PNG or WebP image.');
}

const yearFolder = () => new Date().getFullYear();

// Web sizes for any picture: 640, 1280 and 1920 pixels wide (never larger than the original)
export async function makeWebVariants(buf: Buffer, prefix: string): Promise<{ variants: Img[]; keys: string[]; storage: 'blob' | 'local'; width: number; height: number }> {
  const base = sharp(buf).rotate();
  const meta = await base.clone().metadata();
  const oriented = (meta.orientation || 1) >= 5;
  const W = (oriented ? meta.height : meta.width) || 0;
  const H = (oriented ? meta.width : meta.height) || 0;
  const widths = [640, 1280, 1920].filter((w) => w < W);
  if (widths.length < 3 && W <= 1920) widths.push(W);
  const variants: Img[] = [];
  const keys: string[] = [];
  let storage: 'blob' | 'local' = 'local';
  const id = randomName('');
  for (const w of [...new Set(widths)].sort((a, b) => a - b)) {
    const out = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const saved = await putFile(`${prefix}/${yearFolder()}/${id}-${w}.webp`, out.data, 'image/webp');
    variants.push({ url: saved.url, w: out.info.width, h: out.info.height });
    keys.push(saved.key);
    storage = saved.storage;
  }
  return { variants, keys, storage, width: W, height: H };
}

// Honouree portrait crops (594 × 754, as on the awardee pages), a 1200 × 630 share image and round-face crops
export async function makePortraitVariants(buf: Buffer): Promise<{ portrait: Img[]; og: string; faces: Img[]; keys: string[] }> {
  const id = randomName('');
  const keys: string[] = [];
  const portrait: Img[] = [];
  for (const w of [360, 594]) {
    const h = Math.round((w * 754) / 594);
    const out = await sharp(buf).rotate().resize(w, h, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 82 }).toBuffer();
    const saved = await putFile(`media/portraits/${id}-${w}.webp`, out, 'image/webp');
    portrait.push({ url: saved.url, w, h });
    keys.push(saved.key);
  }
  const faces: Img[] = [];
  for (const w of [120, 240]) {
    const out = await sharp(buf).rotate().resize(w, w, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 82 }).toBuffer();
    const saved = await putFile(`media/portraits/${id}-face-${w}.webp`, out, 'image/webp');
    faces.push({ url: saved.url, w, h: w });
    keys.push(saved.key);
  }
  // Share image: the portrait on the NIDA forest green, as used by LinkedIn, WhatsApp, X and Facebook
  const face = await sharp(buf).rotate().resize(496, 630, { fit: 'cover', position: sharp.strategy.attention }).toBuffer();
  const og = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#083B1E' } })
    .composite([{ input: face, left: 1200 - 496, top: 0 }])
    .jpeg({ quality: 84 })
    .toBuffer();
  const savedOg = await putFile(`media/portraits/${id}-og.jpg`, og, 'image/jpeg');
  keys.push(savedOg.key);
  return { portrait, og: savedOg.url, faces, keys };
}

export async function storeDocument(buf: Buffer, ext: string, mime: string, prefix: string) {
  return putFile(`${prefix}/${yearFolder()}/${randomName(ext)}`, buf, mime);
}
