import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  createCombat,
  legalActions,
  validateDb,
} from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from './index';

describe('Combat v2 content', () => {
  it('passes validation', () => {
    expect(validateDb(db)).toEqual([]);
  });

  it('has the Riftwalkers with 10-card starters of valid cards (12 for Sylas, the Silent shape; 11 with a weapon card, DECISIONS #436)', () => {
    for (const [id, r] of Object.entries(RIFTWALKERS)) {
      const size: Record<string, number> = { assassin: 12, drunkard: 11, spellblade: 11 };
      expect(r.starter, id).toHaveLength(size[id] ?? 10);
      for (const c of r.starter) expect(db.cards[c], `${id}: ${c}`).toBeDefined();
    }
  });

  it('every playable card has readable rules text and an upgrade', () => {
    for (const c of Object.values(db.cards)) {
      if (c.unplayable) continue;
      expect(cardText(db, c).length, c.id).toBeGreaterThan(3);
      // tokens (a Shiv, the Sovereign Blade) are made mid-fight and have no "+"
      if (!c.id.endsWith('+') && c.source !== 'token')
        expect(c.upgrade && db.cards[c.upgrade], c.id).toBeTruthy();
    }
  });

  it('upgrades are strictly better or cheaper', () => {
    for (const c of Object.values(db.cards)) {
      if (!c.upgrade) continue;
      const u = db.cards[c.upgrade]!;
      const same =
        JSON.stringify({
          e: c.effects,
          cost: c.cost,
          stars: c.starCost,
          x: c.exhaust,
          r: c.retain,
          b: c.xBonus,
          d: c.onDiscard,
          o: c.onExhaust,
          // (an Opening hand or a card no longer Fleeting is an upgrade too: the Regent's Big Bang, Void Form)
          i: c.innate,
          f: c.ethereal,
          w: c.onDraw,
        }) ===
        JSON.stringify({
          e: u.effects,
          cost: u.cost,
          stars: u.starCost,
          x: u.exhaust,
          r: u.retain,
          b: u.xBonus,
          d: u.onDiscard,
          o: u.onExhaust,
          i: u.innate,
          f: u.ethereal,
          w: u.onDraw,
        });
      expect(same, `${c.id} upgrade changes nothing`).toBe(false);
    }
  });

  it('each realm has a deep enough reward pool, with all rarities', () => {
    for (const h of Object.keys(RIFTWALKERS) as HeroId[]) {
      const pool = rewardPool(h).map((id) => db.cards[id]!);
      expect(pool.length).toBeGreaterThanOrEqual(24);
      for (const r of ['common', 'uncommon', 'rare'])
        expect(
          pool.some((c) => c.rarity === r),
          `${h} ${r}`,
        ).toBe(true);
    }
  });

  it('has regulars, two elites and a Warden per realm, plus the finale', () => {
    for (const realm of ['aurelion', 'nexus', 'wyldmaw', 'umbral']) {
      const here = ENCOUNTERS.filter((e) => e.realm === realm);
      expect(here.filter((e) => e.kind === 'regular').length).toBeGreaterThanOrEqual(3);
      expect(here.filter((e) => e.kind === 'elite')).toHaveLength(2);
      expect(here.filter((e) => e.kind === 'warden')).toHaveLength(1);
    }
    expect(ENCOUNTERS.filter((e) => e.kind === 'finale')).toHaveLength(1);
  });

  it('every hero can finish a fight against every encounter without errors (bot play)', () => {
    for (const h of Object.keys(RIFTWALKERS) as HeroId[]) {
      for (const e of ENCOUNTERS) {
        let { state } = createCombat(db, {
          seed: `${h}-${e.id}`,
          a: { hero: h, deck: RIFTWALKERS[h].starter },
          b: { enemies: e.units },
        });
        for (let i = 0; i < 600 && !state.winner; i++)
          state = applyAction(db, state, chooseAction(db, state)).state;
        expect(state.winner, `${h} vs ${e.id} did not finish`).not.toBeNull();
      }
    }
  });
});

describe('Riftwalker identities (docs/08 §5)', () => {
  const summonCards = (realm: string) =>
    Object.values(db.cards).filter(
      (c) => c.realm === realm && c.kind === 'summon' && !c.id.endsWith('+'),
    );
  it('The knight and the trickster have no companions at all', () => {
    for (const h of ['knight', 'trickster'] as const) {
      expect(RIFTWALKERS[h].hero.startUnits ?? []).toEqual([]);
    }
    expect(summonCards('aurelion')).toHaveLength(0);
    expect(summonCards('umbral')).toHaveLength(0);
  });
  it('Rivet starts with a Drone and has many summon cards', () => {
    expect(RIFTWALKERS.engineer.hero.startUnits).toEqual([{ unit: 'drone', hp: 6 }]);
    expect(summonCards('nexus').length).toBeGreaterThanOrEqual(6);
  });
  it('the starting Drone has 6 HP and the starting Thrall 2 (DECISIONS #411); a card-built Drone keeps 8', () => {
    const start = (hero: 'engineer' | 'necromancer') =>
      createCombat(db, {
        seed: 'start-units',
        a: { hero, deck: RIFTWALKERS[hero].starter },
        b: { enemies: ['squire'] },
      }).state.sides.a.units.find((u) => u.kind === 'ally')!;
    // (Tinkerer's +1 max HP has already come on turn 1)
    expect([start('engineer').hp, start('engineer').maxHp]).toEqual([7, 7]);
    expect(start('necromancer').def).toBe('bone-thrall');
    expect(start('necromancer').maxHp).toBe(2);
    expect(db.units.drone!.maxHp).toBe(8);
  });
  it('Kesh starts with a Hound and mostly buffs it instead of summoning more', () => {
    expect(RIFTWALKERS.hunter.hero.startUnits).toEqual(['hound']);
    expect(summonCards('wyldmaw').length).toBeLessThanOrEqual(4);
    const buffs = Object.values(db.cards).filter(
      (c) => c.realm === 'wyldmaw' && c.effects.some((o) => 'to' in o && o.to === 'allFriends'),
    );
    expect(buffs.length).toBeGreaterThanOrEqual(6);
  });
  it('"+" summon cards summon the "+" companion', () => {
    expect(db.cards['deploy-drone+']?.effects).toEqual([{ op: 'summon', unit: 'patrol-drone+' }]);
    expect(db.units['patrol-drone+']?.maxHp).toBe(8);
  });
});

describe('enemy debuffs land before they are needed', () => {
  it('Ghostwire, Lamplighter and Nyxara amplify an attack they set up', () => {
    for (const [id, hero] of [
      ['ghostwire', 'knight'],
      ['lamplighter', 'knight'],
      ['nyxara', 'knight'],
    ] as const) {
      let { state } = createCombat(db, {
        seed: id,
        a: { hero, deck: RIFTWALKERS[hero].starter },
        b: { enemies: [id] },
      });
      let sawAmplified = false;
      for (let i = 0; i < 12 && !state.winner; i++) {
        const r = applyAction(db, state, { type: 'endTurn' });
        sawAmplified ||= r.events.some(
          (e) =>
            e.type === 'damage' &&
            e.kind === 'attack' &&
            e.target === state.sides.a.units.at(-1)?.id &&
            e.amount > 0,
        );
        state = r.state;
        const h = state.sides.a.units.at(-1);
        if (h) {
          h.hp = h.maxHp = 9999; // let the fight run
        }
      }
      expect(sawAmplified, id).toBe(true);
    }
  });
});

describe('Warden signature cards', () => {
  const wardens = ['seraphine', 'kron', 'gorrmaw', 'nyxara'];
  it('each Warden has three, with upgrades, and they are never ordinary rewards', async () => {
    const { signatureCards, rewardPool } = await import('./index');
    for (const w of wardens) {
      const ids = signatureCards(w);
      expect(ids, w).toHaveLength(3);
      for (const id of ids) {
        expect(db.cards[id]?.upgrade).toBeTruthy();
        for (const h of Object.keys(RIFTWALKERS) as HeroId[])
          expect(rewardPool(h)).not.toContain(id);
      }
    }
  });

  it('a deck holding every signature card still plays through a fight', () => {
    const all = wardens.flatMap((w) =>
      Object.values(db.cards)
        .filter((c) => c.source === `boss:${w}` && !c.id.endsWith('+'))
        .map((c) => c.id),
    );
    for (const h of Object.keys(RIFTWALKERS) as HeroId[]) {
      let { state } = createCombat(db, {
        seed: `sig-${h}`,
        a: { hero: h, deck: [...RIFTWALKERS[h].starter, ...all] },
        b: {
          enemies: ['squire-pair', 'drone-nest']
            .flatMap((e) => ENCOUNTERS.find((x) => x.id === e)?.units ?? [])
            .slice(0, 3),
        },
      });
      for (let i = 0; i < 800 && !state.winner; i++)
        state = applyAction(db, state, chooseAction(db, state)).state;
      expect(state.winner).not.toBeNull();
    }
  });
});

describe('potions', () => {
  it('every potion can be used in a fight and is used up', async () => {
    const { POTIONS } = await import('./index');
    for (const p of POTIONS) {
      const { state } = createCombat(db, {
        seed: `potion-${p.id}`,
        a: { hero: 'knight', deck: RIFTWALKERS.knight.starter, potions: [p.id], hp: 40 },
        b: {
          enemies: ['squire-pair', 'drone-nest']
            .flatMap((e) => ENCOUNTERS.find((x) => x.id === e)?.units ?? [])
            .slice(0, 3),
        },
      });
      const use = legalActions(db, state).find((a) => a.type === 'potion');
      expect(use, p.id).toBeDefined();
      const after = applyAction(db, state, use!).state;
      expect(after.sides.a.potions, p.id).toEqual([]);
    }
  });
});

describe('every Riftwalker says what kind of fighter it is', () => {
  it('has a one-word role, and no two share one', () => {
    const roles = Object.values(RIFTWALKERS).map((r) => r.role);
    for (const role of roles) expect(role).toMatch(/^[A-Z][a-z]+$/);
    expect(new Set(roles).size).toBe(roles.length);
  });
});
