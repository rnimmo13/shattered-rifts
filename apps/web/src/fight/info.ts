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
};

/** The keywords a card uses, in reading order. */
export function keywordsOf(
  c: {
    kind: string;
    exhaust?: boolean | undefined;
    retain?: boolean | undefined;
    effects: readonly { op: string; status?: string; unit?: string }[];
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
    if (o.op === 'summon' && o.unit && taunting(o.unit)) add(KEYWORD_INFO['taunt']);
    if (o.op === 'status' && o.status) {
      const s = STATUS_INFO[o.status as StatusId];
      if (s) add({ name: s.name, text: s.text });
    }
  }
  if (c.exhaust || c.kind === 'power') add(KEYWORD_INFO['exhaust']);
  if (c.retain) add(KEYWORD_INFO['retain']);
  return out;
}
