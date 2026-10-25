// The rarity gem as a small inline badge for rows and captions that are not full cards (drawn in CSS, see .rgem).
const GEMS = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);

export function RarityGem(props: { rarity: string }) {
  if (!GEMS.has(props.rarity)) return null;
  return <span className={`rgem rgem--${props.rarity}`} aria-hidden="true" />;
}
