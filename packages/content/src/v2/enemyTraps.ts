// Enemies' Traps (DECISIONS #751). An enemy's move sets one (the `setTrap` op): it lies face up beside the enemies, says what sets it off
// from your side and what it does to you, and breaks if the enemy that set it falls first. Its damage is flat (no Might), times the
// enemy's damage percent for the tier, as the engine deals it; its own Barrier and healing grow with the tier like the enemy's moves.
//
// They are cards so the engine can spring them the way it springs a hero's, but they are never anyone's card: `source: 'enemy'` keeps
// them out of rewards, shops, the Grimoire, Discover and every deck check (isDeckCard). Numbers are Tier I targets, sized against the
// move each one shares a turn with (the move gave up a little Barrier, healing or a junk card for it).
//
// The Umbral Veil is the Trap realm (the Trickster's home): nine of its fifteen enemies set one. Four other realms have one each.

import type { CardDef, Op } from '@sr/combat';
import { PREVENT, barrier, card, dmg, heal, status } from './build';

const trap = (
  realm: string,
  id: string,
  name: string,
  on: 'attacked' | 'foeDefends' | 'foeSummons',
  effects: Op[],
): CardDef =>
  card(realm, 'common', id, name, 'snare', 0, 'none', effects, {
    trigger: { on },
    hero: 'enemy',
    source: 'enemy',
  });

/** a Wound in your hand, now: it clogs the turn you are playing (an enemy's addCard 'foe' is your side) */
const woundInHand: Op = { op: 'addCard', card: 'wound', to: 'hand', side: 'foe' };

export const ENEMY_TRAPS: CardDef[] = [
  // ---- the Umbral Veil ----
  // Keyhole Imp: the plain one, to learn on. Your first hit is bitten back.
  trap('umbral', 'enemy-lockjaw', 'Lockjaw', 'attacked', [dmg(6, 'attacker')]),
  // Umbrella Widow: whoever hits first is tangled and hits softer for a while.
  trap('umbral', 'enemy-silk-line', 'Silk Line', 'attacked', [status('faltering', 2, 'attacker')]),
  // Puppet of Knots: punishes raising Barrier, before the Barrier lands (hold your Barrier a turn, or let it cut).
  trap('umbral', 'enemy-cut-strings', 'Cut Strings', 'foeDefends', [dmg(7, 'attacker')]),
  // The Whisperer: no damage, a dead card in the hand you are playing.
  trap('umbral', 'enemy-whispered-doubt', 'Whispered Doubt', 'attacked', [woundInHand]),
  // Inkbound Usher: waits for a companion to arrive and hits it on the way in.
  trap('umbral', 'enemy-no-admittance', 'No Admittance', 'foeSummons', [dmg(9, 'attacker')]),
  // Lost Courtier: a dodge. Spend it with a small hit before the big one.
  trap('umbral', 'enemy-masquerade', 'Masquerade', 'attacked', [PREVENT, barrier(4)]),
  // Midnight Seamstress (Elite): two stabs and a hem that holds you back.
  trap('umbral', 'enemy-pinned-hem', 'Pinned Hem', 'attacked', [
    dmg(4, 'attacker', 2),
    status('faltering', 1, 'attacker'),
  ]),
  // The Borrowed Face (Elite): your blow comes back, and leaves you open.
  trap('umbral', 'enemy-borrowed-pain', 'Borrowed Pain', 'attacked', [
    dmg(9, 'attacker'),
    status('exposed', 2, 'attacker'),
  ]),
  // Nyxara (Warden): the web she gives a Riftwalker who beats her (Nyxara's Web) is the one she sets.
  trap('umbral', 'enemy-veiled-web', 'Veiled Web', 'attacked', [
    PREVENT,
    status('exposed', 2, 'attacker'),
    barrier(6),
  ]),

  // ---- one each elsewhere ----
  // Wyldmaw, Orchid Maw: a flower that snaps shut and drinks.
  trap('wyldmaw', 'enemy-snapping-bloom', 'Snapping Bloom', 'attacked', [
    dmg(5, 'attacker'),
    heal(3),
  ]),
  // Nexus-9, Clockwork Guillotine (Elite): one heavy blade on a wire.
  trap('nexus', 'enemy-tripwire-blade', 'Tripwire Blade', 'attacked', [dmg(10, 'attacker')]),
  // Gloomfen, Lantern Angler: the light that draws you in. Fate for raising Barrier.
  trap('gloomfen', 'enemy-glowing-lure', 'Glowing Lure', 'foeDefends', [
    status('doom', 4, 'foeHero'),
  ]),
  // The Hollow Crown, Ember Chessman: a fork, every one of your units at once.
  trap('starfall', 'enemy-chess-fork', 'Fork', 'attacked', [dmg(4, 'allFoes')]),
];

/** the move op that sets one */
export const setTrap = (id: string): Op => ({ op: 'setTrap', card: id });
