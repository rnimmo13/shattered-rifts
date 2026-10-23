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
