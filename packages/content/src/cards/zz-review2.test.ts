import { describe, it } from 'vitest';
import { createEngine } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';
const t0 = () => scenario(CARD_DB);
const eng = createEngine(CARD_DB);
const log = (...a: unknown[]) =>
  console.log('R', ...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
const tryit = (name: string, fn: () => void) =>
  it(name, () => {
    try {
      fn();
    } catch (e: any) {
      log(name, 'THREW', e.message.slice(0, 300));
    }
  });

describe('probes', () => {
  tryit('B ward bypass by CALYX copy', () => {
    const t = t0().p1.hand('NEU-07', 'NEX-07').p2.board('NEX-07', 'AUR-05');
    t.p1.play('NEU-07', { targets: ['p2:AUR-05'] }).resolve();
    t.p1.play('NEX-07').resolve();
    log('B pending', t.state.pending?.kind);
    t.p1.choose('p2:NEX-07');
    log('B ward target guard after copy (5 = ward held):', t.stats('p2:NEX-07').guard);
  });
  tryit('A returnedToHand reveals facedown', () => {
    const t = t0().p1.hand('UMB-09').p2.ambush('UMB-05');
    t.p1.play('UMB-09', { targets: ['p2:UMB-05'] }).resolve();
    const evs = t.lastEvents.concat(t.events).filter((e) => e.type === 'returnedToHand');
    log('A raw', evs[0], 'redacted for p1', eng.eventsFor(evs, 0)[0]);
  });
  tryit('C override virus no slot / stolen unit dies', () => {
    const t = t0()
      .p1.hand('NEX-18')
      .board('AUR-01', 'AUR-01', 'AUR-01', 'AUR-01', 'AUR-01')
      .p2.board('NEX-04');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    log(
      'C full board: p1 units',
      t.units(1),
      'p2 units',
      t.units(2),
      'blitz on enemy?',
      t.stats('p2:NEX-04').keywords.has('blitz'),
    );
  });
  tryit('D stolen unit bounced: revert ok', () => {
    const t = t0().p1.hand('NEX-18', 'NEX-11').board('AUR-01').p2.board('NEX-04').deck('NEU-03');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    t.p1.play('NEX-11', { targets: ['p1:NEX-04'] }).resolve();
    log('D p2 hand', t.handCards(2), 'p1 hand', t.handCards(1), t.units(1));
    t.p1.endTurn();
    log('D after dusk', t.units(1), t.units(2));
  });
  tryit('E stolen unit then permanently stolen back (Puppeteer by owner)', () => {
    const t = t0().p1.hand('NEX-18').board('AUR-01').p2.board('NEX-04').hand('UMB-06');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    t.p1.endTurn();
    log('E', t.units(1), t.units(2));
  });
  tryit('F pierce vs reduction', () => {
    const t = t0().p1.board('WYL-02').p2.board('NEX-06');
    t.p1.attack('WYL-02', 'p2:NEX-06').resolve();
  });
  tryit('G Ascend discount consumption NEX-15 with Echo', () => {
    const t = t0().p1.rift('NEX-15').hand('NEX-04', 'NEX-04').aether(10, 10);
    t.p1.play('NEX-04').resolve();
    log('G aether after first', t.aetherOf(1));
  });
  tryit('H Prism random targets', () => {
    const t = t0()
      .p1.hand('NEU-10')
      .voidCards('NEU-07', 'AUR-10', 'NEX-09', 'AUR-04', 'NEX-13')
      .p2.board('AUR-05', 'AUR-04')
      .aether(10, 10);
    log('H prism cost legal', t.legal().filter((a) => a.type === 'play').length);
    t.p1.play('NEU-10').resolve();
    log('H after prism', t.units(1), t.units(2), t.void(1));
  });
  tryit('I Hollow Veil removal destroys', () => {
    const t = t0()
      .p1.rift('UMB-15')
      .set('UMB-10', 'UMB-10', 'UMB-10', 'UMB-10', 'UMB-10')
      .hand('NEU-03');
    log('I backrow len', t.state.players[0].backrow.length, t.backrow(1));
  });
  tryit('J Mor’vael traps ready + Hungering Dark', () => {
    const t = t0().p1.board('WYL-05', 'WYL-05').p2.set('UMB-13');
    t.p1.attack('WYL-05', 'face').p2.respond('UMB-13').resolve();
    log('J', t.units(1), t.void(1));
  });
});
