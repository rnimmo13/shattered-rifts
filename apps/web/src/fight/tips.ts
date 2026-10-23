// One-time teaching tips, shown the first time something new appears in a fight. Pure data and a chooser, so it can be tested;
// which tips were seen is kept in this browser (and can be switched off).

import type { CombatView } from '@sr/combat';

export interface Tip {
  id: string;
  title: string;
  text: string;
}

/** What the fight's deck can do, so a tip can show before the first rune or Lumen is on the board. */
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
    text: 'Drag a card up (or click it, or press 1-9) to play it. You have 3 Mana a turn, and each card shows its cost. Above every enemy is what it will do next. Press E to end your turn. Your hand holds at most 10 cards.',
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
    title: 'Runes',
    text: 'Your runes sit in the curved column beside you. At the end of every turn each one fires a small effect. A new rune in a full row pushes the oldest out, and it fires its big effect. Cards that Release runes fire them early.',
    when: (v, c) => c.usesRunes || v.sides.a.runes.length > 0,
  },
  {
    id: 'lumen',
    title: 'Lumen',
    text: 'Lumen is a second resource, in the gold orb beside your Mana. Some cards gain it; cards with a gold orb on them spend it. It lasts the whole fight, so you can save it for a big finisher.',
    when: (v, c) => c.usesStars || v.sides.a.stars > 0,
  },
  {
    id: 'stance',
    title: 'Stances',
    text: 'You are in at most one stance. Fury doubles the damage you deal but you take 50% more. Serene gives you 2 Mana when you leave it. Radiant triples your damage until your turn ends.',
    when: (v) => {
      const h = hero(v);
      return !!h && (!!h.statuses.calm || !!h.statuses.wrath || !!h.statuses.radiant);
    },
  },
  {
    id: 'fervor',
    title: 'Fervor',
    text: 'Fervor builds up as you play cards that give it. At 5 you spend it and enter Radiant: triple damage, and 2 extra Mana, until your turn ends.',
    when: (v) => !!hero(v)?.statuses.mantra,
  },
  {
    id: 'doom',
    title: 'Fate',
    text: 'Cursing a unit with Fate does nothing until the end of its turn: then, if its HP is at or below its Fate, it dies. Stack it, double it, or hit it to bring the HP down to meet it.',
    when: (v) => anyUnit(v, (u) => !!u.statuses.doom),
  },
  {
    id: 'snare',
    title: 'Snares',
    text: 'A Snare is played face down. It springs on its own the moment its trigger happens (an enemy attacks, summons, defends...), then returns to your discard pile. You can have up to 3 set.',
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
