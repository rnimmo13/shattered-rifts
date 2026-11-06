# Campaign pressure, arena identity and selection — local 0.210.0 / rules 88

Robert approved committing, pushing and deploying the complete 0.210.0 / rules 88 candidate on 2026-11-06 (decision 655), including the website/server and matching Windows update. Local verification below records the pre-release checks; live release verification is recorded separately.

## Exact balance ledger

Scripted Campaign enemies start at **100% HP / 93% damage**, previously 90% / 90%. The additive per-tier slope stays +40 HP / +5 damage percentage points. Current Tier XII is 540% / 148%, previously 530% / 145%. Legacy Tier XX remains supported at 860% / 188%, previously 850% / 185%. Old stage offsets +5 HP / +1 damage percentage points remain readable. These are percentages of authored stats; existing difficulty ratios, enemy-stat rounding and HP-derived Barrier/healing scaling still apply. Ghost curves and Arena HP are unchanged.

An **Elite stop** additionally multiplies the tier HP percentage by **1.25** and damage percentage by **1.08**, rounding each result to a whole percentage. Previously both category multipliers were 1.00. This applies to every enemy in the formation, including promoted ordinary encounters and an authored Warden encountered on an Elite stop. A normal Warden stop receives only the shared baseline change. Tier I Elite: 90/90 → 125/100%; Tier XI Elite: 490/140 → 625/154%. Encounter moves, Omen coefficients, rewards, hero stats and Resolve costs are unchanged.

### Knight Strike rewards — Campaign and Arena

Raised Hell remains a 2-Mana rare Aura that auto-plays drawn Strike cards at random enemies, base and upgraded. Robert selected additional Strike rewards rather than redesigning it. Three cards are added to the normal Knight reward pool, not its starter:

| Card | Rarity / Mana | Base | Upgraded |
|---|---|---|---|
| Shield Strike | Common / 1 | 5 damage; 5 Barrier | 8 damage; 6 Barrier |
| Breaching Strike | Common / 1 | 7 damage; then 1 Exposed | 10 damage; then 1 Exposed |
| Muster Strike | Uncommon / 1 | 8 damage; 1 Reserves | 11 damage; 1 Reserves |

Reserves obey the existing maximum and payment order. All three count for Mastered Strike and auto-play through Raised Hell. No new card draws cards itself or increases Max Reserves. Existing Exposed-trigger Aura limits remain. Existing decks/saved offers remain; future reward acquisition includes the new candidates. The three additional names improve optional Strike density without requiring starter Strike retention, but modestly dilute other Knight reward offers.

Hand pricing follows `14_CARD_COSTING.md`: damage=1 point, Barrier=1.2, Exposed=3, Reserves=3.5. Shield: 11 → 15.2 points; Breaching: 10 → 13; Muster: 11.5 → 14.5. Exposed is applied after this card's hit. Muster's reserve is worth less when capped, and full Reserves do not increase its damage. Free random-target auto-plays are the acquired Aura's payoff after its setup cost, not ordinary card efficiency. Repeated Aura/Strike/Exposed interactions need human Arena evidence, especially beyond ten own turns; no parity claim.

## Evidence and limits

Reviewed available retained Campaign client-history positions: Engineer/Golemancer `mw2hdh90-7d18`, and Rogue `mvvj1kc7-6049`, historical Tier XII victories from older rules/routes. Their raw files were copied intact into `.wrangler/testing-0.210-2026-11-06/real-campaign/`. They establish old-route successful builds, not new-rules Elite difficulty, complete reward histories or independent match samples. No representative current real-player Arena exports were available. The owner export credential is not configured in this process. Robert reports breezing through normal/Elite encounters; that is player feedback without supplied game IDs, deck context or encounter positions. It motivates a modest baseline change and explicit Elite premium, not an inferred measured win-rate target.

No balance simulations were requested or run. Deterministic unit scenarios verify implementation only. The append-only `balance-history/0.210.0.{json,md,csv}` records all thirty Ascendancies, ten starts and representative freely mixed builds, setup/recovery/rare reliance, I–III/IV–VII/VIII–X/XI–XII progression and opening/extended/beyond-ten-turn uncertainty. Preserve earlier assessments. All regrades remain unmeasured.

Longer enemy survival increases setup and attrition pressure and allows more enemy actions. The Elite premium also increases HP-derived enemy healing/Barrier. Test low-rare starters and slow growth/companion rebuilding against fast focused damage at equal deck quality; do not assume equal raw DPS is the goal. Arena remains 1,000 HP, equal seats with the existing second-seat opening card, 30-minute limit and unchanged shared AI policy. Drago's optimized-deck clear target stays about 50% or somewhat above, not a measured outcome of this change.

## Presentation and targeting

Every existing arena pack was inspected as backdrop/prop contact sheets. Replace the repeated 3–5 far / 4–6 ground / 1–2 swinging decoration template with sparse authored per-venue scenery: workshops cluster machinery, gardens use fountains/benches, shore sites use ropes/debris, royal venues use restrained architectural accents. Props are not cycled or duplicated; no hanging scenery remains. Preserve the painted focal points. Realm-colored fog/particles replace common purple light. Heat rises faster; water/dream light drifts more slowly. Rift cracks are restricted to Rift venues. These are visual effects, not combat rules.

Selection uses the actual full silhouette width, three columns over the side's span, a 32-stage-pixel gutter and one shared responsive scale. Extra ranks are separated by 200 portrait / 220 landscape pixels. Bosses are placed within the frame, with an escort span reserved before their silhouette. Plate clicks directly identify their unit; the battle log is hidden only while aiming so it cannot cover the third target; model hit testing includes vertical distance so stacked ranks do not tie on horizontal distance alone. No hitbox or target eligibility in the engine changes.

Robert cancelled map artwork entirely after reviewing two style directions. None of the generated map concepts is referenced by the game. Tier XII instead gets an existing-art Drago silhouette, the First Ruin crest, fractured framing, void/ember palette, ordered Warden seals and a larger final throne seal. Cleared seals turn ember-gold; the battle overlay stays translucent. Existing saved dragon order, route geometry and drawing keys remain.

## Saved-deck Sandbox and device switching

Sandbox reads the current account's local and cloud Vault decks and loads a copy: class, Ascendancy, exact cards/upgrades, Boons and saved Campaign Max HP. Saved tier applies Campaign scaling including the Elite premium. Easy mode is still available; a separate reset removes saved class stats/tier. Card edits do not alter the Vault. Potion choices clear because the saved deck contains no potion inventory. No other-player deck source, developer secret or new private-deck endpoint is added.

The gameplay gate offers **Take control on this device** when another session holds play. The existing authenticated account/Vault boundary authorizes a dedicated takeover request. It atomically rotates the lease token, increments its generation and preserves the account's confirmed save revision, runs and replay checkpoints. Old-device writes, renewals and stale releases cannot invalidate the new owner. The previous device pauses on its next heartbeat/rejected write. The new device adopts confirmed account progress before enabling actions; newer-local recovery protection remains. Network/auth failures now show a connection problem rather than incorrectly claiming another device is playing. Server fences are developer details, not player patch-note content.

Rules 88 uses the existing older-battle checkpoint migration; no migration Resolve charge. Existing decks, earned progress, generated maps/offers and account saves are preserved.

The Campaign save-status strip also offers **Save and switch device**, using the existing confirmed-save-before-release flow for a normal handoff.

## Local verification

- Full regression suite: **194 files / 3,995 tests passed**. Existing deterministic harness regression checks are not a new balance experiment or measured player evidence.
- Workspace type checks and changed-source ESLint passed. Clean web and matching desktop renderer builds passed; desktop shell build passed.
- Actual Chromium/Electron UI checks at1366x768,390x844 and320x740: six finale seals/one throne, bounded route viewport/no horizontal overflow, saved-deck copying with157HP and preserved Vault source, non-overlapping full silhouettes for a three-enemy new-realm encounter, all three legal targets hovered and a damaging card played on the clicked third HP plate.
- Fresh-device busy gate displays the takeover control and admits the new session after adopting the current confirmed revision. Actual SQLite tests separately establish old-token write/renew/release rejection. UI account endpoints and local fixtures were isolated; no real account was modified.
- QA artifacts: `.wrangler/qa210/verification.json`, `results.json`, responsive PNGs and `.wrangler/210-*.log`. Source card illustrations and complete built-in image-generation prompts are listed in `docs/art-prompts/0.210-strikes.json`.
- No release artifacts published, no push/deployment.
