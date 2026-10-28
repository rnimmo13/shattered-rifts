import {
  OVERFLOW_NAME,
  OVERFLOW_PCT,
  cardText,
  type CardDef,
  type CombatDb,
  type IntentIcon,
  type StatusId,
} from '@sr/combat';
import { rollOf } from '@sr/content/v2';
import type { TipContent } from '../ui/tip';
import { rollNote } from '../cards/cardText';

export const STATUS_INFO: Record<
  StatusId,
  { name: string; glyph: string; tone: 'good' | 'bad'; text: string }
> = {
  exposed: {
    name: 'Exposed',
    glyph: '◎',
    tone: 'bad',
    text: 'Takes 50% more damage from attacks.',
  },
  faltering: {
    name: 'Faltering',
    glyph: '▽',
    tone: 'bad',
    text: 'Deals 25% less damage with attacks.',
  },
  might: { name: 'Might', glyph: '✦', tone: 'good', text: 'Attacks deal 1 more damage per stack.' },
  seared: {
    name: 'Bleed',
    glyph: '❣',
    tone: 'bad',
    text: 'Bleeding: takes damage equal to its stacks at the start of its turn, then loses 1 stack.',
  },
  stunned: {
    name: 'Stunned',
    glyph: '✖',
    tone: 'bad',
    text: 'Counts as Exposed, Faltering and Brittle at once (it never adds to them) until it wears off: takes 50% more attack damage, deals 25% less, and gains 25% less Barrier. It wears off at the end of its own turns, one each.',
  },
  thorns: {
    name: 'Thorns',
    glyph: '✱',
    tone: 'good',
    text: 'Deals damage back to whatever attacks it.',
  },
  shielded: { name: 'Shielded', glyph: '◈', tone: 'good', text: 'Ignores the next hit.' },
  resonance: {
    name: 'Spirit',
    glyph: '❖',
    tone: 'good',
    text: 'Your totems deal 1 more damage and give 1 more Barrier per stack, and Elder totems charge faster. Elements spells grow with it too.',
  },
  calm: {
    name: 'Serene',
    glyph: '☾',
    tone: 'good',
    text: 'A stance. Leaving it gives you 2 Mana (once a turn).',
  },
  wrath: {
    name: 'Fury',
    glyph: '♦',
    tone: 'bad',
    text: 'A stance. You deal double attack damage and take 50% more.',
  },
  radiant: {
    name: 'Radiant',
    glyph: '☀',
    tone: 'good',
    text: 'A stance. You deal triple attack damage. Entering it gives 1 Mana. It ends when your turn ends.',
  },
  mantra: {
    name: 'Fervor',
    glyph: '❂',
    tone: 'good',
    text: 'At 10 you spend it to enter Radiant.',
  },
  bracing: {
    name: 'Bracing',
    glyph: '▤',
    tone: 'good',
    text: 'Every Barrier you gain is 1 bigger per stack.',
  },
  brittle: { name: 'Brittle', glyph: '▥', tone: 'bad', text: 'Barrier it gains is 25% smaller.' },
  ghostly: {
    name: 'Ghostly',
    glyph: '☁',
    tone: 'good',
    text: 'Each hit it takes is capped at 1 damage. Fades each turn.',
  },
  steadfast: {
    name: 'Steadfast',
    glyph: '⛉',
    tone: 'good',
    text: 'Ignores the next debuff put on it, per stack.',
  },
  armored: {
    name: 'Armored',
    glyph: '▣',
    tone: 'good',
    text: 'Gains Barrier equal to its stacks at the end of its turn. Loses a stack each time an attack gets through.',
  },
  ritual: {
    name: 'Cadence',
    glyph: '☥',
    tone: 'good',
    text: 'Gains that much Might at the end of its turn.',
  },
  vigor: {
    name: 'Primed',
    glyph: '↯',
    tone: 'good',
    text: "Its next attack (an Attack card, or a companion's or enemy's strike) deals that much more damage on every hit, then it is spent.",
  },
  doom: {
    name: 'Fate',
    glyph: '☠',
    tone: 'bad',
    text: 'A curse. If its HP is at or below its Fate at the end of its turn, it dies.',
  },
  twinned: {
    name: 'Reverb',
    glyph: '⧉',
    tone: 'good',
    text: 'Your next Attack card is played twice.',
  },
  mirrored: {
    name: 'Mirrored',
    glyph: '⟷',
    tone: 'good',
    text: 'Your next Skill card is played twice.',
  },
  unbound: {
    name: 'Unbound',
    glyph: '⚯',
    tone: 'good',
    text: 'Your Skills cost 0 and are consumed when played.',
  },
  fortified: {
    name: 'Fortified',
    glyph: '▦',
    tone: 'good',
    text: 'You keep 75% of your Barrier at the start of your turn instead of losing all of it.',
  },
  plating: {
    name: 'Plating',
    glyph: '⛉',
    tone: 'good',
    text: 'Your Barrier survives each turn change up to this much, and the number shrinks by 1 every turn.',
  },
  clutch: {
    name: 'Clutch Genes',
    glyph: '✊',
    tone: 'good',
    text: 'You are hurt, and fight harder for it: you deal more attack damage (the number is the bonus, in %).',
  },
  hangover: {
    name: 'Hangover',
    glyph: '🍺',
    tone: 'bad',
    text: 'At the start of your next turn you lose this much HP (never your last one), then it clears. It stops at 10. Some of KP\'s cards hit harder the more of it you carry.',
  },
  holdfast: {
    name: 'Holdfast',
    glyph: '✋',
    tone: 'good',
    text: 'Your whole hand is held at the end of your turn (one turn per stack).',
  },
  edge: {
    name: 'Edge',
    glyph: '†',
    tone: 'good',
    text: 'Your Sleeve Knives deal 1 more damage per stack.',
  },
  sapped: {
    name: 'Sapped',
    glyph: '⇣',
    tone: 'bad',
    text: 'Its attacks deal this much less damage. It wears off at the end of its next turn.',
  },
  cruelty: {
    name: 'Cruelty',
    glyph: '☠',
    tone: 'good',
    text: 'Your attacks deal 25% more damage to Exposed enemies.',
  },
  sturdy: {
    name: 'Sturdy',
    glyph: '⛨',
    tone: 'good',
    text: 'Exposed enemies deal half damage to you until their next turn is over.',
  },
  unmovable: {
    name: 'Unmovable',
    glyph: '⛰',
    tone: 'good',
    text: 'The first Barrier a card gives you each turn counts double.',
  },
  freeattack: {
    name: 'Free Attack',
    glyph: '➤',
    tone: 'good',
    text: 'Your next Attack costs 0.',
  },
  // (Sylas, the Silent's shape: docs/decisions-pending/assassin.md)
  virulent: {
    name: 'Virulent',
    glyph: '☣',
    tone: 'good',
    text: 'Bleed on your enemies deals its damage this many more times each turn, losing 1 each time.',
  },
  honed: {
    name: 'Honed',
    glyph: '⚔',
    tone: 'good',
    text: 'Your Sleeve Knives Hold, and the first one you play each turn deals this much more damage.',
  },
  fanned: {
    name: 'Fanned',
    glyph: '✷',
    tone: 'good',
    text: 'Your Sleeve Knives hit ALL enemies.',
  },
  tracking: {
    name: 'Tracking',
    glyph: '⌖',
    tone: 'good',
    text: 'Your attacks deal 50% more damage to Faltering enemies.',
  },
  guarded: {
    name: 'Guarded',
    glyph: '⛉',
    tone: 'good',
    text: 'At the start of your next turn, gain this much Barrier.',
  },
  blur: {
    name: 'Blur',
    glyph: '◌',
    tone: 'good',
    text: 'Your Barrier is not removed at the start of your next turn (one turn per stack).',
  },
  meld: {
    name: 'Meld',
    glyph: '◐',
    tone: 'good',
    text: 'Barrier you gain is doubled. It wears off at the end of your turn.',
  },
  poised: {
    name: 'Poised',
    glyph: '↯',
    tone: 'good',
    text: 'At the start of your next turn you become Empowered.',
  },
  empowered: {
    name: 'Empowered',
    glyph: '⚡',
    tone: 'good',
    text: 'Your attacks deal double damage. It wears off at the end of your turn.',
  },
  strangled: {
    name: 'Strangled',
    glyph: '➰',
    tone: 'bad',
    text: 'Whenever the other side plays a card, it loses this much HP. It wears off at the end of that turn.',
  },
  freeskill: {
    name: 'Free Skill',
    glyph: '➤',
    tone: 'good',
    text: 'Your next Skill costs 0.',
  },
  planner: {
    name: 'Planner',
    glyph: '✎',
    tone: 'good',
    text: 'A Skill you play gains Sly for the rest of the fight.',
  },
};

/** One glyph per totem, for the totem row. */
export const RUNE_GLYPH: Record<string, string> = {
  spark: '▲',
  splinter: '✦',
  ward: '▣',
  hollow: '●',
  prism: '◉',
};

export const INTENT_GLYPH: Record<IntentIcon, string> = {
  attack: '⚔',
  defend: '⛨',
  buff: '↑',
  debuff: '↓',
  summon: '✚',
  special: '?',
};

/** Plain-language definitions of every term that can appear on a card, shown when you hover one. */
export const KEYWORD_INFO: Record<string, { name: string; text: string }> = {
  barrier: {
    name: 'Barrier',
    text: 'Absorbs damage before HP. It falls away at the start of its owner’s next turn.',
  },
  exhaust: {
    name: 'Consume',
    text: 'After you play it, it is removed from the rest of this fight.',
  },
  retain: { name: 'Hold', text: 'It stays in your hand when you end your turn.' },
  lifesteal: {
    name: 'Lifesteal',
    text: 'You heal this share of the HP the attack takes off. Damage stopped by Barrier does not count.',
  },
  growHp: {
    name: 'Max HP',
    text: 'Your companion gets this much more maximum HP for the rest of the fight, and heals as much.',
  },
  pointBlank: {
    name: 'Point Blank',
    text: 'It hits harder when there is only one enemy to hit: the whole spread lands on it.',
  },
  mana: { name: 'Mana', text: 'What you spend to play cards. It refills every turn.' },
  snare: {
    name: 'Trap',
    text: 'Played face down. It triggers on its own when its trigger happens, then returns to your discard pile.',
  },
  companion: {
    name: 'Companion',
    text: 'An ally that stands beside you and acts automatically when you end your turn. Single attacks aimed at your side hit your companions before they reach you.',
  },
  overflow: {
    name: OVERFLOW_NAME,
    text: `When a single attack kills a companion, ${OVERFLOW_PCT}% of the damage left over (after its Barrier and HP) carries through to its hero.`,
  },
  taunt: { name: 'Taunt', text: 'Enemies must attack this unit before anything else.' },
  innate: { name: 'Opening hand', text: 'It starts in your opening hand.' },
  ethereal: {
    name: 'Fleeting',
    text: 'If it is still in your hand when you end your turn, it is consumed.',
  },
  discard: {
    name: 'Discard',
    text: 'Choose cards from your hand to put in your discard pile. Some cards have a bonus when discarded.',
  },
  scry: {
    name: 'Foresee',
    text: 'Look at that many cards from the top of your draw pile. Choose one to draw and discard the rest.',
  },
  rune: {
    name: 'Totem',
    text: 'Totems stand in a row (3 slots). Each pulses a small effect at the end of your turn. A totem pushed out of a full row, or awakened by a card, bursts with its big effect and is gone.',
  },
  stance: {
    name: 'Stance',
    text: 'You are in at most one stance. Entering a new one leaves the old one.',
  },
  stars: {
    name: 'Arcana',
    text: 'A second resource. Cards gain it and spend it; it lasts the whole fight.',
  },
  forge: {
    name: 'Sharpen',
    text: 'Every copy of the Obsidian Blade permanently gains damage. If you have none, you get one.',
  },
  'sleeve-knife': { name: 'Sleeve Knife', text: 'A 0-cost Attack that is consumed.' },
  sly: {
    name: 'Sly',
    text: 'When a card makes you discard it, it is played for free (not when you end your turn).',
  },
  'buckshot-shell': {
    name: 'Buckshot Shell',
    text: 'A 0-cost Attack that hits every enemy and is consumed.',
  },
  power: { name: 'Aura', text: 'Played once: its effect lasts for the rest of the fight.' },
};

const WORDS = new Map<string, RegExp>();
/**
 * A keyword as it appears in rules text: capitalised as in the keyword's name (so "discard pile" is not the Discard keyword), whole
 * word, with the plural or a past tense ("Traps", "Consumed").
 */
function wordOf(name: string): RegExp {
  let re = WORDS.get(name);
  if (!re) {
    re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|ed|ing)?\\b`);
    WORDS.set(name, re);
  }
  return re;
}

/** The keywords a card uses, in reading order. */
export function keywordsOf(
  c: {
    kind: string;
    exhaust?: boolean | undefined;
    retain?: boolean | undefined;
    innate?: boolean | undefined;
    ethereal?: boolean | undefined;
    starCost?: number | undefined;
    statusCost?: { status: string; amount: number; x?: boolean } | undefined;
    x?: boolean | undefined;
    effects: readonly {
      op: string;
      status?: string;
      unit?: string;
      card?: string;
      stance?: string;
      lonePct?: number;
      lifesteal?: number;
    }[];
  },
  taunting: (unit: string) => boolean,
  /** the card's rules text as the player reads it: any status or keyword named there is explained too (Radiant, Fervor, Hold...) */
  text?: string,
): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  const add = (k: { name: string; text: string } | undefined) => {
    if (k && !out.some((x) => x.name === k.name)) out.push(k);
  };
  if (c.kind === 'snare') add(KEYWORD_INFO['snare']);
  if (c.kind === 'summon') add(KEYWORD_INFO['companion']);
  for (const o of c.effects) {
    if (o.op === 'barrier') add(KEYWORD_INFO['barrier']);
    if (o.lonePct) add(KEYWORD_INFO['pointBlank']);
    if (o.lifesteal) add(KEYWORD_INFO['lifesteal']);
    if (o.op === 'growHp') add(KEYWORD_INFO['growHp']);
    if (o.op === 'mana') add(KEYWORD_INFO['mana']);
    if (o.op === 'discard') add(KEYWORD_INFO['discard']);
    if (o.op === 'scry') add(KEYWORD_INFO['scry']);
    if (o.op === 'exhaustCards') add(KEYWORD_INFO['exhaust']);
    if (o.op === 'channel' || o.op === 'evoke' || o.op === 'runeSlots') add(KEYWORD_INFO['rune']);
    if (o.op === 'stance') add(KEYWORD_INFO['stance']);
    if (o.op === 'stars') add(KEYWORD_INFO['stars']);
    if (o.op === 'forge') add(KEYWORD_INFO['forge']);
    if (o.op === 'addCard' && o.card === 'sleeve-knife') add(KEYWORD_INFO['sleeve-knife']);
    if (o.op === 'addCard' && o.card === 'buckshot-shell') add(KEYWORD_INFO['buckshot-shell']);
    if (o.op === 'summon' && o.unit && taunting(o.unit)) add(KEYWORD_INFO['taunt']);
    if (o.op === 'status' && o.status) {
      const s = STATUS_INFO[o.status as StatusId];
      if (s) add({ name: s.name, text: s.text });
    }
  }
  if (c.exhaust || c.kind === 'power') add(KEYWORD_INFO['exhaust']);
  if (c.retain) add(KEYWORD_INFO['retain']);
  if (c.innate) add(KEYWORD_INFO['innate']);
  if (c.ethereal) add(KEYWORD_INFO['ethereal']);
  if (c.starCost) add(KEYWORD_INFO['stars']);
  if (c.statusCost) {
    const s = STATUS_INFO[c.statusCost.status as StatusId];
    if (s) add({ name: s.name, text: s.text });
  }
  // whatever else the rules text names, so no word on a card is left unexplained
  const names = (hay: string, name: string): boolean => wordOf(name).test(hay);
  if (text) {
    const hay = text.replace(/\*\*/g, '');
    for (const s of Object.values(STATUS_INFO)) if (names(hay, s.name)) add(s);
    for (const k of Object.values(KEYWORD_INFO)) if (names(hay, k.name)) add(k);
  }
  // ...and what those explanations name in turn (Fervor ends in "enter Radiant": so Radiant is explained too)
  for (const k of [...out])
    for (const s of Object.values(STATUS_INFO)) if (names(k.text, s.name)) add(s);
  return out;
}

/** The note beside a hovered sanctified card: what its roll did to each of its numbers (null for an ordinary card). */
export function sanctifiedNote(db: CombatDb, def: CardDef): { name: string; text: string } | null {
  const dir = rollOf(def.id);
  if (!dir) return null;
  const plain = db.cards[def.id.replace(/^(hi|lo)~/, '')];
  return plain ? rollNote(cardText(db, def), cardText(db, plain), dir) : null;
}

/** Tooltips for the parts of the screen that are not cards or statuses. */
export const UI_TIPS = {
  barrier: (n: number): TipContent => ({
    kicker: 'Defence',
    title: `Barrier ${n}`,
    tone: 'good',
    text: 'Absorbs damage before HP is touched. It falls away at the start of its owner’s next turn, so use it the turn you gain it.',
  }),
  hp: (hp: number, max: number): TipContent => ({
    kicker: 'Health',
    title: `${hp} / ${max} HP`,
    text: 'Hit points. Barrier absorbs damage first; at 0 HP it is defeated.',
  }),
  mana: (mana: number, max: number): TipContent => ({
    kicker: 'Resource',
    title: `Mana ${mana} / ${max}`,
    text: `What you spend to play cards (the number on the blue gem). It refills to ${max} at the start of your turn; unspent Mana is lost.`,
  }),
  lumen: (n: number): TipContent => ({
    kicker: 'Second resource',
    title: `Arcana ${n}`,
    text: 'Some cards gain Arcana. Cards with an orange orb under their Mana gem spend it. Unlike Mana it lasts the whole fight.',
  }),
  draw: {
    kicker: 'Pile',
    title: 'Draw pile',
    text: 'The cards you will draw from. When it runs out, your discard pile is shuffled back into it. Your hand holds at most 10 cards: any card you would draw beyond that goes straight to the discard pile. Click to see what is left (the order is hidden).',
  } as TipContent,
  discard: {
    kicker: 'Pile',
    title: 'Discard pile',
    text: 'Played and discarded cards wait here until the draw pile runs out. Click to look.',
  } as TipContent,
  consumed: {
    kicker: 'Pile',
    title: 'Consumed cards',
    text: 'Cards that were consumed are out of the fight until it ends. Click to look.',
  } as TipContent,
  taunt: {
    kicker: 'Keyword',
    title: 'Taunt',
    tone: 'good',
    text: 'Enemies must attack this unit before anything else.',
  } as TipContent,
  endTurn: {
    title: 'End turn',
    text: 'Your allies act, your totems pulse, your hand is discarded, then the enemies take their turn.',
    hint: 'Shortcut: E',
  } as TipContent,
  emptyRune: {
    kicker: 'Totem slot',
    title: 'Empty slot',
    text: 'A totem you plant goes here. A new totem in a full row pushes the oldest out and it bursts with its big effect.',
  } as TipContent,
  snare: (name: string | null, rules?: string): TipContent => ({
    kicker: 'Trap',
    title: name ?? 'A face-down Trap',
    text:
      rules ??
      'Set face down. It triggers on its own when its trigger happens, then returns to your discard pile.',
    hint: 'Triggers on its own, then goes to your discard pile.',
  }),
  potionSlot: {
    kicker: 'Potion belt',
    title: 'Empty potion slot',
    text: 'You can carry up to 3 potions. Fights and shops give them.',
  } as TipContent,
};

/** The tooltip for a status chip: buff or debuff, with what it does. */
export function statusTip(id: StatusId, n: number): TipContent {
  const s = STATUS_INFO[id];
  return {
    kicker: s.tone === 'good' ? 'Buff' : 'Debuff',
    title: `${s.name} ${n}`,
    tone: s.tone,
    text: s.text,
  };
}
