import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyAction, createCombat, legalActions, clone, cardText } from '@sr/combat';
import {
  COMBAT_DB,
  RIFTWALKERS,
  canRoll,
  lendLegendaries,
  rolledId,
  rollOf,
  stripRoll,
} from '@sr/content/v2';
import {
  availableNodes,
  canAdd,
  chooseEvent,
  enterNode,
  newRun,
  parseRun,
  pickDeckCard,
  serializeRun,
  buyRemoval,
  removableCards,
  takeShrine,
  type RunState,
} from './index';
import { EVENTS, resolveEvent } from './events';
import type { DealStep } from './types';

// Legendary is put away (DECISIONS #363): the shelved cards are lent as Legendaries so the reliquary and the copy limit stay tested
let undo = (): void => {};
beforeAll(() => {
  undo = lendLegendaries(COMBAT_DB);
});
afterAll(() => undo());

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

function eventRun(seed: string, over: Partial<RunState> = {}): RunState {
  const kind = 'event';
  const base = open(newRun('knight', seed));
  const node = availableNodes(base)[0]!;
  const asEvent: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    ...over,
    map: { ...base.map, nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind } : n)) },
  };
  return enterNode(asEvent, node.id);
}

/** events that only happen in a certain state of the run need that state set up to be tried */
const SETUP: Record<string, Partial<RunState>> = {
  'tithe-stone': { boons: ['iron-sigil'] },
  'treasure-dig': { marks: ['map'] },
  'dying-lamp': { hp: 20 },
  tollkeeper: { shards: 400 },
  'deep-spring': { stage: 2, potions: ['healing-philtre'] },
  'class-shrine': { stage: 2 },
  'potion-trade': { potions: ['healing-philtre', 'healing-philtre'] },
  'legend-reliquary': {
    deck: [...RIFTWALKERS.knight.starter, 'oath-of-iron', 'foundry-awakens+'],
  },
  // the trades (DECISIONS #256) name cards of your own class: two common Attacks, two common Skills, a rare, a card off the build
  // path the deck follows, an uncommon and the shards to step it up
  smelter: { deck: [...RIFTWALKERS.knight.starter, 'bulwark-blow', 'twin-cut'] },
  'binders-table': { deck: [...RIFTWALKERS.knight.starter, 'oath-of-iron', 'field-repairs'] },
  'the-fence': { deck: [...RIFTWALKERS.knight.starter, 'bastion-engine'] },
  'the-specialist': {
    deck: [
      ...RIFTWALKERS.knight.starter,
      'oath-of-iron',
      'cold-stare',
      'bulwark-blow',
      'field-repairs',
    ],
  },
  'step-up': { deck: [...RIFTWALKERS.knight.starter, 'rising-fist'], shards: 100 },
};

describe('events', () => {
  it('there are ninety-four of them, each with its own id', () => {
    expect(EVENTS.length).toBe(94);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(94);
  });

  it('are varied and random, and a card is on offer only now and then', () => {
    const titles = new Map<string, number>();
    let withCard = 0;
    const N = 600;
    for (let i = 0; i < N; i++) {
      const ev = eventRun(`ev-${i}`).context!.event!;
      titles.set(ev.title, (titles.get(ev.title) ?? 0) + 1);
      if (ev.options.some((o) => o.id === 'card' || o.id === 'ancestor')) withCard++;
    }
    expect(titles.size).toBeGreaterThanOrEqual(9);
    // no single event takes over
    expect(Math.max(...titles.values()) / N).toBeLessThan(0.3);
    expect(withCard / N).toBeLessThan(0.3);
    expect(withCard).toBeGreaterThan(0);
    // (600 whole runs are built here; the longer maps made this slow enough to need room on a busy machine)
  }, 60_000);

  it('every option of every event resolves, says what happened, and leaves a sane run', () => {
    for (const def of EVENTS) {
      // (The specialist needs a main build path, and build paths are hidden for now, DECISIONS #365)
      if (def.id === 'the-specialist') continue;
      const first = eventRun(`def-${def.id}`);
      // a deck with one non-basic card in it, so every event has something to work with
      const base: RunState = {
        ...first,
        deck: [...first.deck, 'cold-stare'],
        ...(SETUP[def.id] ?? {}),
      };
      expect(def.when(base), def.id).toBe(true);
      const ev = def.build(base);
      expect(ev.options.length, def.id).toBeGreaterThanOrEqual(2);
      for (const o of ev.options) {
        const r = clone(base);
        const msg = resolveEvent(r, o.id, ev, {
          gainBoon: (run, id) => void run.boons.push(id),
          fail: (m) => {
            throw new Error(`${def.id}/${o.id}: ${m}`);
          },
        });
        expect(msg.length, `${def.id}/${o.id}`).toBeGreaterThan(5);
        expect(r.hp).toBeGreaterThanOrEqual(1);
        expect(r.shards).toBeGreaterThanOrEqual(0);
        for (const id of r.deck)
          expect(COMBAT_DB.cards[id], `${def.id}/${o.id} ${id}`).toBeTruthy();
      }
    }
  }, 20_000);

  it('and the result is shown through the run (eventResult)', () => {
    const e = eventRun('result-1');
    // (a bad-luck event has no walking away: take its first option)
    const opt =
      e.context!.event!.options.find((o) => o.id === 'leave') ?? e.context!.event!.options[0]!;
    let left = chooseEvent(e, opt.id);
    const deckPick = left.context?.event?.chooseDeck;
    if (deckPick) left = pickDeckCard(left, deckPick.cards[0]!);
    expect(left.eventResult).toBeTruthy();
    expect(['map', 'duel']).toContain(left.phase);
  });
});

describe('a sanctified card can be removed (DECISIONS #233)', () => {
  /** a run holding one sanctified card, standing at a Shrine */
  const withOne = (): RunState => {
    const base = open(newRun('knight', 'sanct-goes'));
    const deck = [...base.deck];
    const at = deck.findIndex((id) => canRoll(COMBAT_DB.cards[id]!));
    deck[at] = rolledId(deck[at]!, 1);
    return { ...base, deck, shards: 500 };
  };

  it('at a Shrine, at the merchant, and by any event that lets a card go', () => {
    const r = withOne();
    const rolled = r.deck.find((id) => rollOf(id) !== 0)!;
    expect(removableCards(r.deck)).toContain(rolled);
    const shrine: RunState = { ...r, phase: 'shrine', context: { nodeId: r.map.nodes[0]!.id } };
    expect(takeShrine(shrine, { kind: 'remove', card: rolled }).deck).not.toContain(rolled);
    const shop: RunState = {
      ...r,
      phase: 'merchant',
      context: {
        nodeId: r.map.nodes[0]!.id,
        merchant: { items: [], removed: false, removePrice: 50 },
      },
    };
    expect(buyRemoval(shop, rolled).deck).not.toContain(rolled);
  });
});

describe('the Sanctum happens once', () => {
  it('is not offered again to a deck that has been sanctified, and refuses if forced', () => {
    for (let i = 0; i < 300; i++) {
      const e = eventRun(`once-${i}`);
      if (!e.context!.event!.options.some((o) => o.id === 'sanctify')) continue;
      const done = chooseEvent(e, 'sanctify');
      expect(done.sanctified).toBe(true);
      // the same deck met in another event never gets the offer
      for (let j = 0; j < 150; j++)
        expect(
          eventRun(`again-${i}-${j}`, {
            deck: done.deck,
            sanctified: true,
          }).context!.event!.options.some((o) => o.id === 'sanctify'),
        ).toBe(false);
      // and even a run that kept no rolled card (all untouched) is not offered it twice
      expect(
        eventRun(`flag-${i}`, { sanctified: true }).context!.event!.options.some(
          (o) => o.id === 'sanctify',
        ),
      ).toBe(false);
      return;
    }
    throw new Error('no Sanctum event in 300 seeds');
  }, 60_000);
});

describe('sanctifying the deck', () => {
  const sanctified = (): RunState => {
    for (let i = 0; i < 2000; i++) {
      const e = eventRun(`sanct-${i}`);
      if (e.context!.event!.options.some((o) => o.id === 'sanctify'))
        return chooseEvent(e, 'sanctify');
    }
    throw new Error('no Sanctum event in 2000 seeds');
  };

  it('rolls every card that has numbers 25% up or down, about half each, and keeps the rest', () => {
    const before = open(newRun('knight', 'sanct-base')).deck.length;
    const r = sanctified();
    expect(r.deck).toHaveLength(before);
    const up = r.deck.filter((id) => rollOf(id) === 1).length;
    const down = r.deck.filter((id) => rollOf(id) === -1).length;
    // each card has a one-in-five chance of being left alone, so a few untouched cards are normal
    expect(up + down).toBeGreaterThanOrEqual(before - 4);
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
    expect(r.eventResult).toMatch(/rise/);
  }, 30_000); // (rolls every card in the game: slow, and slower as the card list grows)

  it('a rolled card is the same card with its numbers scaled, and is never listed as a card of its own', () => {
    const base = COMBAT_DB.cards['strike']!;
    const hi = COMBAT_DB.cards['hi~strike']!;
    const lo = COMBAT_DB.cards['lo~strike']!;
    const dmg = (c: typeof base): number => (c.effects[0] as { amount: number }).amount;
    expect(dmg(hi)).toBeGreaterThan(dmg(base));
    expect(dmg(lo)).toBeLessThan(dmg(base));
    expect(hi.name).toContain('↑');
    expect(lo.name).toContain('↓');
    expect(cardText(COMBAT_DB, hi)).not.toBe(cardText(COMBAT_DB, base));
    expect(Object.keys(COMBAT_DB.cards).some((k) => k.includes('~'))).toBe(false);
    expect(COMBAT_DB.cards['hi~no-such-card']).toBeUndefined();
    expect(COMBAT_DB.cards['hi~draw-only-card']).toBeUndefined();
  });

  it('plays for real, saves and loads, shares one copy limit with its plain card, and upgrades as itself', () => {
    const { state } = createCombat(COMBAT_DB, {
      seed: 's',
      a: { hero: 'knight', deck: ['hi~strike', 'lo~strike', ...RIFTWALKERS.knight.starter] },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    s.sides.a.hand = [
      { id: 'H', card: 'hi~strike' },
      { id: 'L', card: 'lo~strike' },
    ];
    const foe = s.sides.b.units[0]!;
    foe.hp = foe.maxHp = 100;
    const play = (st: typeof s, id: string) =>
      applyAction(
        COMBAT_DB,
        st,
        legalActions(COMBAT_DB, st).find((a) => a.type === 'play' && a.card === id)!,
      ).state;
    const after = play(play(s, 'H'), 'L');
    const dealt = 100 - after.sides.b.units[0]!.hp;
    // the rolled cards deal their own, scaled, damage
    expect(dealt).toBe(
      (COMBAT_DB.cards['hi~strike']!.effects[0] as { amount: number }).amount +
        (COMBAT_DB.cards['lo~strike']!.effects[0] as { amount: number }).amount,
    );
    const run = sanctified();
    // (card luck is gone, DECISIONS #269: a save that still carries it loads, and drops it)
    const lucky = parseRun(JSON.stringify({ ...JSON.parse(serializeRun(run)), luck: 'blessed' }));
    expect(lucky).not.toBeNull();
    expect(lucky && 'luck' in lucky).toBe(false);
    const back = parseRun(serializeRun(run));
    expect(back?.deck).toEqual(run.deck);
    // one copy limit is shared with the plain card and the upgraded one
    const rare = Object.values(COMBAT_DB.cards).find(
      (c) => c.rarity === 'legendary' && c.hero === 'engineer',
    )!;
    expect(canAdd([`hi~${rare.id}`], rare.id)).toBe(false);
    expect(stripRoll(`lo~${rare.id}+`)).toBe(`${rare.id}+`);
    // the shrine upgrades a rolled card into the rolled upgrade
    const shrine: RunState = {
      ...open(newRun('knight', 'shr')),
      phase: 'shrine',
      context: { nodeId: 'x' },
      deck: [...RIFTWALKERS.knight.starter, 'hi~strike'],
    };
    const up = takeShrine(
      { ...shrine, map: { ...shrine.map } },
      { kind: 'upgrade', card: 'hi~strike' },
    );
    expect(up.deck).toContain('hi~strike+');
  }, 30_000);
});

describe('the data-driven events', () => {
  const helpers = {
    gainBoon: (run: RunState, id: string): void => void run.boons.push(id),
    fail: (m: string): never => {
      throw new Error(m);
    },
  };
  const ctxOf = (r: RunState) => r.context!.event!;

  it('there are about fifty events, each with its own id', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });

  it('every option of every event can be taken from many different runs, and leaves a sane run', () => {
    const states: Partial<RunState>[] = [
      { hp: 60, shards: 200 },
      { hp: 12, shards: 10 },
      { hp: 30, shards: 0 },
      { hp: 66, shards: 500, potions: ['fire-flask', 'fire-flask', 'fire-flask'] },
      { hp: 25, shards: 60, boons: Object.keys(COMBAT_DB.boons) },
    ];
    for (let i = 0; i < 120; i++) {
      const s = states[i % states.length]!;
      const r0 = eventRun(`stress-${i}`, s);
      const ev = ctxOf(r0);
      for (const o of ev.options) {
        if (o.id === 'trial') continue; // (a puzzle: see trials.test.ts)
        const r = clone(r0);
        const msg = resolveEvent(r, o.id, ev, helpers);
        expect(msg.length, `${ev.title}/${o.id}`).toBeGreaterThan(3);
        expect(r.hp, `${ev.title}/${o.id} hp`).toBeGreaterThanOrEqual(1);
        expect(r.hp).toBeLessThanOrEqual(r.maxHp);
        expect(r.shards, `${ev.title}/${o.id} shards`).toBeGreaterThanOrEqual(0);
        expect(r.maxHp).toBeGreaterThanOrEqual(30);
        expect(r.potions.length).toBeLessThanOrEqual(3);
        for (const id of r.deck) expect(COMBAT_DB.cards[id], `${ev.title} ${id}`).toBeTruthy();
      }
    }
  }, 20_000);

  it('an event is not offered when its price cannot be paid', () => {
    const poor: RunState = { ...eventRun('poor-1'), hp: 5, shards: 0 };
    const ferry = EVENTS.find((e) => e.id === 'ferry')!;
    expect(ferry.when(poor)).toBe(false); // the fare is 30 shards and the wade costs 8 HP
    expect(ferry.when({ ...poor, hp: 60, shards: 40 })).toBe(true);
    const beggar = EVENTS.find((e) => e.id === 'beggar')!;
    expect(beggar.when({ ...poor, shards: 40 })).toBe(false); // the big gift needs 60
    // a Boon event needs a Boon left to give
    const reliquary = EVENTS.find((e) => e.id === 'reliquary')!;
    const allOwned = { ...eventRun('boons'), boons: Object.keys(COMBAT_DB.boons) };
    expect(reliquary.when(allOwned)).toBe(false);
  });

  it('the steps do what they say', () => {
    const base = { ...eventRun('steps-1'), hp: 40, shards: 100, potions: [] as string[] };
    const run = (...deal: DealStep[]): RunState => {
      const r = clone(base);
      const ev = { title: 't', text: 't', cardOffer: '', options: [] };
      const o = { id: 'd1' as const, label: 'x', deal };
      resolveEvent(r, 'd1', { ...ev, options: [o] }, helpers);
      return r;
    };
    expect(run({ k: 'shards', n: -30 }).shards).toBe(70);
    expect(run({ k: 'hurt', n: 10 }).hp).toBe(30);
    expect(run({ k: 'maxHp', n: 5 }).maxHp).toBe(base.maxHp + 5);
    expect(run({ k: 'maxHp', n: -5 }).maxHp).toBe(base.maxHp - 5);
    expect(run({ k: 'wound', n: 2 }).deck.filter((c) => c === 'wound').length).toBe(2);
    expect(run({ k: 'potion', n: 2 }).potions.length).toBe(2);
    expect(run({ k: 'remove', of: 'basic', n: 2 }).deck.length).toBe(base.deck.length - 2);
    expect(run({ k: 'gift', rarity: 'common' }).deck.length).toBe(base.deck.length + 1);
    expect(() => run({ k: 'hurt', n: 40 })).toThrow();
    expect(() => run({ k: 'shards', n: -500 })).toThrow();
    // a chance runs one branch
    const lucky = run({
      k: 'chance',
      pct: 100,
      win: [{ k: 'shards', n: 7 }],
      lose: [{ k: 'hurt', n: 1 }],
    });
    expect(lucky.shards).toBe(107);
    expect(lucky.hp).toBe(40);
  });
});

describe('Rift-crossed and sacrifice events', () => {
  const helpers = {
    gainBoon: (run: RunState, id: string) => void run.boons.push(id),
    fail: (m: string): never => {
      throw new Error(m);
    },
  };
  const base = (): RunState => ({
    ...eventRun('crossed-steps'),
    hp: 40,
    shards: 100,
    deck: [...eventRun('crossed-steps').deck, 'cold-stare'],
  });
  const run = (r: RunState, ...deal: DealStep[]): RunState => {
    const c = clone(r);
    const o = { id: 'd1' as const, label: 'x', deal };
    resolveEvent(c, 'd1', { title: 't', text: 't', cardOffer: '', options: [o] }, helpers);
    return c;
  };

  it('a crossed card comes from another Riftwalker, and an exchange keeps the rarity', () => {
    const b = base();
    const got = run(b, { k: 'crossed', rarity: 'rare' }).deck.at(-1)!;
    expect(COMBAT_DB.cards[got]!.hero).not.toBe('knight');
    expect(COMBAT_DB.cards[got]!.rarity).toBe('rare');
    const swapped = run(b, { k: 'exchange' });
    expect(swapped.deck).toHaveLength(b.deck.length);
    expect(swapped.deck).not.toContain('cold-stare');
    expect(COMBAT_DB.cards[swapped.deck.at(-1) ?? '']?.hero).not.toBe('knight');
  });

  it('giving up a Boon, a potion or a flag works, and refuses when there is nothing to give', () => {
    const b = { ...base(), boons: ['iron-sigil'], potions: ['healing-philtre'] };
    expect(run(b, { k: 'loseBoon' }).boons).toEqual([]);
    expect(run(b, { k: 'losePotion', n: 1 }).potions).toEqual([]);
    expect(() => run(b, { k: 'losePotion', n: 2 })).toThrow();
    expect(() => run({ ...b, boons: [] }, { k: 'loseBoon' })).toThrow();
    const marked = run(b, { k: 'mark', id: 'map' });
    expect(marked.marks).toEqual(['map']);
    expect(run(marked, { k: 'mark', id: 'map', off: true }).marks).toEqual([]);
  });

  it('a table of three shows three different crossed cards, and each can be taken', () => {
    const open = EVENTS.find((e) => e.id === 'open-rift')!;
    const b = base();
    const ev = open.build(b);
    expect(ev.cardOffers).toHaveLength(3);
    expect(new Set(ev.cardOffers).size).toBe(3);
    const first = ev.options[0]!;
    const after = clone(b);
    resolveEvent(after, first.id, ev, helpers);
    expect(after.deck).toContain(ev.cardOffers![0]);
    expect(after.hp).toBe(b.hp - 8);
  });

  it('the map is a promise: only a run holding it is offered the dig, and the dig clears it', () => {
    const dig = EVENTS.find((e) => e.id === 'treasure-dig')!;
    const keep = EVENTS.find((e) => e.id === 'buried-map')!;
    const b = base();
    expect(dig.when(b)).toBe(false);
    expect(keep.when(b)).toBe(true);
    const held = run(b, { k: 'mark', id: 'map' });
    expect(dig.when(held)).toBe(true);
    expect(keep.when(held)).toBe(false);
    const ev = dig.build(held);
    const after = clone(held);
    resolveEvent(after, ev.options[0]!.id, ev, helpers);
    expect(after.marks).toEqual([]);
  });
});

describe('letting a card go', () => {
  /** does this option take a card out of the deck on purpose (a removal the player chooses, not a loss)? */
  const removes = (steps: DealStep[]): boolean =>
    steps.some(
      (s) =>
        (s.k === 'remove' && s.of !== 'any') ||
        (s.k === 'choose' && s.act === 'remove') ||
        (s.k === 'chance' && (removes(s.win) || removes(s.lose))),
    );

  it('a good share of the ordinary events offer to let a basic card (or a Wound) go', () => {
    const base = eventRun('removal-share');
    let withRemoval = 0;
    let total = 0;
    for (const def of EVENTS) {
      const ev = def.build({ ...base, shards: 500, hp: 80 });
      total += def.weight;
      // (the hand-written one: the bonfire)
      const handWritten = ['bonfire'].includes(def.id);
      if (handWritten || ev.options.some((o) => o.deal && removes(o.deal)))
        withRemoval += def.weight;
    }
    // (25%: since #227 several of these let you choose the card, which thins a deck better than a random Strike or Defend)
    expect(withRemoval / total).toBeGreaterThan(0.25);
  });

  it('an option that lets a card go is left off, not the whole event, when there is no basic card to give', () => {
    const base = eventRun('removal-none');
    // a deck of nothing but the Riftwalker's own cards: no plain Strike or Defend left
    const own = base.deck.filter((id) => COMBAT_DB.cards[id]?.hero !== 'neutral');
    const bare: RunState = {
      ...base,
      deck: Array.from({ length: 10 }, (_, i) => own[i % own.length] as string),
      shards: 500,
      hp: 80,
    };
    const ferry = EVENTS.find((e) => e.id === 'ferry')!;
    expect(ferry.when(bare)).toBe(true);
    const ev = ferry.build(bare);
    expect(ev.options.filter((o) => o.deal && removes(o.deal))).toHaveLength(0);
    expect(ev.options.length).toBeGreaterThanOrEqual(2);
    // and with a basic card in the deck, it is there
    const ok = ferry.build({ ...bare, deck: [...bare.deck, 'strike'] });
    expect(ok.options.some((o) => o.deal && removes(o.deal))).toBe(true);
  });
});
