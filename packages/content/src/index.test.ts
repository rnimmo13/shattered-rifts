// Content tests (07_TECH_ARCHITECTURE §5): schema validity, text ↔ data consistency,
// every reference resolves, starters are legal decks.
import { describe, expect, it } from 'vitest';
import type { CardDef, Effect } from '@sr/engine';
import {
  ALL_CARDS,
  CARD_DB,
  CHARACTERS,
  CardDefSchema,
  CardIdSchema,
  cardByName,
  starterDeck,
} from './index';

const KEYWORD_WORDS: Record<string, string> = {
  guardian: 'Guardian',
  blitz: 'Blitz',
  shield: 'Shield',
  ward: 'Ward',
  pierce: 'Pierce',
  lifebind: 'Lifebind',
  veiled: 'Veiled',
  stun: 'Stun',
  corrode: 'Corrode',
  ambush: 'Ambush',
  devour: 'Devour',
  evolve: 'Evolve',
  assemble: 'Assemble',
  overclock: 'Overclock',
  resonance: 'Resonance',
  echo: 'Echo',
  ascend: 'Ascend',
  scry: 'Scry',
  swift: 'Swift',
  negate: 'Negate',
  charges: 'Charges',
};

function walkEffects(effects: readonly Effect[], fn: (e: Effect) => void): void {
  for (const e of effects) {
    fn(e);
    if (e.op === 'conditional') {
      walkEffects(e.then, fn);
      if (e.else) walkEffects(e.else, fn);
    }
    if (e.op === 'atEndOfTurn') walkEffects(e.effects, fn);
  }
}

function allEffects(c: CardDef): Effect[] {
  const out: Effect[] = [];
  for (const a of c.abilities) {
    if (a.kind === 'static') continue;
    walkEffects(a.effects, (e) => out.push(e));
    if ('resonance' in a && a.resonance) walkEffects(a.resonance.effects, (e) => out.push(e));
  }
  return out;
}

function referencedCards(c: CardDef): string[] {
  return allEffects(c).flatMap((e) =>
    e.op === 'summon' ? [e.card] : e.op === 'transform' ? [e.into] : [],
  );
}

/** Numbers anywhere in a card's data, plus the stats of tokens it creates. */
function dataNumbers(c: CardDef): Set<number> {
  const { text: _t, name: _n, flavor: _f, art: _a, id: _i, ...data } = c;
  const nums = new Set<number>([0]);
  JSON.stringify(data).replace(/-?\d+/g, (m) => {
    nums.add(Math.abs(Number(m)));
    return m;
  });
  for (const ref of referencedCards(c)) {
    const d = CARD_DB[ref];
    if (d?.power !== undefined) nums.add(d.power);
    if (d?.guard !== undefined) nums.add(d.guard);
  }
  return nums;
}

describe('content', () => {
  it('has all 40 Core Set Commons', () => {
    const commons = ALL_CARDS.filter((c) => c.collectible && c.rarity === 'common');
    expect(commons).toHaveLength(40);
  });

  it('every card id is unique and well-formed', () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(CardIdSchema.safeParse(id).success, id).toBe(true);
  });

  it.each(ALL_CARDS.map((c) => [c.id, c] as const))('%s matches the schema', (_id, c) => {
    const r = CardDefSchema.safeParse(c);
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2)).toBe(true);
  });

  it.each(ALL_CARDS.map((c) => [c.id, c] as const))(
    '%s: every keyword appears in its text',
    (_id, c) => {
      for (const k of c.keywords ?? [])
        expect(c.text, `${c.id} missing ${k}`).toContain(KEYWORD_WORDS[k] ?? k);
    },
  );

  it.each(ALL_CARDS.map((c) => [c.id, c] as const))(
    '%s: every number in its text appears in its data',
    (_id, c) => {
      const nums = dataNumbers(c);
      for (const m of c.text.match(/\d+/g) ?? [])
        expect(nums.has(Number(m)), `${c.id}: "${m}" not in data`).toBe(true);
    },
  );

  it.each(ALL_CARDS.map((c) => [c.id, c] as const))(
    '%s: **bold** names resolve to a card or keyword',
    (_id, c) => {
      const keywordWords = new Set(Object.values(KEYWORD_WORDS));
      for (const m of c.text.matchAll(/\*\*([^*]+)\*\*/g)) {
        const raw = (m[1] ?? '').replace(/:$/, '').replace(/\s+\d+$/, '');
        const singular = raw.replace(/s$/, '');
        const ok = keywordWords.has(raw) || !!cardByName(raw) || !!cardByName(singular);
        expect(ok, `${c.id}: **${m[1]}** is neither a keyword nor a card`).toBe(true);
      }
    },
  );

  it('every summoned / transformed card exists', () => {
    for (const c of ALL_CARDS)
      for (const ref of referencedCards(c)) expect(CARD_DB[ref], `${c.id} → ${ref}`).toBeDefined();
  });

  it('balance budget: Common units are on budget (±1 before keywords, 02_CARDS §3)', () => {
    // vanilla budget: Power + Guard = 2 × cost + 1; keywords/effects are paid from it, so
    // a common's raw stats must not exceed budget + 1.
    for (const c of ALL_CARDS) {
      if (c.type !== 'unit' || c.rarity !== 'common') continue;
      const stats = (c.power ?? 0) + (c.guard ?? 0);
      expect(stats, `${c.id} stats ${stats} vs budget ${2 * c.cost + 1}`).toBeLessThanOrEqual(
        2 * c.cost + 2,
      );
    }
  });
});

describe('characters and starters', () => {
  it('there are four characters, each with a Sigil', () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(['maren', 'rivet', 'kesh', 'vesper']);
    for (const c of CHARACTERS) expect(CARD_DB[c.sigil]?.type).toBe('sigil');
  });

  it.each(CHARACTERS.map((c) => [c.id] as const))(
    '%s starter is a legal 20-card deck of Commons',
    (id) => {
      const deck = starterDeck(id);
      expect(deck).toHaveLength(20);
      const counts = new Map<string, number>();
      for (const card of deck) counts.set(card, (counts.get(card) ?? 0) + 1);
      for (const [card, n] of counts) {
        const d = CARD_DB[card];
        expect(d, card).toBeDefined();
        expect(d?.collectible, card).toBe(true);
        expect(d?.rarity, card).toBe('common');
        expect(n, card).toBeLessThanOrEqual(3);
      }
    },
  );
});
