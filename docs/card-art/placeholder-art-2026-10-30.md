# Placeholder card art (2026-10-30)

The 59 cards that had no art (they showed the fallback painting) now use **borrowed art of cards that are no longer in the game**.
It is a stopgap: **every card below needs its own illustration in the next batch of card art updates.** Machine-readable list:
`docs/card-art/placeholders.json` (card, borrowed source, why).

How it was done: the borrowed picture was copied to `apps/web/public/art/cards/<card id>.jpg` and the manifest rebuilt with
`tools/pack-manifest.ps1`. Nothing was added to `assets-src/cards/individual/`, so the next `pack-cards.ps1` run keeps the placeholders until a real
`<card id>.png` is placed there; that file then overrides the placeholder (the packer writes the same jpg name).

To replace one: generate `assets-src/cards/individual/<card id>.png` (same brief as the other cards, hero reference in `assets-src/heroes/<heroId>.png`),
run `powershell -File tools/pack-cards.ps1`, then remove the card from `placeholders.json` and from this list.

Things to know:
- **Gilded Bulwark** shows the old Knight (a blonde woman) in the corner. The other Knight placeholders are a shield, a wreath, a heart, an altar or a sun,
  or the current helmeted Knight (Vow Fulfilled, Patient Wall, Measured Strike, Cast the Shield).
- The Shaman and status placeholders show the current Shaman model, but the subject is only loosely related to the card.
- Several pictures are used on two cards at once (the placeholder and the retired card it came from, which is out of the game).

### Knight (13)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Vow Fulfilled (`vow-fulfilled`) | `exec-40cfc942` (assets-src/cards/individual) | sword slamming the ground, golden shockwave (current Knight model) |
| Patient Wall (`patient-wall`) | `exec-362a068a` (assets-src/cards/individual) | the Knight resting (current Knight model) |
| Measured Strike (`measured-strike`) | `exec-f7e79926` (assets-src/cards/individual) | a spinning slash (current Knight model) |
| Cast the Shield (`cast-the-shield`) | `exec-06900b74` (assets-src/cards/individual) | hurling stone and cards (current Knight model) |
| Brace and Press (`brace-and-press`) | `plate-discipline` | a shield dome (added when the basic was made) |
| Stand Fast (`stand-fast`) | `tower-shield` | a tall shield |
| Unyielding Line (`unyielding-line`) | `rampart` | a line of shields |
| Gilded Bulwark (`gilded-bulwark`) | `gilded-wall` | gilded barrier panels |
| Vow Kept (`vow-kept`) | `sacred-vow` | an altar of vows |
| Blood Oath (`blood-oath`) | `the-last-oath` | a sword on an altar, bound in thorns |
| Oath Unbroken (`oath-unbroken`) | `radiant-oath` | a sun in thorns |
| Hardened Scars (`hardened-scars`) | `briar-heart` | a heart wrapped in thorns |
| Scarred Hide (`scarred-hide`) | `thorn-covenant` | a wreath of thorns |

### Shaman (32)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Dawn Ward (`dawn-ward`) | `crystal-ward` | a dome of crystals |
| Hail Chant (`hail-chant`) | `cold-snap` | frost bears |
| Consuming Dusk (`consuming-dusk`) | `gathering-dusk` | the Shaman with his spirits at dusk |
| Storm Chant (`storm-chant`) | `storm-call` | lightning and spirit animals |
| Blighted Chorus (`blighted-chorus`) | `splinter-wheel` | a wheel of splinters |
| Swift Strike (`swift-strike`) | `gale-strike` | a fast gale strike |
| Shattering Call (`shattering-call`) | `skybreaker` | a spirit bird breaking through |
| Thunder Rush (`thunder-rush`) | `arc-lightning` | a Thunderbird in lightning |
| Spark Strike (`spark-strike`) | `spark-lash` | a Thunderbird and sparks |
| Thunder Beam (`thunder-beam`) | `falling-star` | spirit birds raining down |
| Swift Study (`swift-study`) | `river-scour` | cards swirling |
| Thunder Chant (`thunder-chant`) | `storm-pole` | the Shaman raising his staff |
| Hurried Prayer (`hurried-prayer`) | `smoke-offering` | an offering bowl |
| Harmonize (`harmonize`) | `elemental-focus` | meditating among three spirits |
| Double Rite (`double-rite`) | `inner-flame` | glowing orbs in his hands |
| Burnt Offering (`burnt-offering`) | `feed-the-fire` | cards fed to a fire |
| Echoing Spirit (`echoing-spirit`) | `spirit-memory` | a glowing card and spirit swirl |
| Hawk Banner (`hawk-banner`) | `night-veil` | a spirit bird in flight |
| Wellspring (`wellspring`) | `clear-spring` | a spring |
| Doubled Vow (`doubled-vow`) | `kindled-rite` | a shrine with spirit animals |
| Free Hand (`free-hand`) | `shifting-strike` | quick strikes |
| Chain of Calls (`chain-of-calls`) | `wild-call` | the Shaman calling a totem |
| Salvage Spirit (`salvage-spirit`) | `carve-a-notch` | carving a totem |
| Snap Back (`snap-back`) | `gust-step` | a gust that returns |
| Bitter Lesson (`bitter-lesson`) | `prismatic-cascade` | a cascade of strikes |
| Turning Wheel (`turning-wheel`) | `whirlpool` | a whirl |
| Ward of the Spirits (`ward-of-the-spirits`) | `ironbark` | the Shaman in a spirit dome |
| Wild Vision (`wild-vision`) | `tidal-surge` | holding a glowing orb |
| Kindling Ward (`kindling-ward`) | `gather-kindling` | a pile of kindling |
| Fresh Start (`fresh-start`) | `rapids` | water rushing |
| Thunder Memory (`thunder-memory`) | `stormcrown` | a Thunderbird totem |
| Harvest of Ruin (`harvest-of-ruin`) | `boulder-fist` | smashed rubble |

### Status cards (11)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Rubble (`rubble`) | `earthen-might` | stones |
| Haze (`haze`) | `deep-freeze` | a cold mist |
| Scorch (`scorch`) | `ember-toss` | embers |
| Muck (`muck`) | `mudslide` | mud and stone |
| Void (`void-drain`) | `spiritfont` | a draining shrine |
| Blight (`blight`) | `firestorm` | a withering burst |
| Venom (`venom`) | `arc-flash` | a shard of ice |
| Smudge (`smudge`) | `kindling` | a small flame |
| Scrap (`scrap`) | `wild-heart` | broken totem pieces |
| Tinder (`tinder`) | `kindle` (assets-src/cards/individual) | a flame from the hand (retired Kindle) |
| Dry Tinder (`dry-tinder`) | `flare` (assets-src/cards/individual) | a flare of fire (retired Flare) |

### Drunkard (3)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Bar Fight (`bar-fight`) | `steady-hands` | a dwarf with a shotgun |
| Nurse the Hangover (`nurse-the-hangover`) | `spare-change` | a mug, bottles and coins |
| Take It on the Chin (`take-it-on-the-chin`) | `stained-glass` | a glass shield |

### Starting-deck basics added 2026-10-30 (5)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Press the Attack (`press-the-attack`) | `sure-footing` | boots stepping forward |
| Heavy Swing (`heavy-swing`) | `colossus-blow` | a huge swing (shows the old Knight) |
| Fang and Claw (`fang-and-claw`) | `venom-fang` | a gloved hand with a fang |
| Pocket Blades (`pocket-blades`) | `gather-the-blades` | blades and cards from a pouch |
| Mindful Palm (`mindful-palm`) | `still-pool` | a still lotus pool |

### Engineer, Trickster and Necromancer basics (3)

| Card | Borrowed art | Why it fits |
|---|---|---|
| Spot Weld (`spot-weld`) | `overtime` | Rivet sending drones forward |
| Pinprick Trap (`pinprick-trap`) | `death-trap` | a spiked trap |
| Marked for the Grave (`marked-for-the-grave`) | `deathknell` | a chained undead under a mark |
