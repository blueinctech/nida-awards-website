import { d, site } from '@/lib/data';

// The three-step awards process (awards and nomination pages)
export default function Steps() {
  return (
    <ol className="steps" role="list">
      {site.process.map((s, i) => (
        <li key={s.title} data-reveal="" style={d(`${i * 0.08}s`)}><h3>{s.title}</h3><p>{s.text}</p></li>
      ))}
    </ol>
  );
}
