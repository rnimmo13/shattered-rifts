// Regression tests for the M2 review findings (reviews/m2-review.md).
import { describe, expect, it } from 'vitest';
import { HIDDEN, createEngine, eventsFor } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB, starterDeck } from '../index';

const t0 = () => scenario(CARD_DB);

describe('M2 review fixes', () => {
  it('H1: Archmagister Velle does not reveal the added spell to the opponent', () => {
    const t = t0().p1.hand('AUR-08').mana(5, 5);
    t.p1.play('AUR-08').resolve();
    const mine = eventsFor(t.events, 0).find((e) => e.type === 'cardAdded');
    const theirs = eventsFor(t.events, 1).find((e) => e.type === 'cardAdded');
    expect(mine).toMatchObject({ cardId: expect.stringMatching(/^AUR-/) as string });
    expect(theirs).toMatchObject({ id: HIDDEN, cardId: HIDDEN });
  });

  it('H1: with a full hand the added card burns into the Void (and nothing goes missing)', () => {
    const t = t0()
      .p1.hand('AUR-08', ...Array.from({ length: 9 }, () => 'NEU-01'))
      .mana(5, 5);
    t.p1.play('AUR-08').resolve();
    expect(t.handCards(1)).toHaveLength(9);
    expect(t.void(1)).toHaveLength(1);
    expect(t.eventTypes()).toContain('cardBurned');
  });

  it('H2: Ascend works with a full unit row (the sacrifice frees the slots)', () => {
    const t = t0()
      .p1.board('AUR-06', 'AUR-19', 'AUR-01', 'AUR-02', 'AUR-03')
      .hand('AUR-09')
      .mana(0, 0);
    const ascends = t.legal().filter((a) => a.type === 'play' && a.ascend);
    expect(ascends.length).toBeGreaterThan(0);
    t.p1.play('AUR-09', { ascend: ['AUR-06', 'AUR-19'] }).resolve();
    expect(t.units(1)).toContain('AUR-09');
    expect(t.units(1)).toHaveLength(4);
  });

  it('H2: a normal cast still needs a free slot', () => {
    const t = t0()
      .p1.board('AUR-01', 'AUR-02', 'AUR-03', 'AUR-04', 'AUR-05')
      .hand('AUR-09')
      .mana(8, 8);
    expect(t.legal().some((a) => a.type === 'play')).toBe(false);
  });

  it('MEDIUM: Mirror of Malice ignores spells that target a Relic or a set card', () => {
    const t = t0().p1.relic('NEU-09').set('UMB-11').p2.hand('NEU-06');
    t.p1.endTurn();
    t.p2.play('NEU-06', { targets: ['p1:NEU-09'] });
    expect(t.legal(0).some((a) => a.type === 'activateTrap')).toBe(false);
    t.resolve();
    expect(t.void(1)).toContain('NEU-09'); // Shatter did its job, undisturbed
  });

  it('MEDIUM: bouncing a face-down unit does not reveal it to the opponent', () => {
    const t = t0().p1.hand('UMB-09').p2.ambush('UMB-01');
    t.p1.play('UMB-09', { targets: ['p2:UMB-01'] }).resolve();
    const ev = eventsFor(t.events, 0).find((e) => e.type === 'returnedToHand');
    expect(ev).toMatchObject({ cardId: HIDDEN });
    const owner = eventsFor(t.events, 1).find((e) => e.type === 'returnedToHand');
    expect(owner).toMatchObject({ cardId: 'UMB-01' });
  });

  it('MEDIUM: CALYX copies respect Ward like the original spell', () => {
    const t = t0().p1.hand('NEU-07', 'NEX-07').p2.board('NEX-16', 'AUR-04').relic('NEU-09');
    // p2 has no CALYX here, so give its Construct Ward through p2's own CALYX on the board
    const u = t0().p1.hand('NEU-07', 'NEX-07').p2.board('NEX-07', 'NEX-16', 'AUR-04');
    u.p1.play('NEU-07', { targets: ['p2:AUR-04'] }).resolve();
    u.p1.play('NEX-07').resolve();
    u.p1.choose('p2:NEX-16');
    expect(u.stats('p2:NEX-16').guard).toBe(1); // the copy was warded away: no damage
    expect(u.eventTypes()).toContain('statusApplied');
    expect(t.units(1)).toEqual([]);
  });

  it('MEDIUM: Override Virus gives Blitz only if the steal worked', () => {
    const t = t0()
      .p1.board('AUR-01', 'AUR-02', 'AUR-03', 'AUR-04', 'AUR-05')
      .hand('NEX-18')
      .p2.board('NEX-04');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    expect(t.units(2)).toEqual(['NEX-04']);
    expect(t.card('p2:NEX-04').granted).toEqual([]);
  });

  it('MEDIUM: the first-Construct discount is once per turn even if the Rift is replaced', () => {
    const t = t0().p1.rift('NEX-15').hand('NEX-04', 'NEX-15', 'NEX-04').mana(10, 10);
    t.p1.play('NEX-04').resolve(); // 3 − 1 = 2
    t.p1.play('NEX-15#1').resolve(); // a new Rift: 2
    t.p1.play('NEX-04#1', { decline: true }).resolve(); // no second discount: 3
    expect(t.manaOf(1).mana).toBe(3);
  });

  it('MEDIUM: shrinking the backrow shifts a card into a free slot instead of destroying it', () => {
    const t = t0()
      .p1.rift('UMB-15')
      .set('UMB-10', 'UMB-10', 'UMB-10', 'UMB-10', 'UMB-10')
      .hand('NEU-06', 'NEX-15');
    t.p1.play('NEU-06', { targets: ['p1:UMB-10#2'] }).resolve(); // frees slot 3
    t.p1.play('NEX-15').resolve(); // the Hollow Veil is replaced: 4 slots
    expect(t.state.players[0].backrow).toHaveLength(4);
    expect(t.backrow(1).filter((c) => c === 'UMB-10')).toHaveLength(4);
    expect(t.void(1).filter((c) => c === 'UMB-10')).toHaveLength(1); // only the Shattered one
  });

  it('MEDIUM: a permanent steal clears an earlier "until end of turn" return', () => {
    const t = t0().p1.hand('NEX-18').p2.board('NEX-04').hand('UMB-06');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    expect(t.card('p1:NEX-04').revertControl).toBe(1);
  });
});

describe('hidden information from the very first move', () => {
  it('the opponent’s hand is hidden during the mulligan phase (turn 0)', () => {
    const engine = createEngine(CARD_DB);
    const s = engine.createGame({
      seed: 'mull',
      players: [{ deck: starterDeck('maren') }, { deck: starterDeck('kesh') }],
    });
    expect(s.phase).toBe('mulligan');
    for (const p of [0, 1] as const) {
      const v = engine.viewFor(s, p);
      expect(v.players[p === 0 ? 1 : 0].hand).toBeNull();
      expect(v.players[p].hand).not.toBeNull();
    }
  });
});
