// Inline SVG icons used across the site.
type P = { className?: string };

export const Arrow = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
);
export const ArrowUpRight = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
);
export const Prev = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6" /></svg>
);
export const Pause = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" fill="currentColor" /><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor" /></svg>
);
export const Info = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5v.5" /></svg>
);
export const LinkedIn = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.6 4.77 6v5.56h-4v-4.93c0-1.18-.02-2.7-1.64-2.7-1.65 0-1.9 1.29-1.9 2.62v5.01h-4z" /></svg>
);
export const Instagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none" /></svg>
);
export const Facebook = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.87.25-1.46 1.5-1.46h1.6V4.36A21 21 0 0 0 14.27 4.2c-2.32 0-3.9 1.41-3.9 4v2.2H7.75v3h2.62V21z" /></svg>
);
export const XLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78zm-1.08 16.18h1.7L7.4 4.73H5.58z" /></svg>
);
export const WhatsApp = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2zm0 18.1c-1.5 0-2.97-.4-4.25-1.17l-.3-.18-3.09.89.9-3-.2-.31a8.2 8.2 0 1 1 6.94 3.77zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.98-1.22a7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5l.37-.43c.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.86 2.04c0 1.2.88 2.37 1 2.53.12.17 1.72 2.63 4.18 3.69.58.25 1.04.4 1.4.51.58.19 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.15-1.17-.06-.1-.22-.17-.47-.29z" /></svg>
);
export const Mail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3.5 6 8.5 7 8.5-7" /></svg>
);
export const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.36 0l3-3a4.5 4.5 0 0 0-6.36-6.36l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.36 0l-3 3a4.5 4.5 0 0 0 6.36 6.36l1.2-1.2" /></svg>
);
export const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v8h14v-8" /></svg>
);
// Five-point star from the NIDA trophy mark
export const Star = () => (
  <svg className="star-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.8l2.95 6.6 7.2.75-5.4 4.85 1.55 7.1L12 17.45 5.7 21.1l1.55-7.1-5.4-4.85 7.2-.75z" /></svg>
);

export const SocialIcon = ({ name }: { name: string }) => (name === 'LinkedIn' ? <LinkedIn /> : <Instagram />);
