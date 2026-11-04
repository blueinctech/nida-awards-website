// Article bodies are written in Markdown in the admin. Raw HTML is shown as text (never run),
// and links may only point to web pages, email addresses or pages on this site.
import { Marked } from 'marked';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = (u: string) => (/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(u.trim()) ? u.trim() : '');

const md = new Marked({ gfm: true, breaks: false, async: false });
md.use({
  renderer: {
    html({ text }) {
      return esc(text);
    },
    link({ href, title, tokens }) {
      const url = safeUrl(href);
      const inner = this.parser.parseInline(tokens);
      if (!url) return inner;
      const external = /^https?:/i.test(url);
      return `<a class="text-link" href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
    },
    image({ href, title, text }) {
      const url = safeUrl(href);
      if (!url) return esc(text);
      return `<img src="${esc(url)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`;
    },
  },
});

export function renderMarkdown(src: string): string {
  return md.parse(src || '') as string;
}
