// The stage map: floors run left to right, the Warden at the end. Click a glowing node to go there.

import type { MapNode, NodeKind, StageMap } from '@sr/campaign';
import { RIFTWALKERS, encounter } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';

const KIND_LABEL: Record<NodeKind, string> = {
  duel: 'Duel',
  elite: 'Elite',
  event: 'Event',
  shrine: 'Shrine',
  merchant: 'Merchant',
  warden: 'Warden',
};

/** Simple geometric icons (no emoji): sword, skull, question mark, flame, coin, crown. */
function NodeIcon({ kind }: { kind: NodeKind }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'duel':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path
            {...common}
            d="M8 24 L22 10 M22 10 L24 6 L26 8 L22 10 M12 24 L8 28 M6 22 L10 26 M24 24 L10 10 M10 10 L8 6 L6 8 L10 10 M20 24 L24 28 M22 22 L26 26"
          />
        </svg>
      );
    case 'elite':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path
            {...common}
            d="M8 14 C8 7 24 7 24 14 C24 18 22 19 22 22 L10 22 C10 19 8 18 8 14 Z M12 26 L12 22 M16 26 L16 22 M20 26 L20 22"
          />
          <circle cx="13" cy="14" r="1.8" fill="currentColor" />
          <circle cx="19" cy="14" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'event':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path {...common} d="M11 12 C11 6 21 6 21 12 C21 16 16 16 16 20" />
          <circle cx="16" cy="26" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'shrine':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path
            {...common}
            d="M16 4 C20 10 24 13 22 19 C21 23 18 25 16 25 C13 25 10 23 10 19 C10 15 13 14 14 10 C15 12 16 12 16 4 Z M9 29 L23 29"
          />
        </svg>
      );
    case 'merchant':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <circle {...common} cx="16" cy="16" r="10" />
          <path
            {...common}
            d="M16 9 L16 23 M12 13 C12 10 20 10 20 13 C20 17 12 15 12 19 C12 22 20 22 20 19"
          />
        </svg>
      );
    case 'warden':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path {...common} d="M5 24 L5 11 L11 17 L16 7 L21 17 L27 11 L27 24 Z M5 28 L27 28" />
        </svg>
      );
  }
}

/** The badge on a Warden that is a ghost: a small ghost, so it is told apart from the realm's own Warden at a glance. */
function GhostGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.5c-4.4 0-7.5 3.3-7.5 7.8V21l2.5-1.8L9.5 21 12 19.2 14.5 21l2.5-1.8L19.5 21V10.3c0-4.5-3.1-7.8-7.5-7.8Z"
        fill="#e9f4ff"
        stroke="#7fd3ff"
        strokeWidth="1.2"
      />
      <circle cx="9.3" cy="10.5" r="1.5" fill="#0c1430" />
      <circle cx="14.7" cy="10.5" r="1.5" fill="#0c1430" />
    </svg>
  );
}

function labelOf(n: MapNode): string {
  if (n.kind === 'merchant' && n.crossed) return 'Stranger';
  if (n.kind === 'warden' && n.ghost && n.ghostDeck) return 'Ghost Warden';
  if (n.enemyId) {
    try {
      return encounter(n.enemyId).name;
    } catch {
      /* fall through */
    }
  }
  return KIND_LABEL[n.kind];
}

export function MapView(props: {
  map: StageMap;
  at: string | null;
  cleared: readonly string[];
  available: ReadonlySet<string>;
  onEnter: (id: string) => void;
}) {
  const { map } = props;
  // fill the screen: the spacing grows with the window. PAD is the room left and right of the first and last floor, so the
  // map sits dead centre and a hovered node's glow is never cut off.
  const PAD = 90;
  const gaps = Math.max(1, map.floors - 1);
  const COL_W = Math.max(
    150,
    Math.min(290, Math.floor((window.innerWidth * 0.9 - 2 * PAD) / gaps)),
  );
  const ROW_H = Math.max(130, Math.min(200, Math.floor(window.innerHeight * 0.22)));
  const rows = Math.max(
    ...map.nodes.map((n) => map.nodes.filter((m) => m.floor === n.floor).length),
  );
  const W = gaps * COL_W + 2 * PAD;
  const H = rows * ROW_H + 40;
  const pos = new Map<string, { x: number; y: number }>();
  for (let f = 1; f <= map.floors; f++) {
    const col = map.nodes.filter((n) => n.floor === f);
    col.forEach((n, i) => {
      pos.set(n.id, { x: PAD + (f - 1) * COL_W, y: ((i + 1) / (col.length + 1)) * H });
    });
  }
  return (
    <div className="map" style={{ width: W, height: H }}>
      <svg className="map__lines" width={W} height={H} aria-hidden>
        {map.nodes.flatMap((n) =>
          n.next.map((t) => {
            const a = pos.get(n.id);
            const b = pos.get(t);
            if (!a || !b) return null;
            const done =
              props.cleared.includes(n.id) && (props.cleared.includes(t) || props.at === n.id);
            return (
              <path
                key={`${n.id}>${t}`}
                d={`M ${a.x} ${a.y} C ${a.x + 70} ${a.y}, ${b.x - 70} ${b.y}, ${b.x} ${b.y}`}
                className={done ? 'map__edge is-walked' : 'map__edge'}
              />
            );
          }),
        )}
      </svg>
      {map.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const open = props.available.has(n.id);
        const done = props.cleared.includes(n.id);
        const here = props.at === n.id;
        return (
          <button
            key={n.id}
            className={`mapnode mapnode--${n.kind}${open ? ' is-open' : ''}${done ? ' is-done' : ''}${here ? ' is-here' : ''}`}
            style={{ left: p.x, top: p.y }}
            disabled={!open}
            onClick={() => props.onEnter(n.id)}
            aria-label={`${KIND_LABEL[n.kind]}: ${labelOf(n)}${n.crossed ? ` (Rift-crossed: sells ${RIFTWALKERS[n.crossed as keyof typeof RIFTWALKERS]?.hero.name ?? 'another'}'s cards)` : ''}${n.ghost && n.ghostDeck ? " (a ghost: another player's deck from the Arena, played by the computer)" : ''}${done ? ' (cleared)' : ''}`}
          >
            <NodeIcon kind={n.kind} />
            {n.crossed && (
              <span
                className="mapnode__crossed"
                title="Rift-crossed merchant: sells another Riftwalker's cards"
              >
                <HeroIcon hero={n.crossed} size={26} />
              </span>
            )}
            {n.kind === 'warden' && n.ghost && n.ghostDeck && (
              <span
                className="mapnode__ghost"
                title="Ghost Warden: another player's deck from the Arena, played by the computer (if none can be found, the usual Warden stands here)"
              >
                <GhostGlyph />
              </span>
            )}
            <span className="mapnode__label">{labelOf(n)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** What each node means. */
export function MapLegend() {
  const items: [NodeKind, string][] = [
    ['duel', 'Duel'],
    ['elite', 'Elite (harder, better reward)'],
    ['event', 'Event'],
    ['shrine', 'Shrine (rest or trim)'],
    ['merchant', 'Merchant (a badge means a Rift-crossed stranger: other classes’ cards)'],
    ['warden', 'Warden (stage boss; a ghost badge means another player’s deck from the Arena)'],
  ];
  return (
    <ul className="maplegend" aria-label="Map legend">
      {items.map(([k, label]) => (
        <li key={k} className={`maplegend__item mapnode--${k}`}>
          <span className="maplegend__icon">
            <NodeIcon kind={k} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
