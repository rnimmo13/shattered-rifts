// The 2026-10-25 event pass (DECISIONS #227): a card of your choice, engraved keywords, fights with spoils, and bad luck.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, markOf } from '@sr/content/v2';
import {
  availableNodes,
  chooseEvent,
  duelPlan,
  enterNode,
  finishDuel,
  newRun,
  parseRun,
  pickDeckCard,
  serializeRun,
  type RunState,
} from './index';
import { TUNED_EVENTS } from './eventsTuned';

/** A run standing at the given event (on the first map node, made an event). */
function at(id: string, over: Partial<RunState> = {}): RunState {
  const base: RunState = { ...newRun('knight', `tuned-${id}`), phase: 'map', context: null };
  const node = availableNodes(base)[0]!;
  const r: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    ...over,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
    },
  };
  const entered = enterNode(r, node.id);
  const def = TUNED_EVENTS.find((e) => e.id === id)!;
  expect(def.when(entered)).toBe(true);
  return { ...entered, phase: 'event', context: { nodeId: node.id, event: def.build(entered) } };
}

describe('events that let you choose the card', () => {
  it('the smith upgrades the card you hand over', () => {
    const r = chooseEvent(at('smith'), 'd1');
    expect(r.phase).toBe('event');
    const pick = r.context!.event!.chooseDeck!;
    expect(pick.act).toBe('upgrade');
    // a run waiting for the choice is a valid save, and nothing else can be chosen meanwhile
    expect(parseRun(serializeRun(r))?.context?.event?.chooseDeck?.act).toBe('upgrade');
    expect(() => chooseEvent(r, 'leave')).toThrow();
    const card = pick.cards.find((c) => c === 'sundering-blow')!;
    const done = pickDeckCard(r, card);
    expect(done.phase).toBe('map');
    expect(done.deck).toContain('sundering-blow+');
    expect(done.deck).not.toContain('sundering-blow');
    expect(() => pickDeckCard(r, 'not-in-deck')).toThrow();
  });

  it('the engraver cuts the keyword chosen into the card chosen, for shards', () => {
    const r = chooseEvent(at('engraver'), 'd1');
    expect(r.shards).toBe(150);
    const done = pickDeckCard(r, 'strike');
    const tagged = done.deck.filter((c) => markOf(c) === 'hold');
    expect(tagged).toEqual(['hold^strike']);
    expect(COMBAT_DB.cards['hold^strike']?.retain).toBe(true);
    expect(parseRun(serializeRun(done))).not.toBeNull();
    // a tagged card is not offered to be tagged again
    const again = chooseEvent({ ...at('engraver'), deck: done.deck }, 'd2');
    expect(again.context!.event!.chooseDeck!.cards).not.toContain('hold^strike');
  });

  it('the scrapyard removes the card you leave', () => {
    const r = chooseEvent(at('scrapyard'), 'd1');
    const done = pickDeckCard(r, 'defend');
    expect(done.deck.filter((c) => c === 'defend').length).toBe(
      r.deck.filter((c) => c === 'defend').length - 1,
    );
  });
});

describe('events that become fights', () => {
  it('rushing the bandits is a fight, and winning it pays the spoils on top of the reward', () => {
    const r = chooseEvent(at('bandit-camp'), 'd1');
    expect(r.phase).toBe('duel');
    const node = r.map.nodes.find((n) => n.id === r.context?.nodeId)!;
    expect(node.kind).toBe('duel');
    expect(node.bonus?.length).toBeGreaterThan(0);
    expect(duelPlan(r)).not.toBeNull();
    expect(parseRun(serializeRun(r))?.phase).toBe('duel');
    const before = r.shards;
    const won = finishDuel(r, true, r.hp);
    expect(won.phase).toBe('reward');
    expect(won.shards).toBeGreaterThanOrEqual(before + 140);
    expect(won.eventResult).toMatch(/spoils/i);
    expect(won.map.nodes.find((n) => n.id === node.id)?.bonus).toBeUndefined();
  });

  it("a guarded hoard's Boon is named when the fight starts and given when it is won", () => {
    const r0 = at('guarded-hoard');
    const offered = r0.context!.event!.boonOffer!;
    const r = chooseEvent(r0, 'd1');
    const node = r.map.nodes.find((n) => n.id === r.context?.nodeId)!;
    expect(node.kind).toBe('elite');
    expect(node.bonus).toContainEqual({ k: 'boonOf', id: offered });
    const won = finishDuel(r, true, r.hp);
    expect(won.boons).toContain(offered);
    // the spoils are the only Boon: an event's Elite does not add the usual Elite Boon
    expect(won.boons).toHaveLength(r0.boons.length + 1);
  });
});

describe('bad luck', () => {
  it('a bad event has no walking away: every option costs something', () => {
    for (const id of ['rift-storm', 'pickpockets', 'cave-in', 'cursed-coin']) {
      const ev = at(id).context!.event!;
      expect(ev.options.some((o) => o.id === 'leave')).toBe(false);
    }
    const storm = chooseEvent(at('rift-storm'), 'd1');
    expect(storm.hp).toBeLessThan(60);
  });
});

describe('a random removal names its card (DECISIONS #233)', () => {
  it('every option that takes a card at random says which, and takes exactly that one', async () => {
    const { EVENTS } = await import('./events');
    const { COMBAT_DB: db } = await import('@sr/content/v2');
    const base: RunState = {
      ...newRun('knight', 'named-removal'),
      phase: 'map',
      context: null,
      shards: 400,
      hp: 60,
      potions: ['fire-flask'],
      boons: ['iron-sigil'],
    };
    const run: RunState = {
      ...base,
      deck: [...base.deck, 'wound', 'dawn-smite', 'field-repairs+'],
    };
    let seen = 0;
    for (const def of EVENTS) {
      const ev = def.build(JSON.parse(JSON.stringify(run)) as RunState);
      for (const o of ev.options) {
        const removals = (o.deal ?? []).flatMap((s) =>
          s.k === 'remove'
            ? [s]
            : s.k === 'chance'
              ? [...s.win, ...s.lose].filter((x) => x.k === 'remove')
              : [],
        );
        if (!removals.length) continue;
        seen++;
        expect(o.label, `${def.id}/${o.id}`).not.toMatch(
          // (the removal itself is named: "random" may still describe something else, like upgrades)
          /random (basic )?cards? leaves?\b|random (Strike|Attack) or Defend goes|lose a card\b/i,
        );
        for (const s of removals) {
          if (s.k !== 'remove') continue;
          expect(s.ids?.length, `${def.id}/${o.id} pinned`).toBe(s.n);
          for (const id of s.ids ?? []) expect(o.label).toContain(db.cards[id]!.name);
        }
      }
      if (def.id === 'bonfire') {
        const name = db.cards[ev.cardOffer]!.name;
        expect(ev.options[0]!.label).toContain(name);
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it('the card named is the card that goes', () => {
    const r0 = at('cave-in');
    const o = r0.context!.event!.options.find((x) => x.id === 'd2')!;
    const step = o.deal!.find((s) => s.k === 'remove')!;
    const named = step.k === 'remove' ? step.ids![0]! : '';
    const after = chooseEvent(r0, 'd2');
    expect(after.deck.filter((c) => c === named).length).toBe(
      r0.deck.filter((c) => c === named).length - 1,
    );
  });
});
