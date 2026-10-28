// How a prize looks on the Brass Reel: a glyph and a colour by kind, and what a tile of the reel shows.

/** the mark of each kind of prize: a glyph and a colour */
export const PRIZE_MARK: Record<string, { glyph: string; color: string }> = {
  // (a card and a rare card wear the card-rarity colours: global.css)
  card: { glyph: '★', color: 'var(--rar-uncommon)' },
  rare: { glyph: '☆', color: 'var(--rar-rare)' },
  crossed: { glyph: '◈', color: '#7fd4ff' },
  boon: { glyph: '✦', color: '#c9a0ff' },
  potion: { glyph: '●', color: '#6fe0b0' },
  upgrade: { glyph: '↑', color: '#ffb36b' },
  shards: { glyph: '¤', color: '#f2e08a' },
  heal: { glyph: '+', color: '#9be08a' },
  hp: { glyph: '♥', color: '#ff8a7a' },
  thin: { glyph: '−', color: '#b9b3c4' },
};

export interface LanePrize {
  icon: string;
  short: string;
  label: string;
}
