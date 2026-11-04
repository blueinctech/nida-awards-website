import { d } from '@/lib/data';
import { getSite } from '@/lib/server/content';

// The three-step awards process (awards and nomination pages)
export default async function Steps() {
  const { site } = await getSite();
  return (
    <ol className="steps" role="list">
      {site.process.map((s, i) => (
        <li key={s.title} data-reveal="" style={d(`${i * 0.08}s`)}><h3>{s.title}</h3><p>{s.text}</p></li>
      ))}
    </ol>
  );
}
