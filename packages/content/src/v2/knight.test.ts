// Valeria, the Ironclad-shaped knight (DECISIONS #364): Devotion is gone, the starter is the classic ten, and the cards that
// were copied in shape from the Slay the Spire 2 Ironclad do what their text says.

import { describe, expect, it } from 'vitest';
import {
  STATUS_IDS,
  applyAction,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { BUILD_PATHS_SHOWN, COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(hand: string[], deck: string[] = RIFTWALKERS.knight.starter): CombatState {
  const { state } = createCombat(db, {
    seed: 'knight-test',
    a: { hero: 'knight', deck: [...deck, ...deck] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = [];
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 200;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  // (a play action names the card in the hand, not the card's id)
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
const foeHp = (s: CombatState): number => s.sides.b.units[0]!.hp + s.sides.b.units[0]!.barrier;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;

describe('the knight is the Ironclad shape', () => {
  it('starts with five Strikes, four Defends and Sundering Blow; Devotion is gone', () => {
    expect(RIFTWALKERS.knight.starter).toEqual([
      ...Array<string>(5).fill('strike'),
      ...Array<string>(4).fill('defend'),
      'sundering-blow',
    ]);
    expect(RIFTWALKERS.knight.hero.maxHp).toBe(80);
    expect(STATUS_IDS).not.toContain('devotion');
    expect(Object.values(db.cards).filter((c) => c.statusCost)).toEqual([]);
    expect(RIFTWALKERS.knight.trait.triggers).toBeUndefined();
  });

  it('keeps four build paths in its data (there is no limit of three, DECISIONS #362), though none is shown', () => {
    expect(RIFTWALKERS.knight.buildPaths).toHaveLength(4);
    expect(pathSizes('knight')).toHaveLength(4);
    expect(BUILD_PATHS_SHOWN).toBe(false);
  });

  it('Sundering Blow hits for 8 and leaves 2 Exposed', () => {
    const s = play(fight(['sundering-blow']), 'sundering-blow');
    expect(foeHp(s)).toBe(192);
    expect(s.sides.b.units[0]!.statuses.exposed).toBe(2);
  });

  it('Mastered Strike counts every Strike in the whole deck, itself included', () => {
    const s0 = fight(['mastered-strike']);
    s0.sides.a.draw = ['strike', 'strike', 'strike'].map((card, i) => ({ id: `D${i}`, card }));
    s0.sides.a.discard = [{ id: 'X0', card: 'hilt-strike' }];
    s0.sides.a.exhausted = [{ id: 'X1', card: 'twin-cut' }]; // (no Strike in its name)
    // 3 Strikes in the draw pile, Hilt Strike in the discard pile, and Mastered Strike itself = 5
    expect(foeHp(play(s0, 'mastered-strike'))).toBe(200 - (6 + 2 * 5));
  });

  it('Break Guard hits twice against an Exposed enemy', () => {
    const plain = play(fight(['break-guard']), 'break-guard');
    expect(foeHp(plain)).toBe(200 - 8);
    const s0 = fight(['break-guard']);
    s0.sides.b.units[0]!.statuses.exposed = 2;
    // two hits of 8, each 50% more against an Exposed enemy
    expect(foeHp(play(s0, 'break-guard'))).toBe(200 - 2 * 12);
  });

  it('Whirling Blade hits every enemy once per Mana spent', () => {
    const s0 = fight(['whirling-blade']);
    s0.sides.a.mana = 3;
    const s = play(s0, 'whirling-blade');
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 15);
  });

  it('Mounting Fury grows every time it is played', () => {
    let s = fight(['mounting-fury', 'mounting-fury']);
    s = play(s, 'mounting-fury');
    expect(foeHp(s)).toBe(200 - 9);
    s = play(s, 'mounting-fury');
    expect(foeHp(s)).toBe(200 - 9 - 14);
  });

  it('Intimidate gives you Might for the Exposed it leaves', () => {
    const s0 = fight(['intimidate']);
    s0.sides.b.units[0]!.statuses.exposed = 2;
    const s = play(s0, 'intimidate');
    expect(s.sides.b.units[0]!.statuses.exposed).toBe(3);
    expect(hero(s).statuses.might).toBe(3);
  });

  it('Burn It All deals 7 for every other card in your hand, and consumes the hand', () => {
    const s = play(fight(['burn-it-all', 'strike', 'strike', 'defend']), 'burn-it-all');
    expect(foeHp(s)).toBe(200 - 21);
    expect(s.sides.a.hand).toHaveLength(0);
    expect(s.sides.a.exhausted).toHaveLength(4);
  });

  it('Rite of Recall draws a card whenever a card is consumed', () => {
    let s = fight(['rite-of-recall', 'sacrificial-guard', 'strike']);
    s.sides.a.draw = [{ id: 'D0', card: 'defend' }, { id: 'D1', card: 'defend' }];
    s = play(s, 'rite-of-recall');
    const drawn = s.sides.a.drawn;
    s = play(s, 'sacrificial-guard'); // consumes a card at random
    expect(s.sides.a.drawn).toBe(drawn + 1);
  });

  it('Unholy Pact makes your Skills free, and consumes them', () => {
    let s = fight(['unholy-pact', 'defend']);
    s.sides.a.mana = 3;
    s = play(s, 'unholy-pact');
    expect(s.sides.a.mana).toBe(0);
    s = play(s, 'defend');
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.exhausted.some((c) => c.card === 'defend')).toBe(true);
  });

  it('Scar Over gives Might for every HP you pay, and Blood Fire strikes everyone', () => {
    let s = fight(['scar-over', 'blood-fire', 'draw-blood']);
    s = play(s, 'scar-over');
    s = play(s, 'blood-fire');
    const hp = hero(s).hp;
    s = play(s, 'draw-blood'); // lose 3 HP, gain 2 Mana
    expect(hero(s).hp).toBe(hp - 3);
    expect(hero(s).statuses.might).toBe(1);
    // (6 damage, and the Might that Scar Over just gave adds 1)
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 7);
  });

  it('Bulwark Blow deals your Barrier as damage', () => {
    const s0 = fight(['bulwark-blow']);
    hero(s0).barrier = 17;
    expect(foeHp(play(s0, 'bulwark-blow'))).toBe(200 - 17);
  });

  it('Field Repairs upgrades a card in your hand', () => {
    const s = play(fight(['field-repairs', 'strike']), 'field-repairs');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['strike+']);
  });
});

// The cards added for the rest of the Ironclad list (DECISIONS #366), and the engine pieces under them.
describe('the rest of the Ironclad list', () => {
  const draw = (...cards: string[]) => cards.map((card, i) => ({ id: `D${i}`, card }));
  const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
  const lostHp = (s: CombatState): number => hero(s).maxHp - hero(s).hp;

  it('Cold Stare gives 8 more Barrier once a card has been consumed this turn', () => {
    const base = hero(play(fight(['cold-stare']), 'cold-stare')).barrier;
    const s0 = fight(['cold-stare']);
    s0.sides.a.exhaustedTurn = 1;
    expect(hero(play(s0, 'cold-stare')).barrier).toBe(base + 8);
  });

  it('Spiteful Jab hits twice only after you have lost HP this turn', () => {
    expect(foeHp(play(fight(['spiteful-jab']), 'spiteful-jab'))).toBe(200 - 6);
    const s0 = fight(['spiteful-jab']);
    s0.sides.a.lostHpTurn = 1;
    expect(foeHp(play(s0, 'spiteful-jab'))).toBe(200 - 12);
  });

  it('Rending Fury hits once more for every time you have lost HP this fight', () => {
    const s0 = fight(['rending-fury']);
    s0.sides.a.lostHpFight = 3;
    expect(foeHp(play(s0, 'rending-fury'))).toBe(200 - 4 * 5);
  });

  it('Plunder draws until a card that is not an Attack comes up', () => {
    const s0 = fight(['plunder']);
    s0.sides.a.draw = draw('strike', 'strike', 'defend', 'strike');
    const s = play(s0, 'plunder');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['strike', 'strike', 'defend']);
    expect(s.sides.a.draw).toHaveLength(1);
  });

  it('Grim Focus draws 3 and then no more cards come this turn', () => {
    const s0 = fight(['grim-focus', 'oath-of-iron']);
    s0.sides.a.draw = draw('strike', 'strike', 'strike', 'strike', 'strike');
    let s = play(s0, 'grim-focus');
    expect(s.sides.a.hand).toHaveLength(1 + 3);
    s = play(s, 'oath-of-iron'); // would draw 1
    expect(s.sides.a.hand).toHaveLength(3);
  });

  it('Trampling Charge costs 1 less for every Attack played this turn', () => {
    const s0 = fight(['trampling-charge']);
    s0.sides.a.mana = 3;
    expect(play(s0, 'trampling-charge').sides.a.mana).toBe(0);
    const s1 = fight(['trampling-charge']);
    s1.sides.a.mana = 3;
    s1.sides.a.attacksPlayed = 2;
    expect(play(s1, 'trampling-charge').sides.a.mana).toBe(2);
  });

  it('Relentless Push makes your next Attack free, once', () => {
    let s = fight(['relentless-push', 'strike', 'strike']);
    s.sides.a.mana = 3;
    s = play(s, 'relentless-push'); // 2 Mana
    expect(s.sides.a.mana).toBe(1);
    expect(hero(s).statuses.freeattack).toBe(1);
    s = play(s, 'strike');
    expect(s.sides.a.mana).toBe(1);
    expect(hero(s).statuses.freeattack).toBeUndefined();
    s = play(s, 'strike');
    expect(s.sides.a.mana).toBe(0);
  });

  it('a Free Attack is kept when the Attack costs nothing anyway (DECISIONS #372)', () => {
    let s = fight(['relentless-push', 'hot-temper', 'strike']);
    s.sides.a.mana = 3;
    s = play(s, 'relentless-push');
    s = play(s, 'hot-temper'); // 0 Mana: the Free Attack waits
    expect(hero(s).statuses.freeattack).toBe(1);
    s = play(s, 'strike');
    expect(s.sides.a.mana).toBe(1);
    expect(hero(s).statuses.freeattack).toBeUndefined();
  });

  it('Bitter Breath consumes every card that is not an Attack, 5 Barrier for each', () => {
    const s0 = fight(['bitter-breath', 'strike', 'defend', 'defend', 'oath-of-iron']);
    const before = hero(s0).barrier;
    const s = play(s0, 'bitter-breath');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['strike']);
    expect(hero(s).barrier).toBe(before + 15);
  });

  it('Fan the Flames consumes the hand and gives a new card for each one', () => {
    const s = play(fight(['fan-the-flames', 'strike', 'defend', 'defend']), 'fan-the-flames');
    expect(s.sides.a.exhausted).toHaveLength(3);
    expect(s.sides.a.hand).toHaveLength(3);
  });

  it('Stone Fury turns every Attack in your hand into a Giant Rock', () => {
    const s = play(fight(['stone-fury', 'strike', 'defend', 'hammer-fall']), 'stone-fury');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['giant-rock', 'defend', 'giant-rock']);
    expect(foeHp(play(s, 'giant-rock'))).toBe(200 - 16);
  });

  it('War Drums draws 2, then consumes the top card of your draw pile every turn', () => {
    const s0 = fight(['war-drums']);
    s0.sides.a.draw = draw('strike', 'strike', 'strike', 'strike', 'strike', 'strike', 'strike');
    let s = play(s0, 'war-drums');
    expect(s.sides.a.hand).toHaveLength(2);
    const consumed = s.sides.a.exhausted.length;
    s = endTurn(s);
    expect(s.sides.a.exhausted.length).toBeGreaterThan(consumed);
  });

  it('Brace for Battle gives a Mana per Attack in hand, and then no more Mana this turn', () => {
    let s = fight(['brace-for-battle', 'strike', 'strike', 'defend', 'draw-blood']);
    s.sides.a.mana = 2;
    s = play(s, 'brace-for-battle');
    expect(s.sides.a.mana).toBe(2);
    s = play(s, 'draw-blood'); // +2 Mana, but the lock holds
    expect(s.sides.a.mana).toBe(2);
  });

  it('Ritual of Ash gives 3 Mana only after a card was consumed this turn', () => {
    const s0 = fight(['ritual-of-ash']);
    s0.sides.a.mana = 1;
    expect(play(s0, 'ritual-of-ash').sides.a.mana).toBe(0);
    const s1 = fight(['ritual-of-ash']);
    s1.sides.a.mana = 1;
    s1.sides.a.exhaustedTurn = 1;
    expect(play(s1, 'ritual-of-ash').sides.a.mana).toBe(3);
  });

  it('Wild Gamble plays the top card of your draw pile for free, and consumes it', () => {
    const s0 = fight(['wild-gamble']);
    s0.sides.a.draw = draw('hammer-fall', 'strike');
    s0.sides.a.mana = 1;
    const s = play(s0, 'wild-gamble');
    // (against a random enemy: 32 damage, less any Barrier it had)
    expect(s.sides.b.units.reduce((n, u) => n + (200 - u.hp), 0)).toBe(32);
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('hammer-fall');
    expect(s.sides.a.draw).toHaveLength(1);
  });

  it('Unravel plays the top X cards of your draw pile', () => {
    const s0 = fight(['unravel']);
    s0.sides.a.draw = draw('strike', 'strike', 'strike', 'strike');
    s0.sides.a.mana = 3;
    const s = play(s0, 'unravel');
    expect(s.sides.a.draw).toHaveLength(1);
    expect(s.sides.b.units.reduce((n, u) => n + (200 - u.hp), 0)).toBe(3 * 6);
  });

  it('Howl of the Fallen comes back from the consumed pile every turn', () => {
    let s = fight(['howl-of-the-fallen']);
    s.sides.a.mana = 3;
    s = play(s, 'howl-of-the-fallen');
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 16);
    s = endTurn(s);
    for (const u of s.sides.b.units) expect(u.hp).toBeLessThanOrEqual(200 - 32);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('howl-of-the-fallen');
  });

  it('Ashen Reckoning needs 3 consumed cards', () => {
    const s0 = fight(['ashen-reckoning']);
    expect(legalActions(db, s0).some((a) => a.type === 'play' && a.card === 'T0')).toBe(false);
    s0.sides.a.exhausted = draw('strike', 'strike', 'strike');
    const s = play(s0, 'ashen-reckoning');
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 17);
  });

  it("Berserker's Rage gives Barrier for each Attack, until the end of the turn", () => {
    let s = fight(['berserkers-rage', 'strike', 'strike']);
    s = play(s, 'berserkers-rage');
    const before = hero(s).barrier;
    s = play(s, 'strike');
    s = play(s, 'strike');
    expect(hero(s).barrier).toBe(before + 6);
    s = endTurn(s);
    expect(s.sides.a.powers.filter((p) => p.temp)).toHaveLength(0);
  });

  it('Charging Herd plays a random Attack from your hand at the end of your turn', () => {
    let s = fight(['charging-herd', 'hammer-fall']);
    s = play(s, 'charging-herd');
    s = endTurn(s);
    expect(s.sides.b.units.reduce((n, u) => n + (200 - u.hp), 0)).toBeGreaterThanOrEqual(32);
  });

  it("Juggler's Rhythm copies your third Attack each turn", () => {
    let s = fight(['jugglers-rhythm', 'strike', 'strike', 'twin-cut']);
    s = play(s, 'jugglers-rhythm');
    s = play(s, 'strike');
    s = play(s, 'strike');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['twin-cut']);
    s = play(s, 'twin-cut');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['twin-cut']);
  });

  it('Scent of Weakness draws a card whenever you put Exposed on an enemy', () => {
    let s = fight(['scent-of-weakness', 'sundering-blow']);
    s.sides.a.draw = draw('strike', 'strike');
    s = play(s, 'scent-of-weakness');
    s = play(s, 'sundering-blow');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['strike']);
  });

  it('Raised Hell plays every Strike you draw against a random enemy', () => {
    let s = fight(['raised-hell', 'hilt-strike']);
    s.sides.a.draw = draw('strike', 'defend');
    s = play(s, 'raised-hell');
    const total = (x: CombatState): number => x.sides.b.units.reduce((n, u) => n + (200 - u.hp), 0);
    s = play(s, 'hilt-strike'); // 9 damage, and the Strike it draws plays itself for 6 more
    expect(total(s)).toBe(9 + 6);
    expect(s.sides.a.hand.map((c) => c.card)).not.toContain('strike');
  });

  it('Unforgiving Drill brings an upgraded Attack back from the discard pile each turn', () => {
    let s = fight(['unforgiving-drill']);
    s = play(s, 'unforgiving-drill');
    // (a full draw pile for the next hand, so the discard pile is still there when the Aura looks)
    s.sides.a.draw = draw('defend', 'defend', 'defend', 'defend', 'defend');
    s.sides.a.discard = draw('strike');
    s = endTurn(s);
    expect(s.sides.a.hand.map((c) => c.card)).toContain('strike+');
  });

  it('Crippling Blow saps the enemy for its next turn only', () => {
    const without = lostHp(endTurn(fight([])));
    expect(without).toBeGreaterThan(0);
    const sapped = lostHp(endTurn(play(fight(['crippling-blow']), 'crippling-blow')));
    expect(sapped).toBeLessThan(without);
    // it is gone again by the next turn
    const after = endTurn(play(fight(['crippling-blow']), 'crippling-blow'));
    expect(after.sides.b.units[0]!.statuses.sapped).toBeUndefined();
  });

  it('Bloodfeast raises your max HP when it kills', () => {
    const s0 = fight(['bloodfeast']);
    s0.sides.b.units[0]!.hp = 5;
    const max0 = hero(s0).maxHp;
    const s = play(s0, 'bloodfeast');
    expect(hero(s).maxHp).toBe(max0 + 3);
    expect(s.sides.a.maxHpGained).toBe(3);
    // and not when it does not
    const s1 = play(fight(['bloodfeast']), 'bloodfeast');
    expect(hero(s1).maxHp).toBe(max0);
  });

  it('Cruel Streak makes your attacks hit Exposed enemies a quarter harder', () => {
    const hitAfterExpose = (hand: string[]): number => {
      let s = fight(hand);
      for (const c of hand.slice(0, -1)) s = play(s, c);
      const hp = foeHp(s);
      s = play(s, 'strike');
      return hp - foeHp(s);
    };
    const base = hitAfterExpose(['sundering-blow', 'strike']);
    expect(hitAfterExpose(['cruel-streak', 'sundering-blow', 'strike'])).toBe(Math.floor(base * 1.25));
  });

  it("Giant's Stance halves the damage of Exposed enemies until the enemies have had their turn", () => {
    const lostWith = (hand: string[]): { lost: number; sturdy: number | undefined } => {
      let s = fight(hand);
      for (const u of s.sides.b.units) u.statuses.exposed = 3;
      for (const c of hand) s = play(s, c);
      s = endTurn(s);
      return { lost: lostHp(s), sturdy: hero(s).statuses.sturdy };
    };
    const without = lostWith([]);
    expect(without.lost).toBeGreaterThan(0);
    const withStance = lostWith(['giants-stance']);
    expect(withStance.lost).toBeLessThan(without.lost);
    expect(withStance.sturdy).toBeUndefined();
  });

  it('Stone Stance doubles the first Barrier a card gives you each turn', () => {
    let s = fight(['stone-stance', 'oath-of-iron', 'oath-of-iron']);
    s = play(s, 'stone-stance');
    const before = hero(s).barrier;
    s = play(s, 'oath-of-iron');
    expect(hero(s).barrier).toBe(before + 16);
    s = play(s, 'oath-of-iron');
    expect(hero(s).barrier).toBe(before + 24);
  });

  it('Flailing Blows consumes a random Attack from your hand and adds its damage', () => {
    const s = play(fight(['flailing-blows', 'hammer-fall', 'defend']), 'flailing-blows');
    expect(s.sides.a.exhausted.map((c) => c.card)).toEqual(['hammer-fall']);
    expect(foeHp(s)).toBe(200 - (2 * 4 + 32));
  });

  it('Rally heals 10 and is consumed', () => {
    const s0 = fight(['rally']);
    hero(s0).hp = 40;
    const s = play(s0, 'rally');
    expect(hero(s).hp).toBe(50);
    expect(s.sides.a.exhausted.map((c) => c.card)).toEqual(['rally']);
  });
});

// The knight is the Ironclad's list, card for card (DECISIONS #367), as a yardstick for the other classes.
describe('one card for each of the Ironclad’s', () => {
  it('has 82 cards of her own (with Sundering Blow, her Bash) plus Strike and Defend: the 87 of the Ironclad less Tank, Demonic Shield and Break', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'knight' && !c.id.endsWith('+') && c.source !== 'token',
    );
    expect(own).toHaveLength(82);
    // no Thorns and no Traps
    expect(own.filter((c) => c.kind === 'snare')).toEqual([]);
    expect(
      own.filter((c) => c.effects.some((o) => o.op === 'status' && o.status === 'thorns' && !o.temp)),
    ).toEqual([]);
  });

  it('Hot Temper puts a copy of itself in your discard pile', () => {
    const s = play(fight(['hot-temper']), 'hot-temper');
    expect(foeHp(s)).toBe(200 - 6);
    expect(s.sides.a.discard.filter((c) => c.card === 'hot-temper')).toHaveLength(2);
  });

  it('Pact of Embers consumes a card and draws 2', () => {
    const s0 = fight(['pact-of-embers', 'strike']);
    s0.sides.a.draw = [
      { id: 'D0', card: 'defend' },
      { id: 'D1', card: 'defend' },
    ];
    const s = play(s0, 'pact-of-embers');
    expect(s.sides.a.exhausted.map((c) => c.card)).toEqual(['strike']);
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['defend', 'defend']);
  });

  it('Inner Furnace gives a Mana more at the start of every turn', () => {
    let s = fight(['inner-furnace']);
    s.sides.a.mana = 3;
    s = play(s, 'inner-furnace');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana + 1);
  });
});
