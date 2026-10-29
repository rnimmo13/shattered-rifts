// Combat v2 content: heroes, starter decks, cards, companions and encounters (docs/08_COMBAT_V2.md).

import {
  CALM_EXIT_MANA,
  validateDb,
  type CombatDb,
  type HeroDef,
  type HeroTrait,
} from '@sr/combat';
import {
  addTo,
  barrier,
  channel,
  dmg,
  draw,
  forge,
  heal,
  mana,
  on,
  per,
  raise,
  scaled,
  stance,
  stars,
  status,
} from './build';
import { BOONS, HEARTS } from './boons';
import { V2_CARDS } from './cards';
import { RUNES } from './pools/shaman';
import { POTIONS } from './potions';
import { isVariant, stripRoll, withRolls } from './sanctify';
import { ALLIES, ENEMY_UNITS } from './units';

export type RealmId =
  'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'starfall' | 'gloomfen' | 'midden';
export type HeroId =
  | 'knight'
  | 'engineer'
  | 'hunter'
  | 'trickster'
  | 'assassin'
  | 'shaman'
  | 'monk'
  | 'spellblade'
  | 'necromancer'
  | 'drunkard';

export interface Riftwalker {
  hero: HeroDef;
  realm: RealmId;
  starter: string[];
  blurb: string;
  /** the build paths of its card pool, shown on the character screen (docs/09_ROSTER.md); most have three, there is no rule (DECISIONS #362) */
  /** what kind of fighter this is, in one word players know ("Knight", "Assassin"...) */
  role: string;
  /**
   * the character's own name (Valeria, Rivet...). Hidden for now: players see the class name, which is `hero.name` too (Robert,
   * 2026-10-28: "lets update each character to just display their class name instead of character names. i may bring them back";
   * DECISIONS #372). Bringing them back is setting `hero.name` to this again.
   */
  persona: string;
  /** the innate trait every one of this character's fights starts with (shown on the character screens) */
  trait: HeroTrait;
  buildPaths: string[];
  /** the mechanics this character plays with, in plain words (shown on the character screens in place of build paths) */
  mechanics: string[];
  /** a few plain sentences on how this character plays (shown on the character screen and the Learn page) */
  howTo: string[];
  /** things the character says (shown on the character screen, one at random) */
  quotes?: string[];
}

/**
 * Build paths are hidden for now (Robert, 2026-10-28, DECISIONS #365: "lets remove the build path thing for now, we will associate cards with
 * build paths later"). The data stays (`buildPaths`, `pathOf`, `pnpm paths`), but nothing shows a card's build path or hints at one, and
 * nothing is offered because of one. Screens show `Riftwalker.mechanics` instead.
 */
export const BUILD_PATHS_SHOWN = false;

const rep = (id: string, n: number): string[] => Array<string>(n).fill(id);

export const RIFTWALKERS: Record<HeroId, Riftwalker> = {
  knight: {
    realm: 'aurelion',
    persona: 'Valeria',
    role: 'Knight',
    // (rebuilt 2026-10-29, docs/BASE_CLASS_REWORKS.md §4, DECISIONS #415: Guard, Riposte and Thorns; the Ironclad copy is archived)
    trait: {
      name: 'Hold and Answer',
      text: 'Start every fight with 6 Barrier. Guard: when your Barrier stops an enemy attack hit completely, that enemy is left Open until the end of your next turn (one Opening per enemy). The first time each turn you earn an Opening, gain 3 Barrier.',
      fightStart: [barrier(6)],
      openings: true,
      triggers: [on('opening', [barrier(3)], { once: true })],
    },
    hero: { id: 'knight', name: 'Knight', maxHp: 80, mana: 3, handSize: 5 },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'sundering-blow', 'briarplate'],
    blurb:
      'A knight of the Gilded Order. No companions: she meets every attack with her shield, answers the opening it gives her, and makes contact hurt.',
    mechanics: ['Barrier', 'Openings', 'Riposte', 'Thorns', 'Exposed'],
    buildPaths: [
      'Guard: stop attacks completely, and gain from every Opening',
      'Riposte: heavy counters that spend Openings',
      'Thorns: hurt every enemy that hits you',
    ],
    howTo: [
      'Barrier soaks damage, but it falls away at the start of your next turn. When it stops an enemy attack hit completely, that enemy is left Open.',
      "A Riposte spends the target's Opening for its bonus (Sundering Blow, Return the Blow). Other attacks never spend it. An Opening lasts until the end of your next turn.",
      'Thorns hurt each enemy that hits you, until the enemy turn is over (Briarplate). Some cards open an enemy themselves, even one that is not attacking.',
    ],
  },
  engineer: {
    realm: 'nexus',
    persona: 'Rivet',
    role: 'Engineer',
    trait: {
      name: 'Tinkerer',
      // (Salvage: scrapping small machines builds a bigger one, DECISIONS #383)
      text: 'At the start of your turn, you heal 1 and your companions gain 1 max HP. Salvage: a companion you build by scrapping others to make room takes their Might and Primed, and half their HP as extra max HP.',
      turnStart: [heal(1, 'allFriends')],
      salvage: true,
    },
    hero: {
      id: 'engineer',
      name: 'Engineer',
      maxHp: 70,
      mana: 3,
      handSize: 5,
      // (6 HP, not the Drone's 8: DECISIONS #411)
      startUnits: [{ unit: 'drone', hp: 6 }],
    },
    starter: [...rep('strike', 5), ...rep('defend', 3), 'deploy-drone', 'overclock'],
    blurb:
      'A tinkerer of machines. She starts every fight with a Drone and builds an army of them.',
    mechanics: ['Companions', 'Frames', 'Salvage', 'Primed', 'Might', 'Max HP growth'],
    buildPaths: [
      'Swarm: many cheap drones, spent freely',
      'Assemble: charge your companions up',
      'Core: one big construct, built up',
    ],
    howTo: [
      'You start with a Drone. Allies attack for you when you end your turn.',
      'You have 3 companion slots. A Light machine takes 1, a Heavy 2 and a Colossal all 3 (the pips on the card and the machine). Many small drones can be spent freely; one big machine can be built up (heals and upgrades give it max HP) and cashed in; and companions can be charged up (Primed: their next strike hits harder).',
      'With no room, a summon scraps companions to make room, and Salvage passes their Might, Primed and half their HP to the new machine.',
      'Enemies can hit your allies too; an ally with Taunt has to be attacked first.',
    ],
  },
  hunter: {
    realm: 'wyldmaw',
    persona: 'Kesh the Unfed',
    role: 'Hunter',
    trait: {
      name: 'Pack Instinct',
      // (DECISIONS #285: her Might is the pack's; the heal after a won fight went in #333 and is back at 2, #381)
      text: 'Your companions share half your Might (rounded down), and a new companion arrives with it. Heal 2 HP after every fight you win.',
      shareMight: 0.5,
      healAfterFight: 2,
    },
    hero: {
      id: 'hunter',
      name: 'Hunter',
      maxHp: 80,
      mana: 3,
      handSize: 5,
      startUnits: ['hound'],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), 'savage-bite', 'blood-frenzy', 'rend'],
    blurb: 'A hunter with a Hound. Pays HP to buff the whole pack with Might.',
    mechanics: ['Companions', 'Might', 'Self-damage', 'Mana and draw'],
    buildPaths: [
      'Bloodrage: HP for Might',
      'Pack: feed the companions',
      'Predator: Mana and draw for burst turns',
    ],
    howTo: [
      'You start with a Hound. Might makes every attack hit harder, permanently.',
      'Many of your cards cost HP. Spend it to buff the pack; Savage Bite and Devour heal some of it back.',
      'Predator: gain Mana, draw hard and play many cards in one turn; its attacks grow with every card played that turn.',
    ],
  },
  trickster: {
    realm: 'umbral',
    persona: 'Vesper Nightlace',
    role: 'Trickster',
    trait: {
      name: 'Lying in Wait',
      text: 'Start every fight with 6 Barrier and 1 extra card in hand. The first time each turn you have played all four suits (♠ ♥ ♦ ♣), a Full Trick: deal 3 damage to a random enemy, 2 more for every Full Trick before it this fight, and draw 1 card.',
      fightStart: [barrier(6), draw(1)],
      // Suits (DECISIONS #387): the first time in a turn all four suits are showing, a Full Trick
      // (no 4 Barrier a turn now; the Full Trick grows instead: 5, 8, 11... DECISIONS #398)
      // (3 to start, not 5, DECISIONS #404; a random enemy, #411; 2 more a Full Trick and 1 card at the start, #412: 3, 5, 7...)
      suits: { fullTrick: [scaled(dmg(3, 'randomFoe'), per('fullTricks', 2)), draw(1)] },
    },
    hero: { id: 'trickster', name: 'Trickster', maxHp: 80, mana: 3, handSize: 5 },
    // (one Defend is Pick a Card, a ♦, so the starting deck holds all four suits: DECISIONS #387)
    starter: [
      ...rep('strike', 3),
      ...rep('defend', 3),
      ...rep('veil-strike', 2),
      'set-the-web',
      'pick-a-card',
    ],
    blurb:
      'A masked trickster who always sees the next move coming. No companions: Traps, Exposed and a deck of tricks.',
    mechanics: ['Traps', 'Exposed', 'Suits', 'Foresee'],
    buildPaths: [
      'Traps: one for every trigger',
      'Exposed: mark, then spend the mark',
      'Suits: show all four suits in a turn for a Full Trick',
    ],
    howTo: [
      'A Trap is played face down and springs on its own when its trigger happens.',
      'Read the icon above each enemy and set the Trap that answers what it is about to do.',
      'Exposed enemies take 50% more damage: mark them, then spend the mark.',
      'Suits: every card is a ♠ (Attacks), ♥ (Barrier), ♦ (cards and Mana) or ♣ (Traps and debuffs). Play all four in one turn for a Full Trick: 3 damage to every enemy and a card, and every Full Trick after it in a fight deals 3 more.',
    ],
  },
  assassin: {
    realm: 'umbral',
    persona: 'Sylas',
    role: 'Assassin',
    trait: {
      name: 'Hidden Blades',
      text: 'At the start of your turn, add a Dagger to your hand.',
      turnStart: [addTo('sleeve-knife')],
    },
    // (the Silent's shape, DECISIONS #368: 70 HP, 5 Strikes, 5 Defends, Neutralize and Survivor)
    hero: {
      id: 'assassin',
      name: 'Assassin',
      maxHp: 70,
      mana: 3,
      handSize: 5,
    },
    starter: [...rep('strike', 5), ...rep('defend', 5), 'hobbling-jab', 'duck-and-weave'],
    blurb:
      'A cutpurse with a sleeve full of blades: a Dagger finds its way into his hand every turn. Daggers, Bleed and sleight of hand.',
    mechanics: ['Daggers', 'Bleed', 'Discard', 'Sly', 'Faltering'],
    buildPaths: [
      'Daggers: Daggers, and the attacks around them',
      'Bleed: stack it, make it burn harder',
      'Sleight: draw, discard and dodge',
    ],
    howTo: [
      'Every turn a Dagger comes to your hand (Hidden Blades): a 0-cost Attack that is consumed when played. Many cards make more of them, and Edge makes each one hit harder.',
      'Bleed hurts for its stacks at the start of the enemy’s turn and then shrinks by 1. Pile it on and let it work.',
      'Discarding is a resource: a card with Sly is played for free when a card makes you discard it.',
    ],
  },
  shaman: {
    realm: 'nexus',
    persona: 'Ilvane',
    role: 'Shaman',
    trait: {
      name: 'Totem-bound',
      text: 'Start every fight with three different totems: Hawk, Bear and Splinter.',
      fightStart: [channel('spark'), channel('ward'), channel('splinter')],
    },
    // (the Slay the Spire 2 Defect's shape: 75 HP, 4 Strike, 4 Defend, Zap and Dualcast; his trait stays, see pools/shaman.ts)
    hero: {
      id: 'shaman',
      name: 'Shaman',
      maxHp: 75,
      mana: 3,
      handSize: 5,
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'spark-cast', 'twin-evocation'],
    blurb:
      'An elder shaman of the old spirits, who plants totems and wakes them. Starts every fight with three totems (Hawk, Bear and Splinter).',
    mechanics: ['Totems', 'Spirit', 'Auras', 'Status cards', '0-cost cards'],
    buildPaths: [
      'Totems: plant, add slots, awaken',
      'Elements: storm, ice and fire strikes, 0-cost cards and status cards',
      'Rites: Auras, Spirit and Mana',
    ],
    howTo: [
      'You start with a Hawk, a Bear and a Splinter totem. Totems stand in a row of 3 slots beside you and pulse at the end of your turn (the Owl at the start of it). A 4th pushes the oldest out, awakening it for its big effect.',
      'Hawks strike a random enemy, Bears give Barrier, Elders charge up for one big blow on the weakest enemy, Owls give Mana, and Splinters hit every enemy but fade a little each turn.',
      'Spirit makes every totem hit harder and guard more. Many of your Auras stay all fight and build on each other.',
      'Some of your cards make status cards (Haze, Muck, Scorch, Drain, Wound) that clutter your deck; others pay off whenever you make one.',
    ],
  },
  monk: {
    realm: 'aurelion',
    persona: 'Solen',
    role: 'Monk',
    trait: {
      name: 'Inner Fire',
      // (its 2 Barrier went: a Flow deck changes stance two or three times a turn, DECISIONS #390; Primed on leaving Fury, #412)
      // (leaving Serene's 2 Mana was an engine rule; it is the trait's now, so the trait table counts it: #413)
      text: 'Whenever you enter a stance, gain 1 Fervor. The first time each turn you leave Serene, gain 2 Mana. Whenever you leave Fury, gain 2 Primed.',
      triggers: [
        on('stance', [status('mantra', 1)]),
        on('stanceLeft', [mana(CALM_EXIT_MANA)], { stance: 'calm', once: true }),
        on('stanceLeft', [status('vigor', 2)], { stance: 'wrath' }),
      ],
    },
    hero: {
      id: 'monk',
      name: 'Monk',
      maxHp: 82,
      mana: 3,
      handSize: 5,
      sigil: [stance('calm')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'kindle-fury', 'still-guard'],
    blurb:
      'A monk who fights in stances. Starts every fight Serene, and every stance he enters stokes his Fervor towards Radiance.',
    mechanics: ['Stances', 'Fervor', 'Foresee', 'Self-damage'],
    buildPaths: [
      'Fury: get in, hit hard, live through it',
      'Flow: change stance again and again; every change pays',
      'Radiant: build Fervor to 10 for a triple-damage turn',
    ],
    howTo: [
      'You start Serene. You are in at most one stance at a time, and every stance you enter gives 1 Fervor (Inner Fire); leaving Fury gives 2 Primed for your next attack.',
      'Fury doubles the damage you deal, but you take 50% more. Leaving Serene gives you 2 Mana (once a turn).',
      'Fervor builds to 10, then you enter Radiant: triple damage until your turn ends.',
      'Burst in Fury, dance between stances, or build Fervor towards Radiant.',
    ],
  },
  spellblade: {
    realm: 'starfall',
    persona: 'Obsidia',
    role: 'Spellblade',
    trait: {
      name: 'Kindled',
      text: 'At the start of your turn, gain 1 Arcana and Sharpen your Obsidian Blade by 1.',
      turnStart: [stars(1), forge('starforged-blade', 1)],
    },
    // the Slay the Spire 2 Regent's shape (DECISIONS #369): 75 HP, 3 Arcana as every fight begins (his Divine
    // Right), and his starter (4 Strike, 4 Defend, Falling Star = Cinderfall, Venerate = Gather Arcana). Kindled is hers, not his.
    hero: {
      id: 'spellblade',
      name: 'Spellblade',
      maxHp: 75,
      mana: 3,
      handSize: 5,
      sigil: [stars(3)],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'meteor-jab', 'gather-light'],
    blurb:
      'A spellblade of black glass and ember. Spends Arcana on her biggest cards, calls an Obsidian Blade that every Sharpen improves for good, and fills her hand with Retainers and borrowed cards.',
    mechanics: ['Arcana', 'Sharpen', 'Created cards', 'Auras'],
    buildPaths: [
      'Blade: sharpen the Obsidian Blade and swing it',
      'Arcana: gain it, then spend it on big cards',
      'Court: create cards and play many',
    ],
    howTo: [
      'Arcana is a second resource that lasts the whole fight. You start every fight with 3 and gain 1 more each turn. Cards with an orange orb spend it; others gain it.',
      'The Obsidian Blade (2 Mana, Hold) comes to your hand on your first turn. Every Sharpen makes it hit harder for the rest of the fight, and some Auras make it strike every enemy or strike twice.',
      'Court cards create cards: Retainers (free Attacks and guards), Neutral cards, Rubble. Created cards feed the Auras that count them.',
    ],
  },
  drunkard: {
    realm: 'midden',
    persona: 'KP, the Homeless Drunk',
    role: 'Drunkard',
    trait: {
      name: 'Clutch Genes',
      // (was +50% at half HP or below; it grows from the first HP lost now, DECISIONS #411)
      text: 'You deal 1% more attack damage for every HP you are missing.',
      clutch: { perMissingHp: 1 },
    },
    hero: {
      id: 'drunkard',
      name: 'Drunkard',
      maxHp: 88,
      mana: 3,
      handSize: 5,
      sigil: [addTo('old-twelve-gauge')],
    },
    starter: [
      ...rep('strike', 3),
      ...rep('defend', 3),
      ...rep('hammer-swing', 2),
      'pane-up',
      'bottle-tripwire',
    ],
    blurb:
      'A short, fat, bald dwarf with a hammer, an Old Twelve Gauge that hits every enemy and gets sharper, and a trolley of window panes. Booby traps, glass and buckshot.',
    mechanics: ['Old Twelve Gauge', 'Buckshot', 'Hangover', 'Stagger'],
    buildPaths: [
      'Gun: sharpen the Old Twelve Gauge',
      'Shells: buckshot that hits everyone',
      'Hangover: drink now, pay tomorrow',
    ],
    howTo: [
      'Window panes and hammer blows get stronger the more HP you are missing, and Clutch Genes makes every attack hit 1% harder for each HP you are missing.',
      'You start every fight with the Old Twelve Gauge: it hits EVERY enemy, you keep it in hand, and every Sharpen card (Rack the Slide...) makes it hit harder for the whole fight.',
      'Shells are 0-cost attacks that hit every enemy and are consumed. Playing one can sharpen the gun (Hair Trigger).',
      'Drinks (Swig, Liquid Lunch...) give Mana, cards or Might now and Hangover: at the start of your next turn you lose that much HP, never your last. Hangover cards hit harder the more of it you carry, and his heals grow with the HP you are missing.',
      "Stagger cards are a drunk's swing: they hit a random enemy instead of one you choose, and hit harder for it.",
    ],
    quotes: [
      '"I ain\'t homeless. I\'m between windows."',
      '"This is a 12 gauge. That\'s how many friends I have."',
      '"Mind the glass. Or don\'t. It\'s mostly insurance."',
      '"I\'m not drunk. The floor is just very enthusiastic."',
      '"Back off, I got a hammer and a bad attitude."',
      '"Everybody\'s got a trolley full of problems. Mine\'s got wheels."',
    ],
  },
  necromancer: {
    realm: 'gloomfen',
    persona: 'Dorian Blackthorn',
    role: 'Necromancer',
    trait: {
      name: 'Grave Chill',
      text: 'At the start of your turn, Raise 2. Whenever one of your allies dies, curse a random enemy with 2 Fate; whenever a card is consumed, with 3.',
      // (Raise a turn, DECISIONS #397: his Commands need a Thrall standing on his turn, and the one he starts with died to the first hit; 2, not 3, #401)
      // (no Fate at the start, #398; a death curses 3, as a consumed card does: 5 had pushed him back to the top, #403)
      turnStart: [raise(2)],
      triggers: [
        on('allyDies', [status('doom', 2, 'randomFoe')]),
        on('exhaust', [status('doom', 3, 'randomFoe')]),
      ],
    },
    // (the Slay the Spire 2 Necrobinder's shape, DECISIONS #370: her 66 HP is below the
    // 70 floor every Riftwalker keeps, so 70; her Osty is his Bone Thrall, and he may have several)
    hero: {
      id: 'necromancer',
      name: 'Necromancer',
      maxHp: 70,
      mana: 3,
      handSize: 5,
      // (2 HP: DECISIONS #411)
      startUnits: [{ unit: 'bone-thrall', hp: 2 }],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'raise-thrall', 'off-the-leash'],
    blurb:
      'A warden of the drowned dead. His Bone Thralls stand between him and harm and strike when he commands; his enemies are cursed with Fate.',
    mechanics: ['Thralls', 'Fate', 'Souls', 'Fleeting'],
    buildPaths: [
      'Fate: curse, then cash it in',
      'Thralls: raise them, grow them, command them',
      'Souls: Gravesouls and Fleeting cards',
    ],
    howTo: [
      'You start with a Bone Thrall. Thralls stand in front of you and take the hits meant for you, but they never act on their own.',
      'Raise N brings a new Bone Thrall with N HP (up to three). With three already standing, your weakest Thrall gains N max HP instead.',
      'Command cards (Knucklebone, Off the Leash...) make each of your Thralls strike. Off the Leash adds each Thrall’s own HP to its blow.',
      'Cursed with Fate, an enemy dies at the end of its turn if its HP is at or below its Fate.',
      'Gravesouls are free cards that draw 2 and are consumed; Fleeting cards are consumed if you still hold them when your turn ends, and some of your cards grow with every one you play.',
      'Grave Chill: Raise 2 at the start of every turn; whenever one of your allies dies or a card is consumed, a random enemy is cursed with 3 Fate.',
    ],
  },
};

export type EncounterKind = 'regular' | 'elite' | 'warden' | 'finale';

export interface Encounter {
  id: string;
  name: string;
  realm: RealmId | 'all';
  kind: EncounterKind;
  /** front to back */
  units: string[];
}

const enc = (
  id: string,
  name: string,
  realm: Encounter['realm'],
  kind: EncounterKind,
  ...units: string[]
): Encounter => ({
  id,
  name,
  realm,
  kind,
  units,
});

export const ENCOUNTERS: Encounter[] = [
  enc('squire-pair', 'Gilded Squires', 'aurelion', 'regular', 'squire', 'squire'),
  enc('squire-recruit', 'Squire Recruit', 'aurelion', 'regular', 'squire-recruit'),
  enc('bell-cleric', 'Bell Cleric and Squire', 'aurelion', 'regular', 'squire', 'bell-cleric'),
  enc('wandering-knight', 'Wandering Knight', 'aurelion', 'regular', 'wandering-knight'),
  enc(
    'page-troop',
    'Page Troop',
    'aurelion',
    'regular',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
  ),
  enc('aldric', 'Templar-Commander Aldric', 'aurelion', 'elite', 'templar-aldric'),
  enc('maelis', 'High Inquisitor Maelis', 'aurelion', 'elite', 'inquisitor-maelis'),
  enc('seraphine', 'Seraphine, the Gilded Warden', 'aurelion', 'warden', 'seraphine'),

  enc('line-technician', 'Line Technician', 'nexus', 'regular', 'line-technician'),
  enc('patrol-unit', 'Patrol Unit 44', 'nexus', 'regular', 'patrol-unit'),
  enc('scrap-collector', 'Scrap Collector', 'nexus', 'regular', 'scrap-collector'),
  enc('drone-nest', 'Drone Nest', 'nexus', 'regular', 'scrap-drone', 'scrap-drone', 'patrol-unit'),
  enc(
    'drone-swarm',
    'Drone Swarm',
    'nexus',
    'regular',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
  ),
  enc('hive-7', 'Hive-7', 'nexus', 'elite', 'hive-7'),
  enc('ghostwire', 'Ghostwire', 'nexus', 'elite', 'ghostwire'),
  enc('kron', 'KR-0N "Kron", Foundry Overseer', 'nexus', 'warden', 'kron'),

  enc('raptor-pack', 'Raptor Pack', 'wyldmaw', 'regular', 'raptor', 'raptor', 'raptor'),
  enc('raptor-horde', 'Raptor Horde', 'wyldmaw', 'regular', 'raptor', 'raptor', 'raptor', 'raptor'),
  enc('acid-spitter', 'Spitter Nest', 'wyldmaw', 'regular', 'acid-spitter'),
  enc('feral-riftling', 'Feral Riftling', 'wyldmaw', 'regular', 'feral-riftling'),
  enc('packmother-ruhn', 'Packmother Ruhn', 'wyldmaw', 'elite', 'packmother-ruhn'),
  enc('bloated-one', 'The Bloated One', 'wyldmaw', 'elite', 'bloated-one'),
  enc('gorrmaw', 'Gorrmaw, the Hunger Below', 'wyldmaw', 'warden', 'gorrmaw'),

  enc('hooded-acolyte', 'Hooded Acolyte', 'umbral', 'regular', 'hooded-acolyte'),
  enc('whisperer', 'The Whisperer', 'umbral', 'regular', 'whisperer'),
  enc('lost-courtier', 'Lost Courtier', 'umbral', 'regular', 'lost-courtier'),
  enc('lamplighter', 'The Lamplighter', 'umbral', 'elite', 'lamplighter'),
  enc('choir-of-silence', 'Choir of Silence', 'umbral', 'elite', 'choir-of-silence'),
  enc('nyxara', 'Nyxara, the Veiled Matriarch', 'umbral', 'warden', 'nyxara'),

  enc('vorthax', 'Vorthax, Heart of the Rift', 'all', 'finale', 'vorthax'),
];

export const encounter = (id: string): Encounter => {
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown encounter "${id}"`);
  return e;
};

// two cards sharing an id would silently overwrite each other in the table below
{
  const seen = new Set<string>();
  for (const c of V2_CARDS) {
    if (seen.has(c.id)) throw new Error(`Duplicate card id "${c.id}"`);
    seen.add(c.id);
  }
}

export const COMBAT_DB: CombatDb = {
  runes: Object.fromEntries(RUNES.map((r) => [r.id, r])),
  // (also answers for sanctified ids like "hi~strike": derived on demand, never listed)
  cards: withRolls(Object.fromEntries(V2_CARDS.map((c) => [c.id, c]))),
  boons: Object.fromEntries([...BOONS, ...HEARTS].map((b) => [b.id, b])),
  potions: Object.fromEntries(POTIONS.map((p) => [p.id, p])),
  units: Object.fromEntries([...ALLIES, ...ENEMY_UNITS].map((u) => [u.id, u])),
  heroes: Object.fromEntries(
    Object.values(RIFTWALKERS).map((r) => [r.hero.id, { ...r.hero, trait: r.trait }]),
  ),
};

/** Cards a Riftwalker may be offered as rewards: their own pool and Neutral, never basics, tokens or junk. */
export function rewardPool(hero: HeroId): string[] {
  return V2_CARDS.filter(
    (c) =>
      (c.hero === hero || c.hero === 'neutral') &&
      c.rarity !== 'basic' &&
      !c.id.endsWith('+') &&
      // a card that cannot be played is only worth offering if discarding it pays (Reflex, Tactician)
      (!c.unplayable || c.onDiscard !== undefined) &&
      !c.source,
  ).map((c) => c.id);
}

/**
 * Is this a card a deck may hold: a listed card, or one derived from one (a sanctified roll "hi~strike", an engraved tag "hold^strike").
 * Every check of a deck that came from outside (a save, an Arena deck, a ghost) uses this, so those cards travel everywhere.
 */
export const isDeckCard = (id: unknown): id is string =>
  typeof id === 'string' &&
  (Object.hasOwn(COMBAT_DB.cards, id) || (isVariant(id) && COMBAT_DB.cards[id] !== undefined));

/** The pool a card belongs to (a Riftwalker id, or 'neutral'). */
export const poolOf = (cardId: string): string => COMBAT_DB.cards[cardId]?.hero ?? 'neutral';

/** The ancestral cards (base versions): powerful, classless, offered only by special events (docs/03_CAMPAIGN.md). */
export function ancestralCards(): string[] {
  return V2_CARDS.filter((c) => c.rarity === 'ancestral' && !c.id.endsWith('+')).map((c) => c.id);
}

/** A Warden's signature cards (the Warden's Gift). The id is the encounter id. */
export function signatureCards(encounterId: string): string[] {
  return V2_CARDS.filter((c) => c.source === `boss:${encounterId}` && !c.id.endsWith('+')).map(
    (c) => c.id,
  );
}

export { validateDb };
export {
  MARK_INFO,
  canMark,
  canRoll,
  isSanctified,
  isVariant,
  markOf,
  markedId,
  rolledId,
  rollOf,
  stripRoll,
  type CardMark,
} from './sanctify';
import { PATH_OF } from './paths.generated';
import { TRIMMED_CARDS } from './retired';

/** Which of its Riftwalker's build paths (an index into `Riftwalker.buildPaths`) a card belongs to, or undefined (basics and glue cards). */
export function pathOf(cardId: string): number | undefined {
  return PATH_OF[stripRoll(cardId).replace(/\+$/, '')];
}

/** The short name of a build path ("Bulwark"), and the whole line ("Bulwark: hit with your Barrier"). */
export function pathName(hero: HeroId, path: number): string {
  return (RIFTWALKERS[hero].buildPaths[path] ?? '').split(':')[0] ?? '';
}

/** How many cards (base versions) a Riftwalker has in each of its build paths. */
export function pathSizes(hero: HeroId): number[] {
  const n = RIFTWALKERS[hero].buildPaths.map(() => 0);
  for (const [id, path] of Object.entries(PATH_OF))
    if (COMBAT_DB.cards[id]?.hero === hero && path >= 0 && path < n.length)
      n[path] = (n[path] ?? 0) + 1;
  return n;
}

/**
 * Deck rules for Combat v2 runs: a deck never drops below minSize cards, holds at most MAX_COPIES of a card (DECISIONS #337), and at most
 * maxLegendary Legendary and maxAncestral Ancestral cards fit in the deck at once (one Legendary and two Ancestral since DECISIONS
 * #238; a deck that already held more keeps them, but takes no more).
 */
export const V2_DECK_RULES = {
  minSize: 8,
  vaultSlots: 10,
  maxLegendary: 1,
  maxAncestral: 2,
} as const;

/** The most copies of one card (and its "+" version) a deck may hold, in a run and in the Arena alike, basics too (DECISIONS #337). */
export const MAX_COPIES = 5;
/**
 * The most copies of one card a deck may take, by rarity: MAX_COPIES of any card (Robert, 2026-10-27: "no more than 5 copies of a card
 * in a deck"; DECISIONS #337), but a Legendary or Ancestral card is one of a kind.
 */
export const COPIES_BY_RARITY: Readonly<Record<string, number>> = {
  legendary: 1,
  ancestral: 1,
};
export const maxCopiesOf = (rarity: string | undefined): number =>
  COPIES_BY_RARITY[rarity ?? 'common'] ?? MAX_COPIES;

export { BOONS, HEARTS, POTIONS };
export { SHELVED_LEGENDARIES, lendLegendaries } from './shelved';
export { SKINS, currentSkinId, skinDef, type SkinDef } from './cosmetics';

/**
 * The Riftwalker ids before they were named for their class (DECISIONS #190, 2026-10-25). A run save, a Vault deck, a remembered
 * choice or a server row made before then still says the old id: everything that reads one passes it through canonicalHero.
 */
export const LEGACY_HERO_IDS: Readonly<Record<string, HeroId>> = {
  maren: 'knight',
  rivet: 'engineer',
  kesh: 'hunter',
  vesper: 'trickster',
  // (the trapper became the Trickster, DECISIONS #372)
  trapper: 'trickster',
  quill: 'assassin',
  ilvane: 'shaman',
  // (the totemist became the Shaman, DECISIONS #371)
  totemist: 'shaman',
  sehra: 'monk',
  // (the Barbarian became the Monk, DECISIONS #391)
  barbarian: 'monk',
  astra: 'spellblade',
  mire: 'necromancer',
  kp: 'drunkard',
};

/**
 * Cards taken out of the game, and the card each becomes wherever an old save or deck still holds it (DECISIONS #312): a run, a
 * saved Arena deck, a ghost. Its Sanctum roll, engraving and upgrade carry over ("hi~heel+" becomes "hi~thick-hide+").
 */
export const RETIRED_CARDS: Readonly<Record<string, string>> = {
  'guard-dog': 'rend',
  heel: 'thick-hide',
  'call-gnashlings': 'thick-hide',
  howl: 'pack-tactics',
  ...TRIMMED_CARDS,
};

/** A card id as it is now: a retired card becomes its replacement, keeping its roll, engraving and upgrade; anything else is unchanged. */
export function canonicalCard(id: string): string {
  const m = /^((?:hi|lo)~)?((?:hold|opening|flare)\^)?(.+?)(\+?)$/.exec(id);
  // (a card retired into one that was itself retired later follows the chain to a card still in the game)
  let now = m ? RETIRED_CARDS[m[3] as string] : undefined;
  for (let i = 0; now && RETIRED_CARDS[now] && i < 8; i++) now = RETIRED_CARDS[now];
  return m && now ? `${m[1] ?? ''}${m[2] ?? ''}${now}${m[4] ?? ''}` : id;
}

/**
 * The classes rebuilt since runs were first saved (docs/BASE_CLASS_REWORKS.md, DECISIONS #415-#420), with the version of each rework. A
 * run of one of them saved before its rework is migrated on load, never read as if it had been played by the new rules: its cards that
 * left the pool become their nearest new cards (RETIRED_CARDS), a fight in progress starts again from its first turn (its move log was
 * made under the old rules), and the player is told what happened (`reworkNotice`).
 */
export const CLASS_REWORKS: Partial<Record<HeroId, { version: number; summary: string }>> = {
  knight: { version: 1, summary: 'Guard, Riposte and Thorns' },
};

/** A Riftwalker id as it is now: an old id becomes its class id, and anything else comes back as it was. */
export function canonicalHero(id: string): string {
  return Object.hasOwn(LEGACY_HERO_IDS, id) ? (LEGACY_HERO_IDS[id] as string) : id;
}

/** The playable realms in the order every screen lists them, with the name players read. */
export const REALMS: { id: RealmId; name: string }[] = [
  { id: 'aurelion', name: 'Aurelion' },
  { id: 'nexus', name: 'Nexus-9' },
  { id: 'wyldmaw', name: 'Wyldmaw' },
  { id: 'umbral', name: 'Umbral Veil' },
  { id: 'starfall', name: 'The Hollow Crown' },
  { id: 'gloomfen', name: 'Gloomfen' },
  { id: 'midden', name: 'The Midden' },
];

/** Riftwalkers grouped by realm (every screen that lists characters uses this, so they always group alike). */
export function heroesByRealm(): { realm: RealmId; name: string; heroes: HeroId[] }[] {
  const all = Object.keys(RIFTWALKERS) as HeroId[];
  return REALMS.map((r) => ({
    realm: r.id,
    name: r.name,
    heroes: all.filter((h) => RIFTWALKERS[h].realm === r.id),
  })).filter((g) => g.heroes.length > 0);
}
