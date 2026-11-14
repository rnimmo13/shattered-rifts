import type { ReactNode } from 'react';

interface Credit {
  work: string;
  author: string;
  url: string;
  note: ReactNode;
}

/** Third-party art and music used in the game. Keep in step with CREDITS.md. */
const CREDITS: Credit[] = [
  {
    work: 'Music: “Woodland Fantasy”, “Blackmoor Tides (Epic Pirate Battle Theme)” and “Beyond The Clouds (Theme for Modern Broadcast)”',
    author: 'Matthew Pablo',
    url: 'https://www.matthewpablo.com',
    note: (
      <>
        Licensed under{' '}
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
          CC-BY 3.0
        </a>
        , from OpenGameArt (
        <a href="https://opengameart.org/content/woodland-fantasy" target="_blank" rel="noreferrer">
          Woodland Fantasy
        </a>
        ,{' '}
        <a
          href="https://opengameart.org/content/blackmoor-tides-epic-pirate-battle-theme"
          target="_blank"
          rel="noreferrer"
        >
          Blackmoor Tides
        </a>
        ,{' '}
        <a
          href="https://opengameart.org/content/beyond-the-clouds-orchestral-theme"
          target="_blank"
          rel="noreferrer"
        >
          Beyond The Clouds
        </a>
        ); used unchanged.
      </>
    ),
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
        {/* (his public name, Robert 2026-11-14: Chief Sharkbait, as on Ko-fi) */}
        Shattered Rifts is made by Chief Sharkbait.{' '}
        {CREDITS.length > 0
          ? 'Thank you to the artists and composers whose work is in the game:'
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
