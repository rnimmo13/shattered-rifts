// Tells the leaderboard where the saved runs are. A run is normally reported as it advances, but a report can be missed (offline, an
// older version, a name chosen later), so the saved runs are announced again when the app opens and when the campaign board is looked
// at. The server only moves a run forward and only as far as it believes, so this is safe to repeat.

import { stagesInAll } from '@sr/pvp';
import { reportRun } from '../pvp/boardApi';
import { getName, hasUsername } from '../pvp/config';
import { stagesCleared } from '../pvp/vault';
import { listRuns } from './saves';
import { runHistory } from './history';

/** Resolves once the server has answered (or a few seconds have passed): the board can be read after that. */
export async function syncSavedRuns(): Promise<void> {
  if (!hasUsername()) return;
  try {
    const sent = listRuns().flatMap(({ run }) => {
      const done = stagesCleared(run);
      // (every run from its first finished stop: one that has not cleared a stage yet is on the board too)
      if (stagesInAll(run.tier, done) === 0 && run.stats.nodesCleared === 0) return [];
      return [
        reportRun({
          completed: run.won === true,
          shards: run.shards,
          seed: run.seed,
          hero: run.character,
          ascendancy: run.ascendancy,
          tier: run.tier,
          stage: done,
          name: getName(),
        }),
      ];
    });
    // Repair known victories already retired under an older client's fallen/abandoned status.
    for (const run of runHistory().filter((r) => r.won)) {
      sent.push(
        reportRun({
          seed: run.id,
          hero: run.hero,
          ascendancy: run.ascendancy,
          tier: run.tier,
          stage: 3,
          name: getName(),
          completed: true,
        }),
      );
    }
    await Promise.race([Promise.all(sent), new Promise((r) => setTimeout(r, 4000))]);
  } catch {
    /* never in the way */
  }
}
