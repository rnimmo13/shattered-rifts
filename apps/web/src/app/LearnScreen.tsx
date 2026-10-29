import { useState } from 'react';
import {
  DMG_PER_STAGE,
  DMG_PER_TIER,
  HP_PER_STAGE,
  HP_PER_TIER,
  LOOP_LEGEND_CHANCE,
  MAX_TIER,
  OMENS,
  enemyScale,
  preludeCatalogue,
} from '@sr/campaign';
import { BOONS, COMBAT_DB, HEARTS, RIFTWALKERS, heroesByRealm } from '@sr/content/v2';
import { KEYWORD_INFO, STATUS_INFO } from '../fight/info';
import { TIP_RULES } from '../fight/tips';
import { LearnOdds } from './LearnOdds';
import { SHOW_ODDS } from './learnFlags';

/** The keywords worth a place in the combat tab, in the order a new player meets them. */
const CORE_KEYWORDS = ['mana', 'barrier', 'companion', 'overflow', 'taunt', 'snare', 'power'];
/** Card words (what a card's text says it does) */
const CARD_WORDS = ['exhaust', 'retain', 'ethereal', 'innate', 'discard', 'scry'];
/** Mechanics that belong to one Riftwalker's way of playing */
const SIGNATURE_WORDS = [
  'rune',
  'stance',
  'stars',
  'forge',
  'knives',
  'prep',
  'riposte',
  'guard',
  'buckshot-shell',
  'stagger',
];

const TABS = [
  { id: 'start', label: 'Start here' },
  { id: 'run', label: 'A run' },
  { id: 'combat', label: 'Combat' },
  { id: 'cards', label: 'Card words' },
  { id: 'status', label: 'Statuses' },
  { id: 'heroes', label: 'Riftwalkers' },
  { id: 'odds', label: 'Odds & numbers' },
] as const;
type Tab = (typeof TABS)[number]['id'];

function Words(props: { ids: string[] }) {
  return (
    <dl>
      {props.ids.map((id) => {
        const k = KEYWORD_INFO[id];
        return k ? (
          <div key={id} className="learn__row">
            <dt>{k.name}</dt>
            <dd>{k.text}</dd>
          </div>
        ) : null;
      })}
    </dl>
  );
}

function Steps(props: { items: [string, string][] }) {
  return (
    <ol className="learn__steps">
      {props.items.map(([head, text]) => (
        <li key={head}>
          <b>{head}</b> <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}

/** What each Rift Tier asks of you, read from the tier table the fights use (packages/campaign/src/tierTable.ts). */
function TierTable() {
  const tiers = Array.from({ length: MAX_TIER }, (_, i) => i + 1);
  return (
    <>
      <p className="learn__note">
        Every Rift Tier up adds {HP_PER_TIER}% enemy HP and {DMG_PER_TIER}% enemy damage; each stage
        of a run adds {HP_PER_STAGE}% HP and {DMG_PER_STAGE}% damage.
      </p>
      <table className="learn__table learn__table--tiers">
        <thead>
          <tr>
            <th rowSpan={2}>Rift Tier</th>
            <th colSpan={3}>Enemy HP (% of base)</th>
            <th colSpan={3}>Enemy damage (% of base)</th>
          </tr>
          <tr>
            {['Stage 1', 'Stage 2', 'Stage 3', 'Stage 1', 'Stage 2', 'Stage 3'].map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => {
            const stages = [1, 2, 3].map((st) => enemyScale(t, st));
            return (
              <tr key={t}>
                <th>{t}</th>
                {stages.map((x, i) => (
                  <td key={'h' + i}>{x.hp}%</td>
                ))}
                {stages.map((x, i) => (
                  <td key={'d' + i}>{x.dmg}%</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** Every Threshold / Waymark option, read from the same data the game offers (packages/campaign/src/preludes.ts). */
function PreludeList() {
  const c = preludeCatalogue(1);
  const row = (o: { id: string; name: string; text: string }) => (
    <div key={o.id} className="learn__row">
      <dt>{o.name}</dt>
      <dd>{o.text}</dd>
    </div>
  );
  return (
    <>
      <h4>Blessings</h4>
      <dl>{[c.rest, ...c.blessings].map(row)}</dl>
      <h4>At a price</h4>
      <dl>{c.bargains.map(row)}</dl>
    </>
  );
}

const ROMAN = [
  '',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
];
const roman = (n: number): string => ROMAN[n] ?? String(n);

/** Every Omen, in the order they arrive: what it does when it comes, and what it has grown to by the last tier. */
function OmenList() {
  return (
    <dl>
      {OMENS.map((o) => {
        const first = o.text(o.tier);
        const last = o.text(MAX_TIER);
        return (
          <div key={o.id} className="learn__row">
            <dt>
              {o.name} <i>(from Tier {roman(o.tier)})</i>
            </dt>
            <dd>
              {first}
              {last !== first && (
                <>
                  {' '}
                  By Tier {roman(MAX_TIER)}: {last}
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Every Warden's Heart. */
function HeartList() {
  return (
    <dl>
      {HEARTS.map((h) => (
        <div key={h.id} className="learn__row">
          <dt>{h.name}</dt>
          <dd>{h.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Every Boon, rarest last. */
function BoonList() {
  const order = ['common', 'uncommon', 'rare', 'legendary'] as const;
  return (
    <dl>
      {order.flatMap((rarity) =>
        BOONS.filter((b) => b.rarity === rarity).map((b) => (
          <div key={b.id} className="learn__row">
            <dt>
              {b.name} <i>({rarity === 'legendary' ? 'Legendary' : rarity})</i>
            </dt>
            <dd>{b.text}</dd>
          </div>
        )),
      )}
    </dl>
  );
}

/** #/learn: every mechanic in plain words, one short tab at a time. */
export function LearnScreen() {
  const [tab, setTab] = useState<Tab>('start');
  const basics = TIP_RULES.find((t) => t.id === 'basics');
  const runes = Object.values(COMBAT_DB.runes ?? {});
  const statuses = Object.values(STATUS_INFO);
  return (
    <main className="learn">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">How to play</h1>
      <nav className="learn__tabs" aria-label="How to play">
        {TABS.filter((t) => t.id !== 'odds' || SHOW_ODDS).map((t) => (
          <button
            key={t.id}
            aria-pressed={tab === t.id}
            className={`learn__tab${tab === t.id ? ' is-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'odds' && SHOW_ODDS && <LearnOdds />}

      {tab === 'start' && (
        <section>
          <h2>Start here</h2>
          <p>
            Shattered Rifts is a card-fighting game. You pick a Riftwalker, build a deck as you go,
            and fight through three stages. Every fight is a short card battle, and your HP carries
            from one to the next.
          </p>
          <h3>One turn, step by step</h3>
          <Steps
            items={[
              ['Look at the enemies.', 'The icon above each one shows what it will do next turn.'],
              [
                'Play cards.',
                'Drag a card up, click it, or press 1-9. You have 3 Mana a turn and every card shows its cost.',
              ],
              [
                'End your turn.',
                'Press E. Your companions act, then the enemies do what their icons showed.',
              ],
              ['Repeat', 'until every enemy is down. Lose all your HP and the fight is lost.'],
            ]}
          />
          <p className="learn__note">{basics?.text}</p>
          <h3>Where to go next</h3>
          <ul>
            <li>
              <b>A run</b>: what the map, rewards and Resolve are.
            </li>
            <li>
              <b>Combat</b>: Barrier, companions, Traps and the rest of the rules.
            </li>
            <li>
              <b>Riftwalkers</b>: how each character wants to play.
            </li>
          </ul>
        </section>
      )}

      {tab === 'run' && (
        <section>
          <h2>A run</h2>
          <p>
            A run is three stages, each a little longer than a short dungeon. Each stage is a map:
            pick a path from the bottom up, and the Warden waits at the top.
          </p>
          <h3>Places on the map</h3>
          <dl>
            {[
              ['Fight', 'A normal fight. Win it and pick a card for your deck.'],
              ['Elite', 'A tougher fight with a better reward, including a Boon.'],
              [
                'Event',
                'A short story with a choice. Some cost HP, some give a gift, some turn into a fight, and some simply go badly.',
              ],
              [
                'Shrine',
                "Rest to heal, upgrade a card, or remove one for good (or walk away). From Tier VI it is a Gambler's Shrine: take two different blessings from seven, including wagers like a Sacrifice for a Rift-crossed card, Loaded Dice, the Chisel and the Ledger, with a free spin of the Spin To Win reel beside them.",
              ],
              ['Merchant', 'Spend shards on cards, potions and Boons. You can also sell potions.'],
              ['Warden', 'The stage boss. Beat it to heal a little and win back 1 Resolve.'],
            ].map(([n, t]) => (
              <div key={n} className="learn__row">
                <dt>{n}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
          <h3>Ancestral cards</h3>
          <p>
            A deck can hold two Ancestral cards, which only special events offer. There are no
            Legendary cards for now.
          </p>
          <h3>Resolve</h3>
          <p>
            Losing a fight does not end the run: you spend Resolve (1 for a normal fight or a
            Warden, 2 for an Elite) and retry it at full HP. When Resolve hits 0 the run collapses.
          </p>
          <h3>Rift Tiers</h3>
          <p>
            Your deck is saved for the Arena as you go (after every stop you finish). Clear all
            three stages and you can stop there, or <b>Continue</b> to the next Rift Tier: you heal
            fully and keep your deck, but enemies have more HP and hit harder. Fall (or give up in
            the middle of a fight) and the run&apos;s deck leaves the Arena; give up anywhere else
            and it stays. The climb ends at Tier 20.
          </p>
          <div className="learn__tierbox">
            <p>
              Here is how tough enemies are at every stage of every tier, as a percentage of their
              base HP and damage (Tier I already starts above it). It only ever goes up: every stage
              is harder than the one before it, and stage 1 of the next tier is harder than the Rift
              of this one.
            </p>
            <TierTable />
          </div>
          <h3>Omens</h3>
          <p>
            From Tier II every Rift Tier brings an Omen, and they stack: at Tier V you face the
            Omens of Tiers II to V together. Each grows a little with every tier after it. In a
            fight they sit at the top right, and the run bar lists the ones in play.
          </p>
          <OmenList />
          <h3>Your deck</h3>
          <ul>
            <li>You start with a small deck. Rewards, shops and events add cards.</li>
            <li>A thin deck draws its best cards more often. Skipping a reward is fine.</li>
            <li>Upgrading a card at a Shrine gives it a "+" version that is better or cheaper.</li>
            <li>
              Some events engrave a word on a card for good: <b>Hold</b> (it stays in your hand),{' '}
              <b>Opening hand</b> (it is always in your first hand) or <b>Flare</b> (it costs 1
              less, but is consumed when played).
            </li>
          </ul>
          <h3>The Threshold and the Waymarks</h3>
          <p>
            Every run opens at <b>The Threshold</b>: three blessings and one option at a price.
            Every stage opens at a <b>Waymark</b>: a rest, two blessings, and half the time an
            option at a price. These are all of them (shard amounts grow a little with each stage;
            Resolve is only offered when you are missing some).
          </p>
          <PreludeList />
          <h3>Boons</h3>
          <p>
            Boons last for the whole run, and every tier after it. Elites give one; the merchant
            sells one (never a Legendary); some events and Threshold options give one; and beating
            Vorthax leaves a Legendary Boon {LOOP_LEGEND_CHANCE}% of the time. A run holds one
            Legendary Boon at most. Wardens give their Gift instead.
          </p>
          <BoonList />
          <h3>Warden&rsquo;s Hearts</h3>
          <p>
            After a Warden you may take a rare card, one of two Hearts, or nothing. A Heart changes
            every fight for the rest of the run, always at a price, and you hold one at a time: a
            new Heart replaces the old one.
          </p>
          <HeartList />
        </section>
      )}

      {tab === 'combat' && (
        <section>
          <h2>Combat</h2>
          <h3>The basics</h3>
          <Words ids={CORE_KEYWORDS} />
          <h3>Special rules of one Riftwalker</h3>
          <p>
            Some mechanics belong to one character. You will only meet these on that character's
            cards (or against enemies that use them).
          </p>
          <Words ids={SIGNATURE_WORDS} />
          <h3>The totems (Shaman)</h3>
          <dl>
            {runes.map((r) => (
              <div key={r.id} className="learn__row">
                <dt>{r.name}</dt>
                <dd>{r.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {tab === 'cards' && (
        <section>
          <h2>Card words</h2>
          <p>Short words on a card. Hover one in a fight to see it again.</p>
          <Words ids={CARD_WORDS} />
        </section>
      )}

      {tab === 'status' && (
        <section>
          <h2>Statuses</h2>
          <p>Little badges next to a unit's HP bar. The number is how many stacks it has.</p>
          <h3>Good for whoever has them</h3>
          <dl>
            {statuses
              .filter((s) => s.tone === 'good')
              .map((s) => (
                <div key={s.name} className="learn__row">
                  <dt>
                    {s.glyph} {s.name}
                  </dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
          </dl>
          <h3>Bad for whoever has them</h3>
          <p className="learn__note">
            Cards in the Neutral cleansing line (Shake It Off, Steady Nerves) lessen every one of
            these on you by a stack or two. Only the rarest, Purging Light, dispels them completely.
          </p>
          <dl>
            {statuses
              .filter((s) => s.tone === 'bad')
              .map((s) => (
                <div key={s.name} className="learn__row">
                  <dt>
                    {s.glyph} {s.name}
                  </dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
          </dl>
        </section>
      )}

      {tab === 'heroes' && (
        <section>
          <h2>Riftwalkers</h2>
          <p>How each character plays, and the mechanics their cards use.</p>
          {heroesByRealm().map((g) => (
            <div key={g.realm} className="learn__realm">
              <h3>{g.name}</h3>
              {g.heroes.map((h) => (
                <div key={h} className="learn__hero learn__more">
                  <h4 className="learn__heroName">{RIFTWALKERS[h].hero.name}</h4>
                  <p className="learn__trait">
                    <b>{RIFTWALKERS[h].trait.name}.</b> {RIFTWALKERS[h].trait.text}
                  </p>
                  <h5>How they play</h5>
                  <ul>
                    {RIFTWALKERS[h].howTo.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  <h5>Mechanics</h5>
                  <ul>
                    {RIFTWALKERS[h].mechanics.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
