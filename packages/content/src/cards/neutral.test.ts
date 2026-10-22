// Scenario tests: Neutral Commons, tokens, Rift Spark and the character Sigils.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB, starterDeck } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Neutral', () => {
  it('NEU-01 Rift Wanderer: Scry 1', () => {
    const t = t0().p1.hand('NEU-01').deck('AUR-04', 'AUR-05');
    t.p1.play('NEU-01').resolve();
    t.p1.scry([], ['AUR-04']);
    expect(t.deckCards(1)).toEqual(['AUR-05', 'AUR-04']);
  });

  it('NEU-02 Echo Wisp: Echo 3 from the Void, then Beyond', () => {
    const t = t0().p1.voidCards('NEU-02').aether(3, 3).p2.hand('NEU-07');
    t.p1.play('NEU-02', { echo: true }).p2.respond('NEU-07', ['p1:NEU-02']).resolve();
    expect(t.beyond(1)).toEqual(['NEU-02']);
  });

  it('NEU-03 Shardstone Golem: a 4/6 Guardian', () => {
    const t = t0().p1.board('NEU-03');
    expect(t.stats('p1:NEU-03')).toMatchObject({ power: 4, guard: 6 });
  });

  it('NEU-06 Shatter: destroys a set card (in response, killing the trap before it springs)', () => {
    const t = t0().p1.hand('NEU-06').p2.set('WYL-11');
    t.p1.play('NEU-06', { targets: ['p2:WYL-11'] }).resolve();
    expect(t.void(2)).toEqual(['WYL-11']);
    expect(t.backrow(2)).toEqual([]);
  });

  it('NEU-06 Shatter: destroys a Relic, and a face-down Ambush unit counts as a set card', () => {
    const t = t0().p1.hand('NEU-06', 'NEU-06').p2.relic('NEU-09').ambush('UMB-05');
    t.p1.play('NEU-06', { targets: ['p2:NEU-09'] }).resolve();
    t.p1.play('NEU-06#0', { targets: ['p2:UMB-05'] }).resolve();
    expect(t.void(2).sort()).toEqual(['NEU-09', 'UMB-05']);
  });

  it('NEU-07 Rift Bolt: 2 damage to a unit, Swift', () => {
    const t = t0().p1.board('AUR-05').p2.hand('NEU-07');
    t.p1.attack('AUR-05', 'face').p2.respond('NEU-07', ['p1:AUR-05']).resolve();
    expect(t.stats('p1:AUR-05').guard).toBe(1);
    expect(t.essenceOf(2)).toBe(27);
  });

  it("NEU-09 Riftwalker's Codex: draws while the hand is 3 or fewer, 2 charges", () => {
    const t = t0()
      .p1.relic('NEU-09')
      .deck('AUR-04', 'AUR-05', 'NEU-03', 'NEU-03', 'NEU-03')
      .p2.deck('NEU-03', 'NEU-03', 'NEU-03');
    t.p1.endTurn().p2.endTurn();
    expect(t.handCards(1)).toHaveLength(2);
    t.p1.endTurn().p2.endTurn();
    expect(t.handCards(1)).toHaveLength(4);
    expect(t.backrow(1)).toEqual([]); // broke at 0 charges
  });

  it('TOK-SPARK Rift Spark: gain 1 temporary Aether (Swift)', () => {
    const t = t0().p1.board('AUR-05').p2.hand('TOK-SPARK').aether(0, 0);
    t.p1.attack('AUR-05', 'face').p2.respond('TOK-SPARK').resolve();
    expect(t.aetherOf(2).temp).toBe(1);
  });

  it('TOK-RAVAGER Rift Ravager: Pierce', () => {
    const t = t0().p1.board('TOK-RAVAGER').p2.board('AUR-01');
    t.p1.attack('TOK-RAVAGER', 'p2:AUR-01').resolve();
    expect(t.essenceOf(2)).toBe(27);
  });
});

describe('Sigils', () => {
  const engine = createEngine(CARD_DB);
  const start = (sigil: string, deck: string[]) => {
    let s = engine.createGame({
      seed: 'sig',
      players: [{ deck, sigil }, { deck: starterDeck('maren') }],
      first: 0,
    });
    s = engine.applyAction(s, { type: 'mulligan', player: 0, cards: [] }).state;
    return engine.applyAction(s, { type: 'mulligan', player: 1, cards: [] }).state;
  };

  it('SIG-RIVET Spare Parts: start each duel with a Drone', () => {
    const s = start('SIG-RIVET', starterDeck('rivet'));
    expect(s.players[0].units.filter(Boolean).map((id) => s.cards[id as string]?.cardId)).toEqual([
      'TOK-DRONE',
    ]);
  });

  it('SIG-VESPER Sleight: a random Trap from the deck starts set', () => {
    const s = start('SIG-VESPER', starterDeck('vesper'));
    const set = s.players[0].backrow.filter(Boolean).map((id) => s.cards[id as string]);
    expect(set).toHaveLength(1);
    expect(set[0]?.faceDown).toBe(true);
    expect(CARD_DB[set[0]?.cardId ?? '']?.type).toBe('trap');
  });

  it('SIG-MAREN Oathbound: only the first unit each duel gains Shield', () => {
    const t = t0().p1.sigil('SIG-MAREN').hand('AUR-05', 'AUR-04');
    t.p1.play('AUR-05').resolve().play('AUR-04').resolve();
    expect(t.card('p1:AUR-05').shield).toBe(true);
    expect(t.card('p1:AUR-04').shield).toBe(false);
  });

  it('SIG-KESH Pack Hunger: the first Devour each duel draws a card', () => {
    const t = t0()
      .p1.sigil('SIG-KESH')
      .board('WYL-01', 'WYL-01')
      .hand('WYL-05', 'WYL-05')
      .deck('NEU-03', 'NEU-03');
    t.p1.play('WYL-05', { targets: ['p1:WYL-01'] }).resolve();
    expect(t.handCards(1).sort()).toEqual(['NEU-03', 'WYL-05']);
    t.p1.play('WYL-05#1', { targets: ['p1:WYL-01'] }).resolve(); // #0 is the one on the field
    expect(t.handCards(1)).toEqual(['NEU-03']);
  });
});
