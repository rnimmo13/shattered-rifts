// What a tooltip says, and how an element asks for one (the layer that shows them is in Tooltip.tsx).

export interface TipContent {
  /** small label above the title: "Buff", "Boon (rare)", "Potion"... */
  kicker?: string;
  title: string;
  text?: string;
  /** colours the title: a buff, a debuff, or a plain fact */
  tone?: 'good' | 'bad' | 'plain' | 'potion' | 'boon';
  /** extra lines under the text (keyword definitions, for instance) */
  lines?: { title: string; text: string }[];
  /** a quieter last line: what clicking does */
  hint?: string;
}

/** Spread these onto any element to give it a tooltip: <span {...tipAttrs({ title: 'Barrier', text: '...' })}>. */
export function tipAttrs(c: TipContent): { 'data-tip': string; tabIndex?: number } {
  return { 'data-tip': JSON.stringify(c) };
}
