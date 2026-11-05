import { readFileSync, writeFileSync } from 'node:fs';
const dir =
  (process.argv[2] ?? 'docs/balance-history/simulations/0.198.0').replace(/\/$/, '') + '/';
const data = JSON.parse(readFileSync(dir + 'card-reference.json', 'utf8'));
const candidates = JSON.parse(readFileSync(dir + 'candidates.json', 'utf8'));
const variants = JSON.parse(readFileSync(dir + 'variants.json', 'utf8'));
const results = readFileSync(dir + 'train-b300.jsonl', 'utf8')
  .trim()
  .split('\n')
  .map(JSON.parse);
if (results.length !== variants.flat().length * 8) throw Error('Training incomplete');
const byId = new Map(results.map((r) => [r.id, r]));
const output = { arena: { optimized: [], good: [] }, boss: { optimized: [], good: [] } };
const selection = [];
const score = (r, side) =>
  r.winner === side ? 1 : r.winner === 'draw' ? 0.5 : r.censored ? 0.5 : 0;
const removePlus = (id) => id.replace(/\+$/, '');
function good(d, c) {
  const deck = d.deck.map(removePlus);
  const filler = (preferred) =>
    [preferred, ...c.fallback, 'defend', 'strike'].find(
      (id) => deck.filter((x) => x === id).length < 5,
    );
  // Lose up to two rare duplicates, retaining at least one of every rare engine/payoff.
  let changed = 0;
  for (let i = deck.length - 1; i >= 0 && changed < 2; i--) {
    const id = deck[i],
      card = data.cards.find((x) => x.id === id);
    if (card.rarity === 'rare' && deck.indexOf(id) !== i) {
      deck[i] = filler(c.fallback[changed % 2]);
      changed++;
    }
  }
  // Four useful common cards represent a less thoroughly trimmed campaign deck.
  for (const id of [...c.fallback, ...c.fallback]) deck.push(filler(id));
  // Half upgraded, prioritizing remaining core cards; same deterministic standard for all.
  const order = deck
    .map((id, i) => ({ id, i, core: c.core.includes(id) }))
    .sort((a, b) => Number(b.core) - Number(a.core) || a.i - b.i);
  for (const { i, id } of order.slice(0, Math.floor(deck.length / 2)))
    deck[i] = data.cards.find((c) => c.id === id).upgrade ?? id;
  return { ...d, deck, quality: 'good' };
}
for (let i = 0; i < variants.length; i++) {
  const stats = variants[i].map((v, k) => {
    const offset = variants.slice(0, i).reduce((n, vs) => n + vs.length * 8, 0);
    const rows = Array.from({ length: 8 }, (_, j) => byId.get(offset + k * 8 + j));
    const boss = rows.slice(0, 4),
      arena = rows.slice(4);
    return {
      k,
      variant: v.quality,
      bossWins: boss.filter((r) => r.winner === 'a').length,
      bossScore: boss.reduce(
        (n, r) =>
          n +
          score(r, 'a') +
          (r.winner === 'a' ? (0.05 * r.hp.a) / r.maxHp.a : 0.05 * (1 - r.bossFraction)),
        0,
      ),
      arenaWins: arena.reduce((n, r, j) => n + score(r, j % 2 === 0 ? 'a' : 'b'), 0),
      arenaScore: arena.reduce((n, r, j) => {
        const me = j % 2 === 0 ? 'a' : 'b',
          them = me === 'a' ? 'b' : 'a';
        return n + score(r, me) + 0.01 * (r.hp[me] / r.maxHp[me] - r.hp[them] / r.maxHp[them]);
      }, 0),
    };
  });
  selection.push({ id: candidates[i].id, stats });
  for (const mode of ['arena', 'boss']) {
    const key = mode + 'Score';
    const best = [...stats].sort((a, b) => b[key] - a[key] || a.k - b.k)[0];
    const d = { ...variants[i][best.k], quality: 'optimized', selectedVariant: best.variant };
    output[mode].optimized.push(d);
    output[mode].good.push(good(d, candidates[i]));
  }
}
writeFileSync(dir + 'selection.json', JSON.stringify(selection, null, 2) + '\n');
writeFileSync(dir + 'decks.json', JSON.stringify(output, null, 2) + '\n');
console.log(
  'Selected separate Arena/Vorthax decks using training seeds only; produced 120 frozen deck specifications.',
);
