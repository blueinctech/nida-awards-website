// Small helpers shared by every public page. The content itself comes from the database
// through getSite() in src/lib/server/content.ts (edited at /admin).
import { Fragment, createElement, type ReactNode } from 'react';
import type { Awardee } from './types';

export const SITE_URL = (process.env.SITE_URL || 'https://nida-awards.org').replace(/\/$/, '');

// Award title without the bracketed detail, e.g. "Male Professional of the Year"
export const shortAward = (a: Awardee) => a.award.replace(/ \(.*\)/, '');

// ---------- URLs (root-absolute, with trailing slashes like the published site) ----------
export const asset = (p: string) => '/assets/' + p;
export const page = (slug = '', hash = '') => (slug ? '/' + slug + '/' : '/') + (hash ? '#' + hash : '');
export const awardeeUrl = (slug: string) => '/awardees/' + slug + '/';
export const postUrl = (slug: string) => '/news/' + slug + '/';
export const absolute = (path: string) => (/^https?:/.test(path) ? path : SITE_URL + path);

// Phone numbers as tel: links
export const tel = (p: string) => 'tel:' + p.replace(/\s/g, '');

// Style helper for the reveal delay custom property: style={d('.1s')} -> style="--d:.1s"
export const d = (v: string) => ({ '--d': v }) as React.CSSProperties;

// Editors mark accent words in headings as [[words]]. Rendered as <span className={cls}> (or the
// given element), with line breaks for new lines. Text is escaped by React, so no HTML is ever injected.
export function rich(text: string, cls = 'green', tag: 'span' | 'em' = 'span'): ReactNode {
  const lines = String(text || '').split('\n');
  return lines.map((line, li) =>
    createElement(
      Fragment,
      { key: li },
      li ? createElement('br') : null,
      ...line.split(/\[\[(.+?)\]\]/g).map((part, i) => (i % 2 ? createElement(tag, { key: i, className: tag === 'span' ? cls : undefined }, part) : part)),
    ),
  );
}

// Plain text version of a [[marked]] heading (for alt text, metadata)
export const plain = (text: string) => String(text || '').replace(/\[\[(.+?)\]\]/g, '$1').replace(/\n/g, ' ');

// Fills {tokens} in editable text
export const fill = (text: string, vars: Record<string, string | number>) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// "6 December 2025" (Paris time)
export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : 'Draft';
