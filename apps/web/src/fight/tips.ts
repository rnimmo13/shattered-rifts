// One-time teaching tips, shown the first time something new appears in a fight. Pure data and a chooser, so it can be tested;
// which tips were seen is kept in this browser (and can be switched off).

import type { CombatView } from '@sr/combat';

export interface Tip {
  id: string;
  title: string;
  text: string;
}

/** What the fight's deck can do, so a tip can show before the first totem or Arcana is on the board. */
export interface TipContext {
  usesRunes: boolean;
  usesStars: boolean;
}

interface TipRule extends Tip {
  when: (v: CombatView, c: TipContext) => boolean;
}

const hero = (v: CombatView) => v.sides.a.units.find((u) => u.kind === 'hero');
const anyUnit = (v: CombatView, pred: (u: CombatView['sides']['a']['units'][number]) => boolean) =>
  [...v.sides.a.units, ...v.sides.b.units].some(pred);

/** In the order they are offered: the basics first, then whatever the fight puts in front of the player. */
export const TIP_RULES: TipRule[] = [
  {
    id: 'basics',
    title: 'Your turn',
    text: 'Tap or click a card to play it (or drag it up, or press 1-9); on a touch screen, a long press lifts it to read. You have 3 Mana a turn, and each card shows its cost. Above every enemy is what it will do next. Press E to end your turn. Your hand holds at most 10 cards.',
    when: () => true,
  },
  {
    id: 'ally',
    title: 'Companions',
    text: 'Allies on your side attack or defend by themselves when you end your turn. Enemies can hit them too; a unit with Taunt must be attacked first.',
    when: (v) => v.sides.a.units.some((u) => u.kind === 'ally'),
  },
  {
    id: 'runes',
    title: 'Totems',
    text: 'Your totems stand in the curved column beside you. At the end of every turn each one pulses a small effect. A new totem in a full row pushes the oldest out, and it bursts with its big effect. Cards that Awaken totems burst them early.',
    when: (v, c) => c.usesRunes || v.sides.a.runes.length > 0,
  },
  {
    // (the Monk's, DECISIONS #419)
    id: 'forms',
    title: 'Martial Forms',
    text: 'Your form (the Form panel by your hero) asks for two techniques each turn. In Current: a Defensive technique, then a Striking one. Complete it for 1 Mastery and 3 Barrier, then spend Mastery on cards such as Mountain Breaker.',
    when: (v) => !!v.sides.a.form,
  },
  {
    // (the Shaman's, DECISIONS #418)
    id: 'totems',
    title: 'The totem cycle',
    text: 'Your Hawk, Bear and Thunderbird (the Totems panel) work every turn while they stand. Spirit Call commands the front one ("Next"): it acts once more and is gone. A new totem goes to the back; in a full row it pushes the front one out, and that one acts. Spirit adds 1 to every totem number.',
    when: (v) => !!v.sides.a.totems,
  },
  {
    id: 'lumen',
    title: 'Arcana',
    text: 'Arcana is a second resource, in the orange orb beside your Mana. Some cards gain it; cards with an orange orb on them spend it. It lasts the whole fight, so you can save it for a big finisher.',
    when: (v, c) => c.usesStars || v.sides.a.stars > 0,
  },
  {
    id: 'stance',
    title: 'Stances',
    text: 'You are in at most one stance. Fury doubles the damage you deal but you take 50% more. Leaving Serene gives the Monk 2 Mana (once a turn, his Inner Fire). Radiant triples your damage until your turn ends.',
    when: (v) => {
      const h = hero(v);
      return !!h && (!!h.statuses.calm || !!h.statuses.wrath || !!h.statuses.radiant);
    },
  },
  {
    id: 'fervor',
    title: 'Fervor',
    text: 'Fervor builds up as you play cards that give it. At 10 you spend it and enter Radiant: triple damage, and 2 extra Mana, until your turn ends.',
    when: (v) => !!hero(v)?.statuses.mantra,
  },
  {
    id: 'hangover',
    title: 'Hangover',
    text: 'Drinks pay off now and leave a Hangover: at the start of your next turn you lose that much HP, but never your last one. It stops at 10. Clutch Genes makes you hit 1% harder for every 1% of your HP you are missing; Sweat It Out and Pass Out clear it, Hair of the Dog trades it for a little one.',
    when: (v) => !!hero(v)?.statuses.hangover,
  },
  {
    // (the Knight's Guard, DECISIONS #415)
    id: 'opening',
    title: 'Openings',
    text: 'An enemy is Open (the gold mark): your Barrier stopped at least half of its attack, or a card opened it. A Riposte against it, such as Sundering Blow, spends the Opening for its bonus; other attacks leave it. It goes at the end of your turn, and each enemy can only have one.',
    when: (v) => v.sides.b.units.some((u) => !!u.statuses.opening),
  },
  {
    // (the Assassin's, DECISIONS #416)
    id: 'knives',
    title: 'Knives and Preparation',
    text: 'Knife cards leave a knife in the enemy they hit (up to 3 each). Cards such as Draw Steel pull them out for a payoff, and each one pulled deals 3 more damage. Preparation (up to 3) stays from turn to turn until a finisher spends it.',
    when: (v) => v.sides.b.units.some((u) => !!u.statuses.knives) || !!hero(v)?.statuses.prep,
  },
  {
    // (the Spellblade's, DECISIONS #417)
    id: 'enchants',
    title: 'Enchantments',
    text: 'Your Obsidian Blade holds two enchantments (the panel by your hero). Spells Imbue them; blade attacks Discharge them: Ember adds 3 to the first hit, Glass breaks for 2 on every enemy after the attack, Ward gives 3 Barrier. Spend one now, or keep it for a bigger attack.',
    when: (v) => !!v.sides.a.enchants,
  },
  {
    id: 'doom',
    title: 'Fate',
    text: 'Cursing a unit with Fate does nothing until the end of its turn: then, if its HP is at or below its Fate, it dies. Stack it, double it, or hit it to bring the HP down to meet it.',
    when: (v) => anyUnit(v, (u) => !!u.statuses.doom),
  },
  {
    id: 'snare',
    title: 'Traps',
    text: 'A Trap is played face down. It triggers on its own the moment its trigger happens (an enemy attacks, summons, defends...), then returns to your discard pile. You can have up to 3 set.',
    when: (v) => v.sides.a.snares.length > 0,
  },
  {
    id: 'aura',
    title: 'Auras',
    text: 'An Aura stays in effect for the rest of the fight. The ones in play are listed at the top left; point at one to read it.',
    when: (v) => v.sides.a.powers.length > 0,
  },
];

const SEEN_KEY = 'sr.tips.seen';
const ON_KEY = 'sr.tips.on';

export function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

export function saveSeen(seen: ReadonlySet<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* non-fatal */
  }
}

export function loadTipsOn(): boolean {
  try {
    return localStorage.getItem(ON_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveTipsOn(on: boolean): void {
  try {
    localStorage.setItem(ON_KEY, on ? 'on' : 'off');
  } catch {
    /* non-fatal */
  }
}

/** The first tip that applies and has not been seen, or null. */
export function nextTip(v: CombatView, c: TipContext, seen: ReadonlySet<string>): Tip | null {
  const rule = TIP_RULES.find((r) => !seen.has(r.id) && r.when(v, c));
  return rule ? { id: rule.id, title: rule.title, text: rule.text } : null;
}
