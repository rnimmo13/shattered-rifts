import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  GHOST_FROM_TIER,
  GHOST_WARDEN_CHANCE,
  attachGhost,
  checkGhostBoss,
  duelPlan,
  finishDuel,
  generateStageMap,
  ghostBossHp,
  ghostWanted,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';

/** a run standing at a Warden that is (or is not) a ghost, on Rift Tier `tier` */
function atWarden(tier: number, ghost: boolean): RunState {
  const base = newRun('knight', 'ghost-boss');
  for (let i = 0; i < 4000; i++) {
    const map = generateStageMap(
      seedRng(`gb-${tier}-${i}`),
      1,
      'aurelion',
      'knight',
      undefined,
      tier,
    );
    const w = map.nodes.find((n) => n.kind === 'warden')!;
    if (!!w.ghost !== ghost) continue;
    return { ...base, tier, map, phase: 'duel', context: { nodeId: w.id } };
  }
  throw new Error('no such map');
}

const entry = {
  name: 'Rob',
  hero: 'trapper',
  deck: [...RIFTWALKERS.trapper.starter],
  boons: ['iron-sigil'],
  tier: 5,
  stage: 2,
};

describe('Wardens that are ghosts', () => {
  it('never before Rift Tier 4, and about a third of the time after', () => {
    for (let tier = 1; tier <= GHOST_FROM_TIER; tier++)
      for (let i = 0; i < 150; i++) {
        const map = generateStageMap(
          seedRng(`early-${tier}-${i}`),
          1,
          'aurelion',
          'knight',
          undefined,
          tier,
        );
        expect(map.nodes.some((n) => n.ghost)).toBe(false);
      }
    let ghosts = 0;
    const N = 800;
    for (let i = 0; i < N; i++) {
      const map = generateStageMap(seedRng(`late-${i}`), 1, 'aurelion', 'knight', undefined, 6);
      if (map.nodes.find((n) => n.kind === 'warden')!.ghost) ghosts++;
    }
    expect(ghosts / N).toBeGreaterThan(GHOST_WARDEN_CHANCE / 100 - 0.07);
    expect(ghosts / N).toBeLessThan(GHOST_WARDEN_CHANCE / 100 + 0.07);
  });

  it('keeps the usual Warden as the fallback, and only a Warden is ever a ghost', () => {
    const map = generateStageMap(seedRng('fallback'), 1, 'aurelion', 'knight', undefined, 7);
    for (const n of map.nodes) if (n.ghost) expect(n.kind).toBe('warden');
    const w = atWarden(5, true);
    const node = w.map.nodes.find((n) => n.id === w.context!.nodeId)!;
    expect(node.enemyId).toBeTruthy();
  });

  it('asks for a ghost once, fights it when it comes, and fights the usual Warden when none does', () => {
    const run = atWarden(5, true);
    expect(ghostWanted(run)).toBe(true);
    expect(duelPlan(run)!.ghost).toBeUndefined();
    const withGhost = attachGhost(run, entry);
    expect(ghostWanted(withGhost)).toBe(false);
    const plan = duelPlan(withGhost)!;
    expect(plan.ghost?.hero).toBe('trapper');
    expect(plan.ghost?.name).toBe('Rob');
    expect(plan.ghost?.hp).toBe(ghostBossHp('trapper', 5));
    expect(plan.kind).toBe('warden');
    // the player is told plainly that this Warden is a ghost deck, and whose
    expect(withGhost.eventResult).toMatch(/^Ghost Warden! .*Rob's Trapper deck from the Arena/);
    // none came: the usual Warden, and it is not asked for again (and nothing says ghost)
    const none = attachGhost(run, null);
    expect(ghostWanted(none)).toBe(false);
    expect(none.eventResult ?? '').not.toMatch(/Ghost/);
    expect(duelPlan(none)!.ghost).toBeUndefined();
    expect(() => attachGhost(withGhost, entry)).toThrow();
    // a ghost the server named is remembered, so the run never meets it again; one below Tier 3 is not a Warden at all
    expect(attachGhost(run, { ...entry, id: 'ghost-1' }).ghostsMet).toEqual(['ghost-1']);
    expect(duelPlan(attachGhost(run, { ...entry, tier: 2 }))!.ghost).toBeUndefined();
    // a Warden that is not a ghost never asks
    expect(ghostWanted(atWarden(5, false))).toBe(false);
  });

  it('is the same ghost after a lost fight and after a reload', () => {
    const run = attachGhost(atWarden(5, true), entry);
    const lost = finishDuel({ ...run, resolve: 5, maxResolve: 5 }, false);
    expect(lost.phase).toBe('duel');
    expect(duelPlan(lost)!.ghost?.name).toBe('Rob');
    const back = parseRun(serializeRun(run))!;
    expect(duelPlan(back)!.ghost?.deck).toEqual(entry.deck);
    expect(ghostWanted(back)).toBe(false);
  });

  it('does not believe everything the network says', () => {
    expect(checkGhostBoss(entry)).not.toBeNull();
    expect(checkGhostBoss({ ...entry, hero: 'nobody' })).toBeNull();
    expect(checkGhostBoss({ ...entry, deck: ['no-such-card', ...entry.deck] })).toBeNull();
    expect(checkGhostBoss({ ...entry, deck: entry.deck.slice(0, 3) })).toBeNull();
    expect(checkGhostBoss({ ...entry, boons: ['no-such-boon'] })).toBeNull();
    expect(checkGhostBoss(null)).toBeNull();
    expect(checkGhostBoss('trapper')).toBeNull();
    // a bad ghost is turned away and the usual Warden is fought
    const run = atWarden(5, true);
    const after = attachGhost(run, { ...entry, hero: 'nobody' });
    expect(duelPlan(after)!.ghost).toBeUndefined();
    expect(ghostWanted(after)).toBe(false);
  });

  it('has more HP than its Riftwalker does, and more with each Rift Tier', () => {
    const base = RIFTWALKERS.trapper.hero.maxHp;
    expect(ghostBossHp('trapper', 4)).toBeGreaterThan(base);
    expect(ghostBossHp('trapper', 12)).toBeGreaterThan(ghostBossHp('trapper', 4));
  });
});
