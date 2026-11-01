// The piles drawn as real stacks of cards (DECISIONS #505): the draw pile is face-down cards squared up, the discard pile is face-up cards
// thrown down crooked, the Consumed pile is cards burnt to ash. Each stack gets taller as the pile grows, and an empty pile is an outline.

const INK = '#120b16';

/** How many cards to draw for a pile of this size. */
export function pileLayers(count: number): number {
  return count <= 0 ? 0 : Math.min(5, 1 + Math.floor(count / 5));
}

/** One card back: gold frame, lattice and a rift in the middle, in the 104 x 146 box the pile sits in. */
function CardBack({ x, y, turn, lit }: { x: number; y: number; turn: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn} 52 73)`}>
      <rect x="9" y="9" width="86" height="128" rx="8" fill={lit ? '#1d2a68' : '#a98f52'} stroke={INK} strokeWidth="3" />
      {lit && (
        <>
          <rect x="16" y="16" width="72" height="114" rx="4" fill="#141c4c" stroke="#d4a84b" strokeWidth="2.5" />
          <path
            d="M16 44L44 16M16 72L72 16M16 100L88 28M16 128L88 56M44 130L88 84M72 130L88 112M88 44L60 16M88 72L32 16M88 100L16 28M88 128L16 56M60 130L16 84M32 130L16 112"
            fill="none"
            stroke="#d4a84b"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path d="M52 40L72 73L52 106L32 73Z" fill="#2c1a5e" stroke="#d4a84b" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M55 52L46 72L56 75L49 95L61 70L51 67Z" fill="#c79bff" />
        </>
      )}
    </g>
  );
}

/** One card face up: a picture, a title bar and lines of text, a card that has been played. */
function CardFace({ x, y, turn, tint, lit }: { x: number; y: number; turn: number; tint: string; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn} 52 73)`}>
      <rect x="9" y="9" width="86" height="128" rx="8" fill={lit ? '#8f7a58' : '#c9b58c'} stroke={INK} strokeWidth="3" />
      {lit && (
        <>
          <rect x="15" y="15" width="74" height="116" rx="4" fill="#d9c9a2" />
          <rect x="20" y="20" width="64" height="54" rx="3" fill={tint} stroke={INK} strokeWidth="2" />
          <path d="M20 74L38 48L50 62L62 42L84 74Z" fill={INK} fillOpacity="0.38" />
          <circle cx="68" cy="33" r="6" fill="#fff0a8" fillOpacity="0.8" />
          <path d="M24 86H80M24 98H80M24 110H62" stroke="#6c5a3e" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** One card burnt: black with a bitten edge, still glowing where it charred. */
function CardAsh({ x, y, turn, lit }: { x: number; y: number; turn: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn} 52 73)`}>
      <path
        d="M17 9H87C92 9 95 12 95 17V96L86 106L78 98L68 116L58 104L47 126L36 110L25 122L9 104V17C9 12 12 9 17 9Z"
        fill={lit ? '#3a3036' : '#57484c'}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {lit && (
        <>
          <path
            d="M9 98L25 114L36 102L47 118L58 96L68 108L78 90L86 98L95 88V96L86 106L78 98L68 116L58 104L47 126L36 110L25 122L9 104Z"
            fill="#ff7a2e"
          />
          <path d="M26 24L46 42L38 58L60 74 M76 26L62 48 M24 76L38 58" fill="none" stroke="#5a4a50" strokeWidth="3" />
        </>
      )}
    </g>
  );
}

/** Where each card of a stack sits, the top one last. */
const DRAW_LAYOUT = [
  { x: 8, y: 8, turn: 0 },
  { x: 4, y: 4, turn: 0 },
  { x: 0, y: 0, turn: 0 },
  { x: -4, y: -4, turn: 0 },
  { x: -8, y: -8, turn: 0 },
];
const DISCARD_LAYOUT = [
  { x: 2, y: 0, turn: -9 },
  { x: -2, y: -2, turn: 7 },
  { x: 2, y: -3, turn: -4 },
  { x: -3, y: -5, turn: 10 },
  { x: 0, y: -6, turn: 2 },
];
const TINTS = ['#7d2332', '#2d6a7d', '#5a3a8c', '#3f6e36', '#8c5a22'];

export function PileArt(props: { kind: 'draw' | 'discard' | 'exhaust'; count: number }) {
  const n = pileLayers(props.count);
  return (
    <svg className="pile__art" viewBox="-12 -16 124 170" aria-hidden>
      {n === 0 && (
        <rect
          x="9"
          y="9"
          width="86"
          height="128"
          rx="8"
          fill="#0a0c1a"
          fillOpacity="0.65"
          stroke="#8b7a4a"
          strokeWidth="2.5"
          strokeDasharray="8 7"
        />
      )}
      {Array.from({ length: n }, (_, i) => {
        const top = i === n - 1;
        if (props.kind === 'draw') return <CardBack key={i} {...DRAW_LAYOUT[i]!} lit={top} />;
        if (props.kind === 'discard') return <CardFace key={i} {...DISCARD_LAYOUT[i]!} tint={TINTS[i]!} lit={top} />;
        return <CardAsh key={i} {...DISCARD_LAYOUT[i]!} lit={top} />;
      })}
    </svg>
  );
}
