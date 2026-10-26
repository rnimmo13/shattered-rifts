// A finished fight watched again: the fight screen in its watching mode, fed every move of the fight from the start. The engine is
// deterministic, so the same setup and the same moves play out exactly as they did. Used for the replay offered after a fight, the
// run history's last fight, and Arena replays shared by link.

import { useMemo, useState } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import type { Side } from '@sr/combat';
import { FightView, type WatchMode } from './FightView';
import { MoveFeed, type PvpLink } from '../pvp/link';
import type { FightReplay } from './recap';

export default function ReplayPlayer(props: {
  replay: FightReplay;
  onClose: () => void;
  /** how the match ended, when it was not by a hero falling (an Arena resignation or a missed clock) */
  end?: { winner: Side | 'draw'; reason: string } | null;
  closeLabel?: string;
  /** more in the top bar (a Share button) */
  topExtra?: React.ReactNode;
}) {
  // (watching again starts a new screen from the first move)
  const [round, setRound] = useState(0);
  return <Replay key={round} {...props} onAgain={() => setRound((n) => n + 1)} />;
}

function Replay(props: {
  replay: FightReplay;
  onClose: () => void;
  onAgain: () => void;
  end?: { winner: Side | 'draw'; reason: string } | null;
  closeLabel?: string;
  /** more in the top bar (a Share button) */
  topExtra?: React.ReactNode;
}) {
  const { replay } = props;
  // (made once: the screen reads its moves from this feed, and a new one would start it over)
  const [watch] = useState((): WatchMode => {
    const feed = new MoveFeed();
    replay.moves.forEach((m, i) =>
      feed.push({
        kind: 'move',
        move: { seq: i + 1, seat: m.seat, action: m.action, hash: '', deadline: 0 },
        history: false,
      }),
    );
    return { feed, total: replay.moves.length, end: props.end ?? null };
  });
  // an Arena match is watched over a link that never sends (the seats' names and tags come with it)
  const link = useMemo((): PvpLink | undefined => {
    if (!replay.names) return undefined;
    return {
      seat: replay.me,
      names: replay.names,
      progress: replay.progress ?? { a: { tier: 1 }, b: { tier: 1 } },
      feed: watch.feed,
      send: () => false,
      replay: 0,
      deadline: null,
      skew: 0,
      end: null,
      series: null,
    };
  }, [replay, watch]);
  return (
    <FightView
      db={COMBAT_DB}
      setup={replay.setup}
      title={`Replay: ${replay.title}`}
      {...(replay.venue ? { venue: replay.venue } : {})}
      {...(link ? { pvp: link } : {})}
      watch={watch}
      exitLabel={props.closeLabel ?? 'Close the replay'}
      topExtra={props.topExtra}
      onExit={props.onClose}
      onDone={props.onClose}
      resultExtra={() => (
        <button className="btn btn--small" onClick={props.onAgain}>
          <span>Watch again</span>
        </button>
      )}
    />
  );
}
