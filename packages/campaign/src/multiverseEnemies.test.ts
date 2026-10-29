// (DECISIONS #437) every encounter of the multiverse expansion turns up on a campaign map: the realms' own fights and Elites on their
// stages (the trios from the second), the far realms' in the Rift, and each new Warden at the end of a first or second stage.

import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { ENCOUNTERS } from '@sr/content/v2';
import { FINAL_STAGE, generateStageMap } from './mapgen';
import type { StageRealm } from './types';

const REALMS: StageRealm[] = ['aurelion', 'nexus', 'wyldmaw', 'umbral'];
// (the encounters before the expansion end with Vorthax; everything after it is new)
const NEW = ENCOUNTERS.slice(ENCOUNTERS.findIndex((e) => e.id === 'vorthax') + 1);

describe('the multiverse encounters on the map (DECISIONS #437)', () => {
  it('adds 48 encounters', () => {
    expect(NEW).toHaveLength(48);
  });

  it('every one of them is reachable on some stage', () => {
    const seen = new Map<string, number>(); // encounter -> the first stage it was seen on
    const note = (id: string | undefined, stage: number) => {
      if (id && !seen.has(id)) seen.set(id, stage);
    };
    for (let seed = 0; seed < 80; seed++) {
      for (const realm of REALMS) {
        for (const stage of [1, 2]) {
          for (const n of generateStageMap(seedRng(`mv-${seed}-${realm}-${stage}`), stage, realm)
            .nodes)
            note(n.enemyId, stage);
        }
      }
      const pool = [REALMS[seed % 4], REALMS[(seed + 1) % 4]] as StageRealm[];
      for (const n of generateStageMap(
        seedRng(`mv-rift-${seed}`),
        FINAL_STAGE,
        'rift',
        undefined,
        pool,
      ).nodes)
        note(n.enemyId, FINAL_STAGE);
    }
    for (const e of NEW)
      expect(seen.has(e.id), `${e.id} (${e.realm} ${e.kind}) never came up`).toBe(true);
    // the trios wait for the second stage
    for (const e of NEW.filter((x) => x.fromStage))
      expect(seen.get(e.id), e.id).toBeGreaterThanOrEqual(e.fromStage!);
  }, 60_000);

  it('a first stage never offers a trio', () => {
    for (let seed = 0; seed < 40; seed++)
      for (const realm of REALMS)
        for (const n of generateStageMap(seedRng(`trio-${seed}-${realm}`), 1, realm).nodes)
          expect(n.enemyId ?? '', n.id).not.toMatch(/-trio$/);
  });
});
