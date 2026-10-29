# The Monk rebuilt: Martial Forms and Mastery (2026-10-29, DECISIONS #419)

From `docs/BASE_CLASS_REWORKS.md` §12, Option A (approved by Robert with the rework brief). The Watcher-shaped Monk he was (Serene's
Mana on exit, Fury's double damage, Fervor to a Radiant turn; DECISIONS #391-#413) is frozen in
`reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (`cards/monk.md`). Card prices: [`monk-ledger.md`](monk-ledger.md)
(generated); rates: `docs/14_CARD_COSTING.md` §15.

**Main question:** which technique does this hand let me complete, and should I commit to it or adapt? A form changes the objective
he pursues, never a global multiplier.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| Forms | `HeroTrait.forms` gives the side `SideState.form`: **Root**, **Current** or **Ember**, one at a time; he starts every fight in Current. No form multiplies damage, makes Mana, makes him take more, or gives anything on entry or exit. |
| Techniques | A card tagged `defensive` ("Defensive technique.") or `striking` ("Striking technique.") is a step when played **from hand** (a free play from a pile is not; an echo replays the effects, not the step). An untagged card neither helps nor breaks the progress. A card is one step; no card has both tags (tested). |
| Objectives | **Root:** two different Defensive techniques (card ids; a "+" is the same card). **Current:** a Defensive technique, then a Striking technique of another card, in that order. **Ember:** two different Striking techniques aimed at the same enemy (an all-enemies strike aims at none). |
| Completion | At most **once a turn**, however often he changes form: 1 **Mastery** and the `technique` triggers (the trait's 3 Barrier, Perfected Motion, Unmoved Mind). The progress and the once-a-turn flag reset at his turn's start. |
| Mastery | Status `mastery` on the hero: at most 3 (`MASTERY_MAX`), kept between turns. Spent by the generic `spend` op (`spendMastery`, at most 2 a card, tested); `per('masterySpent')` reads it. Two cards give it (Wreath of Flame after a completion, Coiled Serpent). |
| Form change | `form(f)` changes form and starts the turn's progress again (not the once-a-turn flag); `form('*')` asks, and keeping the form is allowed (Read the Rhythm). |
| Visibility | `SideView.form`, `formProgress` (0-2) and `formDone` for both players; the `form` event moves the panel as it happens. No reaction prompts: everything happens on his own plays. |

## Trait and starter

- **Martial Forms:** you fight in a form, starting in Current; once each turn, completing your form's technique gives 1 Mastery and 3
  Barrier (~16 with the starter, ~21 in a technique deck; guide §15). Inner Fire (Fervor, Serene's Mana, Fury's Primed) is gone, and
  he no longer starts Serene.
- **Starter (10):** 3 Strike, 3 Defend, **Still Guard** (Defensive: 6 Barrier), **Planted Heel** (Defensive: 6 Barrier, +2 if first),
  **Kindle Strike** (Striking: 6, +4 for up to 1 Mastery), **Turning Palm** (Striking: 7, +4 after a Defensive technique). A Defensive
  and a Striking technique are in about 58% of opening hands (so Current, his starting form, completes most often); the two
  Defensive ones (Root) or the two Striking ones (Ember) in about 22%. Plain Strike and Defend are not techniques, so the order of
  the four tagged cards is the turn's decision. No rare is needed.

## Strategies

1. **Root (discipline):** Settle into Root, Planted Heel, Iron Shirt, Centre Yourself, Bowing Low, Rooted Resolve, Shield of Calm,
   Still Water, Perfect Calm, Mountain's Stillness, Unbroken Calm, Breath Between Blows. Package: two cheap Defensive techniques a turn
   for the Mastery and 3 Barrier, spent on Perfect Calm (14 + 8 Barrier). There is no "block an attack" trigger: that is the Knight's.
2. **Current (flow):** Find the Current, Deflecting Palm, Swift Step, Flowing Step, Vigilance, Held Breath, Turning Palm, Redirect,
   Fearless, Open Palm, Foretold Flame, The River Turns, Unmoved Mind, Wreath of Flame. Package: a Defensive then a Striking technique
   every turn, Foresee and Hold to keep the pair together, The River Turns paying for each.
3. **Ember (pressure):** Stoke the Ember, Ember Step, Crushing Palm, Flurry of Palms, Quick Palms, Sunlit Kick, Focused Strike, Ashen
   Fist, Angry Palm, Scattering Kick, Mountain Breaker, Spinning Heel, Temper Flare, Master's Flourish, Thousand Palms, Final Account,
   Rage of Ages, Last Ember. Package: two cheap strikes at one enemy for the Mastery, then Final Account (24 + 12).

Glue: Read the Rhythm, Inner Sight, Gather Breath, Coiled Serpent (his Trap), Flood of Visions, Perfected Motion, Grandmaster's
Patience (pays for holding 3 Mastery). Every objective works against a single boss: no kill or attack intent is needed.

## Card disposition (53 live: 35 kept or changed, 18 new; 45 removed)

**Kept (same card or lightly tuned, now tagged):** Inner Sight, Gather Breath, Flood of Visions (no Fervor), Centre Yourself (0: 5
Barrier), Vigilance, Swift Step, Crushing Palm, Flurry of Palms, Quick Palms (6), Spinning Heel, Thousand Palms, Rage of Ages, Open
Palm, Mountain's Stillness (8 + 3 a card), Held Breath (7 Barrier).

**Changed (same id, new job):** Kindle Strike (`kindle-fury`: a Mastery spender, no Fury), Still Guard (no Serene), Angry Palm and
Final Account (Mastery spenders, no Fury), Ashen Fist, Scattering Kick (`red-mist`), Temper Flare (no Fury), Bowing Low and Sunlit Kick
(no Fervor), Shield of Calm (`shield-of-faith`) and Perfect Calm (defensive spenders), Foretold Flame (a spender), Still Water (pays
after a completion), Fearless, Unmoved Mind (answers a completion, not a stance), Wreath of Flame (Mastery after a completion), Coiled
Serpent (`cornered-beast`: Barrier and Mastery, no Fury), Unbroken Calm (draws in Root), Breath Between Blows (Defensive techniques),
Last Ember (`last-rites-of-flame`: a spender for every enemy).

**New:** Settle into Root, Find the Current, Stoke the Ember, Read the Rhythm, Perfected Motion, Grandmaster's Patience, Planted Heel,
Iron Shirt, Rooted Resolve, Deflecting Palm, Flowing Step, Turning Palm, Redirect, The River Turns, Ember Step, Focused Strike,
Mountain Breaker, Master's Flourish.

**Removed** (into the nearest new card, `retired.ts` Monk identity block): the Fury package (Rising Ire, Surge of Ire, Wrath Incarnate,
Rampage of Ire, Rage Unbound, Hot-Blooded, Berserk Tide, Unleashed Roar, Ashes of Restraint, Wrathful Guard, Blood on the Sand, Eye of
the Storm); the stance-switching package (Unburdened Guard, Thread-Cutter, Settled Mind, Hushed Stillness, Empty Fist, Inner Calm,
Sanctity, Exhale, Mirror Pool, Meditate, Tide of Peace, Gentle Return, Serenity Incarnate, Perfect Balance); the Fervor/Radiant
package (Whispered Vow, The Offering, Litany, Daily Rite, Rise Radiant, Reading the Signs, Still Flame Ascendant, Kneel, Worship,
Devotion, Radiant Heart, Faith Kept, Mantra Engine, Burning Litany, Unwavering); and Ascendant Form, All-Seeing, Rending Hands,
Poise. His three shelved Legendaries are among them. The healing stall cards (Gentle Return, Serenity Incarnate) went as the brief
asks.

## Checks the points can't do (guide §8)

- **Loops:** no card makes Mana now; a completion is once a turn; Mastery is capped at 3 and spent at most 2 a card; only two cards
  give Mastery, one of them after a completion. Perfected Motion's card is one a turn.
- **Multipliers:** nothing multiplies a hand. The biggest single spend: Final Account+ with 2 Mastery = 30 + 12 = 42 for 3 Mana,
  after two completions. A turn-four Ember deck: Quick Palms + Flurry of Palms (the completion: 12 damage, 1 Mastery, 3 Barrier),
  then Mountain Breaker with 2 Mastery (22): about 34 for 2 Mana with Unmoved Mind's 4 to all.
- **Tiers:** spends and techniques are flat; Exposed and Faltering on his cards keep up.
- **Arena:** the form and its progress are on his side and in the view for both players; an Ember objective aims at the other hero or
  a companion like any strike.

## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements (`RETIRED_CARDS`); a pre-rework Monk run is stamped
(`CLASS_REWORKS.monk`), the player told, and a fight in progress restarts. `RULES_VERSION` 34 covers all five reworks (none has shipped);
an old action log replays under its own version or is rejected, never silently reread. The stances (`stance`, `calm`, `wrath`,
`radiant`, `mantra`) stay in the engine for archived fixtures; no live card uses them.

## Art

No new pictures. 35 cards keep theirs; those drawn as a stance aura (Fury's red, Radiant's light) are listed for review in
`docs/CLASS_REWORK_ART.md`. The 18 new cards use the placeholder. In code: the Form panel, the form choice tiles, tooltips, a teaching
tip and Learn page words.

## Watcher resemblance (the brief's §10 and §12)

The brief rated the old Monk at a subjective ~84% (80-90%) mechanical similarity to the original Slay the Spire's Watcher, from its
rule system: Calm's Energy on exit, Wrath's double damage, 10 Mantra to Divinity. All three are gone from his cards and trait. No new
percentage is claimed for the rebuilt Monk: the brief's rubric was a design judgment, and it has not been re-scored.
