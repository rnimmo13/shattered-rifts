// How the Monk's forms are shown (DECISIONS #419): a mark, a name and the objective in a line. Shared by the Form panel and the form
// choice. Presentation only: the objectives themselves are the engine's (formProgress).

import type { Form } from '@sr/combat';

export const FORM_LOOK: Record<Form, { glyph: string; name: string; goal: string }> = {
  root: { glyph: '⛰', name: 'Root', goal: 'Two different Defensive techniques' },
  current: { glyph: '≋', name: 'Current', goal: 'A Defensive, then a Striking technique' },
  ember: { glyph: '✺', name: 'Ember', goal: 'Two different Striking techniques at one enemy' },
};
