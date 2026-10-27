// `pnpm kittry`: try named starting kits against one stage 1 Warden at Tier 1 (the `pnpm bosssim` fight), next to the current kits.
//   pnpm kittry -- --hero knight --kits "bulwark-sweep,shield-charge,tower-shield;barbed-oath,mirrored-aegis,thorn-volley" --n 60

import { applyAction, chooseSmartAction, createCombat, heroOf } from '@sr/combat';
import { KIT_CARDS, enemyScale } from '@sr/campaign';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, pathOf, type HeroId } from '@sr/content/v2';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? (process.argv[i + 1] ?? d) : d;
};
const hero = arg('hero', 'knight') as HeroId;
const N = Number(arg('n', '60'));
const warden = ENCOUNTERS.find((e) => e.id === arg('warden', 'gorrmaw'));
if (!warden || !RIFTWALKERS[hero]) throw new Error('Unknown hero or Warden');
const sc = enemyScale(1, 1);

const isPlainBasic = (id: string): boolean =>
  db.cards[id]?.hero === 'neutral' && db.cards[id]?.rarity === 'basic';
/** the deck a kit makes (the same swap as makeKits) */
function deckOf(added: readonly string[]): string[] {
  const deck = [...RIFTWALKERS[hero].starter];
  for (const id of added) {
    const attack = db.cards[id]?.kind === 'attack';
    let at = deck.findIndex((c) => isPlainBasic(c) && (db.cards[c]?.kind === 'attack') === attack);
    if (at < 0) at = deck.findIndex(isPlainBasic);
    if (at >= 0) deck.splice(at, 1);
  }
  return [...deck, ...added];
}

function run(kit: readonly string[]): string {
  for (const id of kit) if (!db.cards[id]) throw new Error(`No card ${id}`);
  const deck = deckOf(kit);
  const maxHp = db.units[hero]?.maxHp ?? 80;
  let wins = 0;
  let turns = 0;
  let left = 0;
  let hpLeft = 0;
  for (let i = 0; i < N; i++) {
    let { state } = createCombat(db, {
      seed: `kittry:${hero}:${kit.join(',')}:${i}`,
      a: { hero, deck, hp: maxHp, maxHp },
      b: { enemies: warden!.units, tier: 1, hpPct: sc.hp, dmgPct: sc.dmg },
    });
    const max = state.sides.b.units.reduce((s, u) => s + u.maxHp, 0);
    for (let t = 0; t < 1500 && !state.winner; t++)
      state = applyAction(db, state, chooseSmartAction(db, state)).state;
    turns += Math.ceil(state.turn / 2);
    const h = heroOf(state.sides.a);
    if (state.winner === 'a' && (h?.hp ?? 0) > 0) {
      wins++;
      hpLeft += h!.hp / h!.maxHp;
    } else left += state.sides.b.units.reduce((s, u) => s + Math.max(0, u.hp), 0) / max;
  }
  const pct = (x: number): string => `${Math.round(x * 100)}%`;
  const label = kit
    .map((id) => `${db.cards[id]?.name} (${db.cards[id]?.rarity?.[0]?.toUpperCase()}${pathOf(id) ?? '-'})`)
    .join(', ');
  return `| ${label} | ${pct(wins / N)} | ${(turns / N).toFixed(1)} | ${wins < N ? pct(left / (N - wins)) : '-'} | ${wins ? pct(hpLeft / wins) : '-'} |`;
}

console.log(`${RIFTWALKERS[hero].role} vs ${warden.id} (Tier 1), ${N} fights per kit, smart bot\n`);
console.log('| Kit | Wins | Avg turns | Warden HP left on a loss | Your HP left on a win |');
console.log('|---|---|---|---|---|');
for (const [p, kit] of KIT_CARDS[hero].entries()) console.log(`${run(kit)} ← current ${p}`);
for (const k of arg('kits', '').split(';').filter(Boolean)) console.log(run(k.split(',').map((s) => s.trim())));
