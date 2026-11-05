// Shared vertical tier map: five lanes with routes that split and meet.

import type { MapNode, NodeKind, StageMap } from '@sr/campaign';
import { CAMPAIGN_GHOSTS_ENABLED } from '@sr/campaign';
import { RIFTWALKERS, encounter } from '@sr/content/v2';
import { useEffect, useRef, useState, type CSSProperties, type SVGProps } from 'react';
import { HeroIcon } from '../ui/HeroIcon';
import { Picture } from '../ui/Picture';
import { MapInkLayer, MapInkTools, useMapInk, type MapInkState } from './MapInk';
import { useHorizontalMap } from './useHorizontalMap';

const KIND_LABEL: Record<NodeKind, string> = {
  duel: 'Duel',
  elite: 'Elite',
  event: 'Event',
  shrine: 'Shrine',
  merchant: 'Merchant',
  warden: 'Warden',
  echo: 'Echo',
  cache: 'Rift Cache',
};

/** The painted marker of each kind of stop (an Echo is a ghost, like a ghost Warden's). */
const KIND_PIC: Record<NodeKind, string> = {
  duel: 'map-duel',
  elite: 'map-elite',
  event: 'map-event',
  shrine: 'map-shrine',
  merchant: 'map-merchant',
  warden: 'map-warden',
  echo: 'map-ghost',
  cache: 'map-cache',
};

/** What a stop shows as: an Echo whose ghost has not come (yet, or at all) is the plain fight it stands on. */
const hasGhost = (n: MapNode): boolean => CAMPAIGN_GHOSTS_ENABLED && !!n.ghost && !!n.ghostDeck;
const shownKind = (n: MapNode): NodeKind => (n.kind === 'echo' && !hasGhost(n) ? 'duel' : n.kind);

/** The painted marker of a stop (the drawing is what shows if the picture fails to load). */
function NodeIcon({ kind, pic }: { kind: NodeKind; pic?: string }) {
  return (
    <Picture id={pic ?? KIND_PIC[kind]} className="mapnode__pic">
      <DrawnIcon kind={kind} />
    </Picture>
  );
}

/** Simple geometric icons (no emoji): sword, skull, question mark, flame, coin, crown. */
function DrawnIcon({ kind }: { kind: NodeKind }) {
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
    case 'echo':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path
            {...common}
            d="M16 5 C10 5 7 9 7 14 L7 27 L10 25 L13 27 L16 25 L19 27 L22 25 L25 27 L25 14 C25 9 22 5 16 5 Z"
          />
          <circle cx="12.5" cy="14" r="1.6" fill="currentColor" />
          <circle cx="19.5" cy="14" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'cache':
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path
            {...common}
            d="M5 14 L27 14 L27 26 L5 26 Z M5 14 C5 8 27 8 27 14 M14 14 L14 18 L18 18 L18 14"
          />
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
  if (n.kind === 'warden' && hasGhost(n)) return 'Ghost Warden';
  if (n.kind === 'echo' && !hasGhost(n)) return KIND_LABEL.duel;
  // (a fight or an Elite only says what kind of fight it is: who is waiting is found out on arrival. A Warden is named, as the
  // realm's boss is known in advance)
  if (n.kind === 'warden' && n.enemyId) {
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
  /** names this map for what the player has drawn on it */
  inkKey?: string;
}) {
  // Keep older horizontal/portrait drawings separate from this new layout.
  const wide = useHorizontalMap();
  const ink = useMapInk(props.inkKey && props.inkKey + (wide ? ':horizontal-5' : ':vertical-5'));
  const holder = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 320, height: 500 });
  const [scroll, setScroll] = useState({ position: 0, maximum: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const measureScroll = () => {
    const element = holder.current;
    if (!element) return;
    const next = {
      position: Math.round(element.scrollLeft),
      maximum: Math.max(0, element.scrollWidth - element.clientWidth),
    };
    setScroll((previous) =>
      previous.position === next.position && previous.maximum === next.maximum ? previous : next,
    );
  };
  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      // The outer box stays fixed when a scrollbar appears. Measuring the content box instead
      // fed scrollbar changes back into node sizing and could oscillate at a scroll boundary.
      const box = entry.borderBoxSize?.[0];
      const next = {
        // Portrait maps reserve a permanent vertical scrollbar gutter; keep their canvas inside it.
        width: element.clientWidth,
        height: Math.round(box?.blockSize ?? element.getBoundingClientRect().height),
      };
      setBounds((previous) =>
        previous.width === next.width && previous.height === next.height ? previous : next,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const place = `${props.inkKey ?? ''}:${props.map.nodes[0]?.id ?? ''}:${props.map.floors}:${props.at ?? ''}`;
  useEffect(() => {
    const element = holder.current;
    if (!wide || !element) return;
    const wheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
        element.scrollWidth <= element.clientWidth
      )
        return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      element.scrollLeft += event.deltaY * unit;
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [wide]);
  useEffect(() => {
    // Run after layout and browser scroll restoration, including a full-page reload.
    const center = () => {
      const element = holder.current;
      const node = element?.querySelector<HTMLElement>('.mapnode.is-open, .mapnode.is-here');
      if (!element || !node) return;
      // Move this viewport only; scrollIntoView also moved ancestor/page scrollbars.
      if (wide) element.scrollLeft = Math.max(0, node.offsetLeft - element.clientWidth / 2);
      else element.scrollTop = Math.max(0, node.offsetTop - element.clientHeight / 2);
      measureScroll();
    };
    let frame = requestAnimationFrame(center);
    const restored = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(center);
    };
    window.addEventListener('pageshow', restored);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pageshow', restored);
    };
  }, [place, bounds.width, bounds.height, wide]);
  const move = (direction: -1 | 1) => {
    const element = holder.current;
    element?.scrollBy({
      left: direction * element.clientWidth * 0.7,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  return (
    <>
      <MapInkTools ink={ink} />
      <div
        className={`mapframe${wide ? ' mapframe--wide' : ''}${wide && bounds.height < 320 ? ' mapframe--compact' : ''}`}
      >
        <div
          ref={holder}
          className={`map__holder${wide && !ink.tool ? ' is-pannable' : ''}${dragging ? ' is-dragging' : ''}`}
          onScroll={measureScroll}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (!wide || ink.tool || event.pointerType !== 'mouse' || event.button !== 0) return;
            suppressClick.current = false;
            drag.current = {
              pointer: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              left: event.currentTarget.scrollLeft,
              top: event.currentTarget.scrollTop,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start || start.pointer !== event.pointerId) return;
            if (event.buttons !== 1) {
              drag.current = null;
              setDragging(false);
              return;
            }
            const dx = event.clientX - start.x,
              dy = event.clientY - start.y;
            if (!start.moved && Math.hypot(dx, dy) < 6) return;
            if (!start.moved) {
              start.moved = true;
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            suppressClick.current = true;
            event.preventDefault();
            event.currentTarget.scrollLeft = start.left - dx;
          }}
          onPointerUp={(event) => {
            if (drag.current?.pointer !== event.pointerId) return;
            drag.current = null;
            setDragging(false);
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            requestAnimationFrame(() => {
              suppressClick.current = false;
            });
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
            suppressClick.current = false;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            setDragging(false);
          }}
          onClickCapture={(event) => {
            if (suppressClick.current) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <RouteMap
            {...props}
            ink={ink}
            wide={wide}
            cross={
              wide
                ? Math.max(140, Math.min(720, bounds.height - 32))
                : Math.max(240, Math.min(720, bounds.width))
            }
          />
        </div>
        {wide && (
          <nav className="mapnav" aria-label="Map navigation">
            <button
              className="mapnav__arrow"
              aria-label="Scroll map left"
              disabled={scroll.position <= 1}
              onClick={() => move(-1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 5-7 7 7 7" />
              </svg>
            </button>
            <input
              className="mapnav__track"
              type="range"
              aria-label="Map position"
              min={0}
              max={Math.max(1, scroll.maximum)}
              value={Math.min(scroll.position, scroll.maximum)}
              disabled={scroll.maximum <= 1}
              style={
                {
                  '--map-scroll': `${(scroll.position / Math.max(1, scroll.maximum)) * 100}%`,
                } as CSSProperties
              }
              onChange={(event) => {
                if (holder.current) holder.current.scrollLeft = Number(event.currentTarget.value);
                measureScroll();
              }}
            />
            <button
              className="mapnav__arrow"
              aria-label="Scroll map right"
              disabled={scroll.maximum <= 1 || scroll.position >= scroll.maximum - 1}
              onClick={() => move(1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}

/** A walked path is gold; the ones leading on from where you stand draw themselves in as the map opens. */
const edgeProps = (done: boolean, fromHere: boolean): SVGProps<SVGPathElement> =>
  done && fromHere
    ? { pathLength: 1, className: 'map__edge is-walked is-fresh' }
    : { className: done ? 'map__edge is-walked' : 'map__edge' };

/** What each node means. */
export function MapLegend() {
  const items: [NodeKind, string][] = [
    ['duel', 'Duel'],
    ['elite', 'Elite'],
    ['event', 'Event'],
    ['shrine', 'Shrine'],
    ['merchant', 'Merchant'],
    ['cache', 'Rift Cache'],
    ['echo', 'Echo'],
    ['warden', 'Warden'],
  ];
  return (
    <ul className="maplegend" aria-label="Map legend">
      {items
        .filter(([k]) => k !== 'echo' || CAMPAIGN_GHOSTS_ENABLED)
        .map(([k, label]) => (
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

type MapProps = Parameters<typeof MapView>[0];

/** One stop on the map, wherever the layout puts it. */
function MapButton(props: MapProps & { n: MapNode; p: { x: number; y: number } }) {
  const { n, p } = props;
  const open = props.available.has(n.id);
  const done = props.cleared.includes(n.id);
  const here = props.at === n.id;
  return (
    <button
      className={`mapnode mapnode--${shownKind(n)}${open ? ' is-open' : ''}${done ? ' is-done' : ''}${here ? ' is-here' : ''}`}
      style={{ left: p.x, top: p.y }}
      disabled={!open}
      onClick={() => props.onEnter(n.id)}
      aria-label={`${KIND_LABEL[shownKind(n)]}: ${labelOf(n)}${n.crossed ? ` (Rift-crossed: sells ${RIFTWALKERS[n.crossed as keyof typeof RIFTWALKERS] ? `the ${RIFTWALKERS[n.crossed as keyof typeof RIFTWALKERS].hero.name}` : 'another Riftwalker'}'s cards)` : ''}${hasGhost(n) ? " (a ghost: another player's deck from the Arena, played by the computer)" : ''}${done ? ' (cleared)' : ''}`}
    >
      <NodeIcon
        kind={shownKind(n)}
        {...(done && !here
          ? { pic: 'map-done' }
          : n.crossed
            ? { pic: 'map-crossed' }
            : n.kind === 'warden' && hasGhost(n)
              ? { pic: 'map-ghost' }
              : {})}
      />
      {here && (
        <Picture id="map-here" className="mapnode__here">
          {null}
        </Picture>
      )}
      {n.crossed && (
        <span
          className="mapnode__crossed"
          title="Rift-crossed merchant: sells another Riftwalker's cards"
        >
          <HeroIcon hero={n.crossed} size={26} />
        </span>
      )}
      {n.kind === 'warden' && hasGhost(n) && (
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
}

/** The same lane positions and paths, transposed for desktop's horizontal journey. */
function RouteMap(props: MapProps & { ink: MapInkState; wide: boolean; cross: number }) {
  const { map } = props;
  const { wide, cross } = props;
  const ROW_H = 132;
  const PAD = 88;
  const length = Math.max(1, map.floors - 1) * ROW_H + 2 * PAD;
  const W = wide ? length : cross;
  const H = wide ? cross : length;
  const pos = new Map<string, { x: number; y: number }>();
  for (let f = 1; f <= map.floors; f++) {
    const row = map.nodes.filter((n) => n.floor === f);
    row.forEach((n, i) => {
      const laneIndex =
        row.length === 1
          ? 2
          : row.length === 2
            ? 1 + i * 2
            : Math.round((i * 4) / (row.length - 1));
      const laneFraction = (laneIndex + 0.5) / 5;
      const lane = wide ? 24 + laneFraction * (cross - 48) : laneFraction * cross;
      const step = PAD + (f - 1) * ROW_H;
      pos.set(n.id, { x: wide ? step : lane, y: wide ? lane : step });
    });
  }
  return (
    <div
      className={`map map--route map--${wide ? 'wide' : 'tall'}`}
      style={{ width: W, height: H, '--map-cross': `${cross}px` } as CSSProperties}
    >
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
                d={
                  wide
                    ? `M ${a.x} ${a.y} C ${a.x + 50} ${a.y}, ${b.x - 50} ${b.y}, ${b.x} ${b.y}`
                    : `M ${a.x} ${a.y} C ${a.x} ${a.y + 50}, ${b.x} ${b.y - 50}, ${b.x} ${b.y}`
                }
                {...edgeProps(done, props.at === n.id)}
              />
            );
          }),
        )}
      </svg>
      {map.nodes.map((n) => {
        const p = pos.get(n.id);
        return p ? <MapButton key={n.id} n={n} p={p} {...props} /> : null;
      })}
      <MapInkLayer ink={props.ink} w={W} h={H} />
    </div>
  );
}
