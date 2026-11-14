// The home page's smaller destinations, as a tidy grid of icon tiles under the big menu buttons: your collection (decks,
// trophies, runs), the Card library and the leaderboards (Robert, 2026-11-10). How to play and the patch notes are in the header
// (HomeHeaderLinks); the ghost decks are the Arena's, linked from its page; Credits is in Settings > About.

import type { ReactNode } from 'react';
import { unseenEarned } from '@sr/pvp';
import { useEarned } from '../cosmetics/mastery';
import { SUPPORT_OPEN } from './SupportScreen';

/** Line icons on a 24-unit grid, drawn in the tile's colour. */
const ICON: Record<string, ReactNode> = {
  skins: (
    <>
      <path d="M9 4 12 6l3-2 5 3.5-2.5 3.5L16 10v10H8V10l-1.5 1L4 7.5z" />
      <path d="M12 6v3" />
    </>
  ),
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
  earned: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 7.5 21l4.5-2.5 4.5 2.5-1.5-7.5" />
    </>
  ),
  notes: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 15h5M10 18h3" />
    </>
  ),
  // (the run's header and the battle screen's, 2026-11-11: icon buttons)
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 9.5V20h4v-5.5h3V20h4V9.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      <circle cx="12" cy="12" r="6.6" />
    </>
  ),
  abandon: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5c4-2 7 2 12 0v8.5c-5 2-8-2-12 0" />
    </>
  ),
  arena: (
    <>
      <path d="M4 4l10 10M14 14l2.5 2.5M17.5 19.5l2-2M15 17l2.5-2.5" />
      <path d="M20 4 10 14M10 14l-2.5 2.5M6.5 19.5l-2-2M9 17l-2.5-2.5" />
    </>
  ),
  // (the alpha's support page, DECISIONS #802)
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z" />
  ),
};

/** One of the line icons above, at a size. */
export function LineIcon(props: { name: keyof typeof ICON; size?: number }) {
  const s = props.size ?? 22;
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON[props.name]}
    </svg>
  );
}

// Five shortcuts below the separate Store and Collection links.
const LINKS: { href: string; label: string; icon: keyof typeof ICON }[] = [
  { href: '#/decks', label: 'Saved decks', icon: 'decks' },
  { href: '#/trophies', label: 'Trophy case', icon: 'trophies' },
  { href: '#/history', label: 'Run history', icon: 'history' },
  { href: '#/cards', label: 'Card library', icon: 'cards' },
  { href: '#/board', label: 'Leaderboards', icon: 'boards' },
];

/** How to play and the patch notes, as small buttons in the home page's header beside Settings (the notes with their "new" dot). */
export function HomeHeaderLinks(props: { unreadNotes: boolean }) {
  // (DECISIONS #739) what you have earned by playing; the dot says something has not been acknowledged yet
  const unseen = unseenEarned(useEarned()).length > 0;
  return (
    <>
      <a
        className="btn btn--small btn--ghost home__headlink"
        href="#/earned"
        title={unseen ? 'Earned: something new' : 'What you have earned'}
        aria-label={unseen ? 'Earned (new)' : 'Earned'}
      >
        <span>
          <LineIcon name="earned" size={18} />
          <span className="home__headlabel">Earned</span>
        </span>
        {unseen && <i className="home__dot" aria-hidden />}
      </a>
      <a className="btn btn--small btn--ghost home__headlink" href="#/learn" title="How to play">
        <span>
          <LineIcon name="learn" size={18} />
          <span className="home__headlabel">How to play</span>
        </span>
      </a>
      <a
        className="btn btn--small btn--ghost home__headlink"
        href="#/patch-notes"
        title={props.unreadNotes ? 'Patch notes: something new' : 'Patch notes'}
        aria-label={props.unreadNotes ? 'Patch notes (new)' : 'Patch notes'}
      >
        <span>
          <LineIcon name="notes" size={18} />
          <span className="home__headlabel">Patch notes</span>
        </span>
        {props.unreadNotes && <i className="home__dot" aria-hidden />}
      </a>
      {SUPPORT_OPEN && (
        <a
          className="btn btn--small btn--ghost home__headlink"
          href="#/support"
          title="Support the game"
        >
          <span>
            <LineIcon name="heart" size={18} />
            <span className="home__headlabel">Support</span>
          </span>
        </a>
      )}
    </>
  );
}

export function HomeLinks() {
  return (
    <nav className="home__links" aria-label="More">
      <a className="home__story" href="#/lore">
        <img
          src={`${import.meta.env.BASE_URL}art/lore/key-art-thumb.webp`}
          width="80"
          height="48"
          alt=""
        />
        <span>
          <b>The story of the Rifts</b>
          <small>Discover the worlds beyond the Ward</small>
        </span>
        <span aria-hidden>→</span>
      </a>
      {LINKS.map((l) => (
        <a key={l.href} className="home__link" href={l.href}>
          <LineIcon name={l.icon} />
          <span>{l.label}</span>
        </a>
      ))}
    </nav>
  );
}
