import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  ELITE_EVENTS,
  availableNodes,
  buildElite,
  chooseEvent,
  claimTrialPrize,
  enterNode,
  finishTrial,
  settleInterrupted,
  startTrial,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

/** a run standing in an elite event built from `spec` */
function eliteRun(i: number, over: Partial<RunState> = {}): RunState {
  const base = open(newRun('maren', `elite-${i}`));
  const node = availableNodes(base)[0]!;
  const run: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    ...over,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
    },
  };
  const entered = enterNode(run, node.id);
  const spec = ELITE_EVENTS[i % ELITE_EVENTS.length]!;
  const ev = buildElite(spec, entered);
  if (!ev) throw new Error(`no elite event for ${spec.id}`);
  return { ...entered, context: { ...entered.context!, event: ev } };
}

describe('elite events', () => {
  it('each offers a trial or a walk away, with up to three prizes already fixed', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const ev = eliteRun(i).context!.event!;
      expect(ev.options.map((o) => o.id)).toEqual(['trial', 'leave']);
      expect(ev.trial!.state).toBe('open');
      expect(ev.trial!.prizes.length).toBeGreaterThanOrEqual(2);
      expect(ev.trial!.prizes.length).toBeLessThanOrEqual(3);
      for (const p of ev.trial!.prizes) {
        if (p.card) expect(COMBAT_DB.cards[p.card]).toBeTruthy();
        if (p.boon) expect(COMBAT_DB.boons[p.boon]).toBeTruthy();
        if (p.potion) expect(COMBAT_DB.potions[p.potion]).toBeTruthy();
      }
    }
  });

  it('the puzzle is not a normal option: the trial must be played, and walking away costs nothing', () => {
    const r = eliteRun(0);
    expect(() => chooseEvent(r, 'trial')).toThrow(/puzzle/);
    const left = chooseEvent(r, 'leave');
    expect(left.phase).toBe('map');
    expect(left.shards).toBe(r.shards);
  });

  it('a lost trial pays the consolation and ends the event', () => {
    const r = eliteRun(1);
    const after = finishTrial(startTrial(r), false);
    expect(after.phase).toBe('map');
    expect(after.shards).toBe(r.shards + r.context!.event!.trial!.consolation);
    expect(after.eventResult).toMatch(/shards/);
  });

  it('a won trial lets you choose one prize, once, and then the event is over', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i, { potions: [] });
      // the trial has to be begun first, and is only played once
      expect(() => finishTrial(r, true)).toThrow();
      const won = finishTrial(startTrial(r), true);
      expect(won.phase).toBe('event');
      expect(won.context!.event!.trial!.state).toBe('won');
      // a prize cannot be taken before the trial is won, and the trial cannot be played twice
      expect(() => claimTrialPrize(r, 'd1')).toThrow();
      expect(() => finishTrial(won, true)).toThrow();
      const prize = won.context!.event!.trial!.prizes[0]!;
      const done = claimTrialPrize(won, prize.id);
      expect(done.phase).toBe('map');
      expect(done.eventResult?.length).toBeGreaterThan(5);
      if (prize.card) expect(done.deck).toContain(prize.card);
      if (prize.boon) expect(done.boons).toContain(prize.boon);
      if (prize.potion) expect(done.potions).toContain(prize.potion);
      expect(() => claimTrialPrize(done, prize.id)).toThrow();
      expect(() => claimTrialPrize(won, 'nope')).toThrow();
    }
  });

  it('survives being saved mid-event, both before the trial and after it is won', () => {
    const r = eliteRun(2);
    expect(parseRun(serializeRun(r))?.context?.event?.trial?.state).toBe('open');
    const won = finishTrial(startTrial(r), true);
    const back = parseRun(serializeRun(won));
    expect(back?.context?.event?.trial?.state).toBe('won');
    expect(back?.context?.event?.trial?.prizes).toEqual(won.context!.event!.trial!.prizes);
  });

  it('turn up in about one event in ten', () => {
    let elite = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const base = open(newRun('maren', `rate-${i}`));
      const node = availableNodes(base)[0]!;
      const run = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' as const } : n)),
        },
      };
      if (enterNode(clone(run), node.id).context?.event?.trial) elite++;
    }
    expect(elite / N).toBeGreaterThan(0.04);
    expect(elite / N).toBeLessThan(0.18);
  }, 60_000);
});

describe('one try only', () => {
  it('begun is begun: it is saved as begun, and cannot be begun or tried again', () => {
    const r = eliteRun(3);
    const begun = startTrial(r);
    expect(begun.context!.event!.trial!.state).toBe('playing');
    expect(() => startTrial(begun)).toThrow();
    expect(parseRun(serializeRun(begun))?.context?.event?.trial?.state).toBe('playing');
  });

  it('a run that comes back while a trial was being played counts it failed, with nothing, and moves on', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i);
      const back = parseRun(serializeRun(startTrial(r)))!;
      const { run, notice } = settleInterrupted(back);
      expect(notice).toMatch(/unfinished/);
      expect(run.phase).toBe('map');
      expect(run.context).toBeNull();
      expect(run.shards).toBe(r.shards);
      expect(run.deck).toEqual(r.deck);
      expect(run.cleared).toContain(r.context!.nodeId);
      // the same trial cannot be reached again
      expect(() => finishTrial(run, true)).toThrow();
    }
  });

  it('leaves every other run alone, including an event not yet begun and a prize not yet taken', () => {
    const r = eliteRun(0);
    expect(settleInterrupted(r).run).toBe(r);
    const won = finishTrial(startTrial(r), true);
    expect(settleInterrupted(won).run).toBe(won);
  });
});

describe('chances are recorded for the coin', () => {
  it('an event that tosses a chance leaves its flips on the run, and the next step clears them', () => {
    // the gambler's bet is an even chance
    const base = open(newRun('maren', 'flips'));
    const node = availableNodes(base)[0]!;
    const run: RunState = {
      ...base,
      shards: 100,
      map: {
        ...base.map,
        nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
      },
    };
    let found: RunState | null = null;
    for (let i = 0; i < 400 && !found; i++) {
      const e = enterNode({ ...run, seed: `f-${i}`, rng: newRun('maren', `f-${i}`).rng }, node.id);
      if (e.context?.event?.options.some((o) => o.id === 'bet')) found = e;
    }
    expect(found, 'no gambler in 400 seeds').toBeTruthy();
    const after = chooseEvent(found!, 'bet');
    expect(after.eventFlips).toHaveLength(1);
    expect(after.eventFlips![0]!.pct).toBe(50);
  });
});
