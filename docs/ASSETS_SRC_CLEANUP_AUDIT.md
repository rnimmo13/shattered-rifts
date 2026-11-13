# assets-src cleanup audit

A first pass over `assets-src`, 2026-11-13, to find files that are no longer used. Read-only: nothing was moved or
deleted. Sizes are from folder listings and are approximate.

## Read this first

- **`assets-src` is not in git** (`.gitignore` excludes it, because of purchased packs). A deleted file here cannot be
  restored with git. Cleanup must MOVE files to a holding folder outside the repo, never delete them outright.
- **"Unused" here means:** no pack script, pipeline script or game file reads it, and it is superseded by something
  newer. Source art that the game's files were cut from is still "used", even though the game never loads it directly.
- **This audit is incomplete.** `cards` (over 2 GB) and `units-pose-sheets` (about 1.1 GB) were only partly listed, and
  references were checked from the project notes and the scripts I read, not by searching every file. The agent doing
  the cleanup must search for references before moving anything in tier B.

## Tier A: superseded, safe to move (about 250 MB)

| Folder | Size | Why |
|---|---|---|
| `archive\gritty-v1` | 39 MB | `assets-src\README.txt` says: superseded, safe to delete |
| `heroes-3d-sprites` | about 110 MB | The 3D-rendered-to-sprites trial on the Knight, abandoned. Blender files, 70+ rendered frames, work-in-progress renders |
| `heroes\sun-knight`, `heroes\sun-knight-3d`, `heroes\sun-knight-hd`, `heroes\sun-knight-tripo` | about 70 MB | Four rounds of the 3D Knight (Blender and GLB files, rig scripts, previews), all abandoned |
| `heroes\sun-knight-2d`, `heroes\rogue-2d` | about 30 MB | The first two skeletal-rig tests. The same rigs were rebuilt in `heroes-2d-animated` |
| `heroes-pose-sheets\_pipeline\__pycache__` | tiny | Python cache, regenerated on its own |

**Done 2026-11-13:** all nine rows moved to `D:\Code\ShatteredRifts-attic\assets-src\<same path>` (243 MB); the
emptied `archive` folder was removed. Nothing in the repo read them. The only mentions left are history (DECISIONS
#680/#681, CLASS_REWORK_ART.md) and the "Copied from" header of the committed rig scripts in `apps\web\src\art\hero2d`:
`sync-hero-rigs.mjs` now finds no `heroes\*-2d` folder and leaves those committed copies as they are. To edit the
Knight's or Rogue's rig runtime again, put `sun-knight-2d` / `rogue-2d` back from the attic first.

## Tier B: probably unused, check references first (about 1.1 GB)

| Folder | Size | Why, and what to check |
|---|---|---|
| `heroes-pose-sheets\<hero>\out` | 504 MB | Pipeline output from the first, low-resolution sheets. The game appears to be packed from `out-hd`, but `pack_for_game.py` still defaults to `--src out`: confirm which each hero and skin was packed from |
| `heroes-pose-sheets\<hero>\rig2` and `rig` | 141 MB | The Blender rig trial inside the Knight's folder. Not part of the pose-sheet route |
| `cards\_review` | 120 MB | Looks like review sheets, not sources. Confirm no pack script reads it |
| `heroes-pose-sheets\<hero>\<hero>_attack1.png` and the other first-pass sheets (no `_hd_` in the name) | 99 MB | Replaced by the `_hd_` sheets. Keep every `_PROMPT.txt`: `make_hd_prompts.py` reads them. Keep the Demon Knight's `attack-poses.png` and `reaction-poses.png`: his live skin is built from them |
| `heroes-2d-animated` | about 60 MB | Skeletal rigs for all ten heroes. `HERO_RIGS` is empty, so the game uses none, but the project notes say the rigs are kept "for a better pass". Robert's call |
| `heroes-pose-sheets\<hero>\out-smooth` | 54 MB | The Knight smoothing trial |
| `heroes-pose-sheets\<hero>\review` and `_review_hd` | 61 MB | Review renders and videos from processing. Useful only while a hero is being checked |
| `tripo-references` | 18 MB | A-pose references for the Tripo 3D route, abandoned |
| `animations\combat-motion-v1` | under 1 MB | An early effects experiment. Check whether `fx` replaced it |

## The 20 old still-picture skins: remove (Robert, 2026-11-13)

Robert wants the old static skins gone: the gender swaps and the first themed set (Sunwarden, Moonlit Regent, Admiral
Ale, Frostbound Warden and the rest). Only skins with an animated model stay.

This is more than moving files, because the game still knows about them:

| Where | What |
|---|---|
| `assets-src\heroes\skins` | 20 source pictures and `skin-manifest.json`, about 45 MB. Move to the attic |
| `apps\web\public\art` | The packed copies the game ships. Find and remove them, and their entries in `manifest.json` |
| `SKINS` in `@sr/content` | Their definitions. Remove all but the animated ones |
| `tools\pack-heroes.ps1`, `apps\web\src\art\skins.ts` and their tests | Anything that names a removed skin or the `gender-` naming rule |
| Players' saved cosmetics and the Vault | Some players own these skins. See the warning below |

**Warning: players who own them.** The project notes say never to empty `SKINS`, because `cleanCosmetics` then drops
owned skins from every player and the Vault keeps the loss. Removing 20 of the 24 does the same thing to those 20. The
skins were free, so nobody loses money, but the Steam plan promises players never lose a cosmetic (DECISIONS #737). Pick
one before removing them:

**Chosen 2026-11-13: option 1** (Robert: they were free and only his friends own them). On hold until the session adding
new animated skins (Gothic Puppeteer and more) has committed its work in `cosmetics.ts`, `manifest.json`, `heroRigs.ts`
and `assets-src\heroes\skins`. The full list of places to change was made and is easy to redo with a search for the ids.

1. **Drop them for good.** Simplest. Owners lose a free skin they can no longer see anyway.
2. **Keep the ownership records, remove the art.** `cleanCosmetics` keeps unknown-but-retired ids, so if a skin ever
   returns with an animated model its owners still have it.

## Keep

| Folder | Why |
|---|---|
| `heroes\*.png`, `heroes\_source` | The ten base hero paintings and their originals; the style anchor |
| `heroes\2d-animated\default` | The Luma clips behind the beta "2D animated models" setting |
| `heroes-pose-sheets\<hero>\*_hd_*.png`, `out-hd`, every prompt, `.json` and reference | The current animation source |
| `heroes-pose-sheets\<skin id>` folders and `_pipeline` | Skin prompts, references and the scripts |
| `cards` (other than `_review`), `arenas`, `events`, `fx`, `icons`, `lore`, `maps`, `minions`, `enemies`, `backgrounds`, `weapons`, `music`, `victory` | Source art cut by the `tools\pack-*.ps1` scripts |
| `fx-magic-effects` and any other purchased pack | Licensed packs; keep with their license files |

## Not yet audited

`cards` (beyond its top level), `units-pose-sheets`, `fx`, `arenas`, `events`, `enemies`, `icons`. `units-pose-sheets`
very likely has the same `out`, `review` and first-pass leftovers as the heroes.

## Prompt for the agent doing the cleanup

```
Read docs\ASSETS_SRC_CLEANUP_AUDIT.md. Clean up assets-src following it.

Rules:
- assets-src is NOT in git. Never delete. MOVE files to D:\Code\ShatteredRifts-attic\<same relative path>, so they
  can be put back.
- Before moving anything, search the whole repo (tools, apps, packages, docs, every .ps1, .py, .ts, .json and .md)
  for references to that folder or file. If anything reads it, leave it and tell me.
- Do tier A first. Then run the pack scripts and the build and tests to confirm nothing broke. Stop and show me what
  moved and how much space it freed.
- Tier B only after I say so, one row at a time, with the same reference search and the same checks.
- Then audit the folders listed under "Not yet audited" the same way and add what you find to the document, without
  moving anything.
- Do not touch anything under "Keep". Do not touch apps\web\public, except for the old still skins below.
```

### Prompt for removing the old still skins

```
Read the section "The 20 old still-picture skins" in docs\ASSETS_SRC_CLEANUP_AUDIT.md.

Remove the 20 old static skins from the game, keeping the four animated ones (Demon Knight, Nova Ronin, Arc Welder,
Rogue Tailor). Use option [1 or 2] for players who own them.

First list every place they appear (content definitions, packed art, manifest, pack scripts, tests, docs) and show me
the list. Then make the change, move the source pictures from assets-src\heroes\skins to the attic, and run the
tests and the build. Do not push or deploy until I approve.
```
