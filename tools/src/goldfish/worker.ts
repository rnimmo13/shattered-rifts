import { parentPort } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { COMBAT_DB } from '@sr/content/v2';
import type { CombatDb } from '@sr/combat';
import { goldfish, type GoldfishJob } from './goldfish';

// A script patch (.ts / .mjs) exports a default function that changes the card table in place: for changes a JSON patch cannot say
// (every HP cost at once, an Ascendancy's numbers). It runs once per worker, before the first game.
let loaded: Promise<void> | undefined;
const scriptPatch = (file: string): Promise<void> =>
  (loaded ??= import(pathToFileURL(file).href).then((m: { default: (db: CombatDb) => void }) =>
    m.default(COMBAT_DB),
  ));

parentPort!.on('message', (job: GoldfishJob) => {
  void (async () => {
    try {
      let j = job;
      if (job.patch && /\.(ts|mjs)$/.test(job.patch)) {
        await scriptPatch(job.patch);
        const { patch: _done, ...rest } = job;
        j = rest;
      }
      parentPort!.postMessage({ ok: true, result: goldfish(j) });
    } catch (e) {
      parentPort!.postMessage({ ok: false, error: `${job.deck.name}: ${String(e)}` });
    }
  })();
});
