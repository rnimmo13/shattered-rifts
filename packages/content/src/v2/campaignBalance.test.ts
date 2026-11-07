import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  type CombatState,
  type CombatEvent,
} from '@sr/combat';
import { ascendancyOf, COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState) => s.sides.b.units[0]!;
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');
let testCardId = 0;
function hand(s: CombatState, cards: string[]) {
  s.sides.a.hand = cards.map((card) => ({ id: `test-${testCardId++}`, card }));
  return s;
}
function fight(id: HeroId, cards: string[] = [], ascendancy?: string): CombatState {
  const s = createCombat(db, {
    seed: 'balance-574-' + id,
    a: { hero: id, deck: [...RIFTWALKERS[id].starter], ...(ascendancy ? { ascendancy } : {}) },
    b: { enemies: ['squire'] },
  }).state;
  s.sides.a.mana = 20;
  s.sides.a.draw = Array.from({ length: 30 }, (_, i) => ({ id: `draw-${i}`, card: 'strike' }));
  foe(s).hp = foe(s).maxHp = 10000;
  foe(s).barrier = 0;
  foe(s).statuses = {};
  hero(s).barrier = 0;
  return hand(s, cards);
}
function play(s: CombatState, card: string, target?: string): CombatState {
  const inst = s.sides.a.hand.find((c) => c.card === card);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${card} playable`).toBeDefined();
  let next = applyAction(db, s, act!).state;
  for (let i = 0; i < 10 && next.pending; i++) {
    const p = next.pending;
    next = applyAction(db, next, {
      type: 'pick',
      cards: p.pool.slice(0, Math.max(1, p.min)),
    }).state;
  }
  expect(next.pending, `${card} choices resolved`).toBeNull();
  return next;
}
function end(s: CombatState) {
  foe(s).intent = { move: 'guard', target: null };
  s = applyAction(db, s, { type: 'endTurn' }).state;
  foe(s).barrier = 0;
  return s;
}
const damageEvents = (events: CombatEvent[]) => events.filter((e) => e.type === 'damage');

describe('approved campaign balance pass', () => {
  it('Artillerist replaces saved Foreman, grows hero Might, and shields only the first Attack', () => {
    let s = fight('engineer', ['pulse-pistol', 'pulse-pistol'], 'engineer:foreman');
    expect(ascendancyOf('engineer', 'engineer:foreman')?.id).toBe('engineer:artillerist');
    expect(hero(s).name).toBe('Artillerist');
    expect(hero(s).statuses.might).toBe(2);
    expect(allies(s)).toHaveLength(1);
    expect(s.sides.a.allyPct).toBeUndefined();
    s = play(play(s, 'pulse-pistol'), 'pulse-pistol');
    expect(hero(s).barrier).toBe(6);
    s = end(s);
    expect(hero(s).statuses.might).toBe(4);
    s = play(hand(s, ['pulse-pistol']), 'pulse-pistol');
    expect(hero(s).barrier).toBe(6);
  });

  it('two Weapon Benches grow once each after the first Attack, not on every hit or card', () => {
    let s = fight('engineer', ['weapon-bench', 'weapon-bench', 'pulse-pistol', 'pulse-pistol']);
    s = play(play(s, 'weapon-bench'), 'weapon-bench');
    s = play(s, 'pulse-pistol');
    expect(hero(s).statuses.might).toBe(2);
    expect(foe(s).hp).toBe(9990); // ordinary play triggers happen after the attack
    s = play(s, 'pulse-pistol');
    expect(hero(s).statuses.might).toBe(2);
    expect(foe(s).hp).toBe(9976);
  });

  it('Jumpstart grows companions permanently, without giving the hero Might', () => {
    let s = fight('engineer', ['jumpstart', 'jumpstart']);
    s = play(play(s, 'jumpstart'), 'jumpstart');
    expect(allies(s)[0]!.statuses.might).toBe(2);
    expect(hero(s).statuses.might ?? 0).toBe(0);
    s = end(s);
    expect(allies(s)[0]!.statuses.might).toBe(2);
  });

  it.each([
    ['ion-lance', 18, 4],
    ['ion-lance+', 22, 4],
    ['gallows', 10, 6],
    ['gallows+', 13, 8],
  ] as const)('%s grows linearly across existing copies', (card, first, grow) => {
    let s = fight(card.startsWith('ion') ? 'engineer' : 'necromancer', [card, card, card]);
    s = play(play(play(s, card), card), card);
    expect(10000 - foe(s).hp).toBe(first * 3 + grow * 3);
    expect(foe(s).statuses.noose ?? 0).toBe(0);
  });

  it.each([
    ['rotary-cannon', 44],
    ['rotary-cannon+', 48],
  ] as const)('%s has four fixed hits with Might and Primed', (card, expected) => {
    const s = fight('engineer', [card]);
    hero(s).statuses = { might: 2, vigor: 5 };
    const result = applyAction(db, s, {
      type: 'play',
      card: s.sides.a.hand[0]!.id,
      target: foe(s).id,
    });
    expect(10000 - foe(result.state).hp).toBe(expected);
    expect(damageEvents(result.events)).toHaveLength(4);
    expect(hero(result.state).statuses.vigor ?? 0).toBe(0);
  });

  it('Swarm Tactics includes successful summons, excludes starting units and failed full-board spawns', () => {
    let s = fight('engineer', ['swarm-tactics', 'deploy-drone']);
    expect(s.sides.a.summonedFight ?? 0).toBe(0);
    s.sides.a.summonedFight = 3;
    s = play(play(s, 'swarm-tactics'), 'deploy-drone');
    expect(s.sides.a.summonedFight).toBe(4);
    expect(10000 - foe(s).hp).toBe(7);
    s = play(hand(s, ['deploy-drone']), 'deploy-drone');
    s.sides.a.powers.push({
      id: 'full-board-test',
      card: '',
      when: 'turnStart',
      ops: [{ op: 'summon', unit: 'patrol-drone' }],
    });
    const before = s.sides.a.summonedFight;
    s = end(s);
    expect(s.sides.a.summonedFight).toBe(before);
    expect(allies(s)).toHaveLength(3);
  });

  it.each([
    ['bulwark-frame', 20],
    ['bulwark-frame+', 23],
  ] as const)('%s protects according to the chosen ally max HP', (card, expected) => {
    let s = fight('engineer', [card]);
    const ally = allies(s)[0]!;
    ally.hp = ally.maxHp = 60;
    s = play(s, card, ally.id);
    expect(allies(s)[0]!.barrier).toBe(expected);
  });

  it('Rebuild returns a fallen machine at 75% HP once and is consumed', () => {
    let s = fight('engineer', ['rebuild']);
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    s.sides.a.fallen = ['drone'];
    s = play(s, 'rebuild');
    const unit = allies(s)[0]!;
    expect(unit.hp).toBe(Math.max(1, Math.floor(unit.maxHp * 0.75)));
    expect(s.sides.a.fallen).toHaveLength(0);
    expect(s.sides.a.exhausted.some((c) => c.card === 'rebuild')).toBe(true);
  });

  it.each([0, 2])('Measured Conviction checks the Reserves actually retained: %i', (reserves) => {
    let s = play(fight('knight', ['measured-conviction']), 'measured-conviction');
    s.sides.a.mana = 0;
    s.sides.a.reserves = reserves;
    s = end(s);
    expect(hero(s).statuses.might ?? 0).toBe(reserves >= 2 ? 1 : 0);
  });

  it.each([
    ['smoldering-blow', 16],
    ['smoldering-blow+', 19],
  ] as const)('%s converts consumed cards into damage', (card, expected) => {
    let s = fight('knight', [card]);
    s.sides.a.exhausted = Array.from({ length: 5 }, (_, i) => ({
      id: `gone-${i}`,
      card: 'strike',
    }));
    s = play(s, card);
    expect(10000 - foe(s).hp).toBe(expected);
  });

  it.each([
    ['gleeful-trapsmith', 7],
    ['gleeful-trapsmith+', 9],
  ] as const)('%s reads sprung traps, not traps merely set', (card, expected) => {
    let s = fight('trickster', [card, 'trip-line']);
    s.sides.a.snaresSprung = 12;
    s = play(play(s, card), 'trip-line');
    expect(10000 - foe(s).hp).toBe(expected);
    expect(s.sides.a.snaresSprung).toBe(12);
    s = applyAction(db, s, { type: 'endTurn' }).state; // squire attacks and springs Trip Line
    expect(s.sides.a.snaresSprung).toBe(13);
  });

  it.each([true, false])(
    'Masquerade requires a Full Trick this turn for its accumulated bonus: %s',
    (full) => {
      let s = play(fight('trickster', ['masquerade']), 'masquerade');
      s.sides.a.fullTricks = 6;
      s.sides.a.fullTrickTurn = full;
      s.sides.a.suitsTurn = full
        ? ['spades', 'hearts', 'diamonds', 'clubs']
        : ['spades', 'hearts', 'diamonds'];
      s = end(s);
      expect(10000 - foe(s).hp).toBe(full ? 24 : 9);
    },
  );

  it('Masquerade applies the combined damage once, so Shielded cancels the entire hit', () => {
    let s = play(fight('trickster', ['masquerade+']), 'masquerade+');
    s.sides.a.fullTricks = 6;
    s.sides.a.fullTrickTurn = true;
    s.sides.a.suitsTurn = ['spades', 'hearts', 'diamonds', 'clubs'];
    foe(s).statuses.shielded = 1;
    s = end(s);
    expect(foe(s).hp).toBe(10000);
  });

  it.each([
    ['slow-murder', 21],
    ['slow-murder+', 28],
  ] as const)('%s is a two-Mana draw payoff', (card, expected) => {
    let s = fight('assassin', [card]);
    s.sides.a.drawn = 20;
    s = play(s, card);
    expect(10000 - foe(s).hp).toBe(expected);
    expect(s.sides.a.mana).toBe(18);
    expect(db.cards['side-slip']!.rarity).toBe('common');
  });

  it('Spirit Strike spends one Mana and consumes the totem it commands', () => {
    let s = fight('shaman', ['spirit-strike']);
    s.sides.a.totems = ['hawk', null, null];
    s = play(s, 'spirit-strike');
    expect(10000 - foe(s).hp).toBe(12);
    expect(s.sides.a.mana).toBe(19);
    expect(s.sides.a.totems?.filter(Boolean)).toHaveLength(0);
  });

  it('Spirit Pact pays once after a real ordered command, not planting push-outs or empty commands', () => {
    let s = fight('shaman', ['spirit-pact', 'wardkeepers-pact', 'spirit-call', 'spirit-call']);
    s.sides.a.totems = ['hawk', 'bear', 'thunderbird'];
    s = play(play(s, 'spirit-pact'), 'wardkeepers-pact');
    expect(hero(s).statuses.spirit ?? 0).toBe(0);
    s = play(s, 'spirit-call');
    expect(hero(s).statuses.spirit).toBe(1);
    s = play(s, 'spirit-call');
    expect(hero(s).statuses.spirit).toBe(1);
    s = end(s);
    s.sides.a.totems = [null, null, null];
    s = play(hand(s, ['spirit-call']), 'spirit-call');
    expect(hero(s).statuses.spirit).toBe(1);
    s = play(hand(s, ['wardkeepers-pact', 'spirit-call']), 'wardkeepers-pact');
    s = play(s, 'spirit-call');
    expect(hero(s).statuses.spirit).toBe(2);
  });

  it('Spirit Pact ignores automatic Aura commands', () => {
    let s = play(fight('shaman', ['spirit-pact']), 'spirit-pact');
    s.sides.a.powers.push({
      id: 'automatic-command',
      card: '',
      when: 'turnStart',
      ops: [{ op: 'totemCommand', spirit: 'front' }],
    });
    s = end(s);
    expect(hero(s).statuses.spirit ?? 0).toBe(0);
  });

  it.each([
    ['echoing-strike', 'flame-echo', 18],
    ['echoing-strike+', 'flame-echo+', 23],
  ] as const)('%s produces a consumed token that cannot replicate', (card, token, damage) => {
    let s = play(fight('shaman', [card]), card);
    expect(s.sides.a.discard.some((c) => c.card === token)).toBe(true);
    const created = s.sides.a.created;
    s = play(hand(s, [token]), token);
    expect(10000 - foe(s).hp).toBe(damage * 2);
    expect(s.sides.a.created).toBe(created);
    expect(s.sides.a.exhausted.some((c) => c.card === token)).toBe(true);
  });

  it.each([
    ['heart-of-the-pyre', 10],
    ['heart-of-the-pyre+', 13],
  ] as const)('%s reads Burn on the selected enemy', (card, expected) => {
    let s = play(fight('shaman', [card, 'twin-cinders']), card);
    foe(s).statuses.burn = 20;
    s = play(s, 'twin-cinders');
    expect(10000 - foe(s).hp).toBe(8 + expected);
  });

  it('Monk gains Might on only the first actual stance entry of its turn, not initial setup', () => {
    let s = fight('monk', ['rising-ire', 'centre-yourself', 'centre-yourself']);
    expect(hero(s).statuses.might ?? 0).toBe(0);
    s = play(s, 'rising-ire');
    expect(hero(s).statuses.might).toBe(1);
    s = play(play(s, 'centre-yourself'), 'centre-yourself');
    expect(hero(s).statuses.might).toBe(1);
    s = end(s);
    s = play(hand(s, ['rising-ire']), 'rising-ire');
    expect(hero(s).statuses.might).toBe(2);
  });

  it('Fervor gained stays counted when Radiant spends it; Foretold Flame can use that progress', () => {
    let s = fight('monk', ['whispered-vow', 'the-offering', 'prostrate']);
    s = play(play(play(s, 'whispered-vow'), 'the-offering'), 'prostrate');
    expect(hero(s).statuses.radiant).toBe(1);
    expect(s.sides.a.fervorGained).toBe(11); // ten from cards plus the trait's Radiant entry
    expect(hero(s).statuses.mantra).toBe(1);
    hero(s).statuses.might = 0;
    const before = foe(s).hp;
    s = play(hand(s, ['foretold-flame']), 'foretold-flame');
    expect(before - foe(s).hp).toBe(24);
  });

  it('an enemy-turn stance change grants no Monk Might and does not spend the next own-turn reward', () => {
    let s = play(fight('monk', ['cornered-beast']), 'cornered-beast');
    // The squire's normal opening hit springs Coiled Serpent on its own turn.
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(hero(s).statuses.wrath).toBe(1);
    expect(hero(s).statuses.might ?? 0).toBe(0);
    s = play(hand(s, ['centre-yourself']), 'centre-yourself');
    expect(hero(s).statuses.might).toBe(1);
  });

  it('Morning After responds to an actual Hangover payment, never ordinary self-damage or its HP floor', () => {
    let s = play(fight('drunkard', ['morning-after', 'chaser']), 'morning-after');
    s = play(s, 'chaser');
    expect(hero(s).statuses.might ?? 0).toBe(0);
    hero(s).statuses.hangover = 3;
    s = end(s);
    expect(hero(s).statuses.might).toBe(1);
    hero(s).hp = 1;
    hero(s).statuses.hangover = 3;
    s = end(s);
    expect(hero(s).statuses.might).toBe(1);
  });

  it('Drunken Master grows only once per turn, including with two copies and several Stagger cards', () => {
    let s = fight('drunkard', [
      'drunken-master',
      'drunken-master',
      'haphazard-hook',
      'haphazard-hook',
    ]);
    s = play(play(s, 'drunken-master'), 'drunken-master');
    s = play(play(s, 'haphazard-hook'), 'haphazard-hook');
    expect(hero(s).statuses.might).toBe(2);
    expect(hero(s).barrier).toBe(6);
  });

  it.each([
    ['restless-spirits', 15],
    ['restless-spirits+', 24],
  ] as const)('%s scales from earlier consumed Gravesouls', (card, expected) => {
    let s = play(fight('necromancer', [card]), card);
    for (let i = 0; i < 6; i++) s = play(hand(s, ['gravesoul']), 'gravesoul');
    expect(10000 - foe(s).hp).toBe(expected);
    expect(s.sides.a.exhausted.filter((c) => c.card === 'gravesoul')).toHaveLength(6);
  });

  it.each([
    ['requiem', 19],
    ['requiem+', 22],
  ] as const)('%s pays off souls and replaces the played card', (card, expected) => {
    let s = fight('necromancer', [card]);
    s.sides.a.exhausted = Array.from({ length: 5 }, (_, i) => ({
      id: `soul-${i}`,
      card: 'gravesoul',
    }));
    s = play(s, card);
    expect(10000 - foe(s).hp).toBe(expected);
    expect(s.sides.a.hand).toHaveLength(1);
  });

  it('new rules have readable player text', () => {
    expect(cardText(db, db.cards['spirit-pact']!)).toContain('ordered totem command');
    expect(cardText(db, db.cards['morning-after']!)).toContain('Hangover');
    expect(cardText(db, db.cards['rebuild']!)).toContain('75%');
    expect(cardText(db, db.cards['rotary-cannon']!)).toContain('4 times');
  });
});
