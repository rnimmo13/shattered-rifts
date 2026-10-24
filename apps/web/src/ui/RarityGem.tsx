// The rarity gem (art/ui/gem-*.png) as a small inline badge for rows and captions that are not full cards.
const GEMS = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);

export function RarityGem(props: { rarity: string }) {
  if (!GEMS.has(props.rarity)) return null;
  return (
    <img
      className="rgem"
      src={`${import.meta.env.BASE_URL}art/ui/gem-${props.rarity}.png`}
      alt=""
      draggable={false}
    />
  );
}
