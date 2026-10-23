// Kesh the Unfed (Wyldmaw). Starts with a Hound. Three lanes:
//   Bloodrage  - pay HP for Might and tempo, then hit with it
//   Pack       - buff and feed the companions
//   Feast      - Exhaust engine: eat your own cards, heal, hit for what you have consumed (and devour allies)

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  dmg,
  doubleSt,
  draw,
  exhaustN,
  heal,
  lose,
  mana,
  on,
  per,
  pool,
  sacrifice,
  scaled,
  status,
  summon,
} from '../build';

const k = pool('kesh', 'wyldmaw');

export const KESH: CardDef[] = [
  // --- basics ---
  k('basic', 'savage-bite', 'Savage Bite', 'attack', 1, 'foe', [dmg(8), lose(2)]),
  k('basic', 'blood-frenzy', 'Blood Frenzy', 'skill', 1, 'none', [
    lose(3),
    status('might', 2, 'allFriends'),
  ]),

  // --- Bloodrage ---
  k('common', 'rend', 'Rend', 'attack', 1, 'foe', [dmg(11), lose(3)]),
  k('common', 'twin-fang', 'Twin Fang', 'attack', 1, 'foe', [dmg(5, 'target', 2)]),
  k('common', 'feral-instinct', 'Feral Instinct', 'skill', 0, 'none', [lose(2), draw(2)]),
  k('common', 'pain-ward', 'Pain Ward', 'skill', 1, 'none', [
    barrier(5),
    scaled(barrier(0), per('missingHp', 0.25)),
  ]),
  k('uncommon', 'blood-tithe', 'Blood Tithe', 'skill', 0, 'none', [lose(6), mana(2), draw(3)], {
    exhaust: true,
  }),
  k('uncommon', 'crushing-blow', 'Crushing Blow', 'attack', 2, 'foe', [scaled(dmg(8), per('might', 2))]),
  k('uncommon', 'run-wild', 'Run Wild', 'attack', 2, 'foe', [dmg(6, 'target', 2), status('might', 1)]),
  k('uncommon', 'ravage', 'Ravage', 'attack', 2, 'none', [dmg(7, 'allFoes'), lose(3)]),
  k('rare', 'the-hunger', 'The Hunger', 'power', 1, 'none', [lose(4), status('might', 3)]),
  k('rare', 'slip-the-leash', 'Slip the Leash', 'skill', 1, 'none', [doubleSt('might', 'self')], {
    exhaust: true,
  }),
  k('rare', 'berserker', 'Berserker', 'power', 1, 'none', [on('turnStart', [lose(2), mana(1)])]),

  // --- Pack ---
  k('common', 'heel', 'Heel', 'summon', 1, 'none', [summon('hound')]),
  k('common', 'call-gnashlings', 'Call Gnashlings', 'summon', 1, 'none', [
    summon('gnashling'),
    summon('gnashling'),
  ]),
  k('common', 'pack-tactics', 'Pack Tactics', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
    barrier(4, 'allFriends'),
  ]),
  k('common', 'sic-em', "Sic 'Em", 'skill', 1, 'ally', [
    status('might', 2, 'target'),
    heal(4, 'target'),
  ]),
  k('common', 'howl', 'Howl', 'skill', 1, 'none', [ACT]),
  k('common', 'thick-hide', 'Thick Hide', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  k('uncommon', 'savage-command', 'Savage Command', 'skill', 2, 'none', [
    ACT,
    status('might', 1, 'allFriends'),
  ]),
  k('uncommon', 'pack-bond', 'Pack Bond', 'power', 2, 'none', [on('turnStart', [barrier(3, 'allFriends')])]),
  k('rare', 'alpha-call', 'Alpha Call', 'summon', 2, 'none', [
    summon('hound'),
    status('might', 1, 'allFriends'),
  ]),
  k('rare', 'unchained', 'Unchained', 'power', 2, 'none', [status('might', 3, 'allFriends')]),
  k('rare', 'den-mother', 'Den Mother', 'summon', 3, 'none', [summon('dire-wolf')]),

  // --- Feast ---
  k('common', 'burn-the-weak', 'Burn the Weak', 'skill', 1, 'none', [exhaustN(1), barrier(8)]),
  k('common', 'primal-feast', 'Primal Feast', 'skill', 1, 'none', [heal(5, 'allFriends')]),
  k('common', 'bonepicker', 'Bonepicker', 'skill', 0, 'none', [barrier(3)], {
    exhaust: true,
    onExhaust: [heal(2)],
  }),
  k('common', 'bloodscent', 'Bloodscent', 'attack', 1, 'foe', [
    dmg(5),
    status('might', 1, 'allFriends'),
  ]),
  k('uncommon', 'crimson-pact', 'Crimson Pact', 'skill', 1, 'none', [lose(3), exhaustN(1), draw(2)]),
  k('uncommon', 'gnaw', 'Gnaw', 'attack', 1, 'foe', [scaled(dmg(5), per('exhausted', 2))]),
  k('uncommon', 'devour', 'Devour', 'attack', 2, 'foe', [dmg(14), heal(5)]),
  k('uncommon', 'devour-ally', 'Devour Ally', 'skill', 1, 'ally', [
    heal(8, 'hero'),
    status('might', 2, 'hero'),
    sacrifice,
  ]),
  k('uncommon', 'fell-the-prey', 'Fell the Prey', 'attack', 2, 'foe', [dmg(16), heal(6)], {
    exhaust: true,
  }),
  k('uncommon', 'ravenous', 'Ravenous', 'power', 2, 'none', [on('exhaust', [draw(1)])]),
  k('uncommon', 'thick-skin', 'Thick Skin', 'power', 1, 'none', [on('exhaust', [barrier(4)])]),
  k('rare', 'maw-opens', 'The Maw Opens', 'attack', 2, 'foe', [
    exhaustN(9),
    scaled(dmg(0), per('exhausted', 2)),
  ]),
  k('uncommon', 'gnarltooth-trap', 'Gnarltooth Trap', 'snare', 1, 'none', [
    dmg(6, 'attacker'),
    status('might', 1, 'allFriends'),
  ], { trigger: { on: 'attacked' } }),
  k('common', 'whet-the-fangs', 'Whet the Fangs', 'skill', 0, 'none', [status('vigor', 6)]),
  k('rare', 'bloodsong', 'Bloodsong', 'power', 1, 'none', [lose(2), status('ritual', 1)]),
  k('rare', 'hunger-unbound', 'Hunger Unbound', 'power', 2, 'none', [status('unbound', 1)]),
];
