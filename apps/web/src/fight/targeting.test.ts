import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createCombat,
  legalActions,
  type CombatDb,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { needsAim } from './targeting';

function fight(hero: HeroId = 'engineer'): CombatState {
  const { state } = createCombat(db, {
    seed: 'sole-companion-target',
    a: { hero, deck: [...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire'] },
  });
  state.sides.a.mana = 9;
  return state;
}

function choices(s: CombatState, card: string, content: CombatDb = db) {
  s.sides.a.hand = [{ id: 'chosen-card', card }];
  const actions = legalActions(content, s).filter(
    (a) => a.type === 'play' && a.card === 'chosen-card',
  );
  return {
    playable: actions.length > 0,
    targets: [
      ...new Set(actions.flatMap((a) => (a.type === 'play' && a.target ? [a.target] : []))),
    ],
  };
}

describe('card targeting uses the engine-approved choices (#594)', () => {
  it.each([
    ['engineer', 'reinforce'],
    ['engineer', 'upgrade-chip'],
    ['engineer', 'recycle'],
    ['hunter', 'devour-ally'],
    ['necromancer', 'fen-offering'],
  ] as const)('%s: %s needs no extra aiming with one companion', (hero, card) => {
    const s = fight(hero);
    const companion = s.sides.a.units.find((u) => u.kind === 'ally')!;
    expect(companion).toBeDefined();
    const c = choices(s, card);
    expect(c.playable).toBe(true);
    expect(c.targets).toEqual([companion.id]);
    expect(needsAim(c)).toBe(false);
  });

  it('still requires a choice between two companions', () => {
    let s = fight();
    s.sides.a.hand = [{ id: 'summon', card: 'deploy-drone' }];
    const summon = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'summon')!;
    s = applyAction(db, s, summon).state;
    const c = choices(s, 'reinforce');
    expect(c.playable).toBe(true);
    expect(c.targets).toHaveLength(2);
    expect(needsAim(c)).toBe(true);
  });

  it('does not invent a hero target when there are no companions', () => {
    const s = fight();
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    const c = choices(s, 'reinforce');
    expect(c.playable).toBe(false);
    expect(c.targets).toEqual([]);
  });

  it('requires a choice when both the hero and a companion are legal', () => {
    const content: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        friendly: { ...db.cards.reinforce!, id: 'friendly', target: 'friend' },
      },
    };
    const s = fight();
    const c = choices(s, 'friendly', content);
    expect(c.playable).toBe(true);
    expect(c.targets).toHaveLength(2);
    expect(needsAim(c)).toBe(true);
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
    const heroOnly = choices(s, 'friendly', content);
    expect(heroOnly.targets).toEqual([s.sides.a.units[0]!.id]);
    expect(needsAim(heroOnly)).toBe(false);
  });

  it('keeps the existing behavior for untargeted cards and enemy targets', () => {
    const s = fight();
    const defend = choices(s, 'defend');
    expect(defend.playable).toBe(true);
    expect(defend.targets).toEqual([]);
    expect(needsAim(defend)).toBe(false);
    const strike = choices(s, 'strike');
    expect(strike.targets).toEqual([s.sides.b.units[0]!.id]);
    expect(needsAim(strike)).toBe(false);
  });
});
