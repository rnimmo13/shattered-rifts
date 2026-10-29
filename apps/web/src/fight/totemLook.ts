// How the Shaman's spirits are shown (DECISIONS #418): a mark and a word each, so a totem reads without colour. Shared by the totem
// panel (TotemPanel.tsx) and the choice tiles (PickModal.tsx). Presentation only: what a command does is the TotemDef's text.

export const TOTEM_LOOK: Record<string, { glyph: string; name: string }> = {
  hawk: { glyph: '⋀', name: 'Hawk' },
  bear: { glyph: '◼', name: 'Bear' },
  elder: { glyph: '✥', name: 'Elder' },
};

export const totemLook = (id: string): { glyph: string; name: string } =>
  TOTEM_LOOK[id] ?? { glyph: '◆', name: id };
