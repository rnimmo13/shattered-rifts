// A Campaign fight shared by a link or opened from a saved file (DECISIONS #697): watch it, read its recap and battle log, share it
// again or save it as a file. A fight only plays back under the rules it was fought under.

import { Suspense, lazy, useEffect, useState } from 'react';
import { RULES_VERSION } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';
import { FightRecap } from '../fight/FightRecap';
import { ShareLink } from '../pvp/ShareLink';
import {
  downloadCampaignFight,
  fetchCampaignFight,
  fightLink,
  readCampaignFight,
  type CampaignFight,
} from './campaignFights';
import '../pvp/ranks.css';

const ReplayPlayer = lazy(() => import('../fight/ReplayPlayer'));

export default function CampaignFightScreen(props: { id?: string }) {
  const [got, setGot] = useState<CampaignFight | 'gone' | null | 'loading'>(
    props.id ? 'loading' : null,
  );
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [recap, setRecap] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!props.id) return;
    void fetchCampaignFight(props.id).then((r) => {
      if (alive) setGot(r);
    });
    return () => {
      alive = false;
    };
  }, [props.id]);

  const fight = typeof got === 'object' && got !== null ? got : null;
  const tools = fight && (
    <p>
      {fight.id && <ShareLink link={fightLink(fight.id)} label="Copy share link" />}{' '}
      <button className="btn btn--small" onClick={() => downloadCampaignFight(fight)}>
        <span>Save fight record</span>
      </button>
    </p>
  );

  if (!props.id && !fight)
    return (
      <main className="watchpage">
        <h1>Open a saved fight record</h1>
        <p>Choose a fight JSON file. The file stays on this device.</p>
        <input
          type="file"
          accept=".json,application/json"
          aria-label="Fight record file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 4_000_000) {
              setError('This file is too large.');
              return;
            }
            void file
              .text()
              .then((text) => {
                const parsed = readCampaignFight(JSON.parse(text) as unknown);
                if (!parsed) throw Error('Invalid fight record');
                setGot(parsed);
                setError('');
              })
              .catch(() => setError('This fight record could not be opened.'));
          }}
        />
        {error && <p role="alert">{error}</p>}
        <p>
          <a href="#/history">Back to History</a>
        </p>
      </main>
    );
  if (got === 'loading')
    return (
      <main className="watchpage">
        <p>Fetching the fight…</p>
      </main>
    );
  if (!fight)
    return (
      <main className="watchpage">
        <h1>Campaign fight</h1>
        <p>
          {got === 'gone'
            ? 'This fight is no longer kept: each player keeps their 10 most recent Campaign fights.'
            : 'The server could not be reached. Try again in a moment.'}
        </p>
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  if (fight.rules !== RULES_VERSION)
    return (
      <main className="watchpage">
        <h1>{fight.title}</h1>
        <p>
          This fight was played on an earlier version of the game (rules {fight.rules}, now{' '}
          {RULES_VERSION}), and the cards have changed since: it would not play out the same way, so
          it cannot be shown. The record can still be saved.
        </p>
        {tools}
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  if (!playing)
    return (
      <main className="watchpage">
        <h1>{fight.title}</h1>
        <p>
          {fight.at ? `${new Date(fight.at).toLocaleString()} · ` : ''}
          {fight.won ? 'Won' : 'Lost'} · Tier {fight.tier} · version {fight.version}
        </p>
        <button className="btn" onClick={() => setPlaying(true)}>
          <span>Watch the fight</span>
        </button>{' '}
        <button className="btn btn--small" onClick={() => setRecap(true)}>
          <span>Recap and battle log</span>
        </button>
        {tools}
        <a className="btn btn--small" href="#/history">
          <span>History</span>
        </a>
        {recap && (
          <FightRecap db={COMBAT_DB} replay={fight.replay} onClose={() => setRecap(false)} />
        )}
      </main>
    );
  return (
    <Suspense fallback={<div className="loading">Opening the fight…</div>}>
      <ReplayPlayer
        replay={fight.replay}
        closeLabel="Fight record"
        onClose={() => setPlaying(false)}
        topExtra={
          <>
            {fight.id && <ShareLink link={fightLink(fight.id)} label="Share" />}
            <button className="btn btn--small" onClick={() => downloadCampaignFight(fight)}>
              <span>Save fight record</span>
            </button>
          </>
        }
      />
    </Suspense>
  );
}
