import { useState, type CSSProperties } from 'react';
import { RIFTWALKERS, heroesByRealm } from '@sr/content/v2';
import { BUILD } from '../build';
import { getHero, rememberHero } from './heroChoice';
import { HeroIcon } from '../ui/HeroIcon';
import { tipAttrs } from '../ui/tip';
import { color } from '../design/tokens';

const ACCENT: Record<string, string> = {
  aurelion: color.gold,
  nexus: color.cyan,
  wyldmaw: color.blood,
  umbral: color.violet,
  starfall: '#ff9a4a',
  gloomfen: '#9be86a',
  midden: '#ff9a3c',
};

/** Title screen. The jagged SVG crack is the game's "shattering" motif. */
export function TitleScreen() {
  const groups = heroesByRealm();
  const [picked, setPicked] = useState(getHero);
  return (
    <main className="title">
      <svg className="title__crack" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="seam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color.magenta} />
            <stop offset="50%" stopColor={color.cyan} />
            <stop offset="100%" stopColor={color.heal} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline
          className="title__crack-line"
          points="0,104 140,96 210,118 330,88 420,110 520,82 600,104 690,92 760,122 880,86 960,108 1070,94 1200,102"
          fill="none"
          stroke="url(#seam)"
          strokeWidth="3"
          filter="url(#glow)"
        />
      </svg>

      <header className="title__header">
        <p className="title__eyebrow">Friends alpha · working title</p>
        <h1 className="title__name">Shattered Rifts</h1>
        <p className="title__tagline">
          Walk the broken worlds. Build a deck. Read the rift. Spring the trap.
        </p>
      </header>

      <div className="title__realms" aria-label="Riftwalkers by realm">
        {groups.map((g) => (
          <section
            key={g.realm}
            className="title__realm"
            style={{ '--accent': ACCENT[g.realm] ?? color.gold } as CSSProperties}
          >
            <h2 className="title__realm-name">{g.name}</h2>
            <ul className="title__roster">
              {g.heroes.map((h) => (
                <li key={h} className={`title__card${picked === h ? ' is-picked' : ''}`}>
                  <button
                    type="button"
                    className="title__pick"
                    aria-pressed={picked === h}
                    {...tipAttrs({
                      kicker: `Innate · ${RIFTWALKERS[h].role}`,
                      title: RIFTWALKERS[h].trait.name,
                      text: RIFTWALKERS[h].trait.text,
                    })}
                    onClick={() => {
                      setPicked(h);
                      rememberHero(h);
                      // straight to the Sanctum, where this Riftwalker is already chosen
                      window.location.hash = '#/run';
                    }}
                  >
                    <HeroIcon hero={h} size={52} />
                    <span className="title__card-name">{RIFTWALKERS[h].hero.name}</span>
                    <span className="title__card-role">{RIFTWALKERS[h].role}</span>
                    <span className="title__card-realm">
                      {RIFTWALKERS[h].lanes.map((l) => l.split(':')[0]).join(' · ')}
                    </span>
                    {picked === h && (
                      <span className="title__chosen" aria-hidden>
                        Chosen
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="title__actions">
        <p className="title__playing">
          Pick a Riftwalker above to enter the Sanctum. Practice fights use{' '}
          <b>{RIFTWALKERS[picked].hero.name}</b>.
        </p>
        <a className="btn" href="#/fight">
          Practice fight
        </a>
        <a className="btn" href="#/arena">
          Arena
        </a>
        <a className="btn" href="#/cards">
          Card library
        </a>
        <a className="btn" href="#/learn">
          How to play
        </a>
      </div>
      <p id="cta-note" className="title__cta-note">
        Runs are in early alpha: expect rough edges. Pick Easy, Normal or Hard when you begin.
      </p>

      <p className="title__footer">
        <a href="#/credits">Credits</a> · combat v2 preview · {BUILD.label}
      </p>
    </main>
  );
}
