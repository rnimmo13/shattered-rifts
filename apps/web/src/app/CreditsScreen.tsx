import type { ReactNode } from 'react';

interface Credit {
  work: string;
  author: string;
  url: string;
  note: ReactNode;
}

/** Third-party art used in the game. Keep in step with CREDITS.md. */
const CREDITS: Credit[] = [
  {
    work: 'Monster illustrations (the Whisperer, Vorthax, Nyxara, Gorrmaw and other enemies)',
    author: 'Tania Herrero',
    url: 'https://tania-herrero.itch.io/',
    note: 'Monstrous Menagerie #1, used under CC-BY 4.0 (cropped, resized and given a light rim).',
  },
  {
    work: 'Cave environment (stage backdrop, columns, mushrooms)',
    author: 'wigglesmith79',
    url: 'https://wigglesmith79.itch.io/hand-drawn',
    note: 'Hand Drawn cave pack.',
  },
  {
    work: 'Rarity gems and card backs',
    author: 'Dumivid',
    url: 'https://dumivid.itch.io/',
    note: 'Mechanized Magic, released under CC0.',
  },
  {
    work: 'Fire, frost and portal effects',
    author: 'SovDigital',
    url: 'https://sovdigital.itch.io/',
    note: 'Free Magic Effects.',
  },
];

/** #/credits: who made the art we did not make ourselves. */
export function CreditsScreen() {
  return (
    <main className="learn">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">Credits</h1>
      <p className="learn__note">
        Shattered Rifts is made by Robert. Thank you to the artists whose work is in the game:
      </p>
      <dl>
        {CREDITS.map((c) => (
          <div key={c.author} className="learn__row">
            <dt>{c.author}</dt>
            <dd>
              {c.work}. {c.note}{' '}
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.url.replace('https://', '')}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
