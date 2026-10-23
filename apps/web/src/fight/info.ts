import type { IntentIcon, StatusId } from '@sr/combat';
import type { TipContent } from '../ui/tip';

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
  stunned: { name: 'Stunned', glyph: '✖', tone: 'bad', text: 'Skips its next action.' },
  thorns: {
    name: 'Thorns',
    glyph: '✱',
    tone: 'good',
    text: 'Deals damage back to whatever attacks it.',
  },
  shielded: { name: 'Shielded', glyph: '◈', tone: 'good', text: 'Ignores the next hit.' },
  resonance: {
    name: 'Resonance',
    glyph: '❖',
    tone: 'good',
    text: 'Your runes deal 1 more damage and give 1 more Barrier per stack, and Hollow runes charge faster.',
  },
  calm: {
    name: 'Serene',
    glyph: '☾',
    tone: 'good',
    text: 'A stance. Leaving it gives you 2 Mana.',
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
    text: 'A stance. You deal triple attack damage. It ends when your turn ends.',
  },
  mantra: {
    name: 'Fervor',
    glyph: '❂',
    tone: 'good',
    text: 'At 5 you spend it to enter Radiant.',
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
    text: 'Its next Attack card deals that much more damage on every hit, then it is spent.',
  },
  doom: {
    name: 'Fate',
    glyph: '☠',
    tone: 'bad',
    text: 'A curse. If its HP is at or below its Fate at the end of its turn, it dies.',
  },
  twinned: {
    name: 'Twinned',
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
    text: 'Your Barrier does not fall away at the start of your turn.',
  },
  clutch: {
    name: 'Clutch Genes',
    glyph: '✊',
    tone: 'good',
    text: 'You are hurt, and fight harder for it: you deal more attack damage (the number is the bonus, in %).',
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
};

/** One glyph per rune, for the rune row. */
export const RUNE_GLYPH: Record<string, string> = {
  spark: '⚡',
  splinter: '✦',
  ward: '◈',
  hollow: '●',
  prism: '◇',
};

export const INTENT_GLYPH: Record<IntentIcon, string> = {
  attack: '⚔',
  defend: '⛨',
  buff: '▲',
  debuff: '▼',
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
  mana: { name: 'Mana', text: 'What you spend to play cards. It refills every turn.' },
  snare: {
    name: 'Snare',
    text: 'Played face down. It springs on its own when its trigger happens, then returns to your discard pile.',
  },
  companion: {
    name: 'Companion',
    text: 'An ally that stands beside you and acts automatically when you end your turn.',
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
    text: 'Look at the top cards of your draw pile and discard any you do not want.',
  },
  rune: {
    name: 'Rune',
    text: 'Runes sit in a row (3 slots). Each fires a small effect at the end of your turn. A rune pushed out of a full row, or released by a card, fires its big effect and is gone.',
  },
  stance: {
    name: 'Stance',
    text: 'You are in at most one stance. Entering a new one leaves the old one.',
  },
  stars: {
    name: 'Lumen',
    text: 'A second resource. Cards gain it and spend it; it lasts the whole fight.',
  },
  forge: {
    name: 'Sharpen',
    text: 'Every copy of the Starforged Blade permanently gains damage. If you have none, you get one.',
  },
  'sleeve-knife': { name: 'Sleeve Knife', text: 'A 0-cost Attack that is consumed.' },
  'buckshot-shell': {
    name: 'Buckshot Shell',
    text: 'A 0-cost Attack that hits every enemy and is consumed.',
  },
  power: { name: 'Aura', text: 'Played once: its effect lasts for the rest of the fight.' },
};

/** The keywords a card uses, in reading order. */
export function keywordsOf(
  c: {
    kind: string;
    exhaust?: boolean | undefined;
    retain?: boolean | undefined;
    innate?: boolean | undefined;
    ethereal?: boolean | undefined;
    starCost?: number | undefined;
    x?: boolean | undefined;
    effects: readonly {
      op: string;
      status?: string;
      unit?: string;
      card?: string;
      stance?: string;
    }[];
  },
  taunting: (unit: string) => boolean,
): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  const add = (k: { name: string; text: string } | undefined) => {
    if (k && !out.some((x) => x.name === k.name)) out.push(k);
  };
  if (c.kind === 'snare') add(KEYWORD_INFO['snare']);
  if (c.kind === 'summon') add(KEYWORD_INFO['companion']);
  for (const o of c.effects) {
    if (o.op === 'barrier') add(KEYWORD_INFO['barrier']);
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
  return out;
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
    title: `Lumen ${n}`,
    text: 'Some cards gain Lumen. Cards with a gold orb under their Mana gem spend it. Unlike Mana it lasts the whole fight.',
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
    text: 'Your allies act, your runes fire, your hand is discarded, then the enemies take their turn.',
    hint: 'Shortcut: E',
  } as TipContent,
  emptyRune: {
    kicker: 'Rune slot',
    title: 'Empty slot',
    text: 'A rune you conjure goes here. A new rune in a full row pushes the oldest out and it fires its big effect.',
  } as TipContent,
  snare: (name: string | null, rules?: string): TipContent => ({
    kicker: 'Snare',
    title: name ?? 'A face-down Snare',
    text:
      rules ??
      'Set face down. It springs on its own when its trigger happens, then returns to your discard pile.',
    hint: 'Springs on its own, then goes to your discard pile.',
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
