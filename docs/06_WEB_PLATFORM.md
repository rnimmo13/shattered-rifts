# Shattered Rifts: Web Version Platform (donations, roadmap, saves, hosting)

The web version is **free to play**, funded by **Ko-fi donations**, and is the proving ground for the
Steam game. It has to answer, in plain sight: *what is this, what will it become, and what does my
money pay for?*

---

## 1. Donations: Ko-fi
### 1.1 Placement (visible but never nagging)
- The **Support & Roadmap** tile in the Sanctum (always there).
- A small heart button in the top bar of the Sanctum and map screens (never on the duel screen).
- **After moments of delight, at most once per session:** after a first Warden kill or a Legendary
  drop, a dismissible card slides in: *"Enjoying the Rift? Help fund the full game →"*. It's never
  shown after a loss, and never more than once per day.
- The footer of the public site and the roadmap page.
- **Never:** interstitials, timers, locked content, "watch an ad".

### 1.2 Integration
- Use Ko-fi's official **button/link** pointing to the project's Ko-fi page (open in a new tab). Avoid
  embedding third-party payment iframes inside the game canvas.
- Show the current **Ko-fi goal** (amount + progress) on the roadmap page. Start by entering the numbers by hand
  in `content/roadmap.ts`. Later, update automatically via the webhook (§1.4).
- Ko-fi and payment processor fees change, so check Ko-fi's current pricing before announcing numbers.

### 1.3 Supporter perks (cosmetic only, never gameplay)
| Tier (one-time, cumulative) | Perks |
|---|---|
| **Spark** ($3+) | "Spark" title · name on the in-game **Supporters Wall** (opt-in) |
| **Founder** ($10+) | Everything above + animated **Founder card back** (rift-sigil) + Founder portrait frame + title |
| **Patron** ($25+) | Everything above + vote in the "next realm" polls + name in the Steam version's credits |
| Monthly members | Monthly devlog early access, a role in community polls, title badge |

> **Open decision for Robert:** should Founder (or a $15+ tier) include a **Steam key at launch**?
> Recommendation: yes, at $15+. It converts donors well, and the donor pays more than the expected
> Steam price. Don't announce it until the price and launch plan are firm.
> *(Not legal or tax advice. Donations that come with rewards may be treated as sales in some places;
> worth a quick check with an accountant once money flows.)*

### 1.4 Delivering perks without a backend: signed supporter codes
- Codes are **Ed25519-signed** payloads: `SR1-` + base32(`{tier, issuedAt, nonce}` + signature).
- The **private key never enters the repo or the client.** It lives on Robert's machine (or later as a
  secret in a serverless function).
- The game embeds the **public key** and verifies codes offline (`tweetnacl` or `@noble/ed25519`).
  Unforgeable without the private key. Shareable, but these are cosmetics, so that's acceptable.
- Settings → **Redeem code** → perks unlock and are stored in the save.
- **Phase 1 (manual):** `pnpm tools:code --tier founder --count 1` → Robert emails the code to the donor.
- **Phase 2 (automatic):** a Ko-fi **webhook** → Netlify Function (verify Ko-fi's `verification_token`;
  map amount → tier; sign the code; email it via a transactional email service). Log only the minimum
  data needed.
- At Steam launch, codes redeem once against an account, which moves perks into the Steam version.

## 2. Public roadmap
Players should see exactly what they're funding. The roadmap lives **in the game** (Sanctum → Support &
Roadmap) and at **`/roadmap`** on the site, both rendered from `apps/web/src/content/roadmap.ts`.

Per phase: title, plain-language promise, status (`done / in progress / next / later`), a checklist of
player-visible features, and, if relevant, the **funding goal** that unlocks it.

**"Where the money goes"** (show as a simple bar): commissioned hero art for Legendaries and Mythics ·
original music & SFX · Steam fees and store assets · PvP servers · playtesting/QA. Update it quarterly.

Also: a **changelog** at `/changelog` (from `CHANGELOG.md`) and a devlog link. Shipping visible
progress regularly is the strongest donation driver of all.

The player-facing phases are in `ROADMAP.md` (repo root).

## 3. Saves (browser, no accounts)
- **Storage:** IndexedDB (via a tiny wrapper like `idb-keyval`), with a localStorage fallback for the
  settings blob only.
- **Schema:** `{ schemaVersion, profile, collection, decks, currencies, campaign, settings, perks, stats }`.
  Every schema change ships a **migration** function (`migrations/v1→v2.ts`), with tests.
- **Autosave:** after every map node and every duel turn. A duel is stored as `seed + action log`, so
  the deterministic engine rebuilds it exactly (small saves, bit-perfect resume).
- **Export/Import:** Settings → *Export save* produces a **save code**: JSON → deflate (`fflate`) →
  base64url, prefixed `SRS1.` with a CRC32 suffix. Also offer *Download save file* (`.srsave`). Import
  validates the checksum and schema, previews (tier, collection size), then confirms.
- **Warnings:** on first run, explain that progress lives in this browser, and nudge to export now and
  then (a gentle reminder after each Warden kill if the last export is older than 7 days).
- **Steam migration (later):** the Steam version imports web save codes into its *campaign*. PvP
  collections will be server-verified (decision deferred to the PvP phase).

## 4. Hosting & ops
- A static site (Vite build) on **Netlify** (or Cloudflare Pages), with a custom domain and HTTPS.
  Netlify Functions are only needed for the Phase-2 Ko-fi webhook.
- **Analytics (optional):** privacy-friendly and cookie-less (e.g. Plausible). Track only page views
  and coarse funnel events (tutorial complete, Act 1 cleared, loop cleared).
- **Balance telemetry (opt-in, later):** anonymous end-of-duel summaries (deck card IDs, turns, winner)
  posted to a small endpoint. This is the best data source for balancing before Steam.
- **Error reporting:** a lightweight client error logger (e.g. Sentry free tier), with the duel seed +
  action log attached so bugs are reproducible.
- **Browser support:** latest Chrome, Edge, Firefox, Safari; desktop first; tablet playable;
  phones "works, not optimised" until a dedicated layout exists.

## 5. Legal/housekeeping checklist
- A privacy page (what is stored locally, what analytics collect, what Ko-fi handles).
- Credits page (fonts OFL, libraries, AI-art disclosure, supporters).
- No Yu-Gi-Oh/Konami (or any other franchise) names, card frames, terms of art or logos anywhere.
- Trademark-search "Shattered Rifts" before spending money on branding; it's a working title.
