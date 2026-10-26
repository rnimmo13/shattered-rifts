// The home page's smaller destinations, as a tidy grid of icon tiles under the big menu buttons: what is yours (decks, runs,
// trophies), the Arena's boards and ghosts, and reading (cards, how to play, patch notes). Credits lives in the footer.

import type { ReactNode } from 'react';

/** Line icons on a 24-unit grid, drawn in the tile's colour. */
const ICON: Record<string, ReactNode> = {
  decks: (
    <>
      <rect x="4" y="6" width="11" height="15" rx="2" />
      <path d="M9 3h9a2 2 0 0 1 2 2v13" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  trophies: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4M9 20h6M10 17h4" />
    </>
  ),
  boards: (
    <>
      <path d="M5 20v-6M12 20V6M19 20v-9" />
      <path d="M3 20h18" />
    </>
  ),
  ghosts: (
    <>
      <path d="M6 20V11a6 6 0 0 1 12 0v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z" />
      <path d="M10 11h.01M14 11h.01" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="7" width="9" height="13" rx="1.5" transform="rotate(-8 7.5 13.5)" />
      <rect x="11" y="5" width="9" height="13" rx="1.5" transform="rotate(8 15.5 11.5)" />
    </>
  ),
  learn: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19V5M9 8h6M9 11h4" />
    </>
  ),
  notes: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 15h5M10 18h3" />
    </>
  ),
};

const LINKS: { href: string; label: string; icon: keyof typeof ICON }[] = [
  { href: '#/decks', label: 'Saved decks', icon: 'decks' },
  { href: '#/history', label: 'Run history', icon: 'history' },
  { href: '#/trophies', label: 'Trophy case', icon: 'trophies' },
  { href: '#/board', label: 'Leaderboards', icon: 'boards' },
  { href: '#/ghosts', label: 'Ghost decks', icon: 'ghosts' },
  { href: '#/cards', label: 'Card library', icon: 'cards' },
  { href: '#/learn', label: 'How to play', icon: 'learn' },
  { href: '#/patch-notes', label: 'Patch notes', icon: 'notes' },
];

export function HomeLinks(props: { unreadNotes: boolean }) {
  return (
    <nav className="home__links" aria-label="More">
      {LINKS.map((l) => {
        const fresh = l.icon === 'notes' && props.unreadNotes;
        return (
          <a key={l.href} className="home__link" href={l.href}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden
              focusable="false"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICON[l.icon]}
            </svg>
            <span>{l.label}</span>
            {fresh && (
              <i className="home__dot" role="img" aria-label="new" title="New patch notes" />
            )}
          </a>
        );
      })}
    </nav>
  );
}
