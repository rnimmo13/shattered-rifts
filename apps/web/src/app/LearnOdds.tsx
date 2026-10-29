// How to play > Odds & numbers: the chances in the game, read straight from the tables the game itself uses (so this page can never
// be out of date). For the testing phase: switch it off with SHOW_ODDS in learnFlags.ts.

import { useMemo } from 'react';
import {
  BOON_PRICE,
  BOON_WEIGHTS,
  LOOP_LEGEND_CHANCE,
  CROSSED_MERCHANT_CHANCE,
  CROSSED_OFFER_CHANCE,
  ELITE_EVENT_CHANCE,
  ELITE_HEAL_PCT,
  EVENT_TAG_LABEL,
  FIGHT_SHARDS,
  GHOST_BOSS_HP_BASE,
  wardenMaxHp,
  GHOST_FROM_TIER,
  GHOST_WARDEN_CHANCE,
  REEL_KINDS,
  REEL_PRIZES,
  ROLL_COST,
  CARD_ODDS,
  NODE_ODDS,
  EVENT_FIGHT_ODDS,
  POTION_DROP_CHANCE,
  POTION_PRICE,
  POTION_WEIGHTS,
  PRICE,
  REMOVE_PRICE,
  eventOffers,
} from '@sr/campaign';
import { PRIZE_MARK } from '../trials/prizes';
import { WithArrows } from '../ui/Arrow';

const pct = (w: number, total: number): string => `${Math.round((w / total) * 100)}%`;
const total = (w: Record<string, number>): number => Object.values(w).reduce((a, b) => a + b, 0);
const RARITIES = ['common', 'uncommon', 'rare'] as const;

/** what a prize on the Brass Reel is, by kind */
const LANE_LABEL: Record<string, string> = {
  card: 'A rare card of yours (the top prize, only one)',
  rare: 'A rare card of yours',
  boon: 'A Boon',
  crossed: 'Pick 1 of 3 Rift-crossed rares',
  upgrade: 'Upgrade 2 or 3 cards',
  shards: 'Shards',
  heal: 'Heal 40%',
  hp: '+10 max HP and heal',
  potion: 'A rare potion',
  thin: 'Remove up to 2 cards of your choice',
};
export function LearnOdds() {
  const events = useMemo(() => eventOffers(), []);
  return (
    <section>
      <h2>Odds &amp; numbers</h2>
      <p className="learn__note">
        <b>Testing phase.</b> These are the real numbers, read straight from the game, so they are
        always up to date. They may change as we balance, and this page will be hidden later.
      </p>

      <h3>Card rewards after a fight</h3>
      <p>
        Each card offered is rolled separately, from the Riftwalker&apos;s own cards. If a rarity
        has nothing left to offer (you hold every copy), the roll falls to the next rarity down.
        About {CROSSED_OFFER_CHANCE} cards in 100 come from another Riftwalker (a Rift-crossed
        card). A reward offers three cards (four from Tier IV; an Omen can take one away), each
        rolled like this.
      </p>
      <table className="learn__table">
        <thead>
          <tr>
            <th>Chance per card</th>
            <th>Fight</th>
            <th>Elite</th>
          </tr>
        </thead>
        <tbody>
          {RARITIES.map((r) => (
            <tr key={r}>
              <th scope="row">{r[0]?.toUpperCase() + r.slice(1)}</th>
              {(['duel', 'elite'] as const).map((q) => {
                const w = CARD_ODDS[q];
                return <td key={q}>{pct(w[r] ?? 0, total(w))}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Warden, merchants and prices</h3>
      <ul>
        <li>A Warden&apos;s Gift offers rare cards of your class.</li>
        <li>
          Merchant cards cost {PRICE['common']} (common), {PRICE['uncommon']} (uncommon),{' '}
          {PRICE['rare']} (rare) shards. Taking a card out of your deck costs {REMOVE_PRICE}.
        </li>
        <li>
          Potions cost {POTION_PRICE['common']} / {POTION_PRICE['uncommon']} /{' '}
          {POTION_PRICE['rare']} shards, and Boons {BOON_PRICE['common']} / {BOON_PRICE['uncommon']}{' '}
          / {BOON_PRICE['rare']} (common / uncommon / rare; a Legendary Boon is never for sale).
        </li>
        <li>
          {CROSSED_MERCHANT_CHANCE}% of merchants are visitors from another world who sell only one
          other Riftwalker&apos;s cards.
        </li>
      </ul>

      <h3>The map</h3>
      <p>
        Each stop on a stage (after the first floor) is rolled: an Elite {NODE_ODDS.eliteFirst}%
        (the first one on a stage, then {NODE_ODDS.eliteMore}%; from the third floor, and only two
        or three a stage), a Merchant {NODE_ODDS.merchant}% (two at most), a Shrine{' '}
        {NODE_ODDS.shrine}% (from the third floor; the stop before a Warden is always a Shrine), an
        Event {NODE_ODDS.event}% (never three in a row). Whatever is left is a fight. An Event stop
        is not always an event: {EVENT_FIGHT_ODDS.duel}% of the time it is an ambush by a plain
        enemy and {EVENT_FIGHT_ODDS.elite}% an Elite (from the third floor), played and rewarded
        like any other fight.
      </p>

      <p>
        From Rift Tier {GHOST_FROM_TIER + 1} on, each Warden has a {GHOST_WARDEN_CHANCE}% chance of
        being a <b>ghost</b> instead: a deck from the Arena (one of the better ones, from any
        Riftwalker), played by the computer, with about {GHOST_BOSS_HP_BASE}x its Riftwalker&apos;s
        usual HP at first; its HP and damage then grow with the tier and stage like every
        Warden&apos;s. If no ghost can be had, you fight the usual Warden. It pays the same Gift.
      </p>

      <h3>What a fight pays</h3>
      <ul>
        <li>
          Shards: {FIGHT_SHARDS.duel} for a fight, {FIGHT_SHARDS.elite} for an Elite,{' '}
          {FIGHT_SHARDS.warden} for a Warden.
        </li>
        <li>
          A Warden also leaves you Max HP for good: +{wardenMaxHp(1)} to Tier IV, +{wardenMaxHp(5)}{' '}
          from Tier V, +{wardenMaxHp(10)} from Tier X, +{wardenMaxHp(20)} at Tier XX.
        </li>
        <li>
          A potion drops {POTION_DROP_CHANCE.duel}% of the time after a fight and{' '}
          {POTION_DROP_CHANCE.elite}% after an Elite (if your belt has room). Of potions:{' '}
          {pct(POTION_WEIGHTS.common, total(POTION_WEIGHTS))} common,{' '}
          {pct(POTION_WEIGHTS.uncommon, total(POTION_WEIGHTS))} uncommon,{' '}
          {pct(POTION_WEIGHTS.rare, total(POTION_WEIGHTS))} rare.
        </li>
        <li>
          Every Elite gives a Boon:{' '}
          {pct(BOON_WEIGHTS.elite?.['common'] ?? 0, total(BOON_WEIGHTS.elite ?? {}))} common,{' '}
          {pct(BOON_WEIGHTS.elite?.['uncommon'] ?? 0, total(BOON_WEIGHTS.elite ?? {}))} uncommon,{' '}
          {pct(BOON_WEIGHTS.elite?.['rare'] ?? 0, total(BOON_WEIGHTS.elite ?? {}))} rare,{' '}
          {pct(BOON_WEIGHTS.elite?.['legendary'] ?? 0, total(BOON_WEIGHTS.elite ?? {}))} Legendary
          (the merchant&apos;s Boon rolls the same way, but never Legendary). Wardens give their
          Gift, not a Boon. Beating Vorthax leaves a Legendary Boon {LOOP_LEGEND_CHANCE}% of the
          time. A run holds one Legendary Boon at most: once you have one, no other turns up. An
          Elite also heals {ELITE_HEAL_PCT}% of your HP.
        </li>
      </ul>

      <h3>Events</h3>
      <p>
        There are {events.count} events. They are rolled by weight, and about every{' '}
        {Math.round(100 / ELITE_EVENT_CHANCE)}th event ({ELITE_EVENT_CHANCE}%) is an{' '}
        <b>Elite Event</b> instead (see Spin To Win below). Of the ordinary events, the share that
        offer each kind of thing in at least one of their choices:
      </p>
      <dl>
        {(Object.keys(EVENT_TAG_LABEL) as (keyof typeof EVENT_TAG_LABEL)[]).map((t) => (
          <div key={t} className="learn__row">
            <dt>{events.share[t]}%</dt>
            <dd>{EVENT_TAG_LABEL[t]}</dd>
          </div>
        ))}
      </dl>
      <p className="learn__note">
        A few events only come up in the right state (a buried map you kept, low HP, a lot of
        shards, a Boon to give up), so the real share you meet can differ a little.
      </p>

      <h3>Elite Event: Spin To Win</h3>
      <p>
        A reel of {REEL_PRIZES} prizes, all in plain sight. The first spin is free, and each spin
        after it costs {ROLL_COST} shards: the reel scrolls past a pointer and slows to a stop on
        one prize. You may take it, or pay {ROLL_COST} more shards to let it go and spin again, or
        walk away (the shards you spent are gone).
      </p>
      <p>
        <b>Fair by design.</b> What the reel stops on is drawn by the rules before the reel moves,
        and every prize is equally likely: a first spin stops on each one{' '}
        {Math.round(100 / REEL_PRIZES)}% of the time, and a spin after that never stops on the prize
        you are holding (so each of the other {REEL_PRIZES - 1} is about{' '}
        {Math.round(100 / (REEL_PRIZES - 1))}%). The prizes stand in different places on the reel
        every time. Getting one particular prize takes about {REEL_PRIZES} spins (
        {REEL_PRIZES * ROLL_COST} shards) on average.
      </p>
      <p>
        Every Elite Event has the same {REEL_PRIZES} prizes (where they stand on the reel is
        shuffled each time):
      </p>
      <table className="learn__table learn__table--lanes">
        <tbody>
          <tr>
            {[...REEL_KINDS].map((k, i) => {
              const mark = PRIZE_MARK[k] ?? PRIZE_MARK['shards']!;
              return (
                <td key={i} title={LANE_LABEL[k]} style={{ color: mark.color }}>
                  <WithArrows text={mark.glyph} />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className="learn__note">
        {Object.entries(LANE_LABEL)
          .map(([k, label]) => `${PRIZE_MARK[k]?.glyph ?? ''} ${label}`)
          .join(' · ')}
      </p>
    </section>
  );
}
