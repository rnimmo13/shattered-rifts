import { describe, expect, it } from 'vitest';
import { createEngine } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';
const t0 = () => scenario(CARD_DB);
const eng = createEngine(CARD_DB);

describe('review probes', () => {
  it('P1 ascend with full board', () => {
    const t = t0()
      .p1.board('AUR-06', 'AUR-19', 'AUR-01', 'AUR-01', 'AUR-01')
      .hand('AUR-09')
      .aether(0, 0);
    console.log(
      'P1 ascend legal on full board:',
      t.legal().some((a) => a.type === 'play'),
    );
    const w = t0()
      .p1.board('AUR-01', 'AUR-01', 'AUR-01', 'AUR-01', 'AUR-01')
      .hand('WYL-07')
      .aether(0, 0);
    console.log(
      'P1b thalgor ascend legal on full board:',
      w.legal().some((a) => a.type === 'play'),
    );
  });
  it('P2 Velle cardAdded leak', () => {
    const t = t0().p1.hand('AUR-08').aether(5, 5).p2.board('AUR-04');
    t.p1.play('AUR-08').resolve();
    const ev = t.events.filter((e) => e.type === 'cardAdded');
    console.log(
      'P2 raw',
      JSON.stringify(ev),
      'redacted for p2',
      JSON.stringify(eng.eventsFor(ev, 1)),
    );
  });
  it('P3 mirror redirect', () => {
    const t = t0().p1.hand('NEU-07').p1.board('AUR-01').p2.board('AUR-04').set('UMB-11');
    t.p1
      .play('NEU-07', { targets: ['p2:AUR-04'] })
      .p2.respond('UMB-11')
      .resolve();
    console.log(
      'P3 events',
      t.eventTypes().filter((e) => ['redirected', 'negated', 'fizzled'].includes(e)),
      t.stats('p1:AUR-01').guard,
      t.stats('p2:AUR-04').guard,
    );
  });
  it('P4 pierce vs damage reduction', () => {
    const t = t0().p1.board('AUR-07').p2.board('NEX-06');
    // griffin 4 pierce vs bastion 7 guard
    t.p1.attack('AUR-07', 'p2:NEX-06').resolve();
    console.log('P4 essence', t.essenceOf(2), t.stats('p2:NEX-06').guard);
  });
  it('P5 calyx copy bypasses ward', () => {
    const t = t0().p1.board('NEX-04').hand('NEU-07', 'NEX-07').p2.board('NEX-16', 'AUR-05');
    // enemy NEX-16 is a construct; but ward comes from CALYX controller only. Use p2 CALYX instead:
    const u = t0().p1.hand('NEU-07').aether(5, 5).p2.board('NEX-07', 'AUR-05');
    u.p1.play('NEU-07', { targets: ['p2:NEX-07'] }).resolve();
    console.log('P5 normal ward blocks spell:', u.stats('p2:NEX-07').guard);
  });
});
