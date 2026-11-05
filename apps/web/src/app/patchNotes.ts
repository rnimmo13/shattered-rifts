import { BALANCE_NOTES_199 } from './balanceNotes199';
// The patch notes (#/patch-notes): what changed from version to version, written for players. Newest first. Each version
// is a few short lines in a handful of kinds, so a play tester can see at a glance what to look at.
//
// What never goes in: anything that would help someone game the game. No server limits or anti-cheat checks, nothing about
// how the boards decide what counts, no hidden odds or how a choice is rolled, nothing about what a browser could see that it
// should not. Those stay in docs/DECISIONS.md.

export type NoteKind = 'new' | 'changed' | 'balance' | 'fixed';

export interface PatchItem {
  kind: NoteKind;
  text: string;
  title?: string;
  card?: string;
  hero?: string;
  changes?: {
    label: string;
    before: string;
    after: string;
    direction: 'buff' | 'nerf' | 'neutral';
  }[];
}

export interface PatchNote {
  version: string;
  /** yyyy-mm-dd */
  date: string;
  /** a few words for the list */
  title: string;
  /** one line on what this patch is about */
  summary: string;
  notes: PatchItem[];
  /** something play testers should know (an old replay that no longer plays, a reload) */
  heads?: string;
}

export const KIND_LABEL: Record<NoteKind, string> = {
  new: 'New',
  changed: 'Changed',
  balance: 'Balance',
  fixed: 'Fixed',
};

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '0.204.0',
    date: '2026-11-05',
    title: 'Clearer damage and smoother maps',
    summary:
      'Companion damage breakdowns, fuller card damage totals and a centered map you can drag to scroll.',
    notes: [
      {
        kind: 'fixed',
        title: 'Take a break during the final gauntlet',
        text: 'Campaign: after each Warden Gift in Tier XII, return to the gauntlet map and choose the next fight when ready. Home keeps your run for later. During a gauntlet fight, View map also offers Home; returning resumes the saved fight without forfeiting or spending Resolve. Existing active gauntlets keep their Warden order, progress and rewards. Healing and enemy difficulty are unchanged.',
      },
      {
        kind: 'new',
        title: 'Companion damage calculations',
        text: 'Campaign and Arena: hover a summoned companion or its attack intent to see its current damage calculation, including active bonuses, penalties, target protections and the total across its hits. Its name also exposes the calculation on keyboard focus. These estimates use the current board; earlier actions can change the target or damage. Barrier absorption and remaining enemy HP are separate from the displayed attack damage.',
      },
      {
        kind: 'fixed',
        title: 'Card damage totals, including Hunter multi-hit attacks',
        text: 'Campaign and Arena: Run Wild and Reckless Blow now show both hits and their current total, including damage modifiers. Their base damage remains 7 twice (14 total); their upgraded damage remains 8 twice (16 total). Known effects before a hit, such as Reckless Blow paying HP or a card gaining Barrier or a status, now count in the following damage preview. Conditional damage, companion commands and known Totem follow-up attacks also show a current total where it can be resolved. Zero-damage formulas show 0. Target-dependent outcomes show ranges; random effects, draws and unresolved choices are labelled as uncertain. Trap trigger damage remains a future effect. This changes the display, with no changes to card stats or combat damage.',
      },
      {
        kind: 'fixed',
        title: 'Map centering and scroll stability',
        text: 'The Tier heading is centered above the map again. Horizontal routes sit vertically in the middle of their reserved area, including tall desktop screens. Node sizing uses a stable viewport measurement so scrollbar changes cannot repeatedly resize and shift the route. Reopening or resizing centers the current stop inside the map without moving the surrounding page.',
      },
      {
        kind: 'changed',
        title: 'Map navigation controls',
        text: 'Landscape desktop maps now have larger left/right arrow buttons and a draggable gold scroll track styled to match the game. Click and drag the map itself to scroll; dragging over a node does not select it. Turn off Draw or Erase to pan again. The arrows dim at each end; the track also supports keyboard navigation. Mouse wheels and trackpads can move along the route. Reduced motion disables smooth arrow scrolling. Phone maps retain vertical scrolling and drawing controls remain available.',
      },
    ],
  },
  {
    version: '0.203.0',
    date: '2026-11-05',
    title: 'Twelve tiers, the Warden gauntlet and a true ending',
    summary:
      'A shorter campaign with a final boss gauntlet, illustrated victory, horizontal desktop maps and safer account saves.',
    notes: [
      {
        kind: 'balance',
        title: 'The twelve-tier campaign',
        changes: [
          { label: 'Campaign tiers', before: '20', after: '12', direction: 'neutral' },
          {
            label: 'Tier XII encounters',
            before: '21 map stops + 1 Warden',
            after: '11 Wardens + Vorthax; no regular map',
            direction: 'neutral',
          },
        ],
        text: 'Campaign only. Each pre-finale tier ends with a different Warden, shuffled once per run without repeats: Seraphine, KR-0N, Gorrmaw, Nyxara, The Hollow Benediction, Mother of Static, The Upside-Down Stag, The Applause Below, The Mourning Tide, Queen of the Unmade and Event Horizon Regent. The final gauntlet independently shuffles all eleven, then ends with Vorthax. Each Gift leads straight into the next fight; there are no Shrines, merchants or regular fights between them. Warden rewards retain +5 max HP in the finale, +1 Resolve up to cap and a Gift; Fraying Ward reduces the usual 30% max-HP victory heal to 15%. Vorthax still leaves a final Gift before victory. Existing saved maps keep their order; new runs receive the full unique shuffled roster. Arena combat is unchanged.',
      },
      {
        kind: 'balance',
        title: 'Finale tier scaling',
        changes: [
          {
            label: 'Finale enemy HP multiplier',
            before: '850% at Tier XX',
            after: '530% at Tier XII',
            direction: 'buff',
          },
          {
            label: 'Finale enemy damage multiplier',
            before: '185% at Tier XX',
            after: '145% at Tier XII',
            direction: 'buff',
          },
          {
            label: 'Final Warden max-HP reward',
            before: '+7 at Tier XX',
            after: '+5 at Tier XII',
            direction: 'nerf',
          },
        ],
        text: 'Campaign only, before difficulty, Omens and encounter effects. The per-tier curve stays +40 HP percentage points and +5 damage percentage points; the campaign now ends earlier. Omens now fill every tier as listed below. Existing decks, cards and Ascendancies are unchanged; the shorter build-up and consecutive bosses have not been rated as measured class parity.',
      },
      {
        kind: 'balance',
        title: 'Omens on every tier',
        changes: [
          { label: 'Rallied Foes unlock', before: 'IV', after: 'I', direction: 'nerf' },
          { label: 'Rift Scars unlock', before: 'V', after: 'IV', direction: 'nerf' },
          { label: 'Dread unlock', before: 'VI', after: 'V', direction: 'nerf' },
          { label: 'Rift Static unlock', before: 'VII', after: 'VI', direction: 'nerf' },
          { label: 'Ironclad unlock', before: 'VIII', after: 'VII', direction: 'nerf' },
          { label: 'Third Phase unlock', before: 'XIII', after: 'X', direction: 'nerf' },
          { label: 'Vigilant unlock', before: 'XII', after: 'XI', direction: 'nerf' },
          { label: 'Hunted unlock', before: 'XV', after: 'XII', direction: 'nerf' },
          { label: 'The Rift Awakens unlock', before: 'XX', after: 'XII', direction: 'nerf' },
          {
            label: 'Rallied Foes Barrier at XII',
            before: '9% of enemy HP',
            after: '10.5%',
            direction: 'nerf',
          },
        ],
        text: 'Campaign only. Earlier Omens remain active and grow from their new unlock tier using their existing formulas. Rallied Foes gives the strongest ordinary enemy a half-HP phase with 5% HP as Barrier, growing by 0.5 percentage points per later tier to 13%. Third Phase gives Elites/Wardens a quarter-HP phase with 10% Barrier +0.5 points per later tier (max14%) and 1 Might. Hunted adds 1 damage to the strongest enemy’s first attack; The Rift Awakens gives enemies a half-HP phase with 10% Barrier/0 Might, retaining existing own-phase exceptions. Rift Scars still adds 1 Wound per new tier, capped at6 held; Dread starts you with1 Faltering, Rift Static adds1 temporary Static, Ironclad gives bosses1 Armored and Vigilant gives every enemy1 Steadfast. Second Wind (II), Times Are Tough (III), Brittle Wards (VIII) and Blood Rites (IX) keep their unlocks and formulas. Existing active legacy tiers/fights retain their previous Omen schedule until advancing; saved event choices remain intact.',
      },
      {
        kind: 'balance',
        title: 'Fraying Ward — final-gauntlet recovery',
        changes: [
          {
            label: 'Automatic victory healing reduction',
            before: '0%',
            after: '50%',
            direction: 'nerf',
          },
          {
            label: 'Warden victory heal',
            before: '30% max HP',
            after: '15% max HP',
            direction: 'nerf',
          },
        ],
        text: 'Campaign only, from the final gauntlet. Fraying Ward halves each automatic post-victory heal, rounded up, including Warden recovery, the Hunter’s Pack Instinct (2→1 HP), Boon recovery and any applicable Elite recovery. Max-HP gains still add their usual current HP. In-fight healing, potion effects and full-HP Resolve retries are unchanged. Gifts, shards and Resolve rewards remain available after every Warden.',
      },
      {
        kind: 'balance',
        title: 'Elites before the finale',
        changes: [
          {
            label: 'Tier when all normal fights become Elites',
            before: 'XIX',
            after: 'XI',
            direction: 'nerf',
          },
          {
            label: 'Normal-fight promotion at II / V / X / XI',
            before: '6% / 22% / 50% / 56%',
            after: '10% / 40% / 90% / 100%',
            direction: 'nerf',
          },
        ],
        text: 'Campaign only. Promotion odds now rise by10 percentage points per tier after I, capped at100%; already placed Elites are additional. Before the final gauntlet, every combat stop except its Warden is an Elite, including event ambushes; merchants, Shrines and other noncombat stops remain. Per-Elite reward amounts, rarity odds and healing keep their prior per-tier formulas; their reward fade was separated from the promotion threshold. Broader difficulty tuning is a follow-up. Existing saved map nodes and active fights keep their kinds.',
      },
      {
        kind: 'changed',
        title: 'Campaign shard standings and Resolve retries',
        text: 'The Campaign leaderboard shows the unspent shards held by its ranked run. Equal progress is ordered by more shards, then who reached that progress first. Balances decrease when spent; totals are not combined across runs. Older unknown balances show — until reported. Using Resolve starts a fresh seeded fight shuffle while retaining the encounter, deck contents and full-HP recovery; reloading preserves that retry rather than rerolling it. Campaign introductions and lore describe progressing through realms without promising a fixed tier count.',
      },
      {
        kind: 'new',
        title: 'The rifts are sealed',
        text: 'After defeating Vorthax and taking or skipping the final Gift, a dedicated illustrated victory screen celebrates the reclaimed realms and repaired Ward. Keep your victorious deck or return home. The ending persists across saves, and saved victorious decks are labelled Victory in run history. The art reveal respects reduced motion.',
      },
      {
        kind: 'changed',
        title: 'Desktop maps and existing runs',
        text: 'Desktop maps run left to right again; phones retain top-to-bottom scrolling. Both show the same five-lane graph, icons, connections and choices. Each orientation keeps its own drawings. Existing maps and unfinished fights remain intact. After an older run clears a tier at XII or above, it enters the new Tier XII gauntlet with its earned cards, HP, Boons and statistics preserved. A legacy Vorthax clear receives the victory ending. Held treasure maps still deliver before the next required stop, including before the gauntlet.',
      },
      {
        kind: 'fixed',
        title: 'Mobile card selection',
        text: 'Swiping over cards now scrolls the remove/upgrade picker. Its header and Cancel button stay in view, and combat card dragging keeps its existing controls.',
      },
      {
        kind: 'fixed',
        title: 'Account campaign saves',
        text: 'Campaign and fight progress upload promptly during continuous play. The game shows whether the account save is confirmed; failures pause online play and preserve the local copy. Save-and-stop, desktop close and update handoffs wait for confirmation, and newer local checkpoints are offered for recovery rather than silently replaced. Recent account checkpoints and local recovery copies are retained. Local offline campaigns remain separate from the online account.',
      },
    ],
  },
  {
    version: '0.202.0',
    date: '2026-11-05',
    title: 'Five-lane maps and reliable treasure',
    summary:
      'Vertical campaign routes that split and meet, guaranteed buried treasure and more Rift-Crossed choices.',
    notes: [
      {
        kind: 'balance',
        title: 'The buried map / The X on the map',
        text: 'Campaign only. Keeping the map promises treasure within the next 3 tiers: it appears before your first stop next tier, even on a route with no events. At Tier XX, it appears before your next stop. Existing held maps deliver before the next stop after loading. The bonus encounter preserves every route node. Dig deep still grants a choice of 3 rare Rift-Crossed cards plus 105 shards (the old label incorrectly said 80); Dig carefully still gives +8 max HP and heals 25% of max HP. Claiming either consumes the map; skipping the card keeps the shards. Banking or ending the run ends the promise.',
        changes: [
          {
            label: 'Treasure delivery',
            before: 'Random later event; no deadline',
            after: 'Guaranteed by the next tier',
            direction: 'buff',
          },
        ],
      },
      {
        kind: 'balance',
        title: 'The rift broker',
        text: 'Campaign only. Trade one card still removes one random card. The two-card trade for a rare choice is unchanged.',
        changes: [
          {
            label: 'One-card trade reward',
            before: '1 random uncommon Rift-Crossed card',
            after: 'Choose 1 of 3 uncommon Rift-Crossed cards',
            direction: 'buff',
          },
        ],
      },
      {
        kind: 'balance',
        title: 'The torn grimoire',
        text: 'Campaign only. Copy out one page still costs 40 shards. The gamble option is unchanged.',
        changes: [
          {
            label: 'Page reward',
            before: '1 random common Rift-Crossed card',
            after: 'Choose 1 of 3 common Rift-Crossed cards',
            direction: 'buff',
          },
        ],
      },
      {
        kind: 'balance',
        title: "The old soldiers' camp",
        text: 'Campaign only. A new optional foreign-technique choice costs 8 HP; existing choices are unchanged.',
        changes: [
          {
            label: 'Foreign technique',
            before: 'Unavailable',
            after: 'Choose 1 of 3 common Rift-Crossed cards for 8 HP',
            direction: 'buff',
          },
        ],
      },
      {
        kind: 'balance',
        title: 'The ash market',
        text: 'Campaign only. A new optional foreign-stock choice costs 60 shards; existing choices are unchanged. Previously opened events retain their saved options; new choices appear on newly opened events.',
        changes: [
          {
            label: 'Foreign stock',
            before: 'Unavailable',
            after: 'Choose 1 of 3 uncommon Rift-Crossed cards for 60 shards',
            direction: 'buff',
          },
        ],
      },
      {
        kind: 'balance',
        title: 'Campaign routes',
        text: 'Desktop and mobile now share a map that scrolls from top to bottom, with drawing tools above the path. Newly generated tiers start with 5 routes (previously 2–3); later floors have 1–5 stops (previously 2–4), meeting every 6 floors and splitting again afterward. The final 2 Shrines lead into the Warden. Routes connect without crossed lines. You still visit one stop per floor, with the same tier length, reward amounts and enemy scaling. Existing saved tiers retain their nodes and connections in the new layout. Previous map drawings are kept separately because the layout changed.',
      },
      {
        kind: 'fixed',
        text: 'Centered the Arena rules and recording notice beneath the heading, including when opening Arena directly before visiting Campaign.',
      },
    ],
  },
  {
    version: '0.201.0',
    date: '2026-11-05',
    title: 'Match records for real playtesting',
    summary: 'Keep, share and save Arena games, with more evidence for balance review.',
    notes: [
      {
        kind: 'changed',
        text: 'The current game version is shown in the bottom-right corner on game screens, including battles, on web and desktop.',
      },
      {
        kind: 'new',
        title: 'Share performance reports with a link',
        text: 'After stopping a performance recording, choose Share report in Settings. The report is stored online and you get a short link to send through Discord or chat. Anyone with the link can read it without a login. Reports are kept for up to 90 days, subject to storage availability. Uploading is manual; raw-text copying remains optional. Replay share links also work when copied from the desktop app.',
      },
      {
        kind: 'new',
        title: 'Your last 10 Arena games',
        text: 'History now fetches your last 10 recorded Arena games from the server, including games on your other devices. Those games stay available while they remain in your latest 10. Older shared replays can expire after 30 days. Anyone with a replay link can see both decks and hands.',
      },
      {
        kind: 'new',
        title: 'Save and reopen match records',
        text: 'Open a replay from History to watch it, add an optional note about your plan, or save a JSON match record to share with Robert. Open downloaded records from History without uploading the file. Records include display names, exact decks, moves and captured combat evidence. Playback requires matching rules; older records can still be inspected and saved.',
      },
      {
        kind: 'changed',
        title: 'Evidence for balance review',
        text: 'Completed online Arena games now capture move events and resources, with hands and board positions at the opening, turn boundaries and lethal moves. Capture limits are marked when later positions are missing. Online Campaign saves contribute private exact-deck, Boon and progression snapshots for developer review. Offline runs are not uploaded. No card or combat balance changes.',
      },
    ],
  },
  {
    version: '0.200.0',
    date: '2026-11-05',
    title: 'A shared Arena baseline',
    summary:
      'Equal HP, an opening card for second seat, better ghost planning and clearer balance notes.',
    notes: [
      {
        kind: 'balance',
        title: 'Arena — every class',
        text: 'Both players start at 1,000 current and maximum HP. Second seat keeps its existing +1 opening card only; later draws are normal. Campaign HP is unchanged.',
        changes: [
          { label: 'Starting HP', before: '6 × class HP', after: '1,000', direction: 'neutral' },
          { label: 'Second-seat bonus HP', before: '+60', after: '0', direction: 'nerf' },
          { label: 'Second-seat opening bonus Mana', before: '+1', after: '0', direction: 'nerf' },
        ],
      },
      {
        kind: 'changed',
        title: 'Arena clock and passes',
        text: 'If both players pass three consecutive turns without playing a card, the whole Arena match ends in a draw. Playing a card resets that player’s streak. Turn timeout remains 75 seconds; two missed turns still forfeit.',
        changes: [
          { label: 'Game limit', before: '20 minutes', after: '30 minutes', direction: 'neutral' },
        ],
      },
      {
        kind: 'changed',
        title: 'Ghost decision-making',
        text: 'Ghosts plan through card choices and value more setup resources, companion Auras and totems. Planning no longer uses the real hidden draw order or opponent hand. Simulations use this same AI; it does not learn automatically from games.',
      },
      {
        kind: 'new',
        title: 'Arena balance review',
        text: 'Completed online Arena games record exact deck lists, outcomes, seat order, turns and damage measurements for private developer analysis. Human and ghost results stay separate.',
      },
      {
        kind: 'changed',
        title: 'Readable patch notes',
        text: 'Balance entries show before → after values, green buffs, red nerfs and card art or class icons. Colour is paired with a text label.',
      },
    ],
    heads:
      'Second-seat bonus draw applies only to its first turn. Existing decks keep their cards. Older unfinished fights use the normal rules-update checkpoint handling; older Arena replays remain version-gated.',
  },
  {
    version: '0.199.0',
    date: '2026-11-05',
    title: 'Sustained engines and a clearer path through the Rift',
    summary:
      'Balance revisions for resource loops, setup protection and Vorthax. Class and card changes apply to Campaign and Arena; Vorthax changes apply only to Campaign.',
    notes: BALANCE_NOTES_199,
    heads:
      'Existing cards and saves keep their IDs and use the revised effects. Older unfinished battles restart through the normal rules-update checkpoint handling. Arena HP, targeting and the 20-minute match limit are unchanged.',
  },
  {
    version: '0.198.0',
    date: '2026-11-04',
    title: 'Room to build, room to fight back',
    summary:
      'Shared Campaign and Arena tuning for longer fights, with new protection for Bonelord and Deathwish.',
    notes: [
      {
        kind: 'balance',
        text: 'Necromancer — Grave Chill (Campaign and Arena): Genuine Consumes give 3 Fate each for the first 6 per owner-round, then 1 each (previously 3 without a limit). An owner-round starts on your turn and lasts until your next turn starts, including reactive Consumes on the opponent’s turn. Ally deaths still give 2 Fate.',
      },
      {
        kind: 'balance',
        text: 'Soulreaper — Harvest (Campaign and Arena): Only the first 3 genuine Consumes per owner-round add Harvest (was 6). The first 6 still grant 3 Barrier each. Reap remains 4 + 2 damage per accumulated Harvest, once at the end of your own turn if you consumed that turn; accumulated Harvest has no fight-total cap.',
      },
      {
        kind: 'balance',
        text: 'Spellblade — Fault Lines (Campaign and Arena): Base and upgraded: each Aura gives 1 Fracture on each of your first 6 own-turn Sword/Spell plays (was 2), then 0 on later plays (was 1). Copies count separately and reset each own turn; a card with both tags counts once. Costs remain 2/1 Mana. Permanent Fracture and Shatterer’s 15% bonus stay unchanged.',
      },
      {
        kind: 'balance',
        text: 'Spellblade — Measured Ruin (Campaign and Arena): Added damage on the first qualifying Spell Attack each turn drops from 2 to 1 per spent Power, or 3 to 2 upgraded, per hit. Copies still stack; the Aura still costs 2 Mana. Sword-only attacks such as Obsidian Drill do not qualify.',
      },
      {
        kind: 'balance',
        text: 'Brewmaster — Fermentation (Campaign and Arena): End-turn healing drops from 1% to 0.6% max HP per stack, rounded up once after totaling all stacks. The five-stack cap, actual Hangover-payment trigger and 2 Barrier per stack stay unchanged. At five stacks, healing is 16 instead of 27 at 528 max HP, 18 instead of 30 at 588, and 3 instead of 5 at 88.',
      },
      {
        kind: 'balance',
        text: 'Knight — Crimson Offering (Campaign and Arena): Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw stays 3/4 and HP payment stays 6/5.',
      },
      {
        kind: 'balance',
        text: 'Hunter — Blood Tithe (Campaign and Arena): Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw 2, Might 1 and HP payment 7/5 stay unchanged.',
      },
      {
        kind: 'balance',
        text: 'Hunter — Adrenal Surge (Campaign and Arena): Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw stays 1/2 and HP payment stays 3/2.',
      },
      {
        kind: 'balance',
        text: 'Rogue — Rush of Blood (Campaign and Arena): Upgraded changes from 2 Mana immediately to 1 immediately + 1 next own turn. Base still gives 1 immediately; both still draw 2.',
      },
      {
        kind: 'balance',
        text: 'Shaman — Wellspring (Campaign and Arena): Base changes from 4 Mana immediately to 2 immediately + 2 next own turn. Upgraded changes from 5 immediately to 2 immediately + 3 next own turn.',
      },
      {
        kind: 'balance',
        text: 'Necromancer — Soul Tithe (Campaign and Arena): Base changes from 3 Mana immediately to 1 immediately + 2 next own turn. Upgraded changes from 4 immediately to 1 immediately + 3 next own turn. Draw 2 and recurring self-Fate of the greater of 3 or 2% max HP rounded up stay unchanged.',
      },
      {
        kind: 'balance',
        text: 'Shaman — Spirit Offering (Campaign and Arena): Base changes from 2 Mana immediately to 1 immediately + 1 next own turn. Upgraded changes from 3 immediately to 1 immediately + 2 next own turn. Still adds Void to your discard and remains repeatable.',
      },
      {
        kind: 'balance',
        text: 'Trickster — Cut the Deck (Campaign and Arena): The conditional 1-Mana refund now works once on your own turn across all base/upgraded copies and replays, rather than on every qualifying play. The three-suit requirement must be met before the allowance is spent. Cost 1 and draw 2/3 stay unchanged.',
      },
      {
        kind: 'balance',
        text: 'Knight — Scent of Weakness (Campaign and Arena): Each Aura draws 1 on only the first 3 hostile Exposed applications per owner-round, instead of without a limit. Base and upgraded share this rule; each Aura counts independently, including reactive applications during the opponent’s turn. Two Auras can draw up to 6 per owner-round.',
      },
      {
        kind: 'balance',
        text: 'Bonelord (Campaign and Arena): New: after your first Command played on your own turn resolves, gain 3 Barrier per surviving Bone Thrall, capped at 9. A first Command with no surviving Thralls still uses that turn’s opportunity. Existing Raise 2 bonus and Marrow 2 remain.',
      },
      {
        kind: 'balance',
        text: 'Deathwish (Campaign and Arena): New: before your first Attack played on your own turn resolves, gain 5% max HP as Barrier, rounded up, if you are already at or below 40% HP. Playing that first Attack above 40% uses the opportunity without granting Barrier. Free plays qualify; repeating the same Attack’s effects does not grant it again. Existing damage ramp and once-per-fight rescue remain.',
      },
    ],
    heads:
      'Existing cards and decks receive these changes. Resource cards keep their total Mana, costs and Consume behavior; delayed Mana arrives once at the start of your next own turn and separate grants add together. Hero HP and enemy scaling are unchanged. Unfinished battles from older versions restart from their saved encounter checkpoint; Campaign progress and decks are kept.',
  },
  {
    version: '0.197.0',
    date: '2026-11-04',
    title: 'Growing machines and longer Arena games',
    summary: 'Focused Engineer tuning, a longer Arena clock, and Vorthax’s origins.',
    notes: [
      {
        kind: 'balance',
        text: 'Engineer — Heavy Hitter (Campaign and Arena): damage changes from your biggest living companion’s max HP to 12 + half that max HP, rounded down. Upgraded: 3 + max HP becomes 15 + half max HP. Cost stays 2 Mana. At 22 max HP, damage is 23/26 instead of 22/25; at 160, it is 92/95 instead of 160/163. Without a living companion it deals 12/15 instead of 0/3. Golemancer keeps its HP growth and existing HP-scaled companion attack bonus.',
      },
      {
        kind: 'balance',
        text: 'Engineer — Resonant Pulse (Campaign and Arena): each Aura now heals all friends by 1 on the first 4 Skills you play on your own turn, instead of every Skill without a limit. Later Skills and off-turn Skills do not trigger it. Copies count separately and reset each own turn. Companion healing still adds current and max HP; two Auras can add up to 8 HP per companion each turn. Cost stays 1 Mana and the upgrade still starts in your opening hand.',
      },
      {
        kind: 'changed',
        text: 'Arena: each game now has a 20-minute limit (was 15), including ghost games. The turn limit remains 75 seconds. At the game limit, the higher percentage of hero HP remaining wins; equal percentages draw.',
      },
      {
        kind: 'fixed',
        text: 'Limited Aura descriptions now specify when activations are restricted to your own turn, including Fault Lines. Fault Lines itself is unchanged.',
      },
      {
        kind: 'new',
        text: 'The Story now follows Vorthax from the conquest of his home realm to the Shattering. Learn why he sacrificed his own cities to breach the Ward, how the captured Wardens give him new powers, and why Riftwalkers can challenge him.',
      },
    ],
    heads:
      'Existing cards and decks receive these changes. Unfinished battles from older versions restart from their saved encounter checkpoint; Campaign progress and decks are kept.',
  },
  {
    version: '0.196.0',
    date: '2026-11-04',
    title: 'The cause of the Shattering',
    summary: 'Vorthax broke the Ward. The worlds paid the price.',
    notes: [
      {
        kind: 'new',
        text: 'The illustrated story reveals the Shattering: Vorthax unleashed a cataclysmic blast against the Ward, breaking a vast section and opening its worlds. Distant sections still stand. The Wardens tried to defend the breaches before the Heart took them.',
      },
      {
        kind: 'changed',
        text: 'Includes the shared balance improvements, reward reroll, cleanse previews and playtest reports from 0.195.0.',
      },
    ],
    heads:
      'When updating from 0.194.0 or earlier, unfinished battles restart from their saved encounter checkpoint. Campaign progress and decks are kept.',
  },
  {
    version: '0.195.0',
    date: '2026-11-04',
    title: 'More room for every play style',
    summary: 'Stronger developing builds, steadier scaling and playtest reports.',
    notes: [
      {
        kind: 'balance',
        text: 'Swarmwright develops Fabrication faster. Bonelord raises stronger companions. Blood Knight gets a reliable first-payment bonus. Golemancer saves some earned growth when a large machine dies, keeping its damage-per-HP bonus.',
      },
      {
        kind: 'balance',
        text: 'Deathwish damage now ramps below 70% HP. Its one rescue also covers hostile Skills, Auras, Bleed and Burn; follow-up hits can still kill.',
      },
      {
        kind: 'balance',
        text: 'Strip for Parts and Detonate now Consume. Predator and Fault Lines give smaller bonuses after six activations each turn. Soulreaper gains Harvest and Barrier from the first six consumptions each round. Storm Sovereign costs 2 Mana and grants Barrier on its first three activations each turn.',
      },
      {
        kind: 'balance',
        text: 'Soul Tithe recurring Fate is 2% of your max HP, rounded up, at least 3.',
      },
      {
        kind: 'new',
        text: 'Reroll a combat card reward once per Rift Tier. Inspect cleansing cards to see their exact current debuff reductions. Export playtest results from Settings to share with the developer.',
      },
      {
        kind: 'fixed',
        text: 'Applying Exposed to opposing heroes or companions now triggers the correct player’s effects, including reactive effects.',
      },
    ],
    heads:
      'Older unfinished battles restart from their saved encounter checkpoint. Campaign progress and decks are kept.',
  },
  {
    version: '0.194.0',
    date: '2026-11-04',
    title: 'Skip unnecessary companion targeting',
    summary: 'One valid target means one action to play the card.',
    notes: [
      {
        kind: 'changed',
        text: 'Cards that target your companions automatically choose the target when only one legal option exists. Clicking, tapping, dragging, and keyboard shortcuts all use the same behavior.',
      },
      {
        kind: 'changed',
        text: 'Multiple legal targets still require your choice, including cards that can target either your hero or a companion. Cards without a legal target remain unavailable.',
      },
    ],
  },
  {
    version: '0.193.0',
    date: '2026-11-04',
    title: 'Backup Core is a buff',
    summary: 'A Consume skill with visible, one-use revival charges.',
    notes: [
      {
        kind: 'changed',
        text: 'Backup Core is now a Skill: gain 1 Backup Core, then Consume. It still costs 2 Mana, or 1 upgraded. Its charge appears as a buff on your hero instead of an Aura.',
      },
      {
        kind: 'changed',
        text: 'Each charge revives one fallen companion as a fresh copy at half its base max HP. Charges stay until used and never refresh each turn. Multiple plays add charges; scrapping does not spend them.',
      },
    ],
    heads:
      'Existing copies update automatically. Older unfinished fights restart from their saved encounter checkpoint.',
  },
  {
    version: '0.192.0',
    date: '2026-11-04',
    title: 'Campaign ghosts paused',
    summary: 'Campaign battles use regular enemies and Wardens.',
    notes: [
      {
        kind: 'changed',
        text: 'Echo encounters are removed from campaign maps for now. Ghosts no longer replace Wardens. Arena ghost matches remain available.',
      },
      {
        kind: 'fixed',
        text: 'Existing campaign Echoes become normal fights, and saved ghost Wardens become their usual bosses. Progress and already-earned rewards are kept.',
      },
    ],
    heads:
      'An unfinished campaign ghost fight restarts as a normal enemy encounter from its checkpoint, without spending Resolve.',
  },
  {
    version: '0.191.0',
    date: '2026-11-04',
    title: 'A stronger Engineer crew',
    summary:
      'More opening power, lasting swarm growth and Auras that support replacement machines.',
    notes: [
      {
        kind: 'balance',
        text: 'The Engineer starts with an 8-HP Drone that attacks for 4. New starting decks replace one Strike with Pulse Pistol. Micro Drones attack for 3 instead of 2.',
      },
      {
        kind: 'balance',
        text: 'Swarmwright keeps the fourth slot and 1 Primed each turn, and gains Fabrication: companions deal +1 attack damage per hit for every four companions summoned that fight. Starting companions do not count; replacements keep the bonus.',
      },
      {
        kind: 'changed',
        text: 'Reactor gives a fixed +3 attack damage per hit (+4 upgraded) to you and your current or future companions for the fight. Kron’s Assembly Arm uses the same continuous effect. These bonuses do not grant Might or grow every turn.',
      },
      {
        kind: 'fixed',
        text: 'One-time Aura effects say On play. Companion damage previews include continuous bonuses and Ossify’s Marrow bonus.',
      },
    ],
    heads:
      'Existing decks are retained. An older unfinished fight restarts from its saved encounter checkpoint under the new rules.',
  },
  {
    version: '0.190.0',
    date: '2026-11-04',
    title: 'A seamless Settings header',
    summary: 'The Settings title blends into the menu.',
    notes: [
      {
        kind: 'changed',
        text: 'Removed the darker box and shadow behind the Settings header. Preferences scroll in their own area, keeping Close and Quit visible over one continuous panel background.',
      },
    ],
  },
  {
    version: '0.189.0',
    date: '2026-11-04',
    title: 'A clearer Settings menu',
    summary: 'Quit is easy to reach, and account controls line up with your preferences.',
    notes: [
      {
        kind: 'changed',
        text: 'Quit to Desktop now has its own row at the top of Settings. It stays visible while scrolling and saves your progress before closing.',
      },
      {
        kind: 'changed',
        text: 'Google and Steam account status, save mode and update controls use a consistent layout. Small screens stack labels, descriptions and buttons to keep everything readable.',
      },
    ],
  },
  {
    version: '0.188.0',
    date: '2026-11-04',
    title: 'The worlds beyond the Ward',
    summary: 'An illustrated story, a new opening splash, and smoother desktop sign-in.',
    notes: [
      {
        kind: 'new',
        text: 'The story of the Rifts is on the home and Learn pages: six illustrated chapters, eight worlds, and artwork you can open and explore. The Riftwalkers use their default appearances.',
      },
      {
        kind: 'new',
        text: 'The game opens on a new landscape splash while Riftwalker artwork loads. Slow connections can continue while the remaining art arrives.',
      },
      {
        kind: 'fixed',
        text: 'Google desktop sign-in now completes after browser approval. Approval, cancellation and error pages have clear instructions and a new Shattered Rifts design.',
      },
    ],
  },
  {
    version: '0.187.0',
    date: '2026-11-04',
    title: 'Your Google account on desktop',
    summary: 'Use the same account on the website and Windows app.',
    notes: [
      {
        kind: 'new',
        text: 'The desktop Account panel and Settings offer Sign in with Google. Confirm in your browser and return to the app; your desktop login is remembered securely.',
      },
      {
        kind: 'changed',
        text: 'Sign out saves first and restores your separate guest profile. Other Google accounts and local offline saves stay separate. Account changes wait until you leave battle.',
      },
      {
        kind: 'new',
        text: 'Steam editions are ready to link a fresh Steam game account to existing Google progress after an explicit browser confirmation. Linking refuses separate Steam progress instead of overwriting it; live Steam features still await our Steam app setup.',
      },
    ],
  },
  {
    version: '0.186.0',
    date: '2026-11-04',
    title: 'Download beside Settings',
    summary: 'The Windows download now lives in the home header.',
    notes: [
      {
        kind: 'changed',
        text: 'Download for Windows sits beside Settings on the home screen. Phones use a compact Download button and Settings gear so the header fits on one row.',
      },
    ],
  },
  {
    version: '0.185.0',
    date: '2026-11-04',
    title: 'A Shattered Rifts identity',
    summary: 'Our new logo comes to browser tabs, downloads and the desktop app.',
    notes: [
      {
        kind: 'changed',
        text: 'The SR logo now appears beside the title, on Download for Windows, in browser tabs and mobile home-screen icons, and on the Windows app and installer.',
      },
      {
        kind: 'changed',
        text: 'Credits is now beside Patch notes in Settings > About and updates, instead of sitting alone at the bottom of the home screen.',
      },
    ],
  },
  {
    version: '0.184.0',
    date: '2026-11-04',
    title: 'Update between battles',
    summary: 'A quieter home screen and a clear invitation to update when your battle is over.',
    notes: [
      {
        kind: 'new',
        text: 'The website checks for new versions and offers Save and refresh. Desktop offers Save and restart when a patch has downloaded. Prompts wait until you leave the fight screen, and Later lets you keep playing.',
      },
      {
        kind: 'changed',
        text: 'Account is on the left of the home header and Settings is on the right. Removed the Friends alpha / working title banner and duplicate version labels.',
      },
      {
        kind: 'changed',
        text: 'Settings > About and updates holds the version, build details and update controls. Desktop save-mode switching is now in Settings. Phone layouts have larger buttons and a profile panel that stays on screen.',
      },
    ],
  },
  {
    version: '0.183.0',
    date: '2026-11-04',
    title: 'Desktop downloads and automatic updates',
    summary: 'Download the Windows playtest from the website and let the app keep itself current.',
    notes: [
      {
        kind: 'new',
        text: 'The website home page has Download for Windows. The installer keeps your existing desktop saves.',
      },
      {
        kind: 'new',
        text: 'Installed standalone Windows copies check for updates on launch and periodically, then download them in the background. Downloads do not interrupt a fight.',
      },
      {
        kind: 'new',
        text: 'Settings shows update progress, Check for updates, and Restart to update. Downloaded updates also install when you quit normally.',
      },
      {
        kind: 'changed',
        text: 'Restart to update saves progress before handing off to the installer. Steam editions use Steam for updates.',
      },
    ],
    heads:
      'Versions 0.182.0 and earlier need this installer once to enable future automatic updates. The Windows playtest is still unsigned and may show a Windows warning. Browser and desktop local saves remain separate.',
  },
  {
    version: '0.182.0',
    date: '2026-11-04',
    title: 'Soulreaper: Harvest of Souls',
    summary: 'Consuming cards now develops a growing end-of-turn offensive payoff.',
    notes: [
      {
        kind: 'balance',
        text: 'Soulreaper gains 3 Barrier per consumed card. At the end of a turn in which you consumed cards, Reap the lowest-HP enemy for 4 damage plus 2 per card consumed this fight.',
      },
      {
        kind: 'changed',
        text: 'Reap resolves once after Fleeting cards are consumed and companions act. It is non-attack damage that Barrier can absorb, and its accumulated harvest resets each fight.',
      },
      {
        kind: 'new',
        text: 'Soulreaper’s combat chip shows the number of harvested cards and the next Reap’s damage.',
      },
    ],
    heads:
      'Refresh or update the desktop app. Existing Soulreaper choices receive the new effect. Older replays are incompatible; unfinished older-rule fights restart at their encounter checkpoint. Card pools are unchanged.',
  },
  {
    version: '0.181.0',
    date: '2026-11-04',
    title: 'Ascendancies with a purpose',
    summary: 'Twelve Ascendancies gain distinct ways to develop into the late game.',
    notes: [
      {
        kind: 'balance',
        text: 'Marshal rewards spending banked Reserves; Blood Knight stores retaliation from wounds; Golemancer turns large-machine durability into attack power.',
      },
      {
        kind: 'balance',
        text: 'Seer marks and pursues a chosen enemy. Assassin prepares an execution through Skills, while Bladedancer keeps the knife-volume identity.',
      },
      {
        kind: 'balance',
        text: 'Totemist cultivates a standing row. Elementalist develops each element and rewards switching between them. Archmage recovers power from a paid Spell Attack.',
      },
      {
        kind: 'balance',
        text: 'Zealot develops controlled Fury, Sunwalker preserves progress between Radiant windows, Brewmaster builds Fermentation, and Deathwish gains low-health pressure with one emergency survival opportunity.',
      },
      {
        kind: 'new',
        text: 'Combat trait chips show the progress of these Ascendancy mechanics. The changes apply in Campaign, Arena, and Echo fights.',
      },
    ],
    heads:
      'Refresh or update the desktop app. Existing Ascendancy choices keep their names and receive the new effects. Older replays are incompatible; an unfinished fight from older rules restarts from its encounter checkpoint. Card pools are unchanged. Late-game strength still needs playtesting.',
  },
  {
    version: '0.180.0',
    date: '2026-11-04',
    title: 'One account, one active device',
    summary: 'Other devices can browse while one device plays your shared account.',
    notes: [
      {
        kind: 'changed',
        text: 'Your shared Campaign and Arena are played on one device at a time. Another device can sign in and browse, but must wait until you stop playing on the first device.',
      },
      {
        kind: 'new',
        text: 'Use Save and stop playing on the home screen to switch devices. Interrupted shared-account play pauses until you reconnect.',
      },
      {
        kind: 'new',
        text: 'The desktop app has a separate Local offline play mode. Its campaigns stay on that device and do not enter Arena, leaderboards or shared-account syncing.',
      },
      {
        kind: 'fixed',
        text: 'Switching devices loads the latest confirmed progress and saved fight actions. Divergent older local campaign copies are preserved for recovery instead of replacing newer shared progress.',
      },
    ],
    heads:
      'Refresh the website or install the new desktop build. Shared-account gameplay now requires an internet connection; older clients cannot submit shared gameplay progress.',
  },
  {
    version: '0.179.0',
    date: '2026-11-04',
    title: 'Desktop saves and Steam preparation',
    summary:
      'Quit from Settings, keep backed-up desktop saves, and prepare for Steam accounts and achievements.',
    notes: [
      {
        kind: 'new',
        text: 'Desktop Settings now has Quit to Desktop. The game saves your current progress before closing.',
      },
      {
        kind: 'new',
        text: 'Desktop progress is also kept in versioned save files with a previous-revision backup. These include campaign saves, in-progress fights, history, the local Vault and portable preferences.',
      },
      {
        kind: 'new',
        text: 'Steam integration is ready to configure: automatic Steam account sign-in, 18 campaign achievements, separate account saves, and Steam Auto-Cloud file support.',
      },
      {
        kind: 'changed',
        text: 'Steam features require the game to be registered and configured in Steamworks. Until then the desktop app works in standalone mode, and the website continues separately.',
      },
    ],
  },
  {
    version: '0.178.0',
    date: '2026-11-03',
    title: 'A desktop playtest build',
    summary: 'The first Windows desktop wrapper shares the same game as the website.',
    notes: [
      {
        kind: 'new',
        text: 'A Windows desktop playtest build bundles the game and artwork for offline campaign play. Runs and settings are kept in a separate desktop profile.',
      },
      {
        kind: 'new',
        text: 'Desktop players can start a campaign without an online username. Use F11 or Alt+Enter for fullscreen, and the Game menu to open the save folder.',
      },
      {
        kind: 'changed',
        text: 'The website continues to update separately. Desktop online play uses the existing server and Vault codes; Steam login, achievements and Steam Cloud are still to come.',
      },
    ],
  },
  {
    version: '0.177.0',
    date: '2026-11-03',
    title: 'A smoother campaign climb',
    summary: 'Steady enemy growth through Tier XX, with bounded opening and phase bonuses.',
    notes: [
      {
        kind: 'balance',
        text: 'Scripted enemies gain 40 percentage points of HP and 5 points of damage per tier, starting at 90% of base. Tier XX reaches 850% HP and 185% damage, with no final-tier acceleration.',
      },
      {
        kind: 'balance',
        text: 'Elites and Wardens use the same tier multiplier as other enemies. Extra hardening bonuses, Warden damage multipliers, added Swarming enemies and opening Exposed are removed.',
      },
      {
        kind: 'balance',
        text: 'Phase Might is bounded, Blood Rites gives 1 starting Might instead of growing Ritual, and Hunted gives 1 Primed. Opening Faltering and Brittle last one turn; Rift Static adds one card and Rift Scars adds one Wound per tier, up to six.',
      },
      {
        kind: 'changed',
        text: 'Late-tier health pools, encounter lineups, Warden mechanics and longer maps still demand a developed deck. Dedicated ghost scaling and Arena rules are unchanged.',
      },
    ],
  },
  {
    version: '0.176.0',
    date: '2026-11-03',
    title: 'A steadier climb against ghosts',
    summary:
      'Echoes and ghost Wardens grow at a steady rate, with no sudden HP jumps or extra opening penalty.',
    notes: [
      {
        kind: 'balance',
        text: 'Campaign ghosts use a straight-line curve: Warden HP starts at 2.2 times class base HP and adds 0.2 times each tier. Saved Max HP adds a bounded bonus instead of multiplying with the tier. Echoes retain 60% of ghost-Warden HP.',
      },
      {
        kind: 'balance',
        text: 'Ghost damage starts at 100% at Tier IV and adds 3 percentage points per tier, reaching 148% at Tier XX. There is no Tier XIII Arena-HP jump, final-tier acceleration, or extra Warden damage multiplier.',
      },
      {
        kind: 'balance',
        text: 'Ghosts add no opening Faltering; normal campaign Omens still apply. Campaign ghosts have more variety among nearby-tier decks. Arena fights and their ghost selection are unchanged.',
      },
    ],
  },
  {
    version: '0.175.0',
    date: '2026-11-03',
    title: 'Weapons and growing builds',
    summary:
      'Engineer weapons and summons gain lasting damage, with more ways to grow across the roster.',
    notes: [
      {
        kind: 'new',
        text: 'Foreman becomes Artillerist: gain 1 Might each turn, and your first Attack gives 3 Barrier. Saved Foreman decks become Artillerists. Weapon Bench builds your own Might, and Rotary Cannon fires four shots.',
      },
      {
        kind: 'balance',
        text: 'Engineer: Jumpstart gives companions lasting Might instead of Primed; Ion Lance grows with each shot; Swarm Tactics grows with successful summons. Bulwark Frame scales with companion max HP, and Rebuild returns a machine at 75% HP.',
      },
      {
        kind: 'new',
        text: 'Measured Conviction rewards retained Reserves with Might and Barrier. Spirit Pact rewards your first ordered totem command with Spirit and Barrier. Morning After rewards an actual Hangover payment with Might and Barrier.',
      },
      {
        kind: 'balance',
        text: 'Monk gains 1 Might on the first stance entered on your turn; Foretold Flame remembers Fervor gained. Drunken Master builds Might once a turn. Gleeful Trapsmith grows with sprung Traps, and Masquerade rewards repeated Full Tricks.',
      },
      {
        kind: 'balance',
        text: 'Slow Murder costs 2 Mana and Side Slip is common. Spirit Strike costs 1 with a smaller hit; Heart of the Pyre reads enemy Burn. Smoldering Blow scales faster; Restless Spirits grows with consumed Gravesouls, and Requiem draws a card.',
      },
      {
        kind: 'balance',
        text: 'Echoing Strike creates a free, consumed Flame Echo that cannot make copies. Gallows grows damage across copies instead of doubling through Noose.',
      },
    ],
    heads:
      'Card rules changed, so older battle replays may play differently. Echo encounter rules are unchanged.',
  },
  {
    version: '0.174.0',
    date: '2026-11-03',
    title: 'Settings on a phone, a Low suggestion',
    summary:
      'The Settings menu fits a phone, and a computer drawing without its graphics card is offered Low graphics once.',
    notes: [
      {
        kind: 'changed',
        text: 'The Settings menu fits a phone: a full-screen sheet with Close always in view, each setting on one line with its explanation beneath, and bigger buttons for a finger.',
      },
      {
        kind: 'new',
        text: 'When your browser draws without your graphics card, the first fight offers to switch Graphics to Low, once.',
      },
    ],
  },
  {
    version: '0.173.0',
    date: '2026-11-03',
    title: 'Settings, and fewer stutters',
    summary:
      'A Settings menu on every screen, fewer stutters, and a performance report to send in if the game still stutters.',
    notes: [
      {
        kind: 'new',
        text: "A Settings menu, from the title screen, the run's bar and a fight's top bar: Sound and Volume, Graphics quality, Effects, Fullscreen, Tips, and Show every tip again. It replaces the fight's Tips, Sound and Graphics buttons.",
      },
      {
        kind: 'new',
        text: 'Settings, Performance report: record a while of play and copy a short report of any stutters to send in.',
      },
      {
        kind: 'changed',
        text: 'Fewer stutters: card art is painted ahead of time, painted effects are prepared before they first play, effects move more lightly and at most 12 play at once, and a fight opens faster after the first one.',
      },
    ],
  },
  {
    version: '0.172.0',
    date: '2026-11-03',
    title: 'Every Uncommon has its own effect',
    summary: 'All 371 Uncommon cards now play their own painted effect, as the Rares do.',
    notes: [
      {
        kind: 'new',
        text: 'Every Uncommon card, in every class, plays its own painted effect when played: on its target, on your hero, or across the whole enemy line.',
      },
    ],
  },
  {
    version: '0.171.0',
    date: '2026-11-03',
    title: 'Graphics quality',
    summary:
      'A Graphics quality setting: Low keeps the game smooth on a computer that is slow to draw.',
    notes: [
      {
        kind: 'new',
        text: "Graphics: High or Low, in a fight's top bar beside Tips and Sound. Low stops the drifting fog, floating motes, breathing fighters and other motion at rest, so the game runs smoothly on a computer that draws without a graphics card. Cards, blows and effects play the same. High is the full look and stays the default.",
      },
    ],
  },
  {
    version: '0.170.0',
    date: '2026-11-03',
    title: 'Knight Uncommon effects, the Swarmwright crest',
    summary:
      "The Knight's Uncommons play their own effects, and the Swarmwright has its own crest.",
    notes: [
      {
        kind: 'new',
        text: "All 40 of the Knight's Uncommon cards play their own painted effect, as the Rares do. The other classes' Uncommons follow.",
      },
      { kind: 'new', text: 'The Swarmwright has its own crest: four machines working as one.' },
    ],
  },
  {
    version: '0.169.0',
    date: '2026-11-03',
    title: 'The Swarmwright',
    summary: 'The Overclocker is now the Swarmwright: the only class with a 4th companion slot.',
    notes: [
      {
        kind: 'changed',
        text: "The Engineer's Overclocker is now the Swarmwright, with a 4th companion slot (four Light machines, a Heavy and two Light, or a Colossal and one Light). No other class has one.",
      },
      {
        kind: 'balance',
        text: 'Swarmwright companions gain 1 Primed at the start of your turn (the Overclocker gave 2), as there can be one more of them.',
      },
      {
        kind: 'changed',
        text: 'A run, banked deck or ghost that took the Overclocker carries on as the Swarmwright.',
      },
    ],
    heads: 'Rules changed: Arena matches need both players on this version.',
  },
  {
    version: '0.168.0',
    date: '2026-11-03',
    title: 'Every Rare has its own effect',
    summary:
      'All 286 Rare cards now play their own painted effect, so no two Rares look alike when played.',
    notes: [
      {
        kind: 'new',
        text: 'Every Rare plays its own painted effect: on its target as the blow lands, on your hero for a Skill or an Aura, or across the whole enemy line for a card that hits them all.',
      },
      {
        kind: 'changed',
        text: 'A fight only fetches the effects of the Rares in your deck, so it opens as fast as before.',
      },
    ],
  },
  {
    version: '0.167.0',
    date: '2026-11-03',
    title: 'Fracture, Fault Lines and new attacks',
    summary:
      "The Spellblade's Fracture builds faster and gets a new Aura, Spells are cast instead of swung, and cards that hit every enemy look like it.",
    notes: [
      {
        kind: 'new',
        text: 'Fault Lines (Spellblade, uncommon Aura, 2 Mana, 1 upgraded): whenever you play a Sword or a Spell, apply 2 Fracture to its target, or the enemy with the most Fracture.',
      },
      {
        kind: 'balance',
        text: 'More Fracture: Faultline Hex 7 (9), Pressure Point 6 (8), Spreading Fault 5 to every enemy (7), Hairline Crack 5 (7), Fault Memory 5 and grows by 3, Hungering Void 3 a turn (4).',
      },
      {
        kind: 'balance',
        text: 'Final Shatter applies 8 Fracture (was 10, which always set off a Shatter). Its Barrier, now 12 (16), comes only when it does: play it on an enemy with 2 or more Fracture.',
      },
      {
        kind: 'changed',
        text: "The Spellblade's Spells are cast from her hand as ember instead of swung with the blade, and land as spells.",
      },
      {
        kind: 'changed',
        text: 'Cards that hit every enemy play across them all: a blade cuts through each in one sweep, a spell rains fire on each, a gun or a thrown knife goes to each.',
      },
      {
        kind: 'changed',
        text: 'Campaign leaderboard: Tiers cleared is gone; Class and Ascendancy have a column each, and the Tier is just its number.',
      },
    ],
    heads: 'Card numbers changed: Arena matches need both players on this version.',
  },
  {
    version: '0.166.0',
    date: '2026-11-03',
    title: 'Warden rules fold away',
    summary:
      "A Warden's rule shows in full as the fight starts, then folds down to its name, clear of the enemies' next moves.",
    notes: [
      {
        kind: 'changed',
        text: 'A Warden\'s rule opens as a card with "Got it" when the fight starts. After that it is just its name under the title; tap the name to read it again.',
      },
      {
        kind: 'fixed',
        text: "On a phone the Warden's rule no longer covers the enemies' next moves.",
      },
    ],
  },
  {
    version: '0.165.0',
    date: '2026-11-03',
    title: 'A sweeping Blade',
    summary: 'Under Blade Sweep the Obsidian Blade needs no aiming.',
    notes: [
      {
        kind: 'changed',
        text: 'While Blade Sweep is up, the Obsidian Blade plays straight away with no aiming, as it strikes every enemy.',
      },
      {
        kind: 'fixed',
        text: 'The Blade Sweep buff no longer shows a "1": more of it changes nothing.',
      },
    ],
    heads: 'Reload the page if the game asks you to; old Arena replays will not play.',
  },
  {
    version: '0.164.0',
    date: '2026-11-03',
    title: 'Starting decks evened out',
    summary:
      'Every class starts closer to the others: the strongest starts are trimmed, and the Spellblade, Rogue and Trickster start sturdier.',
    notes: [
      {
        kind: 'balance',
        text: 'Spellblade: Gather Power also gains 2 (+1 per 3 Spell Power) Barrier, and Kindled starts her with 4 Spell Power (was 3).',
      },
      {
        kind: 'balance',
        text: 'Shaman: starts with a Hawk and a Bear totem; the Thunderbird is no longer in the starting row. Thunder Memory plants a Thunderbird, plus one for each planted this fight.',
      },
      { kind: 'balance', text: 'Knight: starts each fight with 1 Reserve (was 2).' },
      { kind: 'balance', text: 'Monk: 78 Max HP (was 82). Rogue: 75 Max HP (was 70).' },
      { kind: 'balance', text: 'Trickster: starts with 3 Strikes and 3 Defends (was 4 and 2).' },
    ],
    heads:
      'Reload the page if the game asks you to; old Arena replays will not play. A run already under way keeps its Max HP.',
  },
  {
    version: '0.163.0',
    date: '2026-11-03',
    title: 'Cinderfall for free',
    summary: "The Spellblade's Cinderfall costs no Mana: Spell Power is its whole price.",
    notes: [
      {
        kind: 'balance',
        text: 'Cinderfall costs 0 Mana (was 1). It still spends half your Spell Power for 4 damage + 4 a point; upgraded it deals 6 + 4 a point (was 7 + 4).',
      },
    ],
    heads: 'Reload the page if the game asks you to; old Arena replays will not play.',
  },
  {
    version: '0.162.0',
    date: '2026-11-03',
    title: 'A smoother hand, clearer choices',
    summary:
      'Cards lift the moment you point at them, choosing cards to discard, Defer or Consume is plain to see, and Wide Arc makes fewer Daggers.',
    notes: [
      {
        kind: 'changed',
        text: 'A card lifts the moment the pointer reaches it, and the one you move off sinks back under its neighbours instead of flickering behind the next card.',
      },
      {
        kind: 'changed',
        text: 'Discarding, Deferring or Consuming from your hand: the cards you can choose are ringed in gold, a marked card stands up with "✓ Discard" (or Defer, Consume) above it, and the prompt counts how many you have chosen.',
      },
      { kind: 'balance', text: 'Wide Arc adds 2 Daggers (3 upgraded), was 4 (5).' },
    ],
    heads: 'Reload the page if the game asks you to; old Arena replays will not play.',
  },
  {
    version: '0.161.0',
    date: '2026-11-03',
    title: 'Shorter tiers',
    summary:
      'Each Rift Tier is one floor longer than the last, not two, so a full run is a third shorter, and Elites give more Max HP to make up for it.',
    notes: [
      {
        kind: 'changed',
        text: 'Tier I is 11 floors with its Warden, Tier X 20 and Tier XX 30 (was 12, 30 and 50).',
      },
      {
        kind: 'balance',
        text: "An Elite's Max HP spoil is now +3 (was +2), so the HP pool you can build over a run stays about the same with fewer Elites.",
      },
    ],
    heads:
      'A run already under way keeps its current map; the next tier you reach uses the new length. Reload the page if the game asks you to.',
  },
  {
    version: '0.160.0',
    date: '2026-11-02',
    title: 'A beatable climb, Elite spoils',
    summary:
      'The deep tiers are hard because enemies take longer to kill, not because they kill you in one blow, and Elites let you choose shards, Max HP or a heal.',
    notes: [
      {
        kind: 'balance',
        text: 'Enemy damage rises more slowly: Tier X deals 171% of the written numbers (was 198%) and Tier XX 294% (was 438%). Enemy HP rises evenly to Tier XVII and steeply over the last three: Tier X has 450% (was 360%), Tier XX still 1000%.',
      },
      {
        kind: 'balance',
        text: 'Enemy Barrier and healing grow at half the rate of their HP: about 5.5 times the written number at Tier XX (was 10).',
      },
      {
        kind: 'changed',
        text: "Hunted: only the strongest enemy's first attack hits harder. Exposed Soul lasts one turn at every tier.",
      },
      {
        kind: 'new',
        text: 'Elite spoils: after an Elite or an Echo, choose its shards, +2 Max HP, or a heal of 15% of your Max HP, then your card. Build a deep HP pool for the long tiers.',
      },
      {
        kind: 'new',
        text: "Kron's Foundry Hatch, the Hollow Acolytes and Vorthax's Rift Ward have their own figures; Slippery, Veiled, Gravity and Unmaking their own icons; the Spin To Win machines their scenes; and every card its own picture.",
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.159.0',
    date: '2026-11-02',
    title: 'Painted events, Warden arenas, the Crossing',
    summary:
      'Every event has its own painted scene, every Warden fights in an arena of its own, each realm has a second place to fight, and ghosts and Arena matches meet in the Crossing.',
    notes: [
      {
        kind: 'new',
        text: 'Every event has its own painted scene, and so do the Rift Caches, the merchant and the shrine. On a wide screen the event stands in the dark side of its picture; on a phone the picture shows across the top.',
      },
      {
        kind: 'new',
        text: 'Every Warden fights in an arena of its own: Kron by his foundry Hatch, Nyxara in her veiled throne room, the Applause Below in an opera house, the Event Horizon Regent at the edge of a black hole, and Vorthax at the Heart of the Rift, among others.',
      },
      {
        kind: 'new',
        text: 'Each realm has a second place to fight (castle ramparts, a skydock, a jungle canopy, a moonlit garden, a stilt village, a desert bazaar, a tavern cellar), and the Far Rifts have their own observatory. The Hollow Crown and the Midden have their painted arenas at last.',
      },
      {
        kind: 'new',
        text: 'Ghost Wardens, Echoes and every Arena match are fought in the Crossing, a colosseum stitched together from every world.',
      },
      {
        kind: 'changed',
        text: "Campaign ghosts no longer have Enduring: you start against an Echo Faltering for 2 turns, and against a ghost Warden for 3. Ghost Wardens get the Arena's HP from Tier XIII, not Tier X.",
      },
      {
        kind: 'changed',
        text: "A Fanned Dagger never needs aiming: Inked Daggers and Recall the Blades play straight away while you are Fanned, and an Inked Dagger's Faltering lands on every enemy, like its damage.",
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.158.0',
    date: '2026-11-02',
    title: 'Rift Caches, Echoes, every Warden a rule',
    summary:
      'Two new stops on the map, a rule of its own for every Warden, Vorthax rebuilt as the last test of a run, and enemy Barrier and healing that keep up with the Rift Tier.',
    notes: [
      {
        kind: 'new',
        text: 'Rift Cache, one on every map: no fight. An open one lets you take a Boon, a rare card or a pile of shards. A trapped one holds the Boon and a rare card together, if you spring the trap (HP), reach past it (a Wound) or disarm it (shards). You can always walk away.',
      },
      {
        kind: 'new',
        text: "Echo, one on every map from Tier IV: another player's deck from the Arena, played by the computer. Beat it to take one of its best cards, with an Elite's chance of a Boon; losing costs 2 Resolve, like an Elite.",
      },
      {
        kind: 'changed',
        text: "Ghosts in the campaign can't be beaten in one turn: a ghost Warden loses at most a quarter of its Max HP a turn, and an Echo at most a third (Enduring). Arena ghosts are unchanged.",
      },
      {
        kind: 'new',
        text: 'Every Warden has a rule of its own now: Gorrmaw eats its Maw Spawn to heal and grow, the Upside-Down Stag takes your Barrier before it strikes, the Queen of the Unmade Consumes the costliest card of your next hand, the Event Horizon Regent pulls the cards you keep in hand back onto your draw pile, and Nyxara is Veiled until you hit her.',
      },
      {
        kind: 'changed',
        text: 'Vorthax, the Heart of the Rift, is rebuilt as the last test of a run: four quarters, each with the rules of the Wardens it made, and in the last one the Rift closes on you with Fate every turn. Gorrmaw is gentler: Maw Spawn have 18 HP (was 24).',
      },
      {
        kind: 'balance',
        text: "Enemies' Barrier and healing grow with the Rift Tier, as their HP does: a move that gives 12 Barrier at Tier I gives about 43 at Tier X and 120 at Tier XX. Tier I is unchanged.",
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.157.0',
    date: '2026-11-02',
    title: 'Painted class crests',
    summary: 'Every class now has a painted crest, in the same style as the Ascendancy crests.',
    notes: [
      {
        kind: 'changed',
        text: 'Painted class crests on the title screen, the Sanctum, the pickers, the fight plates and the leaderboards. The badge on cards keeps its symbol.',
      },
      {
        kind: 'new',
        text: 'The Elementalist has its own crest: a stone ring set with flame, frost and storm gems.',
      },
    ],
  },
  {
    version: '0.156.0',
    date: '2026-11-02',
    title: 'Ascendancies rebalanced, the Elementalist',
    summary:
      "Every Ascendancy is now a good pick in the right deck: none runs away with a long run, and the weakest have been lifted. The Elementalist takes the Pyromancer's place.",
    notes: [
      {
        kind: 'balance',
        text: 'Ascendancies: the strongest early ones come down (Paladin keeps 60% of your Barrier rather than being Fortified, Marshal Max Reserves 4, Trapmaster 2 Barrier, Totemist 1 Spirit and 8 Barrier, Blademaster +1 a Sword hit and a card for the first Sword each turn) and the ones that grew without end are capped (Blood Knight at most 3 Might a fight and once a round, Beastmaster shares three quarters of your Might, Assassin +10% on the first Attack, Sunwalker the first stance each turn, Archmage +20% on the first Attack, Deathwish 1.25% a point of HP missing up to +100%).',
      },
      {
        kind: 'balance',
        text: "The weaker ones go up: Foreman companions deal 25% more, Golemancer +3 max HP, Reaver also gives 2 Primed, Predator 2 Primed a draw, Spiritwalker 4 Barrier, Shatterer Shatters 15% more, Zealot 6 Barrier the first Fury each turn, Gunslinger +2 Precision every turn, Brewmaster also 1 Might for the turn, Fateweaver 2 Fate plus 2% of the enemy's max HP, Soulreaper 4 Barrier.",
      },
      {
        kind: 'new',
        text: 'The Elementalist replaces the Pyromancer: the first Flame card each turn adds 3 Burn, the first Frost card 3 Barrier, the first Storm card 2 damage to all enemies. A run that took the Pyromancer has the Elementalist.',
      },
      {
        kind: 'balance',
        text: 'Etching Edge deals 1 more per 2 Spell Power (was 2 per 4) and applies 1 more Fracture per 4 Spell Power (was per 8).',
      },
      {
        kind: 'changed',
        text: "Phones: the run header at the top of the map is much smaller, with HP, shards, potions and Boons in one row you slide sideways; the Merchant shows two cards to a row; the map's drawing pens are gone on touch screens; the Grimoire is a list of every card two across with the realms as chips.",
      },
      {
        kind: 'changed',
        text: 'The Sanctum shows each Ascendancy as a tile: crest, what it leans into, and what it gives.',
      },
      {
        kind: 'fixed',
        text: 'No picture can show as broken: every one is checked to exist, and the few without a fallback have one.',
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.155.0',
    date: '2026-11-02',
    title: 'Phones: hold to read',
    summary: 'On a phone you can now read every tooltip, and the fight screen fits better.',
    notes: [
      {
        kind: 'new',
        text: "Hold a finger on anything that has a tooltip (statuses, potions, Mana, the piles, Boons, an enemy's intent) to read it. Holding does nothing else, and the next touch closes it.",
      },
      {
        kind: 'fixed',
        text: 'The Consumed pile no longer covers Mana on a phone held upright, or End turn on a phone on its side.',
      },
      {
        kind: 'fixed',
        text: 'Potions fit their slots on the belt, instead of spilling over your statuses.',
      },
      {
        kind: 'changed',
        text: 'Card text is bigger on small cards, and cards are a little bigger on a phone held sideways.',
      },
    ],
  },
  {
    version: '0.154.0',
    date: '2026-11-02',
    title: 'Primed wears off, Wild cards, longer tiers',
    summary:
      'The Monk can no longer bank Primed for one enormous hit, Traps snap shut, Ascendancies are shown everywhere, and the climb is longer and tougher.',
    notes: [
      {
        kind: 'balance',
        text: "Primed wears off: yours and your companions' lose half at the end of your turn, so it can no longer be saved up over many turns.",
      },
      {
        kind: 'balance',
        text: 'Monk: Inner Fire gives 3 Primed the first time each turn you leave Fury (was 2 every time). Iron Body answers the first time each turn you enter Fury, for 1 HP and 4 Primed (5 upgraded). Thousand Palms deals 5 damage 4 times (was 3 seven times).',
      },
      {
        kind: 'balance',
        text: 'Wild Card and The Joker show the first suit you are missing (in the order ♠ ♥ ♦ ♣), not all four, and their text says they are Wild. Cards that make your attacks hit harder or twice are ♠, and cards that crack an enemy are ♣.',
      },
      {
        kind: 'changed',
        text: 'A Trap springing snaps steel jaws shut on whoever set it off, instead of darkening the screen. The Suits panel shows what your next Full Trick deals.',
      },
      {
        kind: 'balance',
        text: 'Every Rift Tier is one floor longer: Tier 1 is 12 floors with its Warden, Tier 20 an even 50. Enemy HP climbs faster, to ten times its base at Tier 20. Tier 1 maps have more Elites, most often 3.',
      },
      {
        kind: 'changed',
        text: "The Gambler's Shrine gives one thing a visit: a blessing, or the reel's prize in its place. Ghost Wardens start from the Max HP their run had gained.",
      },
      {
        kind: 'new',
        text: 'Ascendancies are shown on the home screen, in the Sandbox, in the Sanctum and on How to play. The leaderboards open on the Campaign board and show the Ascendancy each run took.',
      },
      {
        kind: 'changed',
        text: 'On a phone the run header stays at the top while the map scrolls.',
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.153.0',
    date: '2026-11-01',
    title: 'No more acts: 20 Rift Tiers',
    summary:
      'A run is now one climb. Each tier is a single map that ends in a Warden, and the next one is harder straight away.',
    notes: [
      {
        kind: 'changed',
        text: 'Acts are gone. Tier 1 is 10 floors and a Warden, and each tier after it is 2 floors longer, up to 48 and a Warden at Tier 20.',
      },
      {
        kind: 'changed',
        text: 'Every Warden leads to the next tier. Each still heals you a little and gives back 1 Resolve, but going on no longer heals you fully. Each new tier opens at a Waymark, which always offers a rest.',
      },
      {
        kind: 'changed',
        text: 'You still choose your Ascendancy for beating Tier 3. Kron now waits for Tier 3, and Vorthax for Tier 20. Tougher enemy groups join from Tier 3, and the far realms from Tier 6.',
      },
      {
        kind: 'changed',
        text: 'A run in progress finishes the map it is on, and that clears its tier.',
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.152.0',
    date: '2026-11-01',
    title: 'Wardens with rules, and a deeper Rift',
    summary:
      'Six Wardens fight by a rule of their own, the Rift gets much harder as the tiers climb, and Spin To Win works better.',
    notes: [
      {
        kind: 'new',
        text: "Six Wardens have a rule of their own, shown as the fight starts. Kron hides behind a Foundry Hatch he keeps reopening. The Hollow Benediction's Acolytes feed it Might. The Mourning Tide has Low Tide, and Beckoning cards that hurt if you hold them. The Applause Below is Slippery. Seraphine kneels at half HP. Mother of Static takes Mana and cards from your next turn.",
      },
      {
        kind: 'new',
        text: 'Spin To Win has two new prizes: +1 Resolve, and a copy of a card of your choice.',
      },
      {
        kind: 'changed',
        text: 'More Elites the deeper you go: from Tier 2 plain fights can be Elites, rising to every fight at Tier 19. At Tier 20 every fight is a Warden.',
      },
      {
        kind: 'changed',
        text: 'A run already past Tier III without an Ascendancy is offered one at its next Warden.',
      },
      {
        kind: 'balance',
        text: 'Elites stop healing after Tier 10, and their shards, potion chance and Boon chance fade with the tier. Their card rewards stay as good.',
      },
      {
        kind: 'balance',
        text: 'Three new Omens at Tiers 5, 10 and 15: every phase an enemy rises into is tougher, and Elites have more HP and deal more damage.',
      },
      {
        kind: 'balance',
        text: "Ghost Wardens have the Arena's HP from Tier 10, and grow from there.",
      },
      {
        kind: 'balance',
        text: 'Spellblade: each Shatter hits 10 harder than the last, not 5 (20, 30, 40... 110 at 100 Fracture). Rupture Script+ applies 11. Breaking Point applies 4, or 6 upgraded.',
      },
      { kind: 'balance', text: 'Immovable Oath+ now Holds, in place of 3 more Barrier.' },
      {
        kind: 'fixed',
        text: 'Spin To Win: the window for removing cards stays open while you choose, and removing them takes the prize, so you can no longer spin after choosing.',
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.151.0',
    date: '2026-11-01',
    title: 'Ascendancies and a fight that moves',
    summary:
      'Become a new class after Tier III, walk longer acts, and watch every card, status and blow land with new painted effects.',
    notes: [
      {
        kind: 'new',
        text: "Ascendancies: beat the last Warden of Tier III and choose one of three new classes in place of that Warden's Gift. A Knight can become a Paladin, a Marshal or a Blood Knight. Your name changes, you gain a new trait, and it stays with that deck in the Arena. Each has its own crest.",
      },
      {
        kind: 'new',
        text: 'Painted effects for debuffs, buffs, curses, Barrier gained, hit and broken, Bleed and Burn ticking, blows by their weight, summons, deaths and an enemy rising into its next phase.',
      },
      {
        kind: 'new',
        text: 'Cards now move: drawn cards deal out of the pile, discarded ones trail dust into theirs, a Consumed card burns up where it stands, a shuffle arcs across the screen, and a card you take as a reward flies into your deck.',
      },
      {
        kind: 'new',
        text: 'Potions, enemy intents and the stops on the map have painted art. A thrown potion flies from the belt and breaks on its target.',
      },
      {
        kind: 'changed',
        text: "The HP bar shows a pale trail of what you just lost, new status icons pop in, an enemy's intent swings in at the start of your turn and shakes as it acts, and a Trap flips up as the screen dims. All of it follows the speed and reduced-motion settings.",
      },
      {
        kind: 'changed',
        text: 'Every act is now 15 floors, the boss being the 15th. A run in progress keeps its current map, and its next act is the new length.',
      },
      {
        kind: 'changed',
        text: 'The Assassin is now the Rogue, and Assassin is one of the things a Rogue can become.',
      },
      {
        kind: 'changed',
        text: 'Held upright on a phone, the hand is a grid of bigger cards that are all wholly readable.',
      },
      {
        kind: 'changed',
        text: "Thresholds and Waymarks never offer what they can't do, and from Tier IV they offer much better.",
      },
      {
        kind: 'balance',
        text: 'Plating: at the end of your turn you gain that much Barrier, then Plating goes down by 1.',
      },
      {
        kind: 'balance',
        text: 'Omens come sooner and hit harder from Tier II, with two new ones, Times Are Tough and Rift Scars. Past Tier X, enemy HP and damage climb twice as fast.',
      },
      {
        kind: 'balance',
        text: "Warden's Hearts no longer give Mana, and are repriced. Ghost Wardens in the campaign have twice the HP.",
      },
      {
        kind: 'balance',
        text: 'Mana Reserves: the Knight starts each fight with 2 Reserves, and gains 1 Barrier per Reserve at the end of each turn.',
      },
      {
        kind: 'balance',
        text: 'Necromancer: an enemy that kills one of your allies is cursed with the Fate, and an ally you sacrifice curses a random enemy.',
      },
    ],
    heads:
      'Rules changed: older Arena games and replays no longer play, and a browser still on the old version will be asked to reload.',
  },
  {
    version: '0.150.0',
    date: '2026-11-01',
    title: 'Painted icons and card piles',
    summary: 'Buffs, debuffs, Boons and the card piles now have painted art.',
    notes: [
      {
        kind: 'new',
        text: "Every buff, debuff, Boon and Warden's Heart has a new painted icon, and the draw, discard and Consumed piles are painted stacks of cards that grow as they fill.",
      },
      {
        kind: 'changed',
        text: 'Numbers on status icons and piles sit at the bottom right corner with a dark outline, so both the art and the number are easy to see.',
      },
    ],
  },
  {
    version: '0.149.0',
    date: '2026-11-01',
    title: 'Big hits, drawn icons, map pens',
    summary:
      'Scaling cards hit harder instead of more often, burst is reined in, and buffs, Boons and piles get real pictures.',
    notes: [
      {
        kind: 'new',
        text: 'Draw on the map: a pen with six colours, an eraser and a Clear button, to plan your path. Tap a stop with the pen in hand and you still go there.',
      },
      {
        kind: 'new',
        text: 'Fate now builds up in purple from the left of the HP bar. When it reaches the end of the red it glows: that unit dies at the end of its turn.',
      },
      {
        kind: 'new',
        text: "Every buff, debuff, Boon and Warden's Heart has its own small icon, an Aura in play shows its card's picture, and the draw, discard and Consumed piles are stacks of cards that grow as they fill.",
      },
      {
        kind: 'changed',
        text: "Only X cards add hits as they scale. Other cards keep a fixed number of hits and deal more damage on each one, so Might and Primed can't multiply out of control. Reverb, Echo and Echoing Blade work as they did.",
      },
      {
        kind: 'changed',
        text: "If your target dies during a card's aimed attack, the hits left are lost, and so is the card's second strike. They no longer jump to another enemy. Enemies and your companions' own end-of-turn strikes still carry on to the next target.",
      },
      {
        kind: 'changed',
        text: "Burn now has to get through Barrier, and it ticks before last turn's Barrier falls away.",
      },
      {
        kind: 'changed',
        text: 'Hangover costs 1% of your Max HP per stack, rounded up: about the same in a run, and a real price in the Arena.',
      },
      {
        kind: 'balance',
        text: 'Spellblade: each Shatter hits 5 harder than the last, not 10 (20, 25... 65 at 100 Fracture). Rupture Script applies 10. Lava Bomb deals 7 per Spell Power. Thousand Shards deals 6 per Spell Power. Her bigger Swords strike a fixed 2 to 4 times, and Whispering Edge gives 2 Keen.',
      },
      {
        kind: 'balance',
        text: 'Shaman: Wildfire is a skill that applies 8 Burn. Flashpoint costs 2, deals 12, +2 per Burn, and halves the Burn on its target.',
      },
      {
        kind: 'balance',
        text: 'Drunkard: Blind Drunk is 3 hits of 6, +2 each per 2 Hangover. Bender is 2 hits of 4, +1 each per 2 Hangover.',
      },
      {
        kind: 'balance',
        text: 'Rending Fury is one hit of 8, +3 per time you lost HP, at most 45 more. Rattle the Bones gains 3 per earlier command. Apex Frenzy is 2 hits of 4, +2 each per card played, and its upgrade adds damage instead of lowering its cost.',
      },
      {
        kind: 'fixed',
        text: 'A card that counts something, with nothing to count, lands no hit: no Thorns come back, Primed stays, and its number on the card says so.',
      },
    ],
    heads:
      'The rules changed, so old Arena replays no longer play, and a page left open will ask you to reload.',
  },
  {
    version: '0.148.0',
    date: '2026-10-31',
    title: 'Neutral and Ancestral cards',
    summary:
      'Neutral cards now sit at or a little behind the class cards they resemble, and several Ancestral cards were retuned.',
    notes: [
      {
        kind: 'balance',
        text: 'Plan Ahead is now common: next turn, 1 extra Mana and 1 extra card (upgraded, 2 cards).',
      },
      {
        kind: 'balance',
        text: 'Heart of the Rift no longer gives Mana. It is an uncommon that costs 2 (upgraded, 1) and draws 1 card each turn.',
      },
      { kind: 'balance', text: 'Attunement costs 3 (upgraded, 2).' },
      {
        kind: 'balance',
        text: 'Nerve Surge is now uncommon: draw 1 card and gain 1 Mana (upgraded, draw 2).',
      },
      {
        kind: 'balance',
        text: 'Rift Surge is now common. Upgrading Fever Dream adds Hold instead of 3 less.',
      },
      {
        kind: 'balance',
        text: 'Rift Collapse deals 30 to ALL enemies. Upgrading it raises that to 36 instead of lowering the cost.',
      },
      {
        kind: 'balance',
        text: 'Ancestral Blade deals 30 (upgraded, 34), and Elder\u2019s Bulwark gives 28 Barrier (upgraded, 32).',
      },
      {
        kind: 'balance',
        text: 'Echo of Ages gives 2 Might and 2 Thorns (upgraded, 3 Might and 2 Thorns). Lineage costs 1.',
      },
      {
        kind: 'balance',
        text: 'Upgrading The Long Memory draws 1 card when you play it instead of lowering the cost.',
      },
      {
        kind: 'changed',
        text: 'Stolen Time is retired. Copies you already have become Rift Surge.',
      },
    ],
    heads: 'Old Arena games and replays no longer play.',
  },
  {
    version: '0.147.0',
    date: '2026-10-31',
    title: 'Boons, Auras and Fracture',
    summary:
      'Boons no longer have rarities, a deck holds 2 copies of an Aura, and the Spellblade applies less Fracture.',
    heads:
      'Old Arena games and replays no longer play. Saved runs holding a removed Boon get a replacement.',
    notes: [
      {
        kind: 'changed',
        text: 'Boons have no rarity. Every Boon costs 70 at a merchant, and the one-Legendary limit and its swap are gone.',
      },
      {
        kind: 'balance',
        text: "Rift Core, Scholar's Tome, Battle Standard and Phoenix Ember are gone. A run holding one gets a Rift Satchel (for the first two), an Idol of Might or a Healing Vial.",
      },
      {
        kind: 'balance',
        text: "Vigor Wick heals 1 a turn, Hunter's Lens gives 1 turn of Exposed, Shard Purse pays 6, and The Gilded Crown is 6 Max HP and heal 3 after fights. Thorned Heart gives 4 Thorns.",
      },
      {
        kind: 'changed',
        text: 'The Rift Is Hungry now gives 2 Boons and The Cursed Crown gives 3.',
      },
      {
        kind: 'balance',
        text: "A deck holds at most 2 copies of an Aura. A run's deck already over that keeps its copies but can't add more, and an Arena deck leaves the extras out.",
      },
      {
        kind: 'changed',
        text: 'A card on hold that your deck can no longer take refunds its deposit at the next merchant.',
      },
      {
        kind: 'balance',
        text: "The Spellblade's cards apply about a quarter less Fracture: Rupture Script applies 15 and Faultline Hex 5. Shatter damage is unchanged.",
      },
    ],
  },
  {
    version: '0.146.0',
    date: '2026-10-31',
    title: 'Merchant prices',
    summary:
      'Removing and upgrading cards now get dearer only within one merchant visit, and each starts a little higher.',
    notes: [
      {
        kind: 'balance',
        text: 'Removing a card costs 50 at every merchant, then 100, 200, 400 at that same merchant. The next merchant starts over at 50, so it no longer carries across the run.',
      },
      {
        kind: 'balance',
        text: 'Upgrading a card costs 75 at every merchant, then 125, 175 at that same merchant. The next merchant starts over at 75.',
      },
    ],
  },
  {
    version: '0.145.0',
    date: '2026-10-31',
    title: 'Spell Power everywhere',
    summary:
      'The Spellblade\u2019s Shatters, Barrier and Obsidian Blade all grow with Spell Power, merchants remove as many cards as you can pay for, and a run is now Tiers, Acts and Floors.',
    notes: [
      {
        kind: 'balance',
        text: 'Shatters hit much harder: 20 at 10 Fracture and 10 more each time, 110 at 100, plus 1 for each Spell Power you hold.',
      },
      {
        kind: 'balance',
        text: 'All the Spellblade\u2019s fixed Barrier grows with Spell Power: 1 more per 3 you hold (per 2 on Unbreakable Crown, which loses its bonus at 10). Last Ember, Sigil of Glass and Afterglow count what you have spent this turn.',
      },
      {
        kind: 'balance',
        text: 'The Obsidian Blade is now one hit of 5, plus 2 per Spell Power, instead of gaining hits. Upgraded, it starts at 8.',
      },
      { kind: 'balance', text: 'Each Echoing Blade gives the Obsidian Blade 1 more hit.' },
      {
        kind: 'changed',
        text: 'Merchants remove as many cards as you can pay for on one visit. Each costs double the last: 40, 80, 160...',
      },
      {
        kind: 'changed',
        text: 'A run is now Tiers, Acts and Floors. The home page\u2019s New Run button says Play.',
      },
      {
        kind: 'changed',
        text: 'A card in your hand shows the Barrier it would really give, and Recall the Blades shows how many Daggers it plays and what they deal.',
      },
      {
        kind: 'changed',
        text: 'A growing Sword keeps its rule beside its total: "Deal 5 damage 4 times, 1 more time per 2 Spell Power (10 hits, 50 total)."',
      },
      {
        kind: 'changed',
        text: 'Statuses that are simply on or off have no number: "Gain Fanned", not "Gain 1 Fanned".',
      },
      {
        kind: 'changed',
        text: 'A Fanned Dagger plays without aiming. An Inked Dagger still asks, for its Faltering.',
      },
      {
        kind: 'changed',
        text: 'On a phone, Begin the run stays in view while you look over your Riftwalker.',
      },
      {
        kind: 'fixed',
        text: 'The total on a Sword or Obsidian Blade was wrong against a Shielded enemy, and now says "each" when it strikes every enemy.',
      },
      {
        kind: 'fixed',
        text: 'A card that counts your suits now counts its own suit in the number shown in your hand.',
      },
      {
        kind: 'fixed',
        text: 'Should stop the Riftwalker on the home page starting off to one side on some phones.',
      },
    ],
    heads: 'Old Arena games and replays no longer play.',
  },
  {
    version: '0.144.0',
    date: '2026-10-31',
    title: 'Clearer card text',
    summary:
      'Every card now makes it clear where a condition or trigger stops, and Spell Power costs are easier to read.',
    notes: [
      {
        kind: 'changed',
        text: 'Everything one trigger or condition does is now one sentence: "Draw 1 card and gain 2 Barrier."',
      },
      {
        kind: 'changed',
        text: 'What always happens comes first, then keywords like Consume, then each condition, so nothing after a condition can be mistaken for part of it.',
      },
      { kind: 'changed', text: 'A summon says what the companion does inside its own brackets.' },
      {
        kind: 'changed',
        text: 'Spell Power costs on cards are bigger and bolder on a brighter circle, X/2 included.',
      },
      {
        kind: 'balance',
        text: 'Shard Strike checks for 9 Spell Power after its gain, so holding 8 now earns the Barrier.',
      },
    ],
    heads: 'Old Arena games and replays no longer play.',
  },
  {
    version: '0.143.0',
    date: '2026-10-31',
    title: 'Fracture keeps climbing',
    summary:
      'A second pass on the Spellblade: costs on the card instead of a slider, Fracture that only adds up, and more Barrier and Spell Power early.',
    notes: [
      {
        kind: 'changed',
        text: 'No more slider. X on a card spends all your Spell Power and X/2 spends half, rounded down. Basics and commons spend at most half. Mirror Glass costs 2.',
      },
      {
        kind: 'changed',
        text: 'Fracture never drops. Every 10 it Shatters, harder each time: 18 at 10, 21 at 20, 45 at 100, with no limit past that. Cleanses no longer remove it.',
      },
      {
        kind: 'changed',
        text: 'Carry the Fault applies 4 plus half the Fracture on your most-cracked other enemy (8 against one enemy). Rupture Script applies 20.',
      },
      {
        kind: 'changed',
        text: "Hairline Hex is now Obsidian Ward (7 Barrier, gain 1 Spell Power), so Fracture is something you find in rewards. It borrows another card's picture for now.",
      },
      {
        kind: 'balance',
        text: 'Lava Bomb deals 10 per Spell Power spent, her biggest payoff. Pale Ward gains 8 Barrier.',
      },
      {
        kind: 'balance',
        text: 'Emberstrike, Shard Strike, Crosscut, Tempered Bolt, Glass Veil, Ash Wind, Recenter and Fated Hand now gain Spell Power, with some of their other numbers lowered.',
      },
      {
        kind: 'changed',
        text: "Sword and Spell are now a badge in a card's top right with a tooltip. The Spell Power orb and counter show only the number.",
      },
      {
        kind: 'fixed',
        text: 'A Sword in your hand shows its real hits and total, with Might and Primed counted.',
      },
    ],
    heads:
      'Old Arena games and replays no longer play. A Hairline Hex in a saved deck becomes Obsidian Ward.',
  },
  {
    version: '0.142.0',
    date: '2026-10-31',
    title: 'The Spellblade reforged',
    summary:
      'Arcana and Sharpen become one reserve, Spell Power, with three ways to win: Swords, Spells and Fracture.',
    notes: [
      {
        kind: 'new',
        text: 'Spell Power replaces Arcana and Sharpen. You start each fight with 3 and gain 1 a turn. It lasts the whole fight, with no cap.',
      },
      {
        kind: 'new',
        text: 'Swords read Spell Power and spend none. The Obsidian Blade strikes once more for every 2 you hold, and Might and Primed add to every hit.',
      },
      {
        kind: 'new',
        text: 'Spells spend it, as much as you choose: a slider opens when you play one. The more Mana a spell costs, the more each point deals.',
      },
      {
        kind: 'new',
        text: 'Fracture is a new way to win: cracks on an enemy that never fade. At 10 it Shatters for 18 and the rest stays. Barrier stops a Shatter, and some cards make every Shatter hit harder.',
      },
      {
        kind: 'new',
        text: 'Some cards grow: that copy gives more each time you play it, for the rest of the fight.',
      },
      {
        kind: 'changed',
        text: 'Her pool is 88 reward cards: 50 reworked, 38 new with their own art, 30 removed. Retainers and the cards that made other cards are gone. Her starting deck swaps one Strike for Hairline Hex.',
      },
    ],
    heads:
      'A Spellblade run saved before this moves to the new cards and tells you so, and a fight in progress starts again. Old Arena games and replays no longer play.',
  },
  {
    version: '0.141.0',
    date: '2026-10-30',
    title: 'Choose from your hand',
    summary:
      'Discards and Defers are chosen right on your hand, phones get tap to play and a new upright layout, and the battle log tells you far more.',
    notes: [
      {
        kind: 'changed',
        text: 'Choosing a card from your hand (discard, Defer, Consume and the like) no longer opens a window or asks to Confirm. The cards you can choose glow, and clicking one chooses it. There is no undo.',
      },
      {
        kind: 'changed',
        text: 'When you discard, cards with Premeditate pulse violet with a ribbon, because they come back next turn at 0 Mana.',
      },
      {
        kind: 'changed',
        text: 'Phones: a tap plays a card or starts aiming it, and a long press lifts it to read.',
      },
      {
        kind: 'changed',
        text: 'Phones held upright: you stand at the bottom left and the enemies at the top right, with smaller figures, and your Boons and Auras show at the top left.',
      },
      {
        kind: 'changed',
        text: 'The battle log now names discards, Defer, Premeditate, Consume and cards added, and tells cards drawn and Mana gained from effects, Foresee, stopped attacks and Reserves.',
      },
      {
        kind: 'changed',
        text: 'Every card an event option will surely take or give is in its box: the master and the student\u2019s rares, Wounds and Static, and an event saved before the last patch.',
      },
      {
        kind: 'changed',
        text: 'A card\u2019s damage number and its breakdown now count Honed, and name Edge and Honed as their own steps. Fanned Daggers show the range across every enemy, and with several enemies the breakdown shows the highest number. The damage dealt has not changed, only what the card says. Lethality and Noose now count too.',
      },
      {
        kind: 'balance',
        text: 'Knight: Set Your Shield (6 Barrier, 3 more if you have Reserves) replaces Press the Attack in the starting deck.',
      },
      {
        kind: 'balance',
        text: 'Trickster: the starting deck has one Veil Strike; the second is now a Strike.',
      },
      {
        kind: 'balance',
        text: 'Assassin: Garrote is out of the card pool. A Garrote in a saved run or Arena deck becomes Graveside Cut.',
      },
      {
        kind: 'changed',
        text: 'Names: Virulent is now Hemorrhage, and the rare card that was called Hemorrhage is now Red Tide. Both work as before.',
      },
      {
        kind: 'changed',
        text: 'Lay Bare and Cast the Shield say "Remove all Barrier" and no longer mention Steadfast. They work as before.',
      },
    ],
    heads:
      'The rules version went up: old Arena games and replays from before this patch will not play.',
  },
  {
    version: '0.140.0',
    date: '2026-10-30',
    title: 'Big machines hit more often',
    summary:
      'The Engineer\u2019s 3-slot machines hit several times, scrapping a machine has its own buttons, and event cards sit in their option boxes.',
    notes: [
      {
        kind: 'balance',
        text: 'War Engine hits 4 three times, Dreadnought hits everyone for 4 twice, and Scrap Golem hits 3 twice, so Might and Primed reward them as they do a swarm.',
      },
      {
        kind: 'balance',
        text: 'Enforcer, Bulwark Walker and Scrap Golem go back to their HP from before 0.139.0, and Enforcer and Bulwark Walker to their damage and Barrier.',
      },
      {
        kind: 'balance',
        text: 'Removing a card at a merchant now doubles in price each time: 40, 80, 160 and so on through the run.',
      },
      {
        kind: 'changed',
        text: 'When a summon has no room, there is a button to scrap each machine. Play anyway is gone when it would only waste the card.',
      },
      {
        kind: 'changed',
        text: 'Rift Cache, the Ancestors\u2019 Offering, the traveller and the bonfire show their card inside the option box. The elite event button says Spin To Win.',
      },
    ],
    heads:
      'The rules version went up: old Arena games and replays from before this patch will not play.',
  },
  {
    version: '0.139.0',
    date: '2026-10-30',
    title: 'Bigger machines and Legendary swaps',
    summary:
      'The Engineer gets a higher damage ceiling, Foresee is one click, and a Legendary Boon can be given up or swapped.',
    notes: [
      {
        kind: 'new',
        text: 'Engineer: Full Throttle (your companions act twice), Critical Mass (damage grows with Might) and Final Volley (damage grows with your companions). Each is spent after one use.',
      },
      {
        kind: 'balance',
        text: 'Heavy and Colossal machines have a little more HP and damage: Enforcer, Siege Engine, Bulwark Walker, War Engine, Scrap Golem and Dreadnought.',
      },
      {
        kind: 'balance',
        text: 'Defer: the card comes back costing 1 less for that turn only. Not played, it is full price again.',
      },
      {
        kind: 'new',
        text: 'A Legendary Boon has a small X on the map to give it up. A Legendary offered while you hold one lets you swap or keep yours.',
      },
      { kind: 'changed', text: 'Foresee picks the card you click, with no Confirm button.' },
      {
        kind: 'fixed',
        text: 'A campaign run the board did not recognise as yours is now re-linked to your username, or you are asked for one again.',
      },
    ],
    heads:
      'The rules version went up: old Arena games and replays from before this patch will not play.',
  },
  {
    version: '0.138.0',
    date: '2026-10-30',
    title: 'Ten-card starts and tighter rules',
    summary:
      'Every class starts with ten cards, the Arena wants fifteen, and a few cards were fixed or nerfed.',
    notes: [
      {
        kind: 'changed',
        text: 'Every class starts with ten cards and three or four class basics: new basics for the Knight, Assassin, Monk, Engineer, Trickster and Necromancer, fewer duplicates for the Shaman, Drunkard and Spellblade.',
      },
      {
        kind: 'changed',
        text: 'Arena decks need at least 15 cards, and the campaign Arena badge says so. Campaign ghosts are never your own.',
      },
      { kind: 'changed', text: 'The Shaman can hold up to 8 totems; they shrink to fit.' },
      {
        kind: 'balance',
        text: 'Aegis of Ages gives 1 Shielded, not 3, and Ward Stone is gone (old saves get an Iron Sigil). Backup Core revives one ally, once.',
      },
      {
        kind: 'fixed',
        text: 'A card that hits every enemy and then costs you HP now takes the HP even when the hit ends the fight.',
      },
      { kind: 'fixed', text: 'Heavy Hitter says it counts your biggest living companion.' },
    ],
  },
  {
    version: '0.137.0',
    date: '2026-10-30',
    title: 'A stronger start for the Knight',
    summary: 'The Knight gets a second basic card and more Plating.',
    notes: [
      {
        kind: 'new',
        text: 'Brace and Press: a new basic that gives 3 Barrier, 2 Plating and 1 Exposed. It takes the place of one Defend in the Knight’s starting deck.',
      },
      {
        kind: 'balance',
        text: 'Every Knight card that gives Plating gives 1 more: Oath of Iron 2, Dawn Smite 2, Provoke 2, Ember Ward 3, Blood Plate 3, Stand Fast 2 and Stoneskin 5.',
      },
      {
        kind: 'fixed',
        text: 'More mechanics are highlighted in card text, so you can hover them: Plating, Sapped, Hangover, Fate, Virulent, Premeditate, Steadfast, Brittle and the rest.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.136.0',
    date: '2026-10-30',
    title: 'Mana Reserves for the Knight',
    summary:
      'The Knight keeps unspent Mana as Reserves and gets twelve new cards, and a large batch of card art lands.',
    notes: [
      {
        kind: 'new',
        text: 'Mana Reserves: the Knight no longer loses unspent Mana. Up to 3 of it (his Max Reserves) is kept as Reserves, shown in a bubble beside the Mana gem. Cards spend your Mana first and your Reserves after it, and X cards spend all of both. It replaces Oathkeeper’s opening Barrier and Plating.',
      },
      {
        kind: 'new',
        text: 'Twelve Knight cards: Stand Fast, Measured Strike, Blood Oath, Vow Kept, Unyielding Line, Cast the Shield, Hardened Scars, Scarred Hide, Patient Wall, Oath Unbroken, Vow Fulfilled and Gilded Bulwark. They read, fill and raise your Reserves, hold Barrier, or pay blood. Scarred Hide Saps a random enemy whenever you lose HP, from an enemy or from your own cards.',
      },
      {
        kind: 'changed',
        text: 'Some Knight Barrier cards give part of it as Plating: Oath of Iron (6 Barrier and 1 Plating), Dawn Smite (3 and 1), Provoke (5 and 1), Ember Ward (8 and 2) and Blood Plate (12 and 2).',
      },
      {
        kind: 'new',
        text: 'New card art: 55 Shaman illustrations, carved Thunderbird and Moon Owl totems with their spirit forms, and 126 cards redrawn to match the current heroes. Cards that still have no art of their own use borrowed art for now.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.135.0',
    date: '2026-10-30',
    title: 'The Assassin defers',
    summary:
      'A new Assassin keyword, Defer: set a card aside and it comes back next turn costing 1 less.',
    notes: [
      {
        kind: 'new',
        text: 'Defer: choose a card in your hand that costs 1 or more (not a 0-cost or X card). It leaves now and comes back at the start of your next turn, on top of your draw, costing 1 less until you play it. It is not discarded, so discard payoffs do not trigger. With a full hand it waits on top of your draw pile.',
      },
      {
        kind: 'changed',
        text: 'Stalker’s Lunge, Side Slip and Palm Switch now Defer a card (Stalker’s Lunge: 15 damage, 20 upgraded). Quick Reflexes draws 1 and Defers 1. Cartwheel Cut deals 5 to all (7 upgraded) and Defers a card. Slip the Blow and Glancing Knives also Defer a card. Into the Shadows Defers up to 3 cards, discards the rest of your hand, gives Poised, and costs 2 (it defers up to 4 upgraded).',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.134.0',
    date: '2026-10-30',
    title: 'Shaman pool trimmed again',
    summary: 'Nineteen more Shaman cards are retired, and the Shaman is down to 88 reward cards.',
    notes: [
      {
        kind: 'changed',
        text: 'Retired commons: Firebrand and Talon Strike. Retired uncommons: Immolate, Storm Front, Totem Drum, Raise the Pole and Cold Breath. Retired rares: Winter’s Embrace, Maelstrom, Eye of the Tempest, Grow the Pole, Spiritstorm, Elder Recall, Totem Mantle, Sorrow’s Hammer, Glacial Lance, Three Winds, Dream Weaving and Awakened Spirit. Old copies turn into a nearby card (for example Immolate into Flame Spear, Storm Front into Gale Call, Totem Drum into Storm Sovereign).',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.133.0',
    date: '2026-10-30',
    title: 'Shaman pool trimmed',
    summary:
      'Seventeen Shaman uncommons and rares are retired, three pairs are merged, and a few card texts are fixed.',
    notes: [
      {
        kind: 'changed',
        text: 'Retired uncommons: Clear Spring, Wild Spirits, Elder Seed, Hawk’s Shelter, Moonshade Ward, Moonbite, Deepening Night, Hail Rite, Thunderclap and Ember Lance. Retired rares: Meteor Fall, Superstorm, Avalanche, Glacial Fortress, Bark Carapace, Spirit Chorus and Growing Ward. Old copies turn into a nearby card.',
      },
      {
        kind: 'changed',
        text: 'Storm Chant costs 2 and also gives 1 Mana (it absorbed Awakening Chant). Raise the Pole costs 2 and gives 2 totem positions (it absorbed Wider Circle). Storm Sovereign also gives 3 Barrier (it absorbed Harmony). Spirit Surge gives 2 Spirit (3 upgraded).',
      },
      {
        kind: 'fixed',
        text: 'Wild Vision says the card it adds costs 0 this turn. Blighted Chorus says it counts Status cards. Phoenix Feather explains Reverb.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.132.0',
    date: '2026-10-30',
    title: 'Shaman trim, Shocked',
    summary: 'Stunned is now Shocked, and the Shaman’s pool is trimmed and tidied.',
    notes: [
      {
        kind: 'changed',
        text: 'Stunned is now called Shocked. It works exactly as before.',
      },
      {
        kind: 'changed',
        text: 'Thunder Chant now makes every Thunderbird you command deal more damage (it replaces Thunder Roost). Spirit Lance also draws cards, as Rapid Sift did. Wildfire has no limit on the Burn it doubles. Ember Lance, Ash Chant and Spark Strike are reworked, and Hail Chant is a rare that weakens every enemy while you have a Bear.',
      },
      {
        kind: 'changed',
        text: 'Cards that did the same thing several times now say it once ("Plant 2 Bears", "Add 3 Wounds to your discard pile"). Tinder, Owl Charge, Burn, Wound, Void and the totems are highlighted like other mechanics, and Kindling Ward and Deepening Night explain themselves.',
      },
      {
        kind: 'changed',
        text: 'Retired: Rapid Sift, Thunder Roost, Totem Strike, Rally the Spirits, Pyroclasm, Thunder Fork, Skullsplitter, Hardened Resolve, Ruin Fist, Tempest Call, Ice Wall and Ice Mirror. Old copies turn into a nearby card.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.131.0',
    date: '2026-10-30',
    title: 'Shaman pool, big pass',
    summary:
      'The Shaman’s pool is rebuilt around totems and Status cards, with the Moon Owl as a growing charge.',
    notes: [
      {
        kind: 'new',
        text: 'About 60 new Shaman uncommons and rares, in the manner of another game’s Defect: X-cost totem cards, Powers that react to Status cards, Buffer, Loop and more. Three new payoffs for Status cards: Sorrow’s Hammer, Blighted Chorus and Harvest of Ruin.',
      },
      {
        kind: 'changed',
        text: 'The Moon Owl stores 6 charge at the end of each turn; a command deals it, plus 6, to the enemy with the least HP.',
      },
      {
        kind: 'changed',
        text: 'Void is unplayable and ethereal, and costs 1 Mana when drawn. New Status cards: Blight, Venom, Smudge and Scrap. Sweep Away moves the Status cards in your draw pile to the discard pile.',
      },
      {
        kind: 'changed',
        text: 'Slip the Leash doubles all your Might with no cap. Shattering Call costs 2 (1 upgraded).',
      },
      {
        kind: 'changed',
        text: 'Enemies stand a little further from the screen edge, the Boon, Omen and Aura columns scroll inside their own window instead of covering the fight, and a ghost opponent shows its owner’s name in the fight.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.130.0',
    date: '2026-10-30',
    title: 'Shaman totem pass',
    summary:
      'The Hawk and Moon Owl change, Spirit Call commands twice, and a cleaner Shaman card pool.',
    notes: [
      {
        kind: 'changed',
        text: 'The Hawk hits a random enemy at the end of your turn (3, or 7 when commanded), plus 1 per Spirit. The Moon Owl gives 1 Spirit each turn (2 when commanded).',
      },
      {
        kind: 'changed',
        text: 'Spirit Call commands your front totem twice; its upgrade costs 0. Ember Bolt is replaced by Raise the Hawk.',
      },
      {
        kind: 'changed',
        text: 'Gathering Storm costs 0 and hits two enemies. Kindle, Firebrand, Flare, Twin Cinders and Flame Spear apply Burn. Hawk Call, Hawk’s Dive, Bear Call, Raise a Totem, Gale Call and Read the Winds are reworked.',
      },
      {
        kind: 'new',
        text: 'New Shaman cards: Spirit Rush, Spirit Offering, Hasty Ward and Stone Sling. The last three add a Void to your discard pile (Spirit Offering gives Mana, Hasty Ward Barrier); a Void costs 1, draws a card and is consumed.',
      },
      {
        kind: 'changed',
        text: 'Retired: the feather plants, Call Again, Spark Fork, Turn the Wheel, Rime Shield, Bear’s Guard, Thunderbird’s Cry, Last Called, Ancestral Exchange, Great Spirit’s Call and Chain Lightning. Old copies turn into a nearby card.',
      },
    ],
    heads:
      'The rules changed: reload to play the new cards, and old Arena games and replays no longer play.',
  },
  {
    version: '0.129.0',
    date: '2026-10-29',
    title: 'Clearer cards',
    summary:
      'Element icons on the Shaman’s spells, hovers that explain made cards and totems, and a steady Card library.',
    notes: [
      {
        kind: 'new',
        text: 'The Shaman’s Flame, Frost and Storm spells show their element as a coloured icon in the top right (hover it for what the element does).',
      },
      {
        kind: 'changed',
        text: 'Hovering a card explains the cards it makes (Daggers, Gravesouls, Buckshot Shells, Trip Lines...) with their real cost and text, and any totem it plants or names. The Totem explanation describes how totems work now, and a totem on the board says so too.',
      },
      {
        kind: 'fixed',
        text: 'The Card library’s book stays the full width of the screen, with cards the same size, whatever you filter by.',
      },
    ],
  },
  {
    version: '0.128.0',
    date: '2026-10-29',
    title: 'Play it on your phone',
    summary:
      'Fights work on a phone held upright, the hand follows your mouse, and big Thralls look big.',
    notes: [
      {
        kind: 'new',
        text: 'Phones and tablets: fight with your phone upright (no more turning it sideways). Enemies stand on a row behind you, Boons and Auras fold into a drawer, and the menu folds away. Tap a card to see it big, tap again to play it, then tap your target. On smaller screens the figures, plates and cards are smaller and the board sits higher. The run map runs top to bottom on an upright screen.',
      },
      {
        kind: 'changed',
        text: 'The hand follows your mouse along the fan: the card you point at is the one that lifts. The targeting arrow shows as soon as you drag a card out of your hand.',
      },
      {
        kind: 'changed',
        text: 'Enemies stand back toward their edge of the battlefield, and damage numbers are bigger, in the card font, with a black outline.',
      },
      {
        kind: 'changed',
        text: "A big Thrall (the Grave Colossus card's, or one fed to 18 HP) stands as the Grave Colossus, and grows into it mid-fight.",
      },
      {
        kind: 'changed',
        text: "The map's Arena button turns red when your deck as it stands could not be brought to the Arena, and its tip says why.",
      },
      {
        kind: 'balance',
        text: 'Sharpen goes only on the Old Twelve Gauges and Obsidian Blades you have: a copy made later (Double Tap, Spare Barrel) starts unsharpened.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.127.0',
    date: '2026-10-29',
    title: 'Monsters of the multiverse',
    summary: "62 new enemies, new Wardens, and the Shaman's totems beside him.",
    notes: [
      {
        kind: 'new',
        text: '62 new enemies from seven realms (93 in all), in 48 new fights: new pairs and later-stage trios, new Elites, and a second Warden for every realm. Gloomfen, the Hollow Crown and the Far Rifts send their monsters through the Rift.',
      },
      {
        kind: 'changed',
        text: "The Shaman's totems stand in an arc beside him, numbered in order with the next one lit, each showing exactly what it does every turn and when it acts. The Thunderbird and the Moon Owl are drawn now.",
      },
      {
        kind: 'changed',
        text: 'Tempest Call (and other cards that grow a card) says plainly what it does.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.126.0',
    date: '2026-10-29',
    title: 'The totem cycle',
    summary:
      'The Shaman plays a totem cycle, the Drunkard pays off pain, the Assassin premeditates, and damage says how it is made.',
    notes: [
      {
        kind: 'changed',
        text: "The Shaman's totems stand in a row in order. Each does something every turn (the Hawk primes your next attack, the Bear gives Barrier, the Thunderbird zaps two enemies), and every point of Spirit makes those numbers bigger. A command makes the front totem's spirit act, and the totem is used up; planting into a full row pushes the front one out, and it acts as it goes. Trinity is gone.",
      },
      {
        kind: 'changed',
        text: "The Assassin's Sly is now Premeditate: a card with it that another card makes you discard comes back next turn, on top of your hand, and costs 0 until you play it.",
      },
      {
        kind: 'balance',
        text: 'The Drunkard: cards that answer losing HP say that Hangover counts, and Glass Jaw, The Glass Palace and Mean Drunk pay by how much you lost. New: Bar Fight, Nurse the Hangover, Take It on the Chin.',
      },
      {
        kind: 'changed',
        text: 'The Old Twelve Gauge and the Obsidian Blade are cards of the starting decks (always in your opening hand), so you can remove them at a shrine or merchant. Sharpen no longer makes one if you have none.',
      },
      {
        kind: 'new',
        text: 'Hover a card in your hand to see exactly how its damage is made, step by step (Point Blank, Clutch Genes, Might, Exposed...). The Old Twelve Gauge says when Point Blank is counted.',
      },
      {
        kind: 'fixed',
        text: 'The open rift shows its three cards in the option boxes. The Necromancer starts a fight with one Bone Thrall, not two.',
      },
    ],
    heads:
      'Rules changed: replays and Arena games from before this version no longer play. Shaman runs are updated with a note.',
  },
  {
    version: '0.125.0',
    date: '2026-10-29',
    title: 'Carved totems',
    summary:
      "The Shaman's totems are drawn, and Clutch Genes reads the share of HP you are missing.",
    notes: [
      {
        kind: 'new',
        text: "The Shaman's Hawk, Bear and Elder Tree show as carved totems on the totem panel (drag its corner to make them bigger), and a commanded totem's spirit rises out of it. Spirit shows as a glowing number with what it adds.",
      },
      {
        kind: 'balance',
        text: 'Clutch Genes: you deal 1% more attack damage for every 1% of your HP you are missing (it was 1% for every HP). At 19 of 88 HP that is +78%.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.124.0',
    date: '2026-10-29',
    title: 'Four classes restored',
    summary:
      'The Knight, Assassin, Spellblade and Monk are back to their earlier cards; the Shaman gets Forks and quicker totem picks.',
    notes: [
      {
        kind: 'changed',
        text: 'The Knight, Assassin, Spellblade and Monk are back to the cards they had before the rebuilds. A run saved with one of them gets the nearest earlier cards in place of the new ones, and is told so; a fight that was under way starts again.',
      },
      {
        kind: 'new',
        text: 'The Shaman starts with two Forked Lightning: 5 damage to two different enemies, or 25% more when only one is left. Spark Fork and Thunder Fork are new Forks; Gathering Storm is now a common reward instead of a starting card.',
      },
      {
        kind: 'changed',
        text: 'Choosing which totem a command moves (or which one a new totem replaces) now happens on the totem panel itself: it lights up the totems you can pick (or press 1-5). No pop-up.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.123.0',
    date: '2026-10-29',
    title: 'Deeper decks',
    summary: 'The Assassin, Spellblade and Monk each grow to 87 cards with new ways to play.',
    notes: [
      {
        kind: 'new',
        text: 'The Assassin: 36 new cards and 9 new Auras. Spend Preparation a point at a time or hold it for Poised Strike, leave knives in for their effect, pull one knife at a time, spread knives across a fight, and set up a strike from the shadows.',
      },
      {
        kind: 'new',
        text: 'The Spellblade: 36 new cards and 7 new Auras. Spend one charge and keep the other, release matching or mixed pairs (Resonant Pair makes a matching pair take effect again), weave Wards, Recast an awkward charge, or hold a full blade.',
      },
      {
        kind: 'new',
        text: 'The Monk: 36 new cards and 6 new Auras. Root defence that turns into damage, Current pairs that care about order, Ember strikes committed to one enemy, cards that reward keeping Mastery and small spends of it, and ways to change form.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.122.0',
    date: '2026-10-29',
    title: 'Five classes rebuilt',
    summary:
      'The Knight, Assassin, Spellblade, Shaman and Monk each have a playstyle of their own.',
    notes: [
      {
        kind: 'changed',
        text: 'The Knight: Guard, Riposte and Thorns. Block a whole hit to leave the attacker Open; Riposte cards spend the Opening for a big counter. 87 cards in five styles: the Duelist keeps an Opening and uses it first, the formation fighter handles many enemies (Answer Them All), the patient defender turns defence into Mana for the next turn, offensive Thorns spends Thorns as damage (Shed the Spines), the siege fighter opens enemies that will not attack.',
      },
      {
        kind: 'changed',
        text: 'The Assassin: Preparation and knives. Setup cards build Preparation for big finishers; knives stay in enemies until you pull them for a payoff.',
      },
      {
        kind: 'changed',
        text: 'The Spellblade: Imbue and Discharge. Spells put Ember, Glass or Ward on her blade; blade attacks discharge them.',
      },
      {
        kind: 'changed',
        text: 'The Shaman: Flame, Frost and Storm spells, a Hawk, a Bear and a Thunderbird totem that help each element, cards that command them, Burn, and Trinity: all three elements in a turn for Spirit, which makes everything stronger.',
      },
      {
        kind: 'changed',
        text: 'The Monk: Martial Forms and Mastery. Complete your form (Root, Current or Ember) with the right techniques for Mastery, spent by finishers.',
      },
      {
        kind: 'changed',
        text: 'Saved runs with these classes are updated, with a note when you load them.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.121.0',
    date: '2026-10-28',
    title: 'Last Call',
    summary: 'Last Call and The Long Memory are Auras.',
    notes: [
      {
        kind: 'balance',
        text: 'Last Call is an Aura: 2 Mana, gain 2 Hangover, and gain 1 Mana at the start of every turn (Last Call+ starts in your opening hand). It was a 1-Mana Skill with 4 Hangover, too cheap for Mana every turn.',
      },
      {
        kind: 'balance',
        text: 'The Long Memory is an Aura: 2 Mana, gain 1 Mana at the start of every turn, and it starts in your opening hand (The Long Memory+ costs 1).',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.120.0',
    date: '2026-10-28',
    title: 'The reel, the Store and a new Knight',
    summary:
      'Every chance is shown on the slider reel with tiles that are the real odds, a redesigned Store and a Cosmetics Vault, and a new Knight.',
    notes: [
      {
        kind: 'changed',
        text: 'No more coin: every chance in an event is shown on the slider reel, and its tiles are the real odds (a 60% chance is 12 of every 20 tiles your way). The odds are written under it.',
      },
      {
        kind: 'changed',
        text: 'In the Arena, when both players want the same order, a reel of your two names decides who goes first.',
      },
      {
        kind: 'new',
        text: 'A new Knight: a man in sun armour. His looks in the Store are the Sunwarden and the Female Knight (if you had the Moonlit Regent, you have the Female Knight).',
      },
      {
        kind: 'new',
        text: 'A better Store and a Cosmetics Vault: one kind of cosmetic at a time, with its tabs and the classes in a bar that stays at the top as you scroll, and every look on a lit stage. The Vault shows what you own and the look each Riftwalker wears.',
      },
    ],
  },
  {
    version: '0.119.0',
    date: '2026-10-28',
    title: 'Your look',
    summary:
      'Get Riftwalker looks free in the Store and choose them on the Cosmetics page; summon cards can be played with no room.',
    notes: [
      {
        kind: 'new',
        text: 'Cosmetics: get any Riftwalker look in the Store (free for now) and choose which one each Riftwalker wears on the new Cosmetics page. Your look is your hero on the home screen and in your fights, and it follows you to any device with your Vault code or account.',
      },
      {
        kind: 'changed',
        text: 'A summon card whose companions do not all fit can be played anyway: what fits comes. The prompt says how many will come, beside the choice of a companion to scrap to make room.',
      },
      {
        kind: 'balance',
        text: 'Grave Chill: a Thrall that dies curses an enemy with 3 Fate again (was 5). The Full Trick starts at 3 damage (was 5), still 3 more for each one before it in a fight.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.118.0',
    date: '2026-10-28',
    title: 'Tricks and traits',
    summary:
      'Every card has its own art, the Store shows the first Riftwalker looks, and the Trickster and Necromancer traits are toned down.',
    notes: [
      {
        kind: 'new',
        text: 'Every card now has its own art: the last 169 pictures are in.',
      },
      {
        kind: 'new',
        text: 'The Store shows the first Riftwalker looks: twenty of them, two for every Riftwalker (a new outfit and the other gender). They are coming soon, and they will never change how a hero plays.',
      },
      {
        kind: 'balance',
        text: 'Lying in Wait no longer gives 4 Barrier every turn, but every Full Trick in a fight deals 3 more than the last (5, 8, 11...).',
      },
      {
        kind: 'balance',
        text: 'Grave Chill raises 2 a turn (was 3) and no longer puts 3 Fate on every enemy at the start; a Thrall that dies curses an enemy with 5 Fate (was 3).',
      },
      {
        kind: 'changed',
        text: 'The Old Twelve Gauge’s Sharpen is now called Precision, its own stat, separate from the Obsidian Blade’s Sharpen. Both carry over: a new gun or Blade is as sharp as the ones you have, and the hero shows the buff for either weapon.',
      },
      {
        kind: 'fixed',
        text: 'The Suits pips were hidden under the Auras list. They are a panel in the top-left column now, and so are your Boons: drag, resize or fold them like the Auras and the battle log.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.117.0',
    date: '2026-10-28',
    title: 'The Necromancer rises',
    summary:
      'The Necromancer is stronger from the first fight, about 300 cards get their own art, and Sharpen names the right weapon.',
    notes: [
      {
        kind: 'new',
        text: 'About 300 cards that had no picture, or borrowed another card’s, now have their own art: every class, from the new Trickster card tricks to the Monk’s palms and the Engineer’s guns.',
      },
      {
        kind: 'balance',
        text: 'Grave Chill now Raises 3 at the start of every turn: a Bone Thrall is standing for your Command cards from turn 1, and every one that falls still curses an enemy with 3 Fate.',
      },
      {
        kind: 'balance',
        text: 'Bone Bulwark: Raise 5 and 8 Barrier. Bone Sift: Raise 5. Grave Robbery: 6 damage. Spirit Walk needs 6 cards consumed, not 9. Toll in Advance gives 5 Mana.',
      },
      {
        kind: 'fixed',
        text: "The Sharpen tip names the Old Twelve Gauge on the Drunkard's cards, not the Obsidian Blade.",
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.116.0',
    date: '2026-10-28',
    title: 'Auras upgrade properly',
    summary: 'Upgrading an Aura makes it do more, not just cost less.',
    notes: [
      {
        kind: 'balance',
        text: "62 Auras upgrade the Slay the Spire way: a bigger number (Rampage of Ire+ deals 9 to every enemy, Daily Rite+ gives 3 Fervor, Swarm Tactics+ deals 9, Masquerade+ 4 per suit), Opening hand for small engines (Shell Game+, Battle Rhythm+, Legion+, Hunter's Call+), or less HP lost (Ancient Fury+, Berserk Tempo+, Iron Body+).",
      },
      {
        kind: 'changed',
        text: "Auras whose effect cannot grow still cost 1 less when upgraded (Unholy Pact, Command Chip, Wild Hunt, Ascendant Form...). The Knight's Auras are unchanged.",
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.115.0',
    date: '2026-10-28',
    title: 'New faces',
    summary: 'New art for the Monk, the Trickster and seven companions.',
    notes: [
      {
        kind: 'new',
        text: 'The Monk has a new look: a bare-handed, shaved-headed monk with golden fire around his palm and fist. The Trickster is now a masked stage magician with a fan of glowing cards.',
      },
      {
        kind: 'new',
        text: "Art for the Engineer's Spotter Drone, Generator, Bulwark Walker, Scrap Golem and Dreadnought, and the Hunter's Pup and Pack Alpha.",
      },
    ],
  },
  {
    version: '0.114.0',
    date: '2026-10-28',
    title: 'The Drunkard staggers',
    summary: 'The Drunkard is rebalanced card by card and learns to Stagger.',
    notes: [
      {
        kind: 'new',
        text: "Stagger: a drunk's swing hits a random enemy, and hits harder for it. New cards: Haphazard Hook, Drunken Lurch, Stumble, Free-for-All, Drunken Master and Blind Drunk. Also new: Rummage the Bin (Foresee 3) and Sway (Barrier and a card).",
      },
      {
        kind: 'balance',
        text: 'Fewer Buckshot Shells: Load Shells gives 2, Shell Game is an uncommon, One More Round gives 2 a turn. Drinks give more for their Hangover: Barroom Brawl 16 to every enemy, One for the Road draws 3, Drunken Swing 14, Swig 4 Might.',
      },
      {
        kind: 'changed',
        text: 'The Neutral card Stagger is called Off Balance now, so Stagger means one thing.',
      },
      {
        kind: 'balance',
        text: 'Glass Jaw, The Glass Palace and Dutch Courage are trimmed; Trigger Discipline, Gunmetal Soul, Scattergun Symphony, Ricochet, Rock Bottom and Last Call cost 1; Rack the Slide, Scope, Birdshot, Spray and Pray, Fire in the Hole and more are stronger.',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.113.0',
    date: '2026-10-28',
    title: 'The Monk, priced',
    summary:
      'The Barbarian is now the Monk, rebalanced card by card; panels fold on a click again, and the Full Trick waits for the card that earned it.',
    notes: [
      {
        kind: 'changed',
        text: 'The Barbarian is now the Monk: the same fighter and cards, and saved runs carry over. Red Mist, Cornered Beast, Blood on the Sand and Berserk Tide are Burning Breath, Coiled Serpent, Iron Body and Storm of Fists.',
      },
      {
        kind: 'balance',
        text: 'Monk: Inner Fire gives 1 Fervor for each stance you enter, and no Barrier. Still Guard gives 3 Barrier. Unmoved Mind, Wheel of Motion and Surge of Ire cost 2 (Surge of Ire answers the first Fury each turn), and Perfect Balance, Eye of the Storm and Bowing Low give less.',
      },
      {
        kind: 'balance',
        text: 'Monk cards that were weak got stronger: Rage of Ages 8 x3 to every enemy, Final Account, Ashes of Restraint, The Offering, Litany, Radiant Heart, Last Rites of the Flame, Thousand Palms and more. All-Seeing costs 2.',
      },
      {
        kind: 'fixed',
        text: 'Clicking a panel title folds and unfolds it again (the battle log could not be opened on a phone).',
      },
      {
        kind: 'fixed',
        text: "The Full Trick goes off after the card that earned it, so its damage never kills that card's target first. The pips light as each card is played, and the battle log says when you make a Full Trick.",
      },
      {
        kind: 'fixed',
        text: 'Suits cards are no longer offered to other Riftwalkers, where they did nothing.',
      },
      {
        kind: 'fixed',
        text: "A Warden's reward is one page: the Gift and its Hearts. An extra card reward earned in that fight is one more card to choose from on it, not a second page.",
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.112.0',
    date: '2026-10-28',
    title: 'The Trickster deals the cards',
    summary:
      'The Trickster plays with Suits and is rebalanced card by card; battle panels can be moved; attacks that hit your whole side are marked.',
    notes: [
      {
        kind: 'new',
        text: 'Suits: every Trickster card is a ♠, ♥, ♦ or ♣, and four pips beside her light as you play them. Light all four in one turn for a Full Trick: 5 damage to every enemy and a card. New cards: Flourish, Card Fan, Card Sharp, Cut the Deck, Queen of Hearts, Ace of Clubs, Wild Card, Royal Flourish, Showstopper, The Joker and The Whole Deck.',
      },
      {
        kind: 'changed',
        text: "The Trickster's Patience build path is now Suits, and her starting deck has Pick a Card in place of a Defend. Banked Breath, Coiled Patience, Sandbag, Waiting Game, Measured Breath and Fade Away are retired; Masquerade strikes every enemy for each suit you showed.",
      },
      {
        kind: 'new',
        text: "Your Auras, the other side's Auras and the battle log can be moved, resized and folded. Double-click a title to put it back.",
      },
      {
        kind: 'fixed',
        text: 'Card rarity colours match the cards everywhere: uncommon blue and rare gold on the saved decks page too.',
      },
      {
        kind: 'fixed',
        text: 'Backup Core revives one companion, once: it used to bring the same machine back after every hit, so nothing reached you.',
      },
      {
        kind: 'new',
        text: 'An enemy move that strikes every unit on your side carries a red "Hits all" tag, and every unit it will hit is marked. A move whose hits land at random says so too.',
      },
      {
        kind: 'balance',
        text: "Trickster: Set the Web deals 7 and applies 1 Exposed. Cripple, Perfect Alibi, Slit and Run, Smoke Bomb, Metronome Trap, Spring the Trap, Opening Strike, The Perfect Trap and The Long Ambush come down; Mirror Veil, Trap Net, False Floor, Poison Pantry, Trapper's Dividend, The Long Game, Coup de Grace, Culling and more are cheaper or stronger.",
      },
      {
        kind: 'changed',
        text: 'Cheap Shot applies Exposed when you have a Trap set, and Stalk draws 2 extra cards next turn when its target is Exposed. Deep Pockets costs 2. Many Trickster upgrades now raise one number instead of all of them.',
      },
      {
        kind: 'changed',
        text: 'Death Trap and Whisper Net are retired: saved decks get Bait and Switch and False Floor.',
      },
      {
        kind: 'fixed',
        text: 'A Trap that cancels says "Cancel that hit": it stops the one hit that set it off, as Shielded does. Traps that answer a summon or an enemy gaining Barrier name "that enemy" instead of "the attacker".',
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.111.0',
    date: '2026-10-28',
    title: 'A grimoire that stays put',
    summary:
      'Your deck and piles open in a full-window grimoire with steady card sizes, event options show their cards clearly, and the aiming arrow locks on.',
    notes: [
      {
        kind: 'changed',
        text: 'The grimoire opens over the whole window wherever you look at cards. Cards stay a readable size and no longer resize when you change the window, open a ribbon or turn a page. The arrow keys turn its pages.',
      },
      {
        kind: 'changed',
        text: 'Event options that show cards have their words on the left and the cards on the right, with a tag saying whether a card is removed, added, swapped or upgraded.',
      },
      {
        kind: 'changed',
        text: 'The Arena button on the map sits before your Deck: glowing green when your deck is in the Arena, red and struck through until your first fight saves it.',
      },
      {
        kind: 'new',
        text: 'The aiming arrow locks onto the centre of what you point at, with a ring round it and the target lit up. It also shows when you choose a companion to scrap.',
      },
    ],
  },
  {
    version: '0.110.0',
    date: '2026-10-28',
    title: 'The Engineer builds big',
    summary:
      'Companions come in three sizes, small machines can be scrapped into big ones, and the Engineer is rebalanced with her own guns.',
    notes: [
      {
        kind: 'new',
        text: 'Frames: a Light machine takes 1 of your 3 companion slots, a Heavy 2 and a Colossal all 3. Pips on the card and on the machine show its size.',
      },
      {
        kind: 'new',
        text: "With no room, a summon scraps companions to make room (you choose which). The Engineer's Salvage hands their Might, Primed and half their HP to the new machine.",
      },
      {
        kind: 'new',
        text: 'Engineer cards: Pulse Pistol, Arc Welder, Laser Grid, Particle Cannon, Targeting Uplink, Full Salvo, Deploy Spotter, Build Bulwark Walker, Scrap Golem, Dreadnought, Battery Pack, Schematics and Build Generator.',
      },
      {
        kind: 'balance',
        text: 'Every Engineer card was priced again: smaller drones, Heavy Enforcer and Siege Engine, a Colossal War Engine, about 50 number changes and hand-written upgrades. Nanoswarm, Drone Uprising, Overload and Mob Rule are retired (saved decks get the closest card).',
      },
      {
        kind: 'changed',
        text: "A card that summons two or three companions needs room for all of them (the Hunter's Litter too).",
      },
    ],
    heads: 'Rules changed: replays and Arena games from before this version no longer play.',
  },
  {
    version: '0.109.0',
    date: '2026-10-28',
    title: 'Daggers, and the pack holds the line',
    summary:
      'Overflow is tanked by the rest of your companions, the Assassin throws Daggers, and enemies are a little gentler at every tier.',
    notes: [
      {
        kind: 'changed',
        text: 'When a hit kills one of your companions, what is left goes to your next companion before it can reach you.',
      },
      {
        kind: 'changed',
        text: "The Assassin's Sleeve Knives are now Daggers (and Inked Knives are Inked Daggers).",
      },
      {
        kind: 'balance',
        text: 'Enemies have less HP and hit a little softer at every Rift Tier: Tier I starts at 90% of both.',
      },
      {
        kind: 'balance',
        text: 'The Hunter heals 2 HP after every fight she wins again. Blood Pact and Attunement are Auras.',
      },
      {
        kind: 'fixed',
        text: 'A Trap whose damage kills the attacker no longer puts its Exposed or Faltering on another enemy.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.108.0',
    date: '2026-10-28',
    title: 'Might hits, the Hunter hunts',
    summary:
      'Might and Exposed only change attacks now, and the Hunter is rebalanced card by card, with Traps of her own.',
    notes: [
      {
        kind: 'changed',
        text: 'Might, Exposed and Faltering only change attack damage, as their text says. Auras, totems, Traps and potions deal the number on the card (Blood Fire is 6, whatever your Might).',
      },
      {
        kind: 'changed',
        text: 'Thorns, Reflect, Armored and "when attacked" Traps only answer attacks.',
      },
      {
        kind: 'new',
        text: 'The Hunter goes hunting: Bear Trap, Snare Line, Deadfall and Baited Snare (Traps), Hunting Grounds, Single Out and Run It Down.',
      },
      {
        kind: 'balance',
        text: 'The Hunter: smaller summons (Pup 5 HP, Pack Alpha 12, Dire Wolf 18), Litter brings two Pups, about 40 cards retuned, four rares are now uncommon, and Crimson Pact and Unbridled are retired.',
      },
      {
        kind: 'fixed',
        text: 'Blood Fire showed twice in the Aura list.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched. Old runs and decks keep working: Crimson Pact and Unbridled turn into Bone Offering and Blood Tithe.',
  },
  {
    version: '0.107.0',
    date: '2026-10-28',
    title: 'Three cards made whole',
    summary:
      'Three cards that had lost part of what they do now do all of it, and a killing blow that ends a fight pays out.',
    notes: [
      {
        kind: 'changed',
        text: 'Fated Hand (Spellblade): choose 2 cards in your draw pile; they wait on top and come to your hand next turn, with 2 extra cards.',
      },
      {
        kind: 'changed',
        text: 'Army of the Drowned (Necromancer): raises two Thralls of 6 HP, not one.',
      },
      {
        kind: 'changed',
        text: 'Marked for Death (Assassin): if it kills, you get an extra card reward after the fight.',
      },
      {
        kind: 'fixed',
        text: 'Bloodfeast raises your max HP even when its kill ends the fight.',
      },
    ],
  },
  {
    version: '0.106.0',
    date: '2026-10-28',
    title: 'Classes by name, the Trickster',
    summary:
      'Every Riftwalker goes by their class for now, the Trapper is the Trickster, and a few card fixes.',
    notes: [
      {
        kind: 'changed',
        text: 'Riftwalkers are shown by their class: Knight, Engineer, Hunter, Trickster, Assassin, Shaman, Barbarian, Spellblade, Necromancer and Drunkard.',
      },
      {
        kind: 'changed',
        text: 'The Trapper is now the Trickster. Old runs, decks and ghosts keep working.',
      },
      {
        kind: 'fixed',
        text: 'A Free Attack, Free Skill or free Aura is no longer used up on a card that cost nothing anyway.',
      },
      {
        kind: 'fixed',
        text: 'Blade Echo and replayed cards also repeat cards that ask you to choose something.',
      },
      {
        kind: 'fixed',
        text: 'Ember Ward hits back through the enemy turn, as it says.',
      },
      {
        kind: 'fixed',
        text: 'Clearer card text: Hammer and Anvil, At the Threshold, Off the Leash, The Drowned King and Bloodfeast.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.105.0',
    date: '2026-10-28',
    title: 'Five classes rebuilt',
    summary:
      'Valeria, Sylas, Obsidia, Dorian and Ilvane are rebuilt card for card on five classic deckbuilder classes, as the baseline the game is balanced from. Ilvane is now the Shaman.',
    notes: [
      {
        kind: 'changed',
        text: 'Valeria: Might, Barrier, Exposed and burning her own cards; Strikes, Whirlwind-style sweeps and HP-for-power cards. Devotion, Thorns and her Traps are gone.',
      },
      {
        kind: 'changed',
        text: 'Sylas: Sleeve Knives, Bleed and sleight of hand, with Sly cards that play themselves when you discard them.',
      },
      {
        kind: 'changed',
        text: 'Obsidia: Arcana and the Obsidian Blade at the heart of a new deck, with Retainers at her call.',
      },
      {
        kind: 'changed',
        text: 'Dorian: Raise Bone Thralls (up to three), command them to strike, curse with Fate, and make use of Fleeting cards.',
      },
      {
        kind: 'changed',
        text: 'Ilvane is now the Shaman: his totems are elemental spirits that pulse every turn and burst when awakened, and Spirit makes them stronger.',
      },
      {
        kind: 'new',
        text: 'A run starts with two uncommon cards of your choice from your Riftwalker’s pool, in place of two plain cards.',
      },
      {
        kind: 'changed',
        text: 'Build paths are hidden for now: character screens list the mechanics each Riftwalker uses instead, and offered cards no longer say whether they fit your build.',
      },
      {
        kind: 'changed',
        text: 'No Legendary cards for now: the old ones are Rares, and rewards, Warden Gifts and Spin to win give Rares instead. Legendary Boons are unchanged.',
      },
      {
        kind: 'balance',
        text: 'Every card of these five is new and untested: expect big swings while they are balanced.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched. Old runs and decks keep working: retired cards turn into the closest new one.',
  },
  {
    version: '0.104.0',
    date: '2026-10-27',
    title: 'Foundry fix',
    summary: 'Rivet’s The Foundry Awakens reads clearly.',
    notes: [
      {
        kind: 'changed',
        text: 'The Foundry Awakens gives your companions their Primed before the Siege Engine arrives, so the text no longer reads as if the engine does it.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.103.0',
    date: '2026-10-27',
    title: 'Machines, Primed and growing companions',
    summary:
      'Rivet’s three build paths pull apart, companions grow when healed, Valeria and Rivet get new starting kits, and Ilvane hits harder.',
    notes: [
      {
        kind: 'changed',
        text: 'Companions grow: a heal on a companion gives it that much max HP (and HP) instead of mending it. Rivet’s Tinkerer gives each companion 1 max HP a turn.',
      },
      {
        kind: 'changed',
        text: 'Rivet: Swarm goes wide (many drones, spent freely) and Core goes tall (one big machine you build up). New Core cards Crankshaft, Reinforced Frame and Heavy Hitter read your biggest companion, and Reactor Meltdown deals the HP of the ally it blows up.',
      },
      {
        kind: 'changed',
        text: 'Rivet: only Assemble, Relay Strike and Command Chip make companions act now. The rest of Assemble charges them up with Primed, and companions now spend Primed on their next strike.',
      },
      {
        kind: 'balance',
        text: 'Rivet’s cheaper companions have less HP: Patrol Drone 5, Micro Drone 3, Sentry Turret 7, Repair Bot 4, Enforcer Mk.II 12.',
      },
      {
        kind: 'balance',
        text: 'Ilvane: every damage number on his cards is 1 higher; Hawk deals 4 a turn and Awakens for 10, Splinter Awakens for 7.',
      },
      {
        kind: 'changed',
        text: 'Valeria: Devotion costs show just the number; Sunfall and Sunforged Edge show an X. Sunfall strikes 2 different random enemies.',
      },
      {
        kind: 'new',
        text: 'New starting kits for all of Valeria’s build paths and for Rivet’s Swarm and Assemble.',
      },
      {
        kind: 'fixed',
        text: 'An upgraded Gathering Storm grows with the others, and Reactor Meltdown shows its real damage while you aim it.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched. Retired cards in saved decks are swapped for their replacements.',
  },
  {
    version: '0.102.0',
    date: '2026-10-27',
    title: 'Back on your feet',
    summary: 'Spending Resolve after a lost fight brings you back at full HP.',
    notes: [
      {
        kind: 'changed',
        text: 'Lose a fight with Resolve left and you retry it at full HP (it was the HP you came in with, or half your max HP).',
      },
    ],
  },
  {
    version: '0.101.0',
    date: '2026-10-27',
    title: 'Elements and the morning after',
    summary:
      'Ilvane casts the Elements, KP drinks now and pays tomorrow, and every Warden leaves a Gift.',
    notes: [
      {
        kind: 'new',
        text: 'Ilvane: the Whittling build path is now Elements, lightning, ice, fire, water and earth spells that grow with Spirit. Gathering Storm grows every time you cast it, and the Legendary is Avatar of the Elements.',
      },
      {
        kind: 'new',
        text: 'KP: the Hangover build path is rebuilt around drinking. Drinks pay off now and leave a Hangover, HP you lose at the start of your next turn (never your last). Some cards hit harder the more you carry, Hair of the Dog and Sweat It Out clear it, and his heals grow with the HP you are missing.',
      },
      {
        kind: 'changed',
        text: 'The last Warden leaves a Gift too, and a Warden’s Gift always has cards.',
      },
      {
        kind: 'balance',
        text: 'Ilvane: the Bear totem gives 2 Barrier at the end of your turn (was 1).',
      },
      {
        kind: 'fixed',
        text: 'Leaderboard: a run could be left off the board after a busy day of play. Only recorded runs count against the limits now.',
      },
      {
        kind: 'fixed',
        text: 'Devotion costs show a ⚜ (the old cross read like a plus).',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched. Retired cards in saved decks are swapped for their replacements.',
  },
  {
    version: '0.100.0',
    date: '2026-10-27',
    title: 'Shields you can see',
    summary:
      'Shielded units glow inside a yellow bubble, Fortified no longer stacks, and Valeria’s Sunfall and Sunforged Edge spend all her Devotion.',
    notes: [
      {
        kind: 'new',
        text: 'A Shielded unit (yours or an enemy) glows inside a yellow bubble until the shield is spent.',
      },
      {
        kind: 'changed',
        text: 'Fortified is on or off: a second source adds nothing, and cards say "Gain Fortified".',
      },
      {
        kind: 'balance',
        text: 'Valeria: Sunfall deals 10 (+2 per Devotion) and Sunforged Edge 6 (+1 per Devotion); both spend all your Devotion, with no minimum.',
      },
      {
        kind: 'balance',
        text: 'Valeria: Unbroken Wall (Fortified for the fight) costs 3, 2 upgraded. Retribution costs 2, 1 upgraded (its upgrade used to deal 3 more).',
      },
      {
        kind: 'fixed',
        text: 'The Devotion counter beside your Mana reads its whole name.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.99.0',
    date: '2026-10-27',
    title: 'Tidier screens',
    summary:
      'The campaign header fits smaller screens, the Brass Reel shows its card choices side by side, and the build path moves to the bottom of the card.',
    notes: [
      {
        kind: 'fixed',
        text: 'Spin to win: the three Rift-crossed cards on offer are laid out side by side instead of stacked.',
      },
      {
        kind: 'changed',
        text: 'The campaign header fits smaller screens: two lines on a laptop, three on a phone. Your Arena deck is now a small ⚔ badge beside Deck (hover it for the details).',
      },
      {
        kind: 'changed',
        text: 'The build path label sits at the bottom left of a card, and more cards have their own art again.',
      },
    ],
  },
  {
    version: '0.98.0',
    date: '2026-10-27',
    title: 'Rarer, deeper card pools',
    summary:
      'Every Riftwalker’s cards were rebuilt like a proper deckbuilder: more uncommons and rares, each split over the three build paths, near-duplicates gone and Legendaries that build a deck around them.',
    notes: [
      {
        kind: 'new',
        text: 'Every Riftwalker now has 20 commons, 30 uncommons, 25 rares and 3 Legendaries, split evenly over the three build paths, so a rare is a find that defines a build. Near-duplicate cards are gone, many cards are new, and a card that left the game turns into a similar card in any old run or deck.',
      },
      {
        kind: 'new',
        text: 'Kesh: the Feast build path is now Predator: gain Mana, draw hard and play many cards in one turn; its attacks grow with every card played that turn. New cards include Unbridled, Killing Spree, Bloodstorm, Rising Howl and the Legendary Apex Frenzy.',
      },
      {
        kind: 'changed',
        text: 'Legendaries reworked: each one builds a deck around its build path. Valeria’s Dawn’s Mercy turns every heal into a strike; Eye of the Storm, Shatterstorm, Grave Harvest, The Spirit Council, Masquerade, The Twelve-Gauge Opera and more do far more than a one-off burst.',
      },
      {
        kind: 'new',
        text: 'Cards show their build path at the top right of the art, and the card library can filter by build path.',
      },
      {
        kind: 'changed',
        text: 'Starting decks: each kit swaps in two uncommons and a common of its build path. Valeria’s Devotion kit can spend Devotion from the start (Hymn of Reckoning).',
      },
      {
        kind: 'changed',
        text: 'A deck holds at most 5 copies of a card, in a run and in the Arena (a Legendary is one of a kind).',
      },
      {
        kind: 'balance',
        text: 'Kesh no longer heals after a won fight or starts each fight with Might. Valeria’s Devotion shows beside her Mana, and new Devotion attacks join her: Hand of Justice, Consecrated Blade and Hand of God.',
      },
      {
        kind: 'changed',
        text: 'After a fight, Continue sits on top, with the replay options under it.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.97.0',
    date: '2026-10-27',
    title: 'Valeria’s Devotion',
    summary:
      'Valeria’s healing build now pays off: every heal builds Devotion, and new cards cash it in for big hits.',
    notes: [
      {
        kind: 'new',
        text: 'Valeria: whenever she heals she gains that much Devotion, even at full HP, so no heal is wasted. Cards with a gold cost spend it: Lightbrand (5 Devotion: deal 14), Hymn of Reckoning (8 Devotion: 12 to every enemy) and Sunfall (10 Devotion: 2 damage for every Devotion you had, then it is all spent).',
      },
      {
        kind: 'changed',
        text: 'Sunforged Edge now grows with your Devotion (8, +1 per 2 Devotion). Last Stand counts as a Bulwark card.',
      },
      {
        kind: 'changed',
        text: 'Sanctified cards are final: the shrine’s chisel and the engraver no longer put a tag on a sanctified card.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.96.0',
    date: '2026-10-27',
    title: 'Kesh’s pack, rebuilt for Overflow',
    summary:
      'Kesh’s summons are told apart, and her Hound is sturdy again now that minions can be overrun.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: her Hound has 8 HP and hits for 4, and she can have 3 companions at once again. Litter is back: two Hounds for 2 Mana. Rally the Pack gives each of your allies 4 Barrier.',
      },
      {
        kind: 'balance',
        text: 'Kesh’s basics: Rend loses 2 HP, Blood Frenzy loses 1 HP, and Savage Bite deals 8 (10 upgraded).',
      },
      {
        kind: 'new',
        text: 'Kesh: Summon Pup (1 Mana, a Pup), Alpha Call now brings a 16 HP, 10 damage Alpha, and a new Dire Wolf card (3 Mana, 24 HP, 14 damage).',
      },
      {
        kind: 'changed',
        text: 'Den Mother is now an Aura: whenever an enemy kills one of your allies, it takes 15 damage (20 upgraded).',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.95.0',
    date: '2026-10-27',
    title: 'Overflow',
    summary: 'Cheap minions no longer block a whole big hit.',
    notes: [
      {
        kind: 'balance',
        text: 'Overflow: when a single attack kills one of your companions, all of the damage left over (after its Barrier and HP) carries through to you. A 14-damage hit on a 4 HP drone now sends 10 through. It works the same for your enemies’ companions in the Arena. Area attacks, Traps and Thorns are unchanged.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.94.0',
    date: '2026-10-27',
    title: 'Everything on every device',
    summary:
      'Signed in, your run history, Arena match history and username follow you as your runs do; Devour hits harder.',
    notes: [
      {
        kind: 'new',
        text: 'Signed in on shatteredrifts.app, your run history (with the last fight to watch again), your Arena match history and your username appear on every device you sign in on.',
      },
      {
        kind: 'fixed',
        text: 'A run that ended on one device can no longer come back from another device that still had it open, and a device never drops a run it holds to make room for runs from your other devices.',
      },
      {
        kind: 'balance',
        text: 'Kesh: Devour deals 16 (was 14). Fell the Prey, its near twin, is switched off for now.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.93.0',
    date: '2026-10-27',
    title: 'A smaller pack, Stun cards tidied',
    summary:
      'Kesh runs a smaller, frailer pack, and Stun cards apply only Stun, longer on rare ones.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: she can have 2 companions at once (was 3). Her Hound has 5 HP and hits for 3, Savage Bite deals 6 (8 upgraded), and Feeding Time gives 3 max HP.',
      },
      {
        kind: 'balance',
        text: 'Kesh: Call Gnashlings is gone (a saved deck that held it, or Heel, gets Thick Hide), and Litter is switched off for now (a deck that has it keeps it).',
      },
      {
        kind: 'balance',
        text: 'Stun cards apply only Stun (no extra Exposed: Stun already counts as Exposed). Rare and Legendary ones Stun for 2 turns: Override Virus, Silencing Trap, The Perfect Trap, The Long Ambush. Cards now say how many turns.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.92.0',
    date: '2026-10-27',
    title: 'Stun reworked, Kesh retuned',
    summary:
      'Stun no longer skips a turn, three uncommons shield your allies instead of making them act, and Kesh pays more HP with fewer free cards.',
    notes: [
      {
        kind: 'balance',
        text: 'Stun: nobody skips a turn any more. A Stunned unit counts as Exposed, Faltering and Brittle at once (takes 50% more attack damage, deals 25% less, gains 25% less Barrier) for 1 turn, or as many as the card says. It never adds to real Exposed, Faltering or Brittle, and a new Stun keeps the longer countdown.',
      },
      {
        kind: 'balance',
        text: 'Rally the Pack, Hamstring Slam and Second Death no longer make your allies act: each of your allies gains 3 Barrier instead.',
      },
      {
        kind: 'balance',
        text: 'Kesh: every card of hers that costs HP costs 1 more (she has Lifesteal now). Heel, Howl and Guard Dog are gone; a saved run or deck that holds one gets Call Gnashlings, Pack Tactics or Rend in its place.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.91.0',
    date: '2026-10-27',
    title: 'Pick your deck, runs on every device',
    summary:
      'Choose your Arena deck after you are matched, before each game; your runs follow you to every device you sign in on; Kesh is toned down again.',
    notes: [
      {
        kind: 'new',
        text: 'Arena: every saved deck comes to the match. Once you are matched, you choose one before each game, of any Riftwalker, without seeing your opponent’s choice (they cannot see yours either). One deck is enough. Players are matched by Arena rank.',
      },
      {
        kind: 'new',
        text: 'Your runs follow you: sign in on shatteredrifts.app and the runs you have in progress appear on every device you sign in on. Open the game once on the device you played on, so its runs are sent up.',
      },
      {
        kind: 'balance',
        text: 'Kesh: her Hound has 8 HP. Her starting deck has Rend (Deal 9, lose 2 HP, gain 1 Might) instead of Guard Dog, and Savage Bite deals 8 (10 upgraded).',
      },
      {
        kind: 'balance',
        text: 'Stunned heroes: in the Arena and against a ghost Warden, a Stunned hero draws one card fewer at the start of their next turn. Companions and enemies still skip their next action.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.90.0',
    date: '2026-10-27',
    title: 'Kesh, Auras and the Arena page',
    summary:
      'Kesh is toned down early, Auras say how long they last, the battle log shows more, and the Arena page shows who is queued.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: the cards that call her pack bring a companion by their rarity: a Pup (6 HP) from Guard Dog and Heel, a Hound (10 HP) from Rally the Pack, a Pack Alpha (14 HP) from Alpha Call. Her companions share half her Might (rounded down), not all of it.',
      },
      {
        kind: 'balance',
        text: 'Cards that raise your maximum Mana (Deep Pockets and others) start paying on your next turn, not the turn you play them. Deep Pockets+ costs 3 again and has Hold and Opening hand.',
      },
      {
        kind: 'balance',
        text: 'Rift Resonance gives 1 Might, and 1 more every time your deck is reshuffled (it gave 2 Might once).',
      },
      {
        kind: 'balance',
        text: 'A run holds one Legendary Boon at most: once you have one, no other is offered.',
      },
      {
        kind: 'changed',
        text: 'Auras that give you a status once now say it lasts the rest of the fight, and cards that give you a status say "Gain" instead of "Apply".',
      },
      {
        kind: 'new',
        text: 'The battle log shows how hard an enemy move hits ("Gilded Squire uses Slash (9)") and the HP before and after every hit or heal.',
      },
      {
        kind: 'new',
        text: 'The Arena page shows how many players are looking for a match. Making or joining a friend’s room has its own panel, and the room code box shows its hint in full.',
      },
      {
        kind: 'changed',
        text: 'Hovering a card in the card library, your Grimoire or a deck shows its upgrade beside it. In the sandbox the book is no longer split by build path, and ticking Upgraded keeps your page.',
      },
      {
        kind: 'changed',
        text: 'Constructed decks are gone: the Arena only ever takes decks saved from a campaign run.',
      },
      {
        kind: 'changed',
        text: 'The campaign board’s last column, Status, says whether each run is Live, Fell or was Abandoned. An enemy’s intent counts its Vigor.',
      },
      {
        kind: 'fixed',
        text: 'Master Trapper, Gleeful Trapsmith and Curtain Call said "Snare": they say Trap now. Trap is bold on cards, with its note on hover.',
      },
    ],
    heads:
      'Cards and the rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.89.0',
    date: '2026-10-26',
    title: 'Board status',
    summary:
      'The campaign board shows each player once per Riftwalker, and whether the run is still going.',
    notes: [
      {
        kind: 'changed',
        text: 'The campaign board lists each player once per Riftwalker, at their furthest run, and says whether that run is Live, Fell or was Abandoned.',
      },
    ],
  },
  {
    version: '0.88.0',
    date: '2026-10-26',
    title: 'Back on your feet',
    summary:
      'A retried fight starts with at least half your HP, and a clearer end-of-fight screen.',
    notes: [
      {
        kind: 'balance',
        text: 'Lose a fight with Resolve left and you retry it with at least half your max HP (or more, if you came in with more).',
      },
      {
        kind: 'changed',
        text: 'After a fight, Continue comes first and stands on its own; the recap, the board and the replay sit beside it.',
      },
      {
        kind: 'fixed',
        text: 'The Sharpen number on the hero can be read when the blade is sharpened.',
      },
    ],
  },
  {
    version: '0.87.0',
    date: '2026-10-26',
    title: 'Arcana unbound',
    summary: 'Obsidia gets cards paid in Arcana alone, and payoffs for spending it.',
    heads:
      'Arena games and replays from earlier versions can no longer be played or watched: the rules have changed.',
    notes: [
      {
        kind: 'balance',
        text: 'Arcane Bolt deals 12 (was 16).',
      },
      {
        kind: 'new',
        text: 'Obsidia: Spellbolt, Arcane Barrier, Falling Shards, Searing Ray and Crown Strike cost no Mana, only Arcana. Sigil of Scorch and Sigil of Glass now answer whenever you spend Arcana, and Honed Strike makes Arcana.',
      },
      {
        kind: 'changed',
        text: 'A card’s Arcana cost shows only on the card itself, not again in its text.',
      },
    ],
  },
  {
    version: '0.86.0',
    date: '2026-10-26',
    title: 'Kesh unleashed',
    summary: 'Kesh reworked, Lifesteal, companions that grow, and a tidier merchant.',
    heads:
      'Arena games and replays from earlier versions can no longer be played or watched: the rules have changed.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: her companions share her Might, she heals 6 after every fight she wins, and her starting deck has Savage Bite (Lifesteal), Blood Frenzy (hits every enemy) and Guard Dog (a Hound and Barrier). Her self-damage cards pay off properly, and look-alike cards were pulled apart.',
      },
      {
        kind: 'new',
        text: 'Lifesteal: some attacks heal you a share of the HP they take off. Some of Kesh’s, Rivet’s and Dorian’s cards now raise a companion’s max HP instead of only shielding it.',
      },
      {
        kind: 'changed',
        text: 'The merchant has the same layout every visit: Leave the shop at the top, the cards in one row, and Potions, Boon and Services in three columns.',
      },
    ],
  },
  {
    version: '0.85.0',
    date: '2026-10-26',
    title: 'Spin To Win',
    summary:
      'A free first spin, replays you can trust, a tidier Arena, traits on show, and coloured arrows.',
    notes: [
      {
        kind: 'new',
        text: 'The Brass Reel is now Spin To Win, and the first spin at a reel is free. With Reduce motion on, the reel still spins (briefly) instead of jumping to the prize.',
      },
      {
        kind: 'new',
        text: 'Replays: a move counter and a Step button while paused, and a replay says from which move it no longer matches the real game (when the cards have changed since). A game the clock called can be watched again.',
      },
      {
        kind: 'changed',
        text: 'In the Arena the opponent’s piles, trait, Boons and Auras stack on their side without covering each other, and both Riftwalkers’ traits are shown during a fight.',
      },
      {
        kind: 'changed',
        text: 'Coloured arrows instead of triangles (sanctified cards, changed costs, Sharpen, buff and debuff intents). Traps are “triggered”. A held merchant card shows what it will cost next time.',
      },
      {
        kind: 'changed',
        text: 'The campaign board shows every run that made progress this week (or month). A ghost Warden is never your own deck.',
      },
      {
        kind: 'balance',
        text: 'Apex Maw heals 10 (+2 per Might); upgraded, it costs 2.',
      },
    ],
  },
  {
    version: '0.84.0',
    date: '2026-10-26',
    title: 'Tidier runs list',
    summary: 'Each run in progress is one box, with Abandon inside it.',
    notes: [
      {
        kind: 'changed',
        text: 'On the home page each run in progress is one box: Continue fills it, and Abandon (and the question that follows) sits inside it.',
      },
    ],
  },
  {
    version: '0.83.0',
    date: '2026-10-26',
    title: 'Ten runs at once',
    summary: 'Keep up to 10 runs going at the same time.',
    notes: [
      {
        kind: 'changed',
        text: 'You can have up to 10 runs in progress (was 3). With more than two, the home page lists them in a compact panel that scrolls, with how many slots you are using.',
      },
    ],
  },
  {
    version: '0.82.0',
    date: '2026-10-26',
    title: 'No hidden run slots',
    summary:
      'A saved run that cannot be loaded is shown on the home page instead of quietly taking a slot.',
    notes: [
      {
        kind: 'fixed',
        text: 'A saved run the game cannot load used to take one of your three run slots without being listed, so New Run said you were full. It now shows on the home page: copy it to send with a bug report, or remove it to free the slot.',
      },
    ],
  },
  {
    version: '0.81.0',
    date: '2026-10-26',
    title: 'Clearer choices',
    summary:
      'Event cards sit in their option, marked with what happens to them; a centred fight title.',
    notes: [
      {
        kind: 'changed',
        text: 'The cards an event option means sit inside its box: crossed out when they leave your deck, a Swap or Upgrade arrow to what they become, and a plus on a card you get. Options have a little more room between them.',
      },
      {
        kind: 'changed',
        text: 'The fight title sits in the middle of the screen.',
      },
      {
        kind: 'balance',
        text: 'Punishing Gale is one hit: deal 8 (+1 per Thorns) damage to ALL enemies.',
      },
    ],
  },
  {
    version: '0.80.0',
    date: '2026-10-26',
    title: 'Tidier corners',
    summary: 'Card-shaped piles, and the potions, Mana and draw pile lined up.',
    notes: [
      {
        kind: 'changed',
        text: 'The Draw, Discard and Consumed piles have the shape of a real card, so they read as stacks of card backs, and the potions, Mana and the Draw pile sit on one line.',
      },
    ],
  },
  {
    version: '0.79.0',
    date: '2026-10-26',
    title: 'Gentler Wardens',
    summary:
      'A lost Warden costs 1 Resolve, every boss fight shows what is at stake, and KP’s shells are retuned.',
    notes: [
      {
        kind: 'balance',
        text: 'Losing to a Warden costs 1 Resolve (an Elite still costs 2), so a Normal run survives one lost boss fight.',
      },
      {
        kind: 'new',
        text: 'Every Warden fight shows your Resolve and what a loss would leave, in red when a loss would end the run.',
      },
      {
        kind: 'balance',
        text: 'Ammo Dump adds 6 Buckshot Shells (was 8); upgraded, it adds 6 upgraded shells that deal 6 to every enemy. Fire in the Hole+ grows faster with your consumed cards (+2 per 3) instead of gaining flat damage.',
      },
    ],
  },
  {
    version: '0.78.0',
    date: '2026-10-26',
    title: 'No more mystery cards',
    summary: 'Events show the exact random cards they mean before you choose.',
    notes: [
      {
        kind: 'changed',
        text: 'An event option that trades, transforms, copies, gives, removes or upgrades a random card now shows the exact cards: what leaves your deck, and what you get. The Rift-crossed pilgrim shows your card and the one you would trade it for.',
      },
      {
        kind: 'changed',
        text: 'Links to the game now say what it is: a free roguelike deckbuilder card game in your browser.',
      },
    ],
  },
  {
    version: '0.77.0',
    date: '2026-10-26',
    title: 'Numbers you can read',
    summary:
      'Cards show the damage they will really deal, hit numbers hold still, cheaper upgrades for the big cards, and missing-HP cards behave in the Arena.',
    notes: [
      {
        kind: 'new',
        text: 'A damage number on a card in your hand shows what it will really deal: your Might, stance, Faltering, Sharpen and Edge counted, green when higher than printed and red when lower. Aim it at an enemy and their Exposed counts too; a card that could hit several enemies shows the range. A sharpened weapon shows its sharpened damage right on the card.',
      },
      {
        kind: 'changed',
        text: 'Damage (red), healing (green) and Barrier (blue) numbers are bigger and hold still while they fade; a hit that Barrier partly soaks shows both.',
      },
      {
        kind: 'balance',
        text: 'Cards that grow as you get hurt (Bar Stool, the window panes, Last Stand, Death or Glory and more) count the share of your HP missing, so they hit about the same in the campaign and no longer run away in the Arena.',
      },
      {
        kind: 'balance',
        text: 'Some upgrades make a big card cheaper instead of a little bigger: The Twelve-Gauge Opera+, Rift Collapse+, Bloodmoon Hunt+, The Great Pole+ and The Perfect Trap+ cost 2; Shatterstorm+, Cataclysm+ and Killing Glass+ need one less Arcana; Cataclysm Totem+ awakens your totems 3 times.',
      },
      {
        kind: 'changed',
        text: 'Bigger status numbers on the fighters, and a plain map legend.',
      },
    ],
  },
  {
    version: '0.76.0',
    date: '2026-10-26',
    title: 'Your deck at stake',
    summary:
      'Giving up mid-fight costs your Arena deck, no event forces a card on you, retuned card rewards, and shorter Arena games.',
    notes: [
      {
        kind: 'changed',
        text: 'A run saves its deck for the Arena as you go. Fall, or give up in the middle of a fight, and that deck leaves the Arena; give up anywhere else and it stays. Push deeper for a stronger deck, or stop and keep it.',
      },
      {
        kind: 'changed',
        text: 'When an event lays out three cards (the smuggler’s crate, cards from other worlds) you can take none of them.',
      },
      {
        kind: 'balance',
        text: 'Card rewards: each card after a fight is 55% common, 35% uncommon, 9% rare and 1% Legendary; after an Elite 35 / 42 / 20 / 3. Card luck is gone: everyone has the same odds.',
      },
      {
        kind: 'balance',
        text: 'Each Arena game is called at 15 minutes (was 20).',
      },
      {
        kind: 'changed',
        text: 'Decks are "saved" for the Arena (no more "banked"). Event options have bigger text. The Sandbox picks a Riftwalker like the home page does, and its card book fills the window.',
      },
    ],
  },
  {
    version: '0.75.0',
    date: '2026-10-26',
    title: 'Gentler start',
    summary: 'Tier I enemies have less HP, and multi-hit attacks behave when their target falls.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I enemies start at 125% HP (was 150%); every Tier up still adds +50%.',
      },
      {
        kind: 'fixed',
        text: 'An enemy whose multi-hit attack kills its target spends the hits it has left on a new one by its usual way of choosing, so an 8x3 that fells your minion in two hits still lands its third on you.',
      },
    ],
  },
  {
    version: '0.74.0',
    date: '2026-10-26',
    title: 'Readable allies, quieter map',
    summary:
      'Allies show what they will do, the map keeps who you will fight a secret, and the Rift Tiers are retuned.',
    notes: [
      {
        kind: 'new',
        text: 'Every ally and minion wears a small badge with what it does at the end of its side’s turn and how much damage it will deal to the front enemy (Might, Weak and Exposed counted), or "Stunned" when it will skip.',
      },
      {
        kind: 'changed',
        text: 'The map only says Duel or Elite until you arrive, and a ghost Warden in the campaign never says whose deck it is.',
      },
      {
        kind: 'balance',
        text: 'Rift Tiers retuned: Tier I enemies start at 150% HP and 100% damage, and every Tier up adds +50% HP and +20% damage (+12% HP and +5% damage each stage).',
      },
    ],
  },
  {
    version: '0.73.0',
    date: '2026-10-26',
    title: 'Even tiers, smarter ghosts',
    summary:
      'Rift Tiers climb by the same step every time, ghost decks think through their turn, and legendary Boons stand out.',
    notes: [
      {
        kind: 'balance',
        text: 'Rift Tiers climb evenly: Tier I enemies start at 175% HP and 120% damage, and every Tier up adds the same +50% HP and +15% damage, all the way to Tier XX. How to play shows the table.',
      },
      {
        kind: 'changed',
        text: 'Ghost decks (Arena ghosts and ghost Wardens) play smarter: they think through the end of their turn, their allies, Traps and end-of-turn effects, before picking their cards.',
      },
      {
        kind: 'changed',
        text: 'Legendary Boons glow crimson instead of gold, so they never look like a common one.',
      },
    ],
  },
  {
    version: '0.72.0',
    date: '2026-10-26',
    title: 'Weapons and tougher foes',
    summary:
      'Heroes strike with their own weapons, the card you play sits by the discard pile, and every enemy has more HP.',
    notes: [
      {
        kind: 'new',
        text: 'Heroes strike with their own weapons: KP swings his hammer or fires the Old Twelve Gauge with a muzzle flash, Valeria cuts with her sword or bashes with her shield, Sylas throws his knife, and everyone else has theirs, with dust, sparks and spirit swirls where the blow lands.',
      },
      {
        kind: 'changed',
        text: 'The card you play shows beside the discard pile instead of over the arena, and the Draw, Discard and Consumed piles wear card backs.',
      },
      {
        kind: 'balance',
        text: 'Every enemy has 50% more HP at every Rift Tier.',
      },
    ],
  },
  {
    version: '0.71.0',
    date: '2026-10-26',
    title: 'Every Arena game ends',
    summary:
      'Sudden death from Turn 51 and a 20-minute clock for each Arena game. No more blank cards.',
    heads: 'An Arena game in progress when this version arrived was ended as a draw.',
    notes: [
      {
        kind: 'new',
        text: 'Sudden death in the Arena: from Turn 51 both heroes lose more HP every turn (10, then 20, 30...), straight through Barrier and Shielded.',
      },
      {
        kind: 'new',
        text: 'Each Arena game has 20 minutes, shown under the turn clock. When it runs out the game goes to whoever has the larger share of their HP left.',
      },
      {
        kind: 'fixed',
        text: 'A card picture that fails to load shows the card’s painted art instead of a blank.',
      },
    ],
  },
  {
    version: '0.70.0',
    date: '2026-10-26',
    title: 'A harder Rift',
    summary:
      'Tier I is tougher and every tier climbs faster. New events trade your cards, Omens are in view, and Thorns are fairer.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I enemies have about 15% more HP and hit a little harder, and every Rift Tier after it climbs faster.',
      },
      {
        kind: 'new',
        text: 'Trades: new events melt two common Attacks (or bind two common Skills) into an uncommon of your choice, trade a rare for another, retrain a card that does not fit your build path, or step an uncommon up to a rare.',
      },
      {
        kind: 'new',
        text: 'The Threshold can trade Strikes or Defends for your pick of uncommon Attacks or Skills, or upgraded commons.',
      },
      {
        kind: 'new',
        text: 'In a campaign fight the Rift Tier’s Omens sit at the top right; in the Arena your opponent’s Auras and Boons show there.',
      },
      {
        kind: 'new',
        text: 'How to play lists every Omen and every Warden’s Heart. A fight’s title says its Rift Tier.',
      },
      {
        kind: 'changed',
        text: 'Sanctified cards show their changed numbers in green or red, and hovering one says what the roll changed.',
      },
      {
        kind: 'changed',
        text: 'Played cards are smaller (smaller still in replays). Potions stand above Mana with Arcana beside it. Notices no longer cover the run bar.',
      },
      {
        kind: 'fixed',
        text: 'Thorns only answer attacks: your Traps, Auras, totems and potions no longer hurt you when they hit an enemy with Thorns.',
      },
      {
        kind: 'fixed',
        text: 'Back to the result no longer jumps away when you point at it.',
      },
    ],
  },
  {
    version: '0.69.0',
    date: '2026-10-26',
    title: 'Three build paths for everyone',
    summary:
      'Every Riftwalker has three clear ways to build, a trait that helps all of them, and cards of our own.',
    heads:
      'Many cards changed what they do, so a replay of a fight from an older version may not play back the same way.',
    notes: [
      {
        kind: 'new',
        text: 'Build paths: the three ways each Riftwalker builds a deck are shown on the character picker.',
      },
      {
        kind: 'new',
        text: 'Ilvane builds through Totems, Whittling (small free Carvings that keep coming back) or Rites (Auras that pay whenever you play another Aura).',
      },
      {
        kind: 'changed',
        text: 'Sehra builds through Fury, Flow (every stance change pays) or Radiant. Vesper’s third build path is now Patience: hold your cards, keep your Mana, strike later.',
      },
      {
        kind: 'changed',
        text: 'New traits: Sylas gets a Sleeve Knife every turn, Vesper starts with Barrier and two extra cards and gains Barrier every turn, Sehra gains Fervor and Barrier whenever she enters a stance, Dorian curses an enemy whenever an ally dies or a card is consumed, and Obsidia sharpens her blade each turn.',
      },
      {
        kind: 'changed',
        text: 'Dozens of cards have new names and new effects. Your decks keep the same cards and art.',
      },
      {
        kind: 'balance',
        text: 'Ilvane, Sehra and Vesper are stronger, especially later in a run. Rivet’s Overdrive and Perpetual Motion cost 1 less; several of Vesper’s Traps hit harder.',
      },
      {
        kind: 'fixed',
        text: 'On phones the username panel fits the screen, and no page scrolls sideways.',
      },
    ],
  },
  {
    version: '0.68.0',
    date: '2026-10-26',
    title: 'Fairer ghost Wardens',
    summary: 'Ghost Wardens come from your own tier or just below, and only when there is one.',
    notes: [
      {
        kind: 'balance',
        text: 'A ghost Warden is never from a higher Rift Tier than yours, and never more than three tiers below it.',
      },
      {
        kind: 'changed',
        text: 'Whether a stage’s Warden is a ghost is settled as the stage begins: the map only says Ghost Warden when there is one to fight, and otherwise it is the usual Warden.',
      },
      {
        kind: 'changed',
        text: 'The Arena page no longer shows the Vault code box or the server setting. To bring your saved decks to another device, sign in.',
      },
      {
        kind: 'changed',
        text: 'Your username now sits at the top right of the home page. No username yet? Choose one right there. Open it to change your name or sign in.',
      },
    ],
  },
  {
    version: '0.67.0',
    date: '2026-10-26',
    title: 'One Arena, with ranks',
    summary: 'Ranks are simply part of the Arena.',
    notes: [
      {
        kind: 'changed',
        text: 'There is one Arena: every match against another player counts toward your Arena rank (Bronze to Diamond). Matches against ghosts are practice and never count.',
      },
      {
        kind: 'changed',
        text: 'The Arena page always shows your rank and the season, and the Leaderboards’ Arena tab opens on the season’s ranks, with the weekly and monthly win boards (the trophy races) beside them.',
      },
      {
        kind: 'changed',
        text: 'Leaderboards redesigned: pick Arena, Campaign or Ghosts, then the view (season ranks, this week, this month), with how long it has left beside it. What each board counts is folded away under “How this board works”.',
      },
      {
        kind: 'fixed',
        text: 'Long lines of text no longer stretch across wide screens, and introductions sit centred under their titles.',
      },
    ],
  },
  {
    version: '0.66.0',
    date: '2026-10-26',
    title: 'A tidier home page',
    summary: 'The home page’s smaller links are now a grid of tiles.',
    notes: [
      {
        kind: 'changed',
        text: 'Saved decks, Run history, Trophy case, Leaderboards, Ghost decks, Card library, How to play and Patch notes are tiles with icons under the main menu. A green dot on Patch notes means there is something new to read.',
      },
    ],
  },
  {
    version: '0.65.0',
    date: '2026-10-26',
    title: 'Patch notes',
    summary: 'A page to see what changed from patch to patch.',
    notes: [
      {
        kind: 'new',
        text: 'Patch notes (on the home page): every patch, newest first, sorted into New, Changed, Balance and Fixed. The link says New until you have read the latest.',
      },
    ],
  },
  {
    version: '0.64.0',
    date: '2026-10-26',
    title: 'Rift Omens',
    summary: 'Every Rift Tier now changes how the run plays, and Wardens offer a Heart.',
    notes: [
      {
        kind: 'new',
        text: 'Rift Omens: every Rift Tier from II brings an Omen, they stack, and each one grows the deeper you go. Hover the Omens tag on the run bar to read them all.',
      },
      {
        kind: 'new',
        text: 'Second phases: from Tier II, elites and Wardens stop at half HP and rise with Barrier and Might. A red notch on the HP bar shows where.',
      },
      {
        kind: 'new',
        text: 'Warden’s Hearts: after a Warden, take a rare card, one of two Hearts, or nothing. A Heart changes every fight for the rest of the run, at a price. You hold one at a time.',
      },
      {
        kind: 'balance',
        text: 'Shrug It Off lessens every debuff by 1 or 25%, Steady Nerves by 2 or 50% (whichever is more). Purging Light still clears them all.',
      },
      {
        kind: 'balance',
        text: 'Old Twelve Gauge: Point Blank, 25% more damage when only one enemy is left.',
      },
      {
        kind: 'changed',
        text: 'Attacks land on the target: fighters no longer run across the board. A sword cuts across the target, a hammer comes down on it.',
      },
      {
        kind: 'changed',
        text: 'Drag a card that needs a target up towards the enemies and it turns into the targeting arrow.',
      },
      {
        kind: 'changed',
        text: 'Fight layout: your Boons and Auras sit top left, potions beside the Mana, statuses are small round icons. Campaign buttons read View map, Forfeit, Abandon run.',
      },
      {
        kind: 'changed',
        text: 'Event chances that are not even spin a wheel with the right share of gold; only a 50% chance is a coin.',
      },
      {
        kind: 'fixed',
        text: 'Messages can always be dismissed and are never hidden behind other panels. Card costs use a clearer font (0 and 1 no longer look alike).',
      },
    ],
    heads:
      'Arena replays from before this version can no longer be watched, and a campaign fight left half-played may start again.',
  },
  {
    version: '0.63.0',
    date: '2026-10-26',
    title: 'Replays and ranks',
    summary: 'Look back at any fight, climb the Arena ranks, and share your matches.',
    notes: [
      {
        kind: 'new',
        text: 'After every fight: a recap (what hurt you most, the blow that ended it, your best turns), the whole battle log, and a replay at up to 4× speed.',
      },
      {
        kind: 'new',
        text: 'Run history: every run that has ended, with its deck and the last fight it played, to watch again.',
      },
      {
        kind: 'new',
        text: 'Arena ranks: Bronze, Silver, Gold, Platinum and Diamond. A season is a month, with a Ranked leaderboard.',
      },
      {
        kind: 'new',
        text: 'Arena replays can be shared by link for 30 days, and friends can be invited to watch a match live (your hand stays hidden).',
      },
      {
        kind: 'new',
        text: 'Constructed decks (preview): build an Arena deck card by card. The Constructed Arena is not open yet.',
      },
      {
        kind: 'changed',
        text: 'The merchant: one card on every table is on sale, a card for the build path your deck follows is always there, and card removal costs a little more each time.',
      },
      {
        kind: 'new',
        text: 'Offered cards say when they fit a build path your deck is following.',
      },
    ],
  },
  {
    version: '0.62.0',
    date: '2026-10-25',
    title: 'Trophies',
    summary: 'Weekly and monthly Arena trophies, a Store page, and new events.',
    notes: [
      {
        kind: 'new',
        text: 'Arena trophies: finish a week or a month in the top 100 for a silver or gold cup. They show beside your name, and the Trophy case keeps them.',
      },
      {
        kind: 'new',
        text: 'A Store page for cosmetics (coming soon; it will only ever be cosmetic).',
      },
      {
        kind: 'new',
        text: 'Seven new events, among them the reliquary of legends: trade your Legendary for another.',
      },
      { kind: 'changed', text: 'Ghost Wardens are marked on the map.' },
      {
        kind: 'balance',
        text: 'One Legendary and two Ancestral cards per deck. Decks that already hold more keep them, but the Arena takes only decks within the limits.',
      },
    ],
  },
  {
    version: '0.61.0',
    date: '2026-10-25',
    title: 'The Gambler’s Shrine',
    summary: 'A new Shrine for deep runs, and longer Arena matches.',
    notes: [
      {
        kind: 'new',
        text: 'The Gambler’s Shrine (Tier VI and up): two different blessings from seven, including wagers like Sacrifice, Loaded Dice, the Chisel and the Ledger.',
      },
      { kind: 'changed', text: 'You can walk away from any Shrine.' },
      {
        kind: 'balance',
        text: 'Arena: every Riftwalker has 6× their HP (damage unchanged), going second gives +60 HP, and Boons stay out of the Arena.',
      },
      {
        kind: 'balance',
        text: 'Fevered Communion gives 2 Spirit (3 upgraded); Blood Tithe+ draws 3 and loses 4 HP; entering Radiant gives 1 Mana.',
      },
      {
        kind: 'balance',
        text: 'Enemies a little tougher on every tier. Ghost Wardens grow with the tier, and every Warden you beat gives you Max HP.',
      },
      { kind: 'changed', text: 'Only decks that have cleared Tier 3 become ghosts.' },
    ],
  },
  {
    version: '0.60.0',
    date: '2026-10-25',
    title: 'Clearer events',
    summary: 'Events say which card they take.',
    notes: [
      { kind: 'changed', text: 'An event that removes a card names the card it takes.' },
      {
        kind: 'changed',
        text: 'Sanctified cards can be removed, and show each number their roll changed.',
      },
    ],
  },
  {
    version: '0.59.0',
    date: '2026-10-25',
    title: 'A steeper climb',
    summary: 'Harder from the first stage, and every tier harder than the last.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I is harder, and each Rift Tier climbs more steeply: every stage is harder than the one before.',
      },
      { kind: 'changed', text: 'Every run shows on the campaign board from its first fight.' },
      {
        kind: 'changed',
        text: 'Ghost Wardens come from decks near your tier, never the same one twice in a run, and say so when they appear. A ghost deck stays even after its run collapses.',
      },
    ],
  },
  {
    version: '0.58.0',
    date: '2026-10-25',
    title: 'Events pass',
    summary: 'Fewer Boons, more meaningful event choices.',
    notes: [
      {
        kind: 'balance',
        text: 'Boons are rarer: Wardens no longer give one. Legendary Boons are the rarest of all.',
      },
      {
        kind: 'new',
        text: 'Events can tag a card with Hold, Opening hand or Flare, and more events let you choose the card.',
      },
      { kind: 'new', text: 'Some events start a fight that pays spoils on top of the reward.' },
      {
        kind: 'fixed',
        text: 'Sanctified and engraved cards work everywhere, Arena and ghost Wardens included.',
      },
      { kind: 'fixed', text: 'The Brass Reel looks right in a run.' },
    ],
  },
  {
    version: '0.57.0',
    date: '2026-10-25',
    title: 'Threshold and Waymarks',
    summary: 'Better choices between stages.',
    notes: [
      {
        kind: 'changed',
        text: 'Cards at the Threshold and Waymarks are a choice of three from your own class, and upgrades hit your own cards.',
      },
      {
        kind: 'balance',
        text: 'Resolve is offered only when you are missing some, and bargains pay clearly more.',
      },
    ],
  },
  {
    version: '0.56.0',
    date: '2026-10-25',
    title: 'Balance audit',
    summary: 'Numbers brought in line across the board.',
    notes: [
      {
        kind: 'balance',
        text: 'Riftwalker HP 70 to 88, enemies at sensible Tier I values, and a clear table of how much each tier adds.',
      },
      {
        kind: 'balance',
        text: 'Fervor reaches Radiant at 10, Serene gives its Mana once a turn, and cards that double things are capped.',
      },
      {
        kind: 'new',
        text: 'The Brass Reel: pay 25 shards a spin, take the prize or spin again.',
      },
    ],
  },
  {
    version: '0.55.0',
    date: '2026-10-25',
    title: 'Decks save themselves',
    summary: 'Your run’s deck is in the Arena without asking.',
    notes: [
      { kind: 'new', text: 'Your deck saves to the Arena by itself after every fight.' },
      { kind: 'new', text: 'Ambush events, and a notice whenever a card is upgraded.' },
      { kind: 'changed', text: 'The merchant upgrades cards, and Foresee draws a card.' },
    ],
  },
];

const SEEN_KEY = 'sr.patchNotesSeen';

/** The newest version the player has opened the patch notes for (null if never). */
export function seenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

/** The player has read the newest notes. */
export function markSeen(): void {
  try {
    const top = PATCH_NOTES[0];
    if (top) localStorage.setItem(SEEN_KEY, top.version);
  } catch {
    /* it will say "new" again */
  }
}

/** There are notes the player has not opened yet. */
export const hasUnread = (): boolean => {
  const top = PATCH_NOTES[0];
  return !!top && seenVersion() !== top.version;
};
