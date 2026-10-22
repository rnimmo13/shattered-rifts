// Regression tests (real cards) for the M1 review findings.
import { describe, expect, it } from 'vitest';
import { createEngine, eventsFor } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

describe('M1 review fixes (real cards)', () => {
  it('H1: Benediction on an enemy face-down Hollow Lurcher does not reveal its stats', () => {
    const t = scenario(CARD_DB).p1.hand('AUR-11').p2.ambush('UMB-05');
    t.p1.play('AUR-11', { targets: ['p2:UMB-05'] }).resolve();
    const seen = eventsFor(t.events, 0);
    expect(seen.some((e) => e.type === 'statsChanged')).toBe(false);
    expect(createEngine(CARD_DB).viewFor(t.state, 0).stats[t.id('p2:UMB-05')]).toBeUndefined();
  });

  it('M1: Corrode stops at 0 Power, so later buffs count fully', () => {
    const t = scenario(CARD_DB)
      .p1.board('AUR-01')
      .hand('WYL-08')
      .deck('NEU-03', 'NEU-03', 'NEU-03')
      .p2.deck('NEU-03', 'NEU-03', 'NEU-03');
    t.p1.endTurn();
    // three Corrode stacks on a 1-Power Squire
    t.state.cards[t.id('p1:AUR-01')]!.corrode = 3;
    t.p2.endTurn();
    expect(t.stats('p1:AUR-01').power).toBe(0);
    t.p1.endTurn().p2.endTurn();
    t.p1.play('WYL-08', { targets: ['p1:AUR-01'] }).resolve();
    expect(t.stats('p1:AUR-01').power).toBe(3);
  });

  it('M3: Echo Wisp + Recompile cannot loop Echo', () => {
    const t = scenario(CARD_DB).p1.voidCards('NEU-02').hand('NEX-11').aether(5, 5).deck('NEU-03');
    t.p1.play('NEU-02', { echo: true }).resolve();
    t.p1.play('NEX-11', { targets: ['p1:NEU-02'] }).resolve();
    expect(t.beyond(1)).toEqual(['NEU-02']);
  });
});
