import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, ancestralCards, rewardPool, type HeroId } from '@sr/content/v2';
import {
  availableNodes,
  canAdd,
  chooseEvent,
  enterNode,
  giftOffers,
  newRun,
  offerCards,
  type RunState,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];
const rarityOf = (id: string) => COMBAT_DB.cards[id]?.rarity;
const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

describe('ancestral cards', () => {
  it('there are a dozen, all classless, powerful, and kept out of every ordinary pool', () => {
    const ids = ancestralCards();
    expect(ids.length).toBeGreaterThanOrEqual(10);
    for (const id of ids) {
      const c = COMBAT_DB.cards[id]!;
      expect(c.hero, id).toBe('neutral');
      expect(c.rarity, id).toBe('ancestral');
      expect(c.upgrade, `${id} upgrades`).toBeTruthy();
      for (const h of HEROES) expect(rewardPool(h), `${h} pool has ${id}`).not.toContain(id);
    }
  });

  it('one copy per deck (a "+" version counts too)', () => {
    const id = ancestralCards()[0] as string;
    expect(canAdd([], id)).toBe(true);
    expect(canAdd([id], id)).toBe(false);
    expect(canAdd([`${id}+`], id)).toBe(false);
  });

  it('never turn up in ordinary card rewards', () => {
    for (let i = 0; i < 450; i++)
      for (const q of ['duel', 'elite'] as const)
        for (const id of offerCards(seedRng(`a${q}${i}`), 'knight', [], q, 4))
          expect(rarityOf(id), id).not.toBe('ancestral');
  });

  it("the Warden's Gift never holds one (it is your class's cards only)", () => {
    for (let i = 0; i < 200; i++)
      for (const id of giftOffers(seedRng(`g${i}`), 'hunter', [], 3, 'kron'))
        expect(rarityOf(id), id).not.toBe('ancestral');
  });

  it("the merchant sometimes sells one, dear, and the Ancestors' Offering event can be taken (for 12 HP)", () => {
    let sold = 0;
    let event: RunState | null = null;
    for (let i = 0; i < 400 && (!sold || !event); i++) {
      const base = open(newRun('assassin', `anc-${i}`));
      const node = availableNodes(base)[0]!;
      const asMerchant: RunState = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'merchant' } : n)),
        },
      };
      const m = enterNode(asMerchant, node.id).context?.merchant;
      if (m?.items.some((x) => rarityOf(x.cardId) === 'ancestral' && x.price >= 200)) sold++;
      const asEvent: RunState = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
        },
      };
      const e = enterNode(asEvent, node.id);
      if (e.context?.event?.options.some((o) => o.id === 'ancestor')) event = e;
    }
    expect(sold).toBeGreaterThan(0);
    expect(event).not.toBeNull();
    const e = event!;
    const card = e.context!.event!.cardOffer;
    const taken = chooseEvent(e, 'ancestor');
    expect(taken.hp).toBe(e.hp - 12);
    expect(taken.deck).toContain(card);
    expect(rarityOf(card)).toBe('ancestral');
    expect(() => chooseEvent({ ...e, hp: 12 }, 'ancestor')).toThrow();
  });
});
