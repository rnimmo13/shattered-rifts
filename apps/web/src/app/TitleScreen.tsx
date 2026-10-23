import type { CSSProperties } from 'react';
import { ENGINE_VERSION } from '@sr/engine';
import { color } from '../design/tokens';

interface CharacterTeaser {
  name: string;
  realm: string;
  accent: string;
  locked?: boolean;
}

const CHARACTERS: CharacterTeaser[] = [
  { name: 'Ser Maren Ashcourt', realm: 'Aurelion', accent: color.gold },
  { name: 'Rivet', realm: 'Nexus-9', accent: color.cyan },
  { name: 'Kesh the Unfed', realm: 'Wyldmaw', accent: color.blood },
  { name: 'Vesper Nightlace', realm: 'Umbral Veil', accent: color.violet },
];

/** Title screen. The jagged SVG crack is the game's "shattering" motif. */
export function TitleScreen() {
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
        <p className="title__tagline">Walk the broken worlds. Build a Grimoire. Spring the trap.</p>
      </header>

      <ul className="title__roster" aria-label="Riftwalkers">
        {CHARACTERS.map((c) => (
          <li
            key={c.realm}
            className={`title__card${c.locked ? ' title__card--locked' : ''}`}
            style={{ '--accent': c.accent } as CSSProperties}
          >
            <span className="title__sigil" aria-hidden />
            <span className="title__card-name">{c.name}</span>
            <span className="title__card-realm">{c.realm}</span>
          </li>
        ))}
      </ul>

      <div className="title__actions">
        <a className="btn btn--primary" href="#/run">
          Begin Run
        </a>
        <a className="btn" href="#/play">
          Duel the AI
        </a>
        <a className="btn btn--ghost" href="#/duel">
          Art preview
        </a>
      </div>
      <p id="cta-note" className="title__cta-note">
        Runs are in early alpha: expect rough edges, and the difficulty is not tuned yet.
      </p>

      <p className="title__footer">engine v{ENGINE_VERSION}</p>
    </main>
  );
}
