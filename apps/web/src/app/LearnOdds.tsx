// How to play > Odds & numbers: the chances in the game, read straight from the tables the game itself uses (so this page can never
// be out of date). For the testing phase: switch it off with SHOW_ODDS in learnFlags.ts.

import { useMemo } from 'react';
import {
  BOON_PRICE,
  CACHE_DISARM,
  CACHE_STASH,
  CACHE_TRAP_CHANCE,
  CACHE_TRAP_HP_PCT,
  ECHO_FALTERING,
  ECHO_FROM_TIER,
  ECHO_HP_PCT,
  GHOST_FALTERING,
  LOOP_BOON_CHANCE,
  CROSSED_MERCHANT_CHANCE,
  CROSSED_OFFER_CHANCE,
  ELITE_EVENT_CHANCE,
  ELITE_HEAL_PCT,
  ELITE_HEAL_LAST_TIER,
  eliteRewards,
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
  ALL_ELITE_TIER,
  GHOST_ARENA_TIER,
  GHOST_ARENA_HP_MULT,
  ALL_WARDEN_TIER,
  eliteFightChance,
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
  resolve: '+1 Resolve',
  twin: 'Copy a card of your choice',
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
        card). A reward offers three cards (an Omen takes one away from Tier III), each
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
          {PRICE['rare']} (rare) shards. Taking a card out of your deck costs {REMOVE_PRICE}, and each one at the same shop costs double the last; the next shop starts over.
        </li>
        <li>
          Potions cost {POTION_PRICE['common']} / {POTION_PRICE['uncommon']} /{' '}
          {POTION_PRICE['rare']} shards, and a Boon {BOON_PRICE}. From Tier III, the Omen Times Are Tough raises them all.
        </li>
        <li>
          {CROSSED_MERCHANT_CHANCE}% of merchants are visitors from another world who sell only one
          other Riftwalker&apos;s cards.
        </li>
      </ul>

      <h3>The map</h3>
      <p>
        Each stop on a map (after the first floor) is rolled: an Elite {NODE_ODDS.eliteFirst}%
        (the first one on a map, then {NODE_ODDS.eliteMore}%; from the third floor, and at most
        about three for every seven floors), a Merchant {NODE_ODDS.merchant}% (one or two in every seven floors), a Shrine{' '}
        {NODE_ODDS.shrine}% (from the third floor; the stop before a Warden is always a Shrine), an
        Event {NODE_ODDS.event}% (never three in a row). Whatever is left is a fight. An Event stop
        is not always an event: {EVENT_FIGHT_ODDS.duel}% of the time it is an ambush by a plain
        enemy and {EVENT_FIGHT_ODDS.elite}% an Elite (from the third floor), played and rewarded
        like any other fight.
      </p>
      <p>
        Every map has one Rift Cache on a middle floor: {CACHE_TRAP_CHANCE}% are trapped (spring it
        for {CACHE_TRAP_HP_PCT}% of your Max HP, reach past it for a Wound, or disarm it for{' '}
        {CACHE_DISARM} shards); an open one gives a Boon, a rare card or {CACHE_STASH} shards. From
        Tier {ECHO_FROM_TIER} every map also has one Echo: a ghost with {ECHO_HP_PCT}% of a ghost
        Warden&apos;s HP. You start a fight with it Faltering for {ECHO_FALTERING} turns (a ghost
        Warden, {GHOST_FALTERING}), and it pays as an Elite does (shards, potion and Boon chances), with one
        of its own cards for the card reward.
      </p>

      <p>
        Deeper in, plain fights turn into Elites, past those limits: {eliteFightChance(2)}% of them
        at Rift Tier 2, {eliteFightChance(5)}% at Tier 5, {eliteFightChance(10)}% at Tier 10,{' '}
        {eliteFightChance(15)}% at Tier 15, and every one from Tier {ALL_ELITE_TIER}. At Tier{' '}
        {ALL_WARDEN_TIER} every one of them is a Warden&apos;s fight, with a Warden&apos;s numbers, paid as an Elite and costing 2 Resolve if lost.
        Ambushes and fights an event starts follow the same odds.
      </p>

      <p>
        From Rift Tier {GHOST_FROM_TIER + 1} on, each Warden has a {GHOST_WARDEN_CHANCE}% chance of
        being a <b>ghost</b> instead: a deck from the Arena (one of the better ones, from any
        Riftwalker), played by the computer, with about {GHOST_BOSS_HP_BASE}x its Riftwalker&apos;s
        usual HP at first; its HP and damage then grow with the tier like every
        Warden&apos;s. From Tier {GHOST_ARENA_TIER} it takes the HP of an Arena fight
        ({GHOST_ARENA_HP_MULT}x, grown with the tier), about 15% more, and grows from there. If no ghost can be had, you fight the usual Warden. It pays the same Gift.
      </p>

      <h3>What a fight pays</h3>
      <ul>
        <li>
          Shards: {FIGHT_SHARDS.duel} for a fight, {FIGHT_SHARDS.elite} for an Elite at Tier 1,{' '}
          {FIGHT_SHARDS.warden} for a Warden.
        </li>
        <li>
          An Elite pays less the deeper you go, all but its card reward: at Tier 10,{' '}
          {eliteRewards(10).shards} shards, a {eliteRewards(10).potionPct}% potion chance and a{' '}
          {eliteRewards(10).boonPct}% Boon chance; from Tier {ALL_ELITE_TIER},{' '}
          {eliteRewards(ALL_ELITE_TIER).shards} shards, {eliteRewards(ALL_ELITE_TIER).potionPct}% and{' '}
          {eliteRewards(ALL_ELITE_TIER).boonPct}%.
        </li>
        <li>
          A Warden also leaves you Max HP for good: +{wardenMaxHp(1)} to Tier IV, +{wardenMaxHp(5)}{' '}
          from Tier V, +{wardenMaxHp(10)} from Tier X, +{wardenMaxHp(20)} at Tier XX.
        </li>
        <li>
          A potion drops {POTION_DROP_CHANCE.duel}% of the time after a fight and{' '}
          {POTION_DROP_CHANCE.elite}% after an Elite at Tier 1 (if your belt has room). Of potions:{' '}
          {pct(POTION_WEIGHTS.common, total(POTION_WEIGHTS))} common,{' '}
          {pct(POTION_WEIGHTS.uncommon, total(POTION_WEIGHTS))} uncommon,{' '}
          {pct(POTION_WEIGHTS.rare, total(POTION_WEIGHTS))} rare.
        </li>
        <li>
          At Tier 1 every Elite gives a Boon, any Boon you lack as likely as another (the merchant sells one the
          same way). Wardens give their Gift, and leave a Boon as well{' '}
          {LOOP_BOON_CHANCE}% of the time. An
          Elite also heals {ELITE_HEAL_PCT}% of your HP, up to Tier {ELITE_HEAL_LAST_TIER}.
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
        one prize. You may take it, which ends the spinning, or pay {ROLL_COST} more shards to let it
        go and spin again, or walk away (the shards you spent are gone).
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
