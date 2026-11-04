import type { RunState } from './types';

/** Campaign ghosts are paused (#592). Arena ghosts remain available. */
export const CAMPAIGN_GHOSTS_ENABLED = false;

/** Keep old saves playable using each encounter's authored enemy fallback. */
export function withoutCampaignGhosts(run: RunState): RunState {
  if (CAMPAIGN_GHOSTS_ENABLED) return run;
  const r = JSON.parse(JSON.stringify(run)) as RunState;
  for (const node of r.map.nodes) {
    if (node.kind === 'echo') node.kind = 'duel';
    delete node.ghost;
    delete node.ghostDeck;
  }
  if (r.context && typeof r.context === 'object') {
    delete r.context.ghost;
    delete r.context.ghostAsked;
  }
  if (
    typeof r.eventResult === 'string' &&
    (r.eventResult.startsWith('Ghost Warden!') || r.eventResult.startsWith('Echo!'))
  )
    delete r.eventResult;
  return r;
}
