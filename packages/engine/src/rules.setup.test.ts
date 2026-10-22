// Rules tests: setup, turn flow, Mana, Resonance, hand limit, fatigue (01_GAME_DESIGN §3.1, §3.3, §3.4).
import { describe, expect, it } from 'vitest';
import { createEngine } from './engine';
import { FIXTURE_DB, scenario } from './testkit';
import type { GameState } from './types';

const engine = createEngine(FIXTURE_DB);
const deck = (n: number) => Array.from({ length: n }, () => 'TST-FILLER');

function startedGame(seed = 'setup', first: 0 | 1 = 0): GameState {
  let s = engine.createGame({ seed, players: [{ deck: deck(20) }, { deck: deck(20) }], first });
  s = engine.applyAction(s, { type: 'mulligan', player: first, cards: [] }).state;
  s = engine.applyAction(s, { type: 'mulligan', player: first === 0 ? 1 : 0, cards: [] }).state;
  return s;
}

describe('§3.1 setup', () => {
  it('deals 5 cards each and asks the first player to mulligan first', () => {
    const s = engine.createGame({
      seed: 'a',
      players: [{ deck: deck(20) }, { deck: deck(20) }],
      first: 1,
    });
    expect(s.players[0].hand).toHaveLength(5);
    expect(s.players[1].hand).toHaveLength(5);
    expect(s.pending).toEqual({ kind: 'mulligan', player: 1 });
    expect(s.players[0].essence).toBe(30);
  });

  it('mulligan shuffles chosen cards back and redraws the same number', () => {
    let s = engine.createGame({
      seed: 'm',
      players: [{ deck: deck(20) }, { deck: deck(20) }],
      first: 0,
    });
    const back = s.players[0].hand.slice(0, 3);
    s = engine.applyAction(s, { type: 'mulligan', player: 0, cards: back }).state;
    expect(s.players[0].hand).toHaveLength(5);
    expect(s.players[0].deck).toHaveLength(15);
    expect(s.pending).toEqual({ kind: 'mulligan', player: 1 });
  });

  it('second player gets Rift Spark; first player skips their first draw', () => {
    const s = startedGame();
    expect(s.turn).toBe(1);
    expect(s.active).toBe(0);
    expect(s.players[0].hand).toHaveLength(5); // no draw on turn 1 for the first player
    const p2hand = s.players[1].hand.map((id) => s.cards[id]?.cardId);
    expect(p2hand).toContain('TOK-SPARK');
    expect(p2hand).toHaveLength(6);
  });

  it('second player draws on their first turn; Mana starts at 1 and grows', () => {
    let s = startedGame();
    expect(s.players[0].maxMana).toBe(1);
    s = engine.applyAction(s, { type: 'endTurn', player: 0 }).state;
    expect(s.active).toBe(1);
    expect(s.players[1].maxMana).toBe(1);
    expect(s.players[1].hand).toHaveLength(7);
    s = engine.applyAction(s, { type: 'endTurn', player: 1 }).state;
    expect(s.players[0].maxMana).toBe(2);
    expect(s.players[0].mana).toBe(2);
  });

  it('runs Sigil duel-start effects before turn 1', () => {
    let s = engine.createGame({
      seed: 's',
      players: [{ deck: deck(20), sigil: 'SIG-TEST' }, { deck: deck(20) }],
      first: 0,
    });
    s = engine.applyAction(s, { type: 'mulligan', player: 0, cards: [] }).state;
    s = engine.applyAction(s, { type: 'mulligan', player: 1, cards: [] }).state;
    const units = s.players[0].units.filter(Boolean).map((id) => s.cards[id as string]?.cardId);
    expect(units).toEqual(['TST-TOKEN']);
  });
});

describe('§3.3 Mana', () => {
  it('max Mana caps at 10', () => {
    const t = scenario(FIXTURE_DB)
      .p1.mana(10, 10)
      .deck('TST-FILLER', 'TST-FILLER')
      .p2.deck('TST-FILLER', 'TST-FILLER');
    t.p1.endTurn().p2.endTurn();
    expect(t.manaOf(1).max).toBe(10);
  });

  it('unspent Mana is held through the opponent turn, then refilled at your Dawn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.mana(5, 5)
      .board('TST-3-3')
      .deck('TST-FILLER', 'TST-FILLER')
      .p2.mana(2, 2)
      .set('TST-PIT')
      .board('TST-2-2')
      .deck('TST-FILLER', 'TST-FILLER');
    t.p1.endTurn(); // p1 holds 5
    expect(t.manaOf(1).mana).toBe(5);
    t.p2.attack('TST-2-2', 'p1-face');
    // p1 can't spend on a trap they don't have, but the held Mana is visible and intact
    expect(t.manaOf(1).mana).toBe(5);
    t.resolve().p2.endTurn();
    expect(t.manaOf(1)).toEqual({ mana: 6, temp: 0, max: 6 });
  });

  it('pays traps from held Mana on the opponent turn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.mana(3, 3)
      .set('TST-PIT')
      .deck('TST-FILLER', 'TST-FILLER')
      .p2.board('TST-3-3')
      .deck('TST-FILLER', 'TST-FILLER');
    t.p1.endTurn().p2.attack('TST-3-3', 'p1-face').p1.respond('TST-PIT').resolve();
    expect(t.manaOf(1).mana).toBe(1);
    expect(t.void(2)).toContain('TST-3-3');
    expect(t.essenceOf(1)).toBe(30);
  });

  it('temporary Mana can exceed max and disappears at end of turn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.mana(1, 1)
      .hand('TOK-SPARK')
      .deck('TST-FILLER')
      .p2.deck('TST-FILLER');
    t.p1.play('TOK-SPARK').resolve();
    expect(t.manaOf(1)).toEqual({ mana: 1, temp: 1, max: 1 });
    t.p1.endTurn();
    expect(t.manaOf(1).temp).toBe(0);
  });

  it('spends temporary Mana before held Mana', () => {
    const t = scenario(FIXTURE_DB)
      .p1.mana(2, 2)
      .hand('TOK-SPARK', 'TST-SLOWBOLT')
      .p2.board('TST-2-2');
    t.p1
      .play('TOK-SPARK')
      .resolve()
      .p1.play('TST-SLOWBOLT', { targets: ['p2:TST-2-2'] })
      .resolve();
    expect(t.manaOf(1)).toEqual({ mana: 2, temp: 0, max: 2 });
  });
});

describe('§3.3 Resonance', () => {
  it('counts cards played and traps activated; sets do not count; resets each turn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-FILLER', 'TST-DRAW', 'TST-PIT', 'TST-AMBUSH')
      .deck('TST-FILLER', 'TST-FILLER', 'TST-FILLER', 'TST-FILLER')
      .p2.board('TST-3-3')
      .deck('TST-FILLER', 'TST-FILLER');
    t.p1.play('TST-FILLER').resolve();
    expect(t.resonanceOf(1)).toBe(1);
    t.p1.play('TST-DRAW').resolve();
    expect(t.resonanceOf(1)).toBe(2);
    t.p1.setTrap('TST-PIT').setAmbush('TST-AMBUSH');
    expect(t.resonanceOf(1)).toBe(2);
    t.p1.endTurn();
    expect(t.resonanceOf(1)).toBe(0);
  });

  it('counts activations on the opponent turn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.set('TST-PIT')
      .deck('TST-FILLER')
      .p2.board('TST-3-3')
      .deck('TST-FILLER');
    t.p1.endTurn().p2.attack('TST-3-3', 'p1-face').p1.respond('TST-PIT');
    expect(t.resonanceOf(1)).toBe(1);
  });

  it('Resonance N bonus applies when resonance ≥ N on resolution (the card itself counts)', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-FILLER', 'TST-FILLER', 'TST-RESO').deck('TST-2-2');
    t.p1.play('TST-FILLER').resolve().play('TST-FILLER#1').resolve();
    expect(t.handCards(1)).toEqual(['TST-RESO']);
    t.p1.play('TST-RESO').resolve();
    expect(t.handCards(1)).toEqual(['TST-2-2']);
  });

  it('Resonance bonus is off below N', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-RESO').deck('TST-2-2');
    t.p1.play('TST-RESO').resolve();
    expect(t.handCards(1)).toEqual([]);
  });
});

describe('§3.1 hand limit and fatigue', () => {
  it('burns a draw when the hand has 9 cards', () => {
    const t = scenario(FIXTURE_DB)
      .p1.deck('TST-FILLER')
      .p2.hand(...Array.from({ length: 9 }, () => 'TST-FILLER'))
      .deck('TST-5-5');
    t.p1.endTurn();
    expect(t.handCards(2)).toHaveLength(9);
    expect(t.void(2)).toEqual(['TST-5-5']);
    expect(t.eventTypes()).toContain('cardBurned');
  });

  it('fatigue deals 1, then 2, then 3', () => {
    const t = scenario(FIXTURE_DB);
    t.p1.endTurn(); // p2 draws from empty: 1
    expect(t.essenceOf(2)).toBe(29);
    t.p2.endTurn(); // p1: 1
    t.p1.endTurn(); // p2: 2
    expect(t.essenceOf(2)).toBe(27);
    t.p2.endTurn().p1.endTurn(); // p2: 3
    expect(t.essenceOf(2)).toBe(24);
  });

  it('a card returned to a full hand is burned', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-RECALL', ...Array.from({ length: 8 }, () => 'TST-FILLER'))
      .board('TST-3-3')
      .deck('TST-2-2');
    t.p1.play('TST-RECALL', { targets: ['p1:TST-3-3'] }).resolve();
    // the Recall left the hand, so the unit fits (9th card); the draw is then burned
    expect(t.handCards(1)).toHaveLength(9);
    expect(t.handCards(1)).toContain('TST-3-3');
    expect(t.void(1)).toContain('TST-2-2');
  });
});

describe('game end', () => {
  it('reaching 0 Essence ends the game', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-5-5').p2.essence(5);
    t.p1.attack('TST-5-5', 'p2-face').resolve();
    expect(t.state.winner).toBe(0);
    expect(t.state.phase).toBe('ended');
    expect(t.legal(0)).toEqual([]);
  });

  it('both players at 0 at once is a draw', () => {
    const t = scenario(FIXTURE_DB).p1.essence(4).hand('TST-NOVA').p2.essence(5);
    t.p1.play('TST-NOVA').resolve();
    expect(t.state.winner).toBe('draw');
  });

  it('conceding hands the win to the opponent', () => {
    const t = scenario(FIXTURE_DB);
    t.p1.act({ type: 'concede', player: 1 });
    expect(t.state.winner).toBe(0);
  });

  it('the 200-turn cap ends in a draw', () => {
    const t = scenario(FIXTURE_DB, { turn: 200 }).p1.essence(50).p2.essence(50);
    t.p1.endTurn();
    expect(t.state.winner).toBe('draw');
  });
});
