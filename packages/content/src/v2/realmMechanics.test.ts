import { describe, it, expect } from 'vitest';
import { applyAction, clone, createCombat, enemyGuardFactor, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, DRAGON_WARDENS, RIFTWALKERS, ENCOUNTERS, CAMPAIGN_REALMS } from './index';
const enemy = (s: CombatState, id: string) => s.sides.b.units.find((u) => u.def === id)!;
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const end = (s: CombatState) => applyAction(db, s, { type: 'endTurn' });
function fight(id: string, move: string) {
  const s = clone(
    createCombat(db, {
      seed: `mechanic-${id}`,
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 100000, maxHp: 100000 },
      b: { enemies: [id], tier: 1, hpPct: 100, dmgPct: 100 },
    }).state,
  );
  enemy(s, id).intent = { move, target: hero(s).id };
  return s;
}
describe('realm-specific Elite variety', () => {
  it('offers five distinct native formations per realm, including at least two original solo Elites', () => {
    for (const world of CAMPAIGN_REALMS) {
      const elites = ENCOUNTERS.filter((e) => e.kind === 'elite' && e.realm === world.id);
      expect(elites, world.id).toHaveLength(5);
      expect(new Set(elites.map((e) => [...e.units].sort().join('|'))).size, world.id).toBe(5);
      expect(elites.filter((e) => e.units.length === 1).length).toBeGreaterThanOrEqual(2);
      for (const e of elites) for (const id of e.units) expect(db.units[id], e.id).toBeTruthy();
    }
  });
});
describe('nine Warden mechanics and counterplay', () => {
  it('breaking retained furnace fuel reduces the Colossus discharge and the discharge spends it', () => {
    const full = fight('ashbound-colossus', 'march');
    enemy(full, 'ashbound-colossus').barrier = 24;
    enemy(full, 'ashbound-colossus').statuses.blur = 1;
    const broken = clone(full);
    enemy(broken, 'ashbound-colossus').barrier = 0;
    const a = end(full),
      b = end(broken);
    expect(hero(b.state).hp - hero(a.state).hp).toBe(12);
    expect(enemy(a.state, 'ashbound-colossus').barrier).toBe(0);
  });
  it('Pearl Tribute steals only the Barrier that exists, up to twenty, before gaining its own twenty-four', () => {
    for (const amount of [0, 9, 50]) {
      const s = fight('pearlbound-sovereign', 'mirror');
      hero(s).barrier = amount;
      s.sides.a.mana = 0;
      s.sides.a.reserves = 0;
      const r = end(s);
      const gains = r.events.filter(
        (e) => e.type === 'barrier' && e.target === enemy(s, 'pearlbound-sovereign').id,
      );
      expect(gains.reduce((sum, e) => sum + (e.type === 'barrier' ? e.amount : 0), 0)).toBe(
        Math.round(24 * enemyGuardFactor(1, 100)) + Math.min(20, amount),
      );
    }
  });
  it('Nightmares multiply on discard; paying one Mana consumes one and draws a replacement card', () => {
    const s = fight('dreaming-monarch', 'dream');
    const r = end(s).state;
    expect(r.sides.a.hand.filter((c) => c.card === 'nightmare')).toHaveLength(2);
    const card = r.sides.a.hand.find((c) => c.card === 'nightmare')!;
    const before = r.sides.a.mana;
    const played = applyAction(db, r, { type: 'play', card: card.id }).state;
    expect(played.sides.a.mana).toBe(before - 1);
    expect(played.sides.a.exhausted.some((c) => c.id === card.id)).toBe(true);
    const discarded = end(r).state;
    const all = [
      ...discarded.sides.a.hand,
      ...discarded.sides.a.draw,
      ...discarded.sides.a.discard,
    ];
    expect(all.filter((c) => c.card === 'nightmare').length).toBeGreaterThanOrEqual(4);
  });
  it('the Chronicler wagers fifteen percent of its own life, then spends that Fate on its finisher', () => {
    const r = end(fight('sandbound-chronicler', 'measure')).state;
    expect(enemy(r, 'sandbound-chronicler').statuses.doom).toBe(33);
    enemy(r, 'sandbound-chronicler').intent = { move: 'turn', target: hero(r).id };
    const result = end(r).state;
    expect(enemy(result, 'sandbound-chronicler').statuses.doom ?? 0).toBe(0);
    const lethal = fight('sandbound-chronicler', 'erode');
    enemy(lethal, 'sandbound-chronicler').hp = 30;
    enemy(lethal, 'sandbound-chronicler').statuses.doom = 33;
    expect(end(lethal).state.winner).toBe('a');
  });
  it('Pyrewing converts remaining Burn into stronger talons and consumes the fuel', () => {
    const a = fight('pyrewing', 'talon'),
      b = clone(a);
    hero(a).statuses.burn = 4;
    const charged = end(a),
      plain = end(b);
    const hits = (r: ReturnType<typeof end>) =>
      r.events
        .filter((e) => e.type === 'damage' && e.source === enemy(a, 'pyrewing').id)
        .reduce((sum, e) => sum + (e.type === 'damage' ? e.amount : 0), 0);
    expect(hits(charged) - hits(plain)).toBe(16);
    expect(hero(charged.state).statuses.burn ?? 0).toBe(0);
  });
  it('Nacreth raises three facets but lowers both facets and Reflect during its exposed fracture window', () => {
    const s = end(fight('nacreth', 'scales')).state;
    expect(enemy(s, 'nacreth').statuses.shielded).toBe(3);
    enemy(s, 'nacreth').intent = { move: 'fracture', target: hero(s).id };
    const u = enemy(end(s).state, 'nacreth');
    expect(u.statuses.shielded ?? 0).toBe(0);
    expect(u.statuses.reflect ?? 0).toBe(0);
    expect(u.statuses.exposed).toBeGreaterThan(0);
  });
  it('Morvane eggs hatch on their second action, heal and strengthen survivors, then die; killing eggs denies that benefit', () => {
    const s = end(fight('morvane', 'brood')).state;
    expect(s.sides.b.units.filter((u) => u.def === 'hollow-egg')).toHaveLength(2);
    const fed = clone(s);
    enemy(fed, 'morvane').hp = 100;
    let r = end(fed).state;
    r = end(r).state;
    expect(r.sides.b.units.filter((u) => u.def === 'hollow-egg')).toHaveLength(0);
    expect(enemy(r, 'morvane').hp).toBeGreaterThan(100);
    expect(enemy(r, 'morvane').statuses.might).toBe(2);
    const denied = clone(s);
    denied.sides.b.units = denied.sides.b.units.filter((u) => u.def !== 'hollow-egg');
    expect(enemy(end(end(denied).state).state, 'morvane').statuses.might ?? 0).toBe(0);
  });
  it('Aethrion focuses three bolts on a lone target but forks to different targets against a formation', () => {
    const solo = end(fight('aethrion', 'bolts'));
    expect(
      solo.events.filter(
        (e) => e.type === 'damage' && e.source === enemy(solo.state, 'aethrion').id,
      ),
    ).toHaveLength(3);
    const group = fight('aethrion', 'bolts');
    const h = hero(group);
    group.sides.a.units.unshift({ ...clone(h), id: 'test-companion', def: 'hound', kind: 'ally' });
    const r = end(group);
    const targets = r.events.flatMap((e) =>
      e.type === 'damage' && e.source === enemy(group, 'aethrion').id ? [e.target] : [],
    );
    expect(targets).toHaveLength(2);
    expect(new Set(targets).size).toBe(2);
  });
  it('Xalvorr curses wounded targets and compounds existing Fate, so healing/cleansing changes its pressure', () => {
    const s = fight('xalvorr', 'eclipse');
    hero(s).hp -= 40;
    const r = end(s).state;
    expect(hero(r).statuses.doom).toBe(6);
    enemy(r, 'xalvorr').intent = { move: 'night', target: hero(r).id };
    expect(hero(end(r).state).statuses.doom).toBe(9);
    expect(hero(end(fight('xalvorr', 'eclipse')).state).statuses.doom ?? 0).toBe(0);
  });
});
describe('Drago’s native Warden court', () => {
  it.each(DRAGON_WARDENS)(
    'calls %s at reduced HP; replacements are releases and do not trigger a false victory',
    (id) => {
      const s = fight('vorthax', `call-${id}`);
      const u = enemy(s, 'vorthax');
      // Fill all four enemy slots: replacement must free the old escort first.
      const oldId = id === 'morvane' ? 'pyrewing' : 'morvane';
      const old = clone(
        createCombat(db, {
          seed: 'old-escort',
          a: { hero: 'knight', deck: [] },
          b: { enemies: [`${oldId}-incarnation`, 'hollow-egg', 'rift-shard'] },
        }).state.sides.b.units,
      );
      old.forEach((unit, i) => (unit.id = 'old-' + i));
      s.sides.b.units.unshift(...old);
      const r = end(s);
      expect(r.state.winner).toBeNull();
      const call = enemy(r.state, `${id}-incarnation`);
      expect(call).toBeTruthy();
      expect(call.maxHp).toBe(Math.round(db.units[id]!.maxHp * 0.4));
      expect(r.events.filter((e) => e.type === 'died' && e.released)).toHaveLength(3);
      expect(enemy(r.state, 'vorthax').id).toBe(u.id);
    },
  );
  it('the Morvane incarnation is not a leader; killing it cannot kill Drago', () => {
    const s = end(fight('vorthax', 'call-morvane')).state;
    const m = enemy(s, 'morvane-incarnation');
    m.hp = 1;
    m.barrier = 0;
    s.sides.a.hand = [{ id: 'kill', card: 'strike' }];
    const r = applyAction(db, s, { type: 'play', card: 'kill', target: m.id }).state;
    expect(r.winner).toBeNull();
    expect(enemy(r, 'vorthax')).toBeTruthy();
  });
});
