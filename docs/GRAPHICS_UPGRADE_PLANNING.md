# Graphics upgrade planning

Started: 2026-11-01. Owner: Robert.

Living checklist for upgrading Shattered Rifts' characters and effects while preserving a path to Steam and the Apple App Store. This is planning guidance, not a decision to change engine, renderer, monetisation, or release platforms. Apple planning below assumes iPhone/iPad; a Mac App Store release needs its own packaging checks.

## Goals and working preferences

- Keep the current web game and shared gameplay code wherever practical.
- Robert wants to download assets into the repository and have AI handle inspection, code integration, and animation wiring, without manually operating Blender or other art software.
- Prefer assets that already work in portable runtime formats. AI assistance does not remove requirements for compatible files, platform build tools, developer accounts, signing, or device testing.
- Preserve the game's original identity and a consistent style across characters, cards, icons, backgrounds, and effects.
- Prove one character works before buying a roster or changing the whole battle renderer.

## 1. Before acquiring an asset

- [ ] Save the listing URL, publisher, product/version, purchase receipt, and applicable licence terms.
- [ ] Confirm commercial use and distribution inside games on web, Steam, and Apple platforms. Check the actual listing licence; do not assume every Fab asset has identical terms.
- [ ] Check restrictions on source redistribution. Keep licensed source assets out of a public repository unless their terms permit it; a private source repository can hold them where permitted. Distribute assets only as allowed within the finished game.
- [ ] Confirm downloadable source files are included rather than reference-only access.
- [ ] Inspect the actual file formats, not just screenshots or an “animated” label.
- [ ] Confirm the required animations are included. A rigged model has a skeleton but may have no usable action clips.
- [ ] Check dependencies, skeleton compatibility, materials, textures, and any required plugins or runtimes.
- [ ] Check style, silhouette, facing direction, weapons, proportions, and readability at battlefield size.

| Asset format | Fit for the intended workflow | What to verify |
|---|---|---|
| Animated GLB/glTF | Candidate for live 3D characters in the web renderer | Animation clips, supported materials/extensions, textures, scale, file size, and mobile performance |
| PNG/WebP sprite sheets with animation metadata | Candidate for animated 2D characters | Frame rectangles, clip names, timing, transparency, pivot points, atlas dimensions, and compression support |
| Other 2D skeletal animation formats | Possible after checking the player/runtime | Runtime licence, supported export version, browser/iOS compatibility, and integration effort |
| FBX or Blender source only | Usually requires conversion before use in this web client | Whether conversion can be automated reliably; prefer a ready-to-use alternative for Robert's workflow |
| Unreal-only packages, Blueprints, or Niagara systems | Not directly usable by the current web client | Whether a portable export exists; otherwise conversion or a larger architecture change is required |

Fab's Standard License permits commercial projects and use outside Unreal Engine. Some listings may use other or legacy terms. Format availability and licence rights are separate checks.

## 2. First-character proof of concept

- [ ] Choose one representative character and record the listing in the asset register below.
- [ ] Inspect downloaded files and establish whether additional tools or conversion are needed before promising integration.
- [ ] Decide between animated 2D and live 3D through a small prototype; no full renderer replacement is approved by this document.
- [ ] Map available clips to idle, attack, hit, block, cast, and death. Define fallbacks for missing clips.
- [ ] Fix facing direction, scale, floor position, animation blending/timing, and weapon attachments.
- [ ] Trigger visuals from resolved combat events. Preserve the pure deterministic engine; rendering must not decide rules or block gameplay.
- [ ] Fit the character into existing combat layout, selection/highlight behaviour, health bars, and effects.
- [ ] Test multiple characters together, including repeated spawns and scene transitions.
- [ ] Have Robert review the result beside existing artwork before expanding the set.

## 3. Performance and player experience

- [ ] Identify minimum desktop and iPhone/iPad test devices before setting budgets.
- [ ] Set measured budgets for frame rate, peak memory, download size, texture resolution, and simultaneous characters/effects. Do not invent targets before the prototype is measured.
- [ ] Check initial loading, asset caching, failed loads, and missing-asset fallbacks.
- [ ] Check mobile heat and battery use during a full run, not just a short animation preview.
- [ ] Test transparency, texture compression, shaders, and animation playback in each target runtime.
- [ ] Provide reduced effects or animation settings if needed; retain clear combat feedback.
- [ ] Make cards and tooltips readable with touch input; avoid hover-only interactions.
- [ ] Test safe areas, supported orientations, small screens, audio interruption, background/resume, and save recovery.
- [ ] Preserve offline campaign play where planned; keep graphics loading independent of online Arena services.

## 4. Steam planning

The existing Steam plan is in [12_STEAM_READINESS.md](12_STEAM_READINESS.md). Keep its packaging and platform decisions authoritative rather than creating a conflicting plan here.

- [ ] Validate upgraded graphics inside the chosen desktop shell, including packaged local assets, fullscreen/windowed modes, and supported resolutions.
- [ ] Check Steam Deck performance and controls if it becomes a supported target.
- [ ] Keep source/licence records for purchased assets and provenance for generated artwork.
- [ ] Complete Steam's Content Survey accurately for shipped AI-generated content. Using AI to wire up purchased assets does not by itself make those assets AI-generated; evaluate the actual content and current survey wording.
- [ ] Keep game updates, save compatibility, offline behaviour, and any Steam integrations consistent with the existing readiness document.

## 5. Apple App Store planning

- [ ] Choose iPhone, iPad, and minimum OS/device targets. A Mac App Store version is a separate decision.
- [ ] Evaluate an iOS wrapper/runtime for the shared web client, including live 3D support if selected.
- [ ] Arrange macOS/Xcode build access, locally or through an appropriate cloud build service, plus signing and provisioning. Robert does not need to operate art software, but Apple build tooling is still required.
- [ ] Test on real devices and through TestFlight before release.
- [ ] Deliver a polished game experience. Apple's minimum-functionality rules require more than a repackaged website; web technology itself is not a blanket prohibition.
- [ ] Review paid downloads, digital unlocks, supporter benefits, account linking, and restore-purchase behaviour before implementation. Apple generally requires in-app purchase for digital unlocks, with storefront/programme-specific exceptions. Do not assume web Ko-fi/supporter codes can be reused unchanged.
- [ ] Review privacy disclosures, SDK data collection, permissions, age ratings, and account deletion where applicable.
- [ ] Recheck Apple's current review and distribution rules before submission; approval is not guaranteed by the choice of renderer or wrapper.

## 6. Asset register

Add a row before purchasing or integrating each pack. “Candidate” is not approval to buy.

| Asset / listing | Publisher and version | Licence / receipt location | Runtime format | Included clips | Size / dependencies | Status / notes |
|---|---|---|---|---|---|---|
| First character: to select | — | — | — | — | — | Candidate; no purchase or renderer decision yet |

## 7. Open decisions and progress

| Date | Question or milestone | Status / decision |
|---|---|---|
| 2026-11-01 | Upgrade animation without Robert manually using Blender or other art tools | Working preference: portable ready-to-use assets with AI-assisted integration |
| 2026-11-01 | Animated 2D sprites or live 3D models? | Open; evaluate using one character |
| 2026-11-01 | Which Fab asset pack fits the game? | Open; inspect a listing and files before buying a roster |
| 2026-11-01 | Steam and Apple App Store | Future targets under consideration; this document does not commit to release scope |
| 2026-11-01 | Minimum devices and graphics budgets | Open; measure the prototype |

Record approved architecture/design changes in [DECISIONS.md](DECISIONS.md). Changes to economy, monetisation, or core rules still need Robert's sign-off under the project guide.

## References

Policy sources last checked during planning on 2026-11-01. Recheck before purchasing or submitting a release.

- [Fab Standard License](https://www.fab.com/eula)
- [Fab licences and pricing](https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab)
- [Fab supported asset formats](https://dev.epicgames.com/documentation/fab/asset-file-format-and-structure-requirements-in-fab)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Developer Program](https://developer.apple.com/programs/whats-included/)
- [Capacitor environment setup: iOS build requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Steam Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)
- Project context: [05_ART_PIPELINE.md](05_ART_PIPELINE.md), [04_VISUALS_AND_ANIMATION.md](04_VISUALS_AND_ANIMATION.md), and [12_STEAM_READINESS.md](12_STEAM_READINESS.md).
