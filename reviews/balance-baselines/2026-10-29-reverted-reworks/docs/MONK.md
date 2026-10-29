# The Monk rebuilt: Martial Forms and Mastery (2026-10-29, DECISIONS #419; the pool expansion, DECISIONS #426)

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
| Reading the form (#426) | Metrics `formProgress` (0, 1 or 2, the same number the panel shows; "one step from done" is exactly 1) and `vigor` (Primed on a unit). A card's own step counts after its effects, so a card reads the progress before itself: Shifting Stance's change of form comes first, then it is the new form's first step. |

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

## The pool expansion (2026-10-29, DECISIONS #426): 89 cards, 87 reward-eligible, 12 Auras

Planned before implementation (the brief); the cards as they stood (53, 51 reward-eligible, 6 Auras) are frozen in
`reviews/balance-baselines/2026-10-29-monk-expansion/`. 36 cards added in six strategies, none removed. Points by the guide and
§15 (Primed 1 a stack a hit, ~1.3 hits on his attacks; "+N per Mastery you have" at ~1.5 Mastery, never spent).

| Card | Rarity | Mana | Type | Effect | Upgrade | Role | Decision | Points | Combo risk |
|---|---|---|---|---|---|---|---|---|---|
| **1. Root discipline** (a route to damage) | | | | | | | | | |
| Coiled Stance | C | 1 | Skill, Defensive | 6 Barrier, 3 Primed if not Primed | 9 Barrier, the same | Root step that banks damage | a Root step now for a harder strike later | 7.2 + 3 Primed x ~1.3 hits = 11.1 | Primed (every hit of the next attack) stacks while he does not attack; with Thousand Palms +21 |
| Unleashed Stillness | U | 1 | Attack, Striking | 7, +3 per Defensive technique played this turn | 10, +3 | Root finisher | play it after the Root pair, not before | 7 + 3 x1.2 = 10.6 | needs Defensive cards played first; capped by Mana |
| Mountain Roots | C | 1 | Skill, Defensive | 5 Barrier, 1 Faltering to ALL | 8 Barrier | group defence | a Root step that blunts every enemy | 6 + 3.9 = 9.9 | - |
| Earth Shrug | U | 1 | Skill, Defensive | 7 Barrier; in Root, 1 Mana next turn | 10 Barrier | Root resource | stay in Root for next turn's Mana | 8.4 + 4 x0.5 = 10.4 | one Mana a card, next turn only |
| Patient Thunder | R | 1 | Skill, Defensive, Hold | 7 Barrier; in Root, 6 to ALL | 9 Barrier, 8 to ALL | Root rare: defence that hits back | hold it for a Root turn | 8.4 + 7.8 x0.5 + Hold 1 = 13.3 | a skill's damage: Primed does not add to it |
| Stored Strength | U | 1 | Aura | end of turn, in Root, after a completion, if not Primed: 4 Primed | Opening hand | Root engine toward damage | Root turns become a harder strike next turn | 0.6 x 4 x ~1.4 hits x4 = 13.4 | never stacks; Primed goes on every hit (Thousand Palms+: +28 once) |
| **2. Current sequencing** | | | | | | | | | |
| Ebbing Guard | C | 1 | Skill, Defensive, Hold | 7 Barrier | 10 Barrier | a held opener | keep the Defensive half of a pair for next turn | 8.4 + Hold 1 = 9.4 | - |
| Riverstone Strike | U | 1 | Attack, Striking | 7; after a Defensive technique, 2 Faltering | 10 | Current closer with defence | order: Defensive first | 7 + 6 x0.65 = 10.9 | - |
| Undertow | U | 1 | Attack, Striking | 8; a random Defensive technique from the discard pile to the hand | 11 | assembles the next pair | recover the half you need | 8 + 3 = 11 | fetches a Defensive card, never itself; each costs Mana |
| Read the Water | U | 1 | Skill (untagged) | 3 Barrier, draw 2, put a card from the hand on top of the draw pile | 6 Barrier | selection | set next turn's pair | 3.6 + 6 + 1.5 = 11.1 | net one card |
| River's Answer | R | 2 | Attack, Striking | 14; after a Defensive technique, 12 more | 18 | Current rare payoff | Defensive first, then this | 14 + 12 x0.65 = 21.8 | - |
| Ebb and Flow | U | 1 | Aura | the first Striking technique each turn, after a Defensive one: 2 Barrier, 1 Faltering on its target | Opening hand | Current engine | sequence the pair | 0.75 x 5.4 x4 = 16.2 | once a turn |
| **3. Ember commitment** | | | | | | | | | |
| Follow-Through | C | 1 | Attack, Striking | 8; if the target is Exposed, 4 more | 11 | Ember second step | Expose first, then the same enemy | 8 + 4 x0.5 = 10 | - |
| First Touch | C | 0 | Attack, Striking | 3, 1 Exposed | 5 | cheap Ember first step | the opener at the enemy you commit to | 3 + 3 = 6 | no draw: cannot cycle |
| Ember's Edge | U | 1 | Attack, Striking | 9; if your technique is one step from done, 4 more | 12 | the closer of any form | the second step hits harder | 9 + 4 x0.5 = 11 | - |
| Searing Combination | U | 2 | Attack, Striking | 10; if the target is Exposed, 5 more; then 2 Exposed | 14 | Ember heavy | second strike, or opener for next turn | 10 + 2.5 + 6 = 18.5 | - |
| Heart of the Ember | R | 2 | Attack, Striking | spend up to 2 Mastery: 10, one more hit per Mastery spent | 12 a hit | Ember rare spender | with Exposed, many hits | 10 + 10 x1.2 = 22 | at most 3 hits |
| Kindled Focus | U | 1 | Aura | the first Striking technique each turn: 1 Exposed on its target (2 in Ember) | Opening hand | Ember engine | commit the second strike to the same enemy | 0.9 x (3 + 1.5) x4 = 16.2 | once a turn |
| **4. Mastery conservation** (benefits at 1-2, no spend) | | | | | | | | | |
| Centred Strike | C | 1 | Attack, Striking | 7, +2 per Mastery you have | 10 | holds Mastery | keep 1-2 Mastery for it | 7 + 2 x1.5 = 10 | reads, never spends |
| Quiet Confidence | C | 1 | Skill, Defensive | 6 Barrier, +2 per Mastery you have | 9 | holds Mastery, defence | the same | (6 + 3) x1.2 = 10.8 | - |
| Composed Mind | U | 1 | Skill (untagged) | 5 Barrier, draw 1, +1 with 2 Mastery | 8 Barrier | utility | keep 2 for the card | 6 + 3 + 1.5 = 10.5 | - |
| Master's Calm | R | 1 | Skill, Defensive, Hold | 3 Barrier, +4 per Mastery you have | 5 Barrier, +4 | held defence that rewards a reserve | hold it for the turn that needs it | (3 + 6) x1.2 + 1 = 11.8 | - |
| Unhurried Sweep | U | 2 | Attack, Striking (ALL) | 12 to ALL, +2 per Mastery you have | 15 to ALL | group option | a reserve makes it bigger | (12 + 3) x1.3 = 19.5 | aims at none: no Ember step |
| Inner Reserve | U | 1 | Aura | end of turn, with 1+ Mastery: 4 Barrier | 5 Barrier | conservation engine | spend down to 1, not to 0 | 0.85 x 4.8 x4 = 16.3 | flat: spending to 1 loses nothing |
| **5. Tactical spending** (small spenders compete) | | | | | | | | | |
| Clear Mind | C | 1 | Skill (untagged) | 4 Barrier, draw 1; spend up to 1 Mastery: draw 1 | 7 Barrier | utility spender | a card now or Mastery later | 4.8 + 3 + 3 x0.72 = 10 | - |
| Long Exhale | U | 1 | Skill, Defensive | 6 Barrier; spend up to 1 Mastery: 1 Mana next turn | 9 Barrier | resource spender | Mastery into next turn's Mana | 7.2 + 4 x0.72 = 10.1 | next turn only; one a card |
| Pinpoint Strike | C | 1 | Attack, Striking | spend up to 1 Mastery: 2 Exposed; then 7 | 10 | offensive spender | Expose before the hit | 7 + 6 x0.72 = 11.3 | - |
| Deflecting Spirit | U | 1 | Skill, Defensive | 5 Barrier; spend up to 2 Mastery: 1 Faltering to ALL per Mastery | 8 Barrier | defensive spender, group | blunt a big turn | 6 + 3.9 x1.2 = 10.7 | - |
| Decisive Moment | R | 1 | Skill (untagged) | 3 Barrier; spend up to 2 Mastery: draw 1 and 3 Barrier per Mastery | 6 Barrier | rare utility spender | cards and defence now, or Mastery for a finisher | 3.6 + 6.6 x1.2 = 11.5 | at most 2 cards |
| Flowing Release | U | 1 | Aura | whenever you spend Mastery: 3 Barrier | 4 Barrier | spending engine | spend often, in small amounts | ~1 a turn x 3.6 x4 = 14.4 | one answer a spending card |
| **6. Adaptive forms** | | | | | | | | | |
| Shifting Stance | C | 1 | Skill, Defensive | 6 Barrier; change to a form of your choice | 9 Barrier | adapt, and be the first step of the new form | the change resets progress, then this card counts | 7.2 + 1.5 = 8.7 | no resource from switching |
| Change of Heart | C | 1 | Attack, Striking | 8; change to a form of your choice | 11 | the same, Striking | the same | 8 + 1.5 = 9.5 | - |
| Adapting Flow | U | 1 | Skill (untagged) | 3 Barrier, draw 2; if your technique is not done, change form (your choice) | 6 Barrier | recovery | fix a hand that cannot complete | 3.6 + 6 + 1.5 = 11.1 | - |
| Seek the Strike | C | 1 | Skill (untagged) | 5 Barrier; a random Striking technique from the discard pile to the hand | 8 Barrier | recovery | find the missing half | 6 + 3.5 = 9.5 | - |
| Thousand Forms | R | 2 | Skill, Defensive | 14 Barrier, change form (your choice), draw 1 | 18 Barrier | rare adaptive defence | the big block that also reshapes the turn | 16.8 + 1.5 + 3 = 21.3 | - |
| Unfinished Form | U | 1 | Aura | end of turn, if you did not complete your technique: Hold your hand, 4 Barrier | Opening hand | recovery engine | keep a half pair for next turn | 0.4 x 8.8 x4 = 14.1 | only on a missed turn |

### How the six strategies play

1. **Root discipline, a route to damage:** two different Defensive techniques (Coiled Stance banks 3 Primed, Mountain Roots blunts the
   line), then Unleashed Stillness (+3 a Defensive technique played) or Patient Thunder (6 to all in Root); Stored Strength turns a
   completed Root turn into 4 Primed for the next attack (never while still Primed); Earth Shrug pays a Mana next turn for staying.
   No full-block or Opening mechanic (the Knight's).
2. **Current sequencing:** a Defensive opener held for the right turn (Ebbing Guard), then the closer that pays for the order
   (Riverstone Strike, River's Answer), Undertow and Read the Water to assemble the next pair, Ebb and Flow paying the pair once a turn.
3. **Ember commitment:** First Touch (free, Exposed) or Kindled Focus marks the enemy; Follow-Through and Searing Combination hit an
   Exposed one harder; Ember's Edge closes any form; Heart of the Ember turns spent Mastery into hits. The target choice: the second
   strike must go at the same enemy, so a kill or a Taunt mid-turn changes the plan.
4. **Mastery conservation:** Centred Strike, Quiet Confidence, Master's Calm, Unhurried Sweep and Composed Mind read the Mastery he has
   (useful at 1-2), Inner Reserve pays for keeping at least 1. Spending to 1 loses little, so sitting at 3 is never forced.
5. **Tactical spending:** one Mastery buys a card (Clear Mind), next turn's Mana (Long Exhale) or 2 Exposed before a hit (Pinpoint
   Strike); up to two buy Faltering on every enemy (Deflecting Spirit) or cards and Barrier (Decisive Moment); Flowing Release pays each
   spending card. They compete with the finishers for the same three points.
6. **Adaptive forms:** Shifting Stance, Change of Heart, Thousand Forms and Adapting Flow change form for a card (the progress starts
   again, the once-a-turn completion stays spent); Seek the Strike recovers a missing half; Unfinished Form Holds the hand on a missed
   turn. No card gives anything for changing form by itself.

Tags of the 89: 25 Defensive, 36 Striking, 28 untagged (utility neither helps nor breaks progress).

### Arena

Every form works against one hero: Root and Current need no attacker, Ember aims at the other hero (or a companion). No intent is
read, no reaction prompt is added; the form, its progress and his Mastery are on his side of the view. Burst through legal actions
(seat b 540 HP, no Barrier):

| Turn | Mana | Mastery | Damage |
|---|---|---|---|
| Ember: First Touch+ (Exposed), Heart of the Ember+ (2 spent: 3 hits), Follow-Through+ (test) | 3 | 3 | 81 (15%) |
| First Touch+, Final Account+ (2 spent) | 3 | 3 | 68 |
| Pinpoint Strike+ (Exposed), Heart of the Ember+ | 3 | 3 | 69 |
| Coiled Stance+, First Touch+ (takes the Primed), Thousand Palms+ | 3 | 0 | 50 |
| Current: Ebbing Guard+, River's Answer+ | 3 | 0 | 30 |
| Conservation at 3 Mastery: Centred Strike+, Unhurried Sweep+ | 3 | 3 | 37 |

Primed goes on every hit of the next attack: Coiled Stance (3) before Thousand Palms+ adds 21, Stored Strength (4) 28, once: neither adds Primed while he is Primed, so copies and turns never stack it (the review found 3 Coiled Stances and Thousand Palms at 84, 5 over two turns at 119).

## Checks the points can't do (guide §8)

- **Loops (#426):** First Touch is free and draws nothing; Undertow and Seek the Strike return a technique for 1 Mana each (no Mana
  made); Mana only next turn (Earth Shrug in Root, Long Exhale for a Mastery); a change of form after a completion never gives a
  second one (tested). Before: no card makes Mana now; a completion is once a turn; Mastery is capped at 3 and spent at most 2 a card; only two cards
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
