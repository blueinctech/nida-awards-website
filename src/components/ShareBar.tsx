import { Facebook, LinkedIn, LinkIcon, Mail, ShareIcon, WhatsApp, XLogo } from './icons';

// Share links for an honouree page. Copy-link and the native share sheet are wired up in main.js.
export default function ShareBar({ url, title, text, theme = 'dark' }: { url: string; title: string; text: string; theme?: 'dark' | 'light' }) {
  const e = encodeURIComponent;
  const links: [string, React.ReactNode, string][] = [
    ['LinkedIn', <LinkedIn key="i" />, `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`],
    ['Facebook', <Facebook key="i" />, `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`],
    ['X', <XLogo key="i" />, `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(text)}`],
    ['WhatsApp', <WhatsApp key="i" />, `https://wa.me/?text=${e(text + ' ' + url)}`],
  ];
  return (
    <div className={`share share--${theme}`} data-share="" data-url={url} data-title={title} data-text={text}>
      <p className="share__label">Share this profile</p>
      <ul className="share__list" role="list">
        {links.map(([n, ic, href]) => (
          <li key={n}><a className="share__btn" href={href} target="_blank" rel="noopener" aria-label={`Share on ${n} (opens in a new tab)`}>{ic}</a></li>
        ))}
        <li><a className="share__btn" href={`mailto:?subject=${e(title)}&body=${e(text + '\n\n' + url)}`} aria-label="Share by email"><Mail /></a></li>
        <li><button className="share__btn" type="button" data-copy-link="" aria-label="Copy link to this profile"><LinkIcon /></button></li>
        <li className="share__native" hidden><button className="share__btn" type="button" data-native-share="" aria-label="More sharing options"><ShareIcon /></button></li>
      </ul>
      <p className="share__status" role="status" data-share-status=""></p>
    </div>
  );
}
