// Obsidia, the Regent-shaped spellblade (docs/decisions-pending/spellblade.md): her starter and Arcana, the Obsidian Blade (the
// Sovereign Blade) and what sharpens and changes it, and the generic engine pieces her Regent cards brought in.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  validateDb,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

const BLADE = 'starforged-blade';

function fight(
  hand: string[],
  opts: { deck?: string[]; draw?: string[]; foes?: number; stars?: number } = {},
): CombatState {
  const deck = opts.deck ?? RIFTWALKERS.spellblade.starter;
  const { state } = createCombat(db, {
    seed: 'spellblade-test',
    a: { hero: 'spellblade', deck: [...deck, ...deck] },
    b: { enemies: Array.from({ length: opts.foes ?? 1 }, () => 'squire') },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = (opts.draw ?? []).map((card, i) => ({ id: `D${i}`, card }));
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  s.sides.a.stars = opts.stars ?? 10;
  // (the 3 Arcana the fight opened with and Kindled's 1 do not count as gained in the turn under test)
  s.sides.a.starsGainedTurn = 0;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 300;
  return s;
}
const play = (s: CombatState, id: string, pick?: string[]): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  if (pick && r.pending) r = applyAction(db, r, { type: 'pick', cards: pick }).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foeHp = (s: CombatState, i = 0): number => s.sides.b.units[i]!.hp + s.sides.b.units[i]!.barrier;
const blade = (s: CombatState) =>
  [...s.sides.a.hand, ...s.sides.a.draw, ...s.sides.a.discard].find((c) => c.card === BLADE);

describe('Obsidia is the Regent: starter, HP and Arcana', () => {
  it('starts with 75 HP, 4 Strike, 4 Defend, Cinderfall and Gather Arcana', () => {
    const r = RIFTWALKERS.spellblade;
    expect(r.hero.maxHp).toBe(75);
    expect([...r.starter].sort()).toEqual(
      ['defend', 'defend', 'defend', 'defend', 'gather-light', 'meteor-jab', 'strike', 'strike', 'strike', 'strike'].sort(),
    );
    expect(r.trait.name).toBe('Kindled');
  });

  it('every fight opens with 3 Arcana (and 1 from Kindled) and the Obsidian Blade in hand', () => {
    const { state } = createCombat(db, {
      seed: 'open',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.stars).toBe(4);
    const b = state.sides.a.hand.find((c) => c.card === BLADE);
    expect(b?.bonus).toBe(1);
  });

  it('Cinderfall costs no Mana and 2 Arcana, and leaves the enemy Faltering and Exposed', () => {
    let s = fight(['meteor-jab'], { stars: 2 });
    const hp = foeHp(s);
    s = play(s, 'meteor-jab');
    expect(s.sides.a.mana).toBe(9);
    expect(s.sides.a.stars).toBe(0);
    expect(hp - foeHp(s)).toBe(8);
    expect(s.sides.b.units[0]!.statuses.exposed).toBe(1);
    expect(s.sides.b.units[0]!.statuses.faltering).toBe(1);
  });

  it('a card is not playable without the Arcana it costs', () => {
    const s = fight(['devastate'], { stars: 3 });
    expect(legalActions(db, s).some((a) => a.type === 'play')).toBe(false);
  });
});

describe('the Obsidian Blade (Sovereign Blade)', () => {
  it('costs 2, deals 10, and every Sharpen adds to it for the fight', () => {
    let s = fight(['forged-in-fury', BLADE]);
    s = play(s, 'forged-in-fury');
    expect(blade(s)?.bonus).toBe(7);
    const hp = foeHp(s);
    const mana = s.sides.a.mana;
    s = play(s, BLADE);
    expect(mana - s.sides.a.mana).toBe(2);
    expect(hp - foeHp(s)).toBe(17);
  });

  it('a Sharpen with no Blade anywhere makes one in your hand', () => {
    const s = play(fight(['spoils']), 'spoils');
    expect(s.sides.a.hand.find((c) => c.card === BLADE)?.bonus).toBe(6);
  });

  it('Call the Blade brings it from the draw pile and sharpens it 8', () => {
    const s0 = fight(['call-the-blade'], { draw: ['strike', BLADE, 'defend'] });
    s0.sides.a.draw[1]!.bonus = 3;
    const s = play(s0, 'call-the-blade');
    const b = s.sides.a.hand.find((c) => c.card === BLADE);
    expect(b?.bonus).toBe(11);
    expect(s.sides.a.draw.some((c) => c.card === BLADE)).toBe(false);
  });

  it('Cleaving Edge makes it strike every enemy', () => {
    let s = fight(['cleaving-edge', BLADE], { foes: 2 });
    s = play(s, 'cleaving-edge');
    const a = foeHp(s, 0);
    const b = foeHp(s, 1);
    s = play(s, BLADE);
    expect(a - foeHp(s, 0)).toBe(17);
    expect(b - foeHp(s, 1)).toBe(17);
  });

  it('Echoing Blade plays it twice', () => {
    let s = fight(['echoing-blade', BLADE]);
    s = play(s, 'echoing-blade');
    const hp = foeHp(s);
    s = play(s, BLADE);
    expect(hp - foeHp(s)).toBe(20);
  });

  it('Crowned Edge doubles what the Blade deals to the target this turn, and only the Blade', () => {
    let s = fight(['conqueror', BLADE, 'sunstrike']);
    s = play(s, 'conqueror');
    expect(s.sides.b.units[0]!.statuses.bladebane).toBe(1);
    let hp = foeHp(s);
    s = play(s, 'sunstrike');
    expect(hp - foeHp(s)).toBe(9);
    hp = foeHp(s);
    s = play(s, BLADE);
    expect(hp - foeHp(s)).toBe((10 + 3) * 2);
    s = endTurn(s);
    expect(s.sides.b.units[0]!.statuses.bladebane).toBeUndefined();
  });

  it('Glass Guard gives Barrier whenever the Blade is played', () => {
    let s = fight(['parry', BLADE]);
    s = play(s, 'parry');
    s = play(s, BLADE);
    expect(hero(s).barrier).toBe(10);
  });

  it('Hammer and Anvil sharpens 5 more for each earlier hit on that enemy this turn', () => {
    let s = fight(['obsidian-flurry', 'hammer-and-anvil']);
    s = play(s, 'obsidian-flurry'); // 3 hits
    s = play(s, 'hammer-and-anvil');
    expect(blade(s)?.bonus).toBe(5 + 3 * 5);
  });
});

describe('Arcana: gained, spent, and the Auras that answer it', () => {
  it('Falling Shards spends all your Arcana, one hit for each', () => {
    let s = fight(['falling-sky'], { stars: 4 });
    const hp = foeHp(s);
    s = play(s, 'falling-sky');
    expect(s.sides.a.stars).toBe(0);
    expect(hp - foeHp(s)).toBe(20);
  });

  it('Sigil of Glass gives 2 Barrier for each Arcana spent; Hungering Void strikes on gaining and on spending', () => {
    let s = fight(['cygnus', 'gravity-well', 'devastate', 'gather-light'], { foes: 2 });
    s = play(s, 'cygnus');
    s = play(s, 'gravity-well');
    const other = foeHp(s, 1);
    s = play(s, 'devastate'); // 4 Arcana
    expect(hero(s).barrier).toBe(8);
    expect(other - foeHp(s, 1)).toBe(3);
    s = play(s, 'gather-light');
    expect(other - foeHp(s, 1)).toBe(6);
  });

  it('Arcane Flood hits every enemy once for each Arcana gained this turn', () => {
    let s = fight(['gather-light', 'radiance']);
    s = play(s, 'gather-light');
    const hp = foeHp(s);
    s = play(s, 'radiance');
    expect(hp - foeHp(s)).toBe(2 * 3);
  });

  it('Obsidian Lance grows with every card with an Arcana cost in the deck', () => {
    let s = fight(['cosmic-lance', 'meteor-jab'], { draw: ['devastate', 'strike'] });
    const hp = foeHp(s);
    s = play(s, 'cosmic-lance');
    // itself, Cinderfall and Molten Ruin
    expect(hp - foeHp(s)).toBe(8 + 3 * 2);
  });

  it('Ember Cache and Glass Veil pay out at the start of the next turn', () => {
    let s = fight(['ember-cache', 'glass-veil'], { draw: Array<string>(8).fill('strike') });
    s = play(s, 'ember-cache');
    s = play(s, 'glass-veil');
    const stars = s.sides.a.stars;
    s = endTurn(s);
    // 3 put by, 1 from Kindled
    expect(s.sides.a.stars).toBe(stars + 3 + 1);
    expect(hero(s).barrier).toBeGreaterThanOrEqual(5);
  });

  it('Ley Line turns 3 Arcana into 2 Mana', () => {
    let s = fight(['chart-the-orbit'], { stars: 3 });
    s = play(s, 'chart-the-orbit');
    expect(s.sides.a.mana).toBe(11);
    expect(s.sides.a.stars).toBe(0);
  });
});

describe('the other pieces the Regent cards brought in', () => {
  it('Glint draws and puts the chosen card back on top of the draw pile', () => {
    let s = fight(['gleam', 'defend'], { draw: ['strike', 'strike'] });
    s = play(s, 'gleam', ['T1']);
    expect(s.sides.a.draw[0]?.card).toBe('defend');
    expect(s.sides.a.hand.some((c) => c.id === 'T1')).toBe(false);
  });

  it('Out of My Sight! turns the chosen card into a Retainer Strike; To Arms! turns 2 of the draw pile into Retainer Dives', () => {
    let s = fight(['out-of-my-sight', 'defend', 'strike'], { draw: ['defend', 'defend', 'defend'] });
    s = play(s, 'out-of-my-sight', ['T1']);
    expect(s.sides.a.hand.find((c) => c.id === 'T1')?.card).toBe('retainer-strike');
    expect(s.sides.a.hand.find((c) => c.id === 'T2')?.card).toBe('strike');
    s.sides.a.hand.push({ id: 'A', card: 'to-arms' });
    s = play(s, 'to-arms');
    expect(s.sides.a.draw.filter((c) => c.card === 'retainer-dive')).toHaveLength(2);
  });

  it('Call the Guard! turns any number of cards into Retainer Guards', () => {
    const s = play(fight(['call-the-guard', 'strike', 'strike', 'defend']), 'call-the-guard', ['T1', 'T3']);
    expect(s.sides.a.hand.map((c) => c.card).sort()).toEqual(['retainer-guard', 'retainer-guard', 'strike']);
  });

  it('Call the Guard! played for free (no one to ask) turns nothing, never the whole hand', () => {
    const s = play(fight(['weigh-the-crown', 'call-the-guard', 'strike', 'defend'], { draw: [] }), 'weigh-the-crown');
    expect(s.sides.a.hand.some((c) => c.card === 'retainer-guard')).toBe(false);
  });

  it('Glass Wall goes back to your hand; Shard Strike goes on top of your draw pile', () => {
    let s = fight(['glass-wall', 'shard-strike'], { draw: ['defend'] });
    s = play(s, 'glass-wall');
    expect(s.sides.a.hand.some((c) => c.card === 'glass-wall')).toBe(true);
    s = play(s, 'shard-strike');
    expect(s.sides.a.draw[0]?.card).toBe('shard-strike');
  });

  it('Hollow Form ends the turn, and from then on the first 2 cards each turn cost no Mana', () => {
    let s = fight(['hollow-form', 'strike'], { draw: Array<string>(10).fill('strike') });
    const turn = s.turn;
    s = play(s, 'hollow-form');
    expect(s.turn).toBeGreaterThan(turn);
    expect(s.active).toBe('a');
    const mana = s.sides.a.mana;
    s = play(s, 'strike');
    s = play(s, 'strike');
    expect(s.sides.a.mana).toBe(mana);
    s = play(s, 'strike');
    expect(s.sides.a.mana).toBe(mana - 1);
  });

  it('Sigil of Momentum gives a Mana back for every 4 spent', () => {
    let s = fight(['orbit', 'obsidian-flurry', 'obsidian-flurry', 'strike']);
    // (the Sigil's own 2 Mana is paid before it is in play, so it does not count)
    s = play(s, 'orbit');
    s = play(s, 'obsidian-flurry');
    s = play(s, 'obsidian-flurry');
    expect(s.sides.a.mana).toBe(9 - 2 - 2 - 2 + 1);
  });

  it('Mirror Glass sends what its Barrier soaks back to the attacker, until your next turn', () => {
    let s = fight(['mirror-glass'], { draw: Array<string>(10).fill('defend') });
    s = play(s, 'mirror-glass');
    const hp = s.sides.b.units[0]!.hp;
    s = endTurn(s); // the Squire slashes for 9 into 15 Barrier
    expect(hp - s.sides.b.units[0]!.hp).toBe(9);
    expect(hero(s).statuses.reflect).toBeUndefined();
  });

  it("Tyrant's Stomp gets cheaper and Crowned Fist hits harder each time they are drawn", () => {
    let s = fight(['read-the-embers'], { draw: ['tyrants-stomp', 'crowned-fist'] });
    s = play(s, 'read-the-embers');
    const stomp = s.sides.a.hand.find((c) => c.card === 'tyrants-stomp');
    const fist = s.sides.a.hand.find((c) => c.card === 'crowned-fist');
    expect(stomp?.costMod).toBe(-1);
    expect(fist?.bonus).toBe(4);
    const hp = foeHp(s);
    s = play(s, 'crowned-fist');
    expect(hp - foeHp(s)).toBe(12);
  });

  it('By Decree comes back to your hand on every third Skill played in a turn', () => {
    let s = fight(['defend', 'defend', 'defend'], { draw: ['by-decree', 'strike'] });
    s.sides.a.discard = [{ id: 'BD', card: 'by-decree' }];
    s.sides.a.draw = [];
    s = play(s, 'defend');
    s = play(s, 'defend');
    expect(s.sides.a.hand.some((c) => c.id === 'BD')).toBe(false);
    s = play(s, 'defend');
    expect(s.sides.a.hand.some((c) => c.id === 'BD')).toBe(true);
  });

  it('Unbreakable Crown plays itself from the top of the draw pile as the turn ends', () => {
    let s = fight(['strike'], { draw: ['unbreakable-crown', 'defend'] });
    s = endTurn(s);
    // its 10 Barrier soaked the Squire's slash (9) before the next turn began
    expect(hero(s).hp).toBe(hero(fight([])).hp);
  });

  it('Cataclysm hits every enemy and fills the hand with Rubble', () => {
    const s = play(fight(['supernova', 'strike'], { foes: 2 }), 'supernova');
    expect(s.sides.a.hand.length).toBe(10);
    expect(s.sides.a.hand.filter((c) => c.card === 'rubble')).toHaveLength(9);
    expect(300 - foeHp(s, 1)).toBe(21);
  });

  it('Weigh the Crown plays a Skill from your hand 3 times', () => {
    const s = play(fight(['weigh-the-crown', 'defend'], { draw: [] }), 'weigh-the-crown');
    expect(hero(s).barrier).toBe(15);
  });

  it('Rift Gifts and Wild Spark add Neutral cards', () => {
    let s = play(fight(['rift-gifts']), 'rift-gifts');
    expect(s.sides.a.hand).toHaveLength(3);
    for (const c of s.sides.a.hand) expect(db.cards[c.card]?.hero).toBe('neutral');
    s = play(fight(['wild-spark']), 'wild-spark');
    expect(db.cards[s.sides.a.hand[0]!.card]?.hero).toBe('neutral');
  });

  it('Endless Barrage comes back from the consumed pile every turn', () => {
    let s = fight(['endless-barrage'], { draw: Array<string>(10).fill('defend') });
    s = play(s, 'endless-barrage');
    const hp = foeHp(s);
    s = endTurn(s);
    expect(hp - foeHp(s)).toBeGreaterThanOrEqual(18);
    expect(s.sides.a.exhausted.some((c) => c.card === 'endless-barrage')).toBe(true);
  });

  it('the card data validates', () => {
    expect(validateDb(db)).toEqual([]);
  });
});
