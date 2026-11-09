// The Share button on a Campaign fight's result (DECISIONS #697): the fight is saved for the signed-in player as the result shows, and the
// button copies its link; with no account or no connection, the fight can still be saved as a file.

import { useEffect, useState } from 'react';
import { ShareLink } from '../pvp/ShareLink';
import {
  downloadCampaignFight,
  fightLink,
  saveCampaignFight,
  type CampaignFight,
} from './campaignFights';

export function ShareFight(props: { fight: CampaignFight }) {
  const [id, setId] = useState<string | null | 'saving'>('saving');
  const { fight } = props;
  useEffect(() => {
    let live = true;
    void saveCampaignFight(fight).then((got) => {
      if (live) setId(got);
    });
    return () => {
      live = false;
    };
    // (one save per fight: the replay object is the fight's identity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fight.replay]);
  return (
    <>
      {id === 'saving' ? (
        <button className="btn btn--small btn--ghost" disabled>
          <span>Saving the fight…</span>
        </button>
      ) : id ? (
        <ShareLink link={fightLink(id)} label="Share fight" />
      ) : null}
      <button
        className="btn btn--small btn--ghost"
        onClick={() => downloadCampaignFight(id && id !== 'saving' ? { ...fight, id } : fight)}
      >
        <span>Save fight record</span>
      </button>
    </>
  );
}
