// The campaign board is told when a run ends, so it can say "Fell" or "Abandoned" instead of "Live" (DECISIONS #292).

import type { RunState } from '@sr/campaign';
import { reportRunEnd } from '../pvp/boardApi';
import { getName, hasUsername } from '../pvp/config';
import { stagesCleared } from '../pvp/vault';

/** Report how this run ended (a run with no username is not on the board, so nothing is sent). Never throws. */
export function endOnBoard(run: RunState, how: 'fell' | 'abandoned'): void {
  if (!hasUsername()) return;
  void reportRunEnd(
    {
      seed: run.seed,
      hero: run.character,
      tier: run.tier,
      stage: stagesCleared(run),
      name: getName() || 'Riftwalker',
    },
    how,
  );
}
