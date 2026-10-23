import type { IntentIcon, StatusId } from '@sr/combat';

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
    name: 'Seared',
    glyph: '♨',
    tone: 'bad',
    text: 'Takes damage equal to its stacks at the start of its turn, then loses 1 stack.',
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
    name: 'Calm',
    glyph: '☾',
    tone: 'good',
    text: 'A stance. Leaving it gives you 2 Mana.',
  },
  wrath: {
    name: 'Wrath',
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
    name: 'Mantra',
    glyph: '❂',
    tone: 'good',
    text: 'At 5 you spend it to enter Radiant.',
  },
  edge: {
    name: 'Edge',
    glyph: '†',
    tone: 'good',
    text: 'Your Shivs deal 1 more damage per stack.',
  },
};

/** One glyph per rune, for the rune row. */
export const RUNE_GLYPH: Record<string, string> = {
  spark: '⚡',
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
    name: 'Exhaust',
    text: 'After you play it, it is removed from the rest of this fight.',
  },
  retain: { name: 'Retain', text: 'It stays in your hand when you end your turn.' },
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
  innate: { name: 'Innate', text: 'It starts in your opening hand.' },
  ethereal: { name: 'Ethereal', text: 'If it is still in your hand when you end your turn, it is exhausted.' },
  discard: {
    name: 'Discard',
    text: 'Choose cards from your hand to put in your discard pile. Some cards have a bonus when discarded.',
  },
  scry: {
    name: 'Scry',
    text: 'Look at the top cards of your draw pile and discard any you do not want.',
  },
  rune: {
    name: 'Rune',
    text: 'Runes sit in a row (3 slots). Each fires a small effect at the end of your turn. A rune pushed out of a full row, or evoked by a card, fires its big effect and is gone.',
  },
  stance: {
    name: 'Stance',
    text: 'You are in at most one stance. Entering a new one leaves the old one.',
  },
  stars: { name: 'Stars', text: 'A second resource. Cards gain them and spend them; they last the whole fight.' },
  forge: {
    name: 'Forge',
    text: 'Every copy of the Sovereign Blade permanently gains damage. If you have none, you get one.',
  },
  shiv: { name: 'Shiv', text: 'A 0-cost Attack that exhausts.' },
  power: { name: 'Power', text: 'Played once: its effect lasts for the rest of the fight.' },
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
    effects: readonly { op: string; status?: string; unit?: string; card?: string; stance?: string }[];
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
    if (o.op === 'addCard' && o.card === 'shiv') add(KEYWORD_INFO['shiv']);
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
