// Scenario tests: Umbral Veil Commons.
import { describe, expect, it } from 'vitest';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Umbral Veil', () => {
  it('UMB-01 Veilshade: attacked while set, flips and Stuns the attacker', () => {
    const t = t0().p1.board('AUR-05').deck('NEU-03', 'NEU-03').p2.ambush('UMB-01').deck('NEU-03');
    t.p1.attack('AUR-05', 'p2:UMB-01').resolve();
    expect(t.void(2)).toContain('UMB-01'); // 3 Power kills the 1/2
    t.p1.endTurn().p2.endTurn();
    expect(t.legal(0).some((a) => a.type === 'attack')).toBe(false);
  });

  it('UMB-02 Whisper Acolyte: your Traps cost 1 less to activate', () => {
    const t = t0().p1.board('AUR-05').p2.board('UMB-02').set('WYL-11').mana(1, 1);
    t.p1.attack('AUR-05', 'face').p2.respond('WYL-11').resolve();
    expect(t.manaOf(2).mana).toBe(0);
    expect(t.void(1)).toContain('AUR-05');
  });

  it('UMB-03 Gloomstalker: Veiled until it attacks', () => {
    const t = t0().p1.board('UMB-03').p2.hand('NEU-07');
    t.p1.endTurn();
    expect(t.legal(1).some((a) => a.type === 'play')).toBe(false);
  });

  it('UMB-05 Hollow Lurcher: voluntary flip (cost 3) deals 3 damage', () => {
    const t = t0().p1.ambush('UMB-05').mana(3, 3).p2.board('AUR-05');
    t.p1.flip('UMB-05', ['p2:AUR-05']).resolve();
    expect(t.void(2)).toContain('AUR-05');
    expect(t.manaOf(1).mana).toBe(0);
  });

  it('UMB-08 Mindrot: discard 1, or 2 at Resonance 3', () => {
    const a = t0().p1.hand('UMB-08').p2.hand('NEU-03', 'AUR-04', 'AUR-05');
    a.p1.play('UMB-08').resolve();
    expect(a.handCards(2)).toHaveLength(2);
    const b = t0()
      .p1.hand('NEU-07', 'NEU-07', 'UMB-08')
      .p2.hand('NEU-03', 'AUR-04', 'AUR-05')
      .board('WYL-16');
    b.p1
      .play('NEU-07', { targets: ['p2:WYL-16'] })
      .resolve()
      .play('NEU-07', { targets: ['p2:WYL-16'] })
      .resolve();
    b.p1.play('UMB-08').resolve();
    expect(b.handCards(2)).toHaveLength(1);
  });

  it('UMB-10 Shadow Coil: the attacker gets −3 Power this turn', () => {
    const t = t0().p1.board('AUR-04').p2.set('UMB-10');
    t.p1.attack('AUR-04', 'face').p2.respond('UMB-10').resolve();
    expect(t.essenceOf(2)).toBe(30);
  });

  it('UMB-16 Whispered Bargain: draw 2, then put a card from hand on top of the deck', () => {
    const t = t0().p1.hand('UMB-16').deck('AUR-04', 'AUR-05', 'NEU-03');
    t.p1.play('UMB-16').resolve();
    expect(t.state.pending?.kind).toBe('chooseCards');
    t.p1.chooseCards('AUR-04');
    expect(t.handCards(1)).toEqual(['AUR-05']);
    expect(t.deckCards(1)).toEqual(['AUR-04', 'NEU-03']);
  });
});
