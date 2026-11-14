# Shattered Rifts character art direction

Approved by Robert, 2026-11-13. This is the anchor for **future Riftwalker, skin, companion, dragon, and enemy designs and pose sheets**. Read it before using older prompt batches or style guides. It records art direction; it does not approve a redraw or a release.

## The look

Inked, stylized fantasy with a slightly cartoon feel. Use a confident dark contour, selective interior ink lines, readable shapes, and shaded colour that gives the figure volume. Preserve material differences and a few character-defining details. Keep the figure legible at its actual game size. The result should feel drawn and designed for the same game as the approved anchors below, rather than like a realistic rendering, a soft painting, a flat mascot, or a different animation franchise.

Use the images, not just these words, as the reference. Compare the full figure, face, line weight, shadows, palette, texture, and prop treatment at the same display size before approving a new asset. The original Knight, animated Knight, and Demon Knight are a cohesive range; variation within that range is welcome. Character height and body shape may vary intentionally while line language and finish stay related.

## Visual anchors

Attach the relevant base hero and at least one of these approved style anchors when commissioning or generating a new character. References are for **style and scale** unless the task explicitly asks to reuse a design.

| Role | Reference | Why it is here |
|---|---|---|
| Primary anchor | `assets-src/heroes-pose-sheets/rogue/rogue_reference.png` | Default Rogue is the clearest match for the desired style. |
| Main family | `assets-src/heroes-pose-sheets/knight/knight_reference.png` and `assets-src/heroes-pose-sheets/knight-demon-knight/knight-demon-knight_reference.png` | Original Knight and Demon Knight belong together; compare their animated models in game too. |
| Strong variants | `assets-src/heroes-pose-sheets/spellblade/spellblade_reference.png` and `assets-src/heroes-pose-sheets/spellblade-nova-ronin/spellblade-nova-ronin_reference.png` | Both Spellblades are excellent examples of the range. |
| Supporting anchors | `assets-src/heroes-pose-sheets/engineer/engineer_reference.png`, `assets-src/heroes-pose-sheets/monk/monk_reference.png`, `assets-src/heroes-pose-sheets/monk-tempest-sage/monk-tempest-sage_reference.png` | Animated Engineer and Monk read well, as does Tempest Sage. |
| Approved style trials | `docs/art-references/drunkard-style-trial-approved.png` and `docs/art-references/gorrmaw-style-trial-approved.png` | The restored Drunkard concept and the Gorrmaw redraw show how the anchor language carries to a stout hero with a prop and a large dragon. These are design references, not finished animation assets. |

The source and animation must agree. Compare a new still reference with its in-game idle and action frames; a matching reference alone is insufficient.

## Known drift to correct in future work

- **Necromancer:** base, animated model, and current skin have drifted from the anchors. Reconcile the whole family together when revisited; keep their identity and gameplay silhouettes.
- **Rogue Tailor:** markedly different rendering from default Rogue. Bring its line work, face, shading, and finish toward the default Rogue.
- **Arc Welder:** broadly fits with the Engineer but needs a modest style pass.
- **Drunkard (KP):** the current game art has moved too far from his original concept. His approved design trial restores the short, stout dwarf's scrappy Midden identity and shopping trolley loaded with window panes and glass, as specified in `docs/09_ROSTER.md` and `docs/art-briefs.md`. Preserve his hammer, short gun, and bottle-green/rust cues when making production art.
- **Dragons:** large differences across the group. The approved Gorrmaw trial is the preferred style direction over his current `assets-src/units-pose-sheets/03-wyldmaw/gorrmaw/gorrmaw_reference.png`. Use the same inked fantasy language without forcing dragons into human proportions. Preserve each dragon's own design and moves.
- **Enemies generally:** review against the hero anchors. Improve outlines, form shading, shape design, and finish while preserving each enemy's recognizable design, realm cues, size, and threat level.

These are review priorities, not authorization to replace existing assets now. Avoid solving consistency by making every character the same size, palette, outfit, or silhouette.

## Animation and effects

- Idle should hold a stable, hand-drawn ready pose. Do **not** distort, squash, stretch, or scale the entire body for breathing. If breathing is visible, use restrained, localized changes in shoulders, chest, clothing, hair, or effects; keep the face, feet, hands, weapon length, and silhouette stable. An occasional characterful fidget can carry more motion.
- Drawn key poses should preserve anatomy, costume, weapon dimensions, and line weight throughout motion. Effects can enrich a move but cannot hide a changing prop or off-model pose.
- Effects should support the character's material and magic while remaining readable at game size. Follow the specific approved effect direction for each character.
- Enemy animation effort rises with encounter importance: regular enemies stay simple, Elites need only useful distinctions, Wardens get unique actions tied to their intents, the five First Ruin dragon Wardens get a stronger and varied set, and Drago is the peak. See `docs/ANIMATION_BACKLOG.md` part A for the production brief.

## Brief and approval checklist

1. Identify the base hero/enemy reference, the approved anchor images, and the intended in-game display size before a design is made.
2. Create one full design reference and compare it beside the anchors at equal displayed height. Check contour weight, interior ink, face treatment, shading, colour, material detail, silhouette, and prop scale.
3. Review idle and action frames beside the same anchors at game size. Check stable anatomy and props and a stable idle silhouette.
4. Get design approval before producing its animation sheets when the task uses a staged design/sheet workflow. Record any deliberate style exception with the asset.

## Scope and precedence

This character direction supersedes older hero and enemy prompts where they call for a uniformly bright, flat cartoon look or painterly character rendering. Existing batch prompts and generated files are historical records; when continuing a batch, revise its style wording and references to this guide before making new art. Pose counts, sheet dimensions, backgrounds, naming, and other technical requirements remain in their pipeline documents unless a specific task changes them.

`docs/05_ART_PIPELINE.md` describes **card illustrations**, which use their own painterly format. Backgrounds and UI also have separate production needs. Keep their world, palette, and motifs compatible with these characters without forcing every medium to share the same rendering technique.
