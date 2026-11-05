import { crestPic } from '../fight/fxMoments';
import { Picture } from '../ui/Picture';
import { useState } from 'react';
import {
  DMG_PER_TIER,
  HP_PER_TIER,
  LOOP_BOON_CHANCE,
  MAX_TIER,
  OMENS,
  enemyScale,
  floorsOf,
  preludeCatalogue,
} from '@sr/campaign';
import type { StatusId } from '@sr/combat';
import { ASCENDANCIES, BOONS, COMBAT_DB, HEARTS, RIFTWALKERS, heroesByRealm } from '@sr/content/v2';
import { KEYWORD_INFO, STATUS_INFO } from '../fight/info';
import { TIP_RULES } from '../fight/tips';
import { STATUS_ICONS } from '../art/gameIcons';
import { GameIcon } from '../ui/GameIcon';
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
  'command',
  'element',
  'stars',
  'sword',
  'spell',
  'shatter',
  'grows',
  'forge',
  'sleeve-knife',
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
        Every Rift Tier adds {HP_PER_TIER} percentage points of enemy HP and {DMG_PER_TIER} of enemy
        damage, at the same rate through the final gauntlet, up to {enemyScale(MAX_TIER, 1).hp}% HP
        and {enemyScale(MAX_TIER, 1).dmg}% damage at Tier {MAX_TIER}.
      </p>
      <table className="learn__table learn__table--tiers">
        <thead>
          <tr>
            <th>Rift Tier</th>
            <th>Floors</th>
            <th>Enemy HP (% of base)</th>
            <th>Enemy damage (% of base)</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => {
            const x = enemyScale(t, 1);
            return (
              <tr key={t}>
                <th>{t}</th>
                <td>{t === MAX_TIER ? '11 Wardens + Valerion' : floorsOf(t) + 1}</td>
                <td>{x.hp}%</td>
                <td>{x.dmg}%</td>
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
      <h4>From Tier IV, once you have beaten Tier III</h4>
      <p>
        The rest heals more, these join the offers, and the small blessings and common cards stop
        coming.
      </p>
      <dl>{[c.ascended.rest, ...c.ascended.blessings, ...c.ascended.bargains].map(row)}</dl>
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
      {OMENS.filter((o) => o.tier <= MAX_TIER).map((o) => {
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

/** Every Ascendancy, by class; or one class's (on its Riftwalker's page, where the class needs no naming). */
function AscendancyList(props: { hero?: string }) {
  return (
    <dl>
      {ASCENDANCIES.filter((a) => !props.hero || a.hero === props.hero).map((a) => (
        <div key={a.id} className="learn__row">
          <dt>
            <Picture id={crestPic(a.id)} className="learn__crest">
              {null}
            </Picture>
            {a.name}{' '}
            {!props.hero && (
              <i>(from the {RIFTWALKERS[a.hero as keyof typeof RIFTWALKERS].hero.name})</i>
            )}
          </dt>
          <dd>{a.text}</dd>
        </div>
      ))}
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

/** Every Boon. */
function BoonList() {
  return (
    <dl>
      {BOONS.map((b) => (
        <div key={b.id} className="learn__row">
          <dt>{b.name}</dt>
          <dd>{b.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** #/learn: every mechanic in plain words, one short tab at a time. */
export function LearnScreen() {
  const [tab, setTab] = useState<Tab>('start');
  const basics = TIP_RULES.find((t) => t.id === 'basics');
  // (the Shaman's spirits, DECISIONS #418)
  const runes = Object.values(COMBAT_DB.totems ?? {});
  // (the old totems' Focus left every live card with the Shaman's rework: not taught, still defined; the Monk's stances are back, #428)
  // (and the reverted reworks' marks, #428: no live card makes them; the first Shaman rework's Rousing and Shelter too)
  const RETIRED: readonly string[] = [
    'resonance',
    'knives',
    'prep',
    'twinedge',
    'mastery',
    'opening',
    'rousing',
    'shelter',
  ];
  const statuses = Object.entries(STATUS_INFO)
    .filter(([id]) => !RETIRED.includes(id))
    .map(([id, s]) => ({ ...s, id: id as StatusId }));
  return (
    <main className="learn">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">How to play</h1>
      <p>
        <a className="btn btn--small btn--ghost" href="#/lore">
          The story · Explore the worlds
        </a>
      </p>
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
            and climb the Rift Tiers. Every fight is a short card battle, and your HP carries from
            one to the next.
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
            Progress through the realms, facing each Warden once in a shuffled order. Maps start at{' '}
            {floorsOf(1) + 1} stops and add one stop per tier. The final gauntlet brings back every
            Warden in a fresh shuffled order: all eleven Wardens, then Valerion, with normal Warden
            healing and rewards between fights. Desktop paths run left to right; mobile paths run
            top to bottom.
          </p>
          <h3>Places on the map</h3>
          <dl>
            {[
              ['Fight', 'A normal fight. Win it and pick a card for your deck.'],
              ['Elite', 'A tougher fight with a better reward, often a Boon.'],
              [
                'Event',
                'A short story with a choice. Some cost HP, some give a gift, some turn into a fight, and some simply go badly.',
              ],
              [
                'Shrine',
                "Rest to heal, upgrade a card, or remove one for good (or walk away). From Tier VI it is a Gambler's Shrine: take one blessing from seven, including wagers like a Sacrifice for a Rift-crossed card, Loaded Dice, the Chisel and the Ledger, or a free spin of the Spin To Win reel instead. Only one: the shrine closes after it.",
              ],
              ['Merchant', 'Spend shards on cards, potions and Boons. You can also sell potions.'],
              [
                'Rift Cache',
                'One on every map, with no fight. An open one lets you take one thing: a Boon, a rare card or a pile of shards. A trapped one holds the Boon and a rare card together, if you pay: spring the trap (HP), reach past it (a Wound) or disarm it (shards). You can always walk away.',
              ],
              ['Warden', 'The boss of the tier. Beat it to heal a little and win back 1 Resolve.'],
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
            Warden, 2 for an Elite, or for a Warden met at an Elite's stop) and retry it at full HP.
            When Resolve hits 0 the run collapses.
          </p>
          <h3>Rift Tiers</h3>
          <p>
            Your deck is saved for the Arena as you go (after every stop you finish). Beat a
            tier&apos;s Warden and you can stop there, or <b>Continue</b> to the next Rift Tier: you
            keep your deck and your HP, and enemies have more HP and hit harder. Fall (or give up in
            the middle of a fight) and the run&apos;s deck leaves the Arena; give up anywhere else
            and it stays. Defeat the final gauntlet and Valerion to seal the rifts.
          </p>
          <div className="learn__tierbox">
            <p>
              Here is how long every tier is and how tough its enemies are, as a percentage of their
              base HP and damage. It only ever goes up.
            </p>
            <TierTable />
          </div>
          <h3>Omens</h3>
          <p>
            Every Rift Tier brings a new Omen, starting with the first, and they stack: at Tier V
            you face every Omen up to there together. Each grows with every tier after it. In a
            fight they sit at the top right, and the run bar lists the ones in play. In the final
            gauntlet, Fraying Ward halves automatic healing between fights; Warden recovery is 15%
            of max HP instead of 30%. Combat healing and Resolve retries retain their usual effects.
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
            Every tier after the first opens at a <b>Waymark</b>: a rest, two blessings, and half
            the time an option at a price. These are all of them (shard amounts grow a little deeper
            in; Resolve is only offered when you are missing some; an option that could not do all
            it says, like removing Strikes you no longer have, is not offered).
          </p>
          <PreludeList />
          <h3>Ascendancies</h3>
          <p>
            Beat the last Warden of Tier III and your reward is an Ascendancy: one of three, in
            place of the usual Gift. Your class changes, a new trait joins the old one, and it stays
            with that run and its deck, in the Arena too.
          </p>
          <AscendancyList />
          <h3>Boons</h3>
          <p>
            Boons last for the whole run, and every tier after it. Elites often give one; the
            merchant sells one; some events and Threshold options give one; and beating Valerion
            leaves one {LOOP_BOON_CHANCE}% of the time. Wardens give their Gift instead.
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
                    <GameIcon art={STATUS_ICONS[s.id]} pic={s.id} className="learn__icon" />{' '}
                    {s.name}
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
                    <GameIcon art={STATUS_ICONS[s.id]} pic={s.id} className="learn__icon" />{' '}
                    {s.name}
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
                  <h5>Ascendancies</h5>
                  <AscendancyList hero={h} />
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
