import type { ReactNode } from 'react';

interface Credit {
  work: string;
  author: string;
  url: string;
  note: ReactNode;
}

/** Third-party art used in the game. Keep in step with CREDITS.md. */
const CREDITS: Credit[] = [];

/** #/credits: who made the art we did not make ourselves. */
export function CreditsScreen() {
  return (
    <main className="learn">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">Credits</h1>
      <p className="learn__note">
        Shattered Rifts is made by Robert.{' '}
        {CREDITS.length > 0
          ? 'Thank you to the artists whose work is in the game:'
          : 'No third-party art is used in the game.'}
      </p>
      <p className="learn__note">
        <b>AI-generated art.</b> The character and enemy models, the card art and the battle arenas
        were created largely with AI image tools, then cut out, arranged and edited by hand. The
        interface, icons, effects and animation are drawn in the game itself.
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
