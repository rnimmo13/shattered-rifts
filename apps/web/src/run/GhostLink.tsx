// Makes the computer-played match for a ghost Warden (once per fight) and hands the fight screen its link; stops it when the fight leaves.

import { useEffect, useState, type ReactNode } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import type { CombatSetup, Side } from '@sr/combat';
import type { PvpLink } from '../pvp/link';
import { createGhostDuel } from './ghostDuel';

export function GhostLink(props: {
  setup: CombatSetup;
  names: Record<Side, string>;
  progress: PvpLink['progress'];
  /** where this fight's moves are kept (so a reload resumes it) */
  logKey: string;
  children: (link: PvpLink) => ReactNode;
}) {
  const [duel] = useState(() =>
    createGhostDuel(COMBAT_DB, props.setup, {
      names: props.names,
      progress: props.progress,
      key: props.logKey,
    }),
  );
  useEffect(() => {
    duel.activate();
    return () => duel.dispose();
  }, [duel]);
  return <>{props.children(duel.link)}</>;
}
