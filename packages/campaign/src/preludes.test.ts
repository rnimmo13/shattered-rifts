import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, type HeroId } from '@sr/content/v2';
import {
  RunError,
  chooseKit,
  choosePrelude,
  continueLoop,
  makePrelude,
  newRun,
  nextStage,
  parseRun,
  serializeRun,
  type PreludeEffect,
  type RunState,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

/** A run standing at a prelude whose only option is `effects`. */
function offering(effects: PreludeEffect[], hero: HeroId = 'maren'): RunState {
  const r = newRun(hero, 'prelude-test', 'normal');
  return {
    ...r,
    phase: 'prelude',
    context: {
      nodeId: '',
      prelude: {
        kind: 'threshold',
        title: 't',
        text: 't',
        options: [{ id: 'x', name: 'x', text: 'x', effects }],
      },
    },
  };
}
const take = (r: RunState): RunState => choosePrelude(r, 'x');

describe('what a choice did is told', () => {
  it('names the card that was upgraded, and the card that was added', () => {
    const up = take(offering([{ k: 'upgrade', n: 2 }]));
    expect(up.eventResult).toMatch(/ and .* are upgraded\.$/);
    const card = take(offering([{ k: 'card', rarity: 'common' }]));
    expect(card.eventResult).toMatch(/ joins your deck\.$/);
    // a choice with nothing left to chance says nothing extra
    expect(take(offering([{ k: 'shards', n: 50 }])).eventResult).toBeUndefined();
  });

  it('every offered line reads as a full sentence about the deck', () => {
    for (let i = 0; i < 20; i++)
      for (const o of makePrelude(seedRng(`wording-${i}`), 'threshold', 1, 'aurelion').options)
        for (const part of o.text.split('. ')) expect(part, o.id).not.toMatch(/^(A|An) random/);
  });
});

describe('the choice at the start of a run', () => {
  it('after the starting deck, every run meets The Threshold: three blessings and one bargain', () => {
    for (const h of HEROES) {
      const r0 = newRun(h, `thr-${h}`, 'normal');
      expect(r0.phase).toBe('kit');
      const r = chooseKit(r0, 'a');
      expect(r.phase).toBe('prelude');
      const offer = r.context?.prelude;
      expect(offer?.kind).toBe('threshold');
      expect(offer?.options).toHaveLength(4);
      expect(offer?.options.filter((o) => o.risky)).toHaveLength(1);
      expect(new Set(offer?.options.map((o) => o.id)).size).toBe(4);
      for (const o of offer?.options ?? []) expect(o.text.length).toBeGreaterThan(5);
    }
  });

  it('is the same offer for the same seed, and varies between seeds', () => {
    const ids = (s: string) =>
      chooseKit(newRun('maren', s, 'normal'), 'a')
        .context?.prelude?.options.map((o) => o.id)
        .join();
    expect(ids('same')).toBe(ids('same'));
    expect(new Set(Array.from({ length: 30 }, (_, i) => ids(`v${i}`))).size).toBeGreaterThan(5);
  });

  it('taking an option applies it and opens the map', () => {
    const r = chooseKit(newRun('maren', 'take', 'normal'), 'a');
    const pick = r.context?.prelude?.options[0]?.id as string;
    const after = choosePrelude(r, pick);
    expect(after.phase).toBe('map');
    expect(after.context).toBeNull();
    expect(r.phase).toBe('prelude'); // the input is never changed
  });

  it('refuses anything that is not on offer', () => {
    const r = chooseKit(newRun('maren', 'bad', 'normal'), 'a');
    expect(() => choosePrelude(r, 'nope')).toThrow(RunError);
    expect(() => choosePrelude({ ...r, phase: 'map', context: null }, 'x')).toThrow(RunError);
  });

  it('a new stage and a new loop open a Waymark with a rest, blessings, and sometimes a bargain', () => {
    const base = {
      ...newRun('maren', 'waymark', 'normal'),
      phase: 'stageClear' as const,
      context: null,
    };
    const next = nextStage(base);
    expect(next.phase).toBe('prelude');
    expect(next.context?.prelude?.kind).toBe('stage');
    expect(next.context?.prelude?.options[0]?.id).toBe('rest');
    expect(next.context?.prelude?.title).toContain('Waymark');
    const loop = continueLoop({ ...base, phase: 'loopCleared' });
    expect(loop.phase).toBe('prelude');
    expect(loop.stage).toBe(1);
    // over many seeds a bargain shows up sometimes but not always
    const withBargain = Array.from({ length: 40 }, (_, i) =>
      makePrelude(seedRng(`w${i}`), 'stage', 2, 'nexus').options.some((o) => o.risky),
    );
    expect(withBargain.some(Boolean)).toBe(true);
    expect(withBargain.every(Boolean)).toBe(false);
  });
});

describe('what each effect does', () => {
  it('max HP, healing, losing HP (never to 0), shards and Resolve', () => {
    const base = offering([{ k: 'maxHp', n: 8 }]);
    const a = take(base);
    expect(a.maxHp).toBe(base.maxHp + 8);
    expect(a.hp).toBe(base.hp + 8);
    const lost = take(offering([{ k: 'maxHp', n: -8 }]));
    expect(lost.maxHp).toBe(base.maxHp - 8);
    expect(lost.hp).toBe(lost.maxHp);
    const hurt = take({ ...offering([{ k: 'hp', n: 9999 }]), hp: 20 });
    expect(hurt.hp).toBe(1);
    const healed = take({ ...offering([{ k: 'heal', pct: 30 }]), hp: 10 });
    expect(healed.hp).toBe(10 + Math.ceil(base.maxHp * 0.3));
    expect(take(offering([{ k: 'shards', n: 90 }])).shards).toBe(base.shards + 90);
    const low = { ...offering([{ k: 'resolve', n: 2 }]), resolve: 1 };
    expect(take(low).resolve).toBe(2);
  });

  it('cards come from your own pool at the rarity promised', () => {
    for (const h of HEROES) {
      for (const rarity of ['common', 'uncommon', 'rare'] as const) {
        const before = offering([{ k: 'card', rarity }], h);
        const after = take(before);
        expect(after.deck).toHaveLength(before.deck.length + 1);
        const got = COMBAT_DB.cards[after.deck[after.deck.length - 1] as string];
        expect(got?.rarity).toBe(rarity);
        expect(['neutral', h]).toContain(got?.hero);
      }
    }
  });

  it('upgrades change cards to their "+" version', () => {
    const before = offering([{ k: 'upgrade', n: 2 }]);
    const after = take(before);
    expect(after.deck.filter((c) => c.endsWith('+')).length).toBe(2);
    expect(after.deck).toHaveLength(before.deck.length);
  });

  it('removal only takes plain Attack/Defend cards and never drops the deck below the minimum', () => {
    const before = offering([{ k: 'remove', n: 2 }]);
    const after = take(before);
    expect(after.deck).toHaveLength(before.deck.length - 2);
    const tiny: RunState = { ...before, deck: [...before.deck].slice(0, V2_DECK_RULES.minSize) };
    expect(take({ ...tiny, context: before.context }).deck.length).toBeGreaterThanOrEqual(
      V2_DECK_RULES.minSize,
    );
  });

  it('boons, potions, wounds and transforms', () => {
    const boon = take(offering([{ k: 'boon', rarity: 'common' }]));
    expect(boon.boons).toHaveLength(1);
    expect(COMBAT_DB.boons[boon.boons[0] as string]).toBeDefined();
    const potion = take(offering([{ k: 'potion' }]));
    expect(potion.potions).toHaveLength(1);
    const full = {
      ...offering([{ k: 'potion' }]),
      potions: ['fire-flask', 'fire-flask', 'fire-flask'],
    };
    expect(take(full).potions).toHaveLength(3);
    const wound = take(offering([{ k: 'wound', n: 2 }]));
    expect(wound.deck.filter((c) => c === 'wound')).toHaveLength(2);
    const before = offering([{ k: 'transform', n: 3 }]);
    const t = take(before);
    expect(t.deck).toHaveLength(before.deck.length);
    expect(t.deck.filter((c) => c === 'strike' || c === 'defend').length).toBe(
      before.deck.filter((c) => c === 'strike' || c === 'defend').length - 3,
    );
  });

  it('a Wound-bearing deck is still a valid save, and so is a run standing at a prelude', () => {
    const r = take(offering([{ k: 'wound', n: 1 }]));
    expect(parseRun(serializeRun(r))).not.toBeNull();
    const standing = chooseKit(newRun('quill', 'save-me', 'normal'), 'a');
    expect(parseRun(serializeRun(standing))?.phase).toBe('prelude');
    const broken = JSON.parse(serializeRun(standing)) as RunState;
    broken.context = {
      nodeId: '',
      prelude: { kind: 'threshold', title: 't', text: 't', options: [] },
    };
    expect(parseRun(JSON.stringify(broken))).toBeNull();
  });
});

describe('the Threshold draws from a wide pool', () => {
  it('always offers four options (three blessings and a bargain) but over many runs shows many different ones', () => {
    const seen = new Set<string>();
    const risky = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const o = makePrelude(seedRng(`t${i}`), 'threshold', 1, 'aurelion').options;
      expect(o).toHaveLength(4);
      expect(o.filter((x) => x.risky)).toHaveLength(1);
      for (const x of o) (x.risky ? risky : seen).add(x.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(15);
    expect(risky.size).toBeGreaterThanOrEqual(14);
  });
});
