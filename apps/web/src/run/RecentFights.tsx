// History's Campaign fights (DECISIONS #697): the signed-in player's 10 most recent Campaign fights, kept on the server, each to watch
// or share by its link.

import { useEffect, useState } from 'react';
import { RULES_VERSION } from '@sr/pvp';
import { ShareLink } from '../pvp/ShareLink';
import { fightLink, recentCampaignFights, type CampaignFightSummary } from './campaignFights';

export function RecentFights() {
  const [fights, setFights] = useState<CampaignFightSummary[] | null | 'loading'>('loading');
  useEffect(() => {
    let live = true;
    void recentCampaignFights().then((f) => {
      if (live) setFights(f);
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <>
      <p className="history__lead">
        Your 10 most recent Campaign fights, kept online. Open one to watch it or read its battle
        log, or copy its link to share it with a friend or the developer. A fight from an older
        version of the rules can still be saved, but not watched.
      </p>
      {fights === 'loading' && <p className="history__empty">Fetching your fights…</p>}
      {fights === null && (
        <p className="history__empty">
          Your fights could not be fetched: check your connection. (The desktop's offline profile
          keeps no fights online.)
        </p>
      )}
      {Array.isArray(fights) && fights.length === 0 && (
        <p className="history__empty">No Campaign fights kept yet: they appear as each one ends.</p>
      )}
      {Array.isArray(fights) && fights.length > 0 && (
        <ol className="history__list">
          {fights.map((f) => (
            <li key={f.id} className="history__run">
              <a href={`#/campaign-fight/${f.id}`}>
                <strong>{f.title}</strong>
              </a>{' '}
              · {f.won ? 'Won' : 'Lost'} · {new Date(f.at).toLocaleString()}
              {f.rules !== RULES_VERSION && ' · older rules'}{' '}
              <ShareLink link={fightLink(f.id)} label="Copy link" />
            </li>
          ))}
        </ol>
      )}
      <p>
        <a className="btn btn--small btn--ghost" href="#/campaign-fight">
          <span>Open a saved fight record</span>
        </a>
      </p>
    </>
  );
}
