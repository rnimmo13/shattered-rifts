import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, type HeroId } from '@sr/content/v2';
import {
  RunError,
  choosePrelude,
  chooseCard,
  continueLoop,
  makePrelude,
  newRun,
  nextStage,
  parseRun,
  serializeRun,
  type PreludeEffect,
  type RunState,
} from './index';
import { describeEffect } from './preludes';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

/** A run standing at a prelude whose only option is `effects`. */
function offering(effects: PreludeEffect[], hero: HeroId = 'knight'): RunState {
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
  it('every run opens at The Threshold: three blessings and one bargain', () => {
    for (const h of HEROES) {
      const r = newRun(h, `thr-${h}`, 'normal');
      expect(r.deck).toEqual(RIFTWALKERS[h].starter);
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
      newRun('knight', s, 'normal')
        .context?.prelude?.options.map((o) => o.id)
        .join();
    expect(ids('same')).toBe(ids('same'));
    expect(new Set(Array.from({ length: 30 }, (_, i) => ids(`v${i}`))).size).toBeGreaterThan(5);
  });

  it('taking an option applies it and opens the map', () => {
    const r = newRun('knight', 'take', 'normal');
    const pick = r.context?.prelude?.options[0]?.id as string;
    const after = choosePrelude(r, pick);
    expect(after.phase).toBe('map');
    expect(after.context).toBeNull();
    expect(r.phase).toBe('prelude'); // the input is never changed
  });

  it('refuses anything that is not on offer', () => {
    const r = newRun('knight', 'bad', 'normal');
    expect(() => choosePrelude(r, 'nope')).toThrow(RunError);
    expect(() => choosePrelude({ ...r, phase: 'map', context: null }, 'x')).toThrow(RunError);
  });

  it('a new stage and a new loop open a Waymark with a rest, blessings, and sometimes a bargain', () => {
    const base = {
      ...newRun('knight', 'waymark', 'normal'),
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
    const standing = newRun('assassin', 'save-me', 'normal');
    expect(parseRun(serializeRun(standing))?.phase).toBe('prelude');
    const broken = JSON.parse(serializeRun(standing)) as RunState;
    broken.context = {
      nodeId: '',
      prelude: { kind: 'threshold', title: 't', text: 't', options: [] },
    };
    expect(parseRun(JSON.stringify(broken))).toBeNull();
  });

  it('a run saved at the old starting choice (kits, or two uncommons) starts at The Threshold (DECISIONS #374)', () => {
    const fresh = newRun('knight', 'old-kit', 'normal');
    for (const context of [
      { nodeId: '', kits: [{ id: 'a', leans: 'Bulwark', deck: [], added: [], removed: [] }] },
      { nodeId: '', starterPick: { options: ['twin-cut', 'challenge'], count: 2 } },
    ]) {
      const old = { ...(JSON.parse(serializeRun(fresh)) as object), phase: 'kit', context, deck: [] };
      const back = parseRun(JSON.stringify(old));
      expect(back?.phase).toBe('prelude');
      expect(back?.context?.prelude?.kind).toBe('threshold');
      expect(back?.deck).toEqual(RIFTWALKERS.knight.starter);
    }
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
    expect(risky.size).toBeGreaterThanOrEqual(13); // (14 until "A Legend's Price" went with Legendary, DECISIONS #363)
  });
});

describe('Threshold choices are worth taking (DECISIONS #224)', () => {
  it('a card is a choice of three from your own class, and taking or skipping it opens the map', () => {
    for (const h of HEROES) {
      const before = offering([{ k: 'pick', rarity: 'rare' }], h);
      const at = take(before);
      expect(at.phase).toBe('reward');
      const offers = at.context?.offers ?? [];
      expect(new Set(offers).size).toBe(3);
      for (const id of offers) {
        expect(COMBAT_DB.cards[id]?.rarity).toBe('rare');
        expect(COMBAT_DB.cards[id]?.hero).toBe(h);
      }
      // a run standing at the choice is a valid save
      expect(parseRun(serializeRun(at))?.phase).toBe('reward');
      const took = chooseCard(at, offers[0] as string);
      expect(took.phase).toBe('map');
      expect(took.deck).toHaveLength(before.deck.length + 1);
      expect(took.cleared).toEqual(before.cleared);
      expect(chooseCard(at, null).deck).toHaveLength(before.deck.length);
    }
  });

  it('an upgraded pick offers the "+" versions; ancestral picks come from the ancestral cards', () => {
    const up = take(offering([{ k: 'pick', rarity: 'common', upgraded: true }]));
    for (const id of up.context?.offers ?? []) expect(id.endsWith('+')).toBe(true);
    const anc = take(offering([{ k: 'pick', rarity: 'ancestral' }]));
    for (const id of anc.context?.offers ?? [])
      expect(COMBAT_DB.cards[id]?.rarity).toBe('ancestral');
  });

  it('upgrades go to your own cards before Strikes and Defends', () => {
    // (the knight starts with one card of her own, Sundering Blow)
    const after = take(offering([{ k: 'upgrade', n: 1 }]));
    const upped = after.deck.filter((c) => c.endsWith('+'));
    expect(upped).toHaveLength(1);
    for (const c of upped) expect(['strike+', 'defend+']).not.toContain(c);
  });

  it('a better transform makes uncommon or rare cards', () => {
    const t = take(offering([{ k: 'transform', n: 3, better: true }]));
    const made = t.deck.filter((c) => !newRun('knight', 'prelude-test', 'normal').deck.includes(c));
    expect(made.length).toBe(3);
    for (const id of made) expect(['uncommon', 'rare']).toContain(COMBAT_DB.cards[id]?.rarity);
  });

  it('Resolve is never offered to a run that is not missing any', () => {
    for (let i = 0; i < 200; i++) {
      const full = makePrelude(seedRng(`r${i}`), 'threshold', 1, 'aurelion', false).options;
      expect(full.some((o) => o.effects.some((e) => e.k === 'resolve'))).toBe(false);
    }
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++)
      for (const o of makePrelude(seedRng(`h${i}`), 'stage', 2, 'nexus', true).options)
        seen.add(o.id);
    expect(seen.has('nerve')).toBe(true);
  });
});

describe('trades at the Threshold (DECISIONS #256)', () => {
  it('Trade Steel gives up two Strikes (and only Strikes) for a choice of three uncommon Attacks', () => {
    const base = offering([
      { k: 'remove', n: 2, only: 'strike' },
      { k: 'pick', rarity: 'uncommon', kind: 'attack' },
    ]);
    const count = (r: RunState, id: string) => r.deck.filter((x) => x === id).length;
    const after = take(base);
    expect(count(after, 'strike')).toBe(count(base, 'strike') - 2);
    expect(count(after, 'defend')).toBe(count(base, 'defend'));
    expect(after.phase).toBe('reward');
    const offers = after.context?.offers ?? [];
    expect(offers).toHaveLength(3);
    for (const id of offers) {
      expect(COMBAT_DB.cards[id]?.kind).toBe('attack');
      expect(COMBAT_DB.cards[id]?.rarity).toBe('uncommon');
    }
  });

  it('Quiet Study gives up a Defend for a choice of three upgraded common Skills', () => {
    const base = offering([
      { k: 'remove', n: 1, only: 'defend' },
      { k: 'pick', rarity: 'common', kind: 'skill', upgraded: true },
    ]);
    const after = take(base);
    expect(after.deck.filter((x) => x === 'defend').length).toBe(
      base.deck.filter((x) => x === 'defend').length - 1,
    );
    for (const id of after.context?.offers ?? []) {
      expect(id.endsWith('+')).toBe(true);
      expect(COMBAT_DB.cards[id]?.kind).toBe('skill');
    }
    expect(describeEffect({ k: 'pick', rarity: 'common', kind: 'skill', upgraded: true })).toBe(
      'Choose one of three upgraded common Skills for your deck',
    );
  });
});
