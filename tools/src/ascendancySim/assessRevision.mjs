import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../docs/balance-history/', import.meta.url));
const prior = JSON.parse(readFileSync(root + '0.198.0.json'));
const summary = JSON.parse(readFileSync(root + 'simulations/0.199.0/summary.json'));
const changed = {
  'knight:marshal':
    'Blood Oath is limited across copies; Marshal receives steady Reserves and cheaper Measured Conviction. The resource loop is removed while a sustained plan remains.',
  'engineer:artillerist':
    'Own-turn Might and first-Attack protection doubled. Shared setup protection is cheaper; personal-weapon identity remains.',
  'engineer:golemancer':
    'Earned machine HP now supplies capped passive hero protection; Bulwark Frame protects the hero too. Full HP growth, companion damage-per-HP and recovery remain.',
  'engineer:swarmwright':
    'Successful own-turn summons provide up to nine Barrier per turn, supporting rebuilding; Fabrication and the fourth slot remain.',
  'hunter:beastmaster':
    'Steady Might feeds the existing companion-sharing identity. Pack protection is cheaper and Pack Tactics shields more.',
  'hunter:reaver':
    'First self-payment grants four Barrier alongside the existing draw/Primed. Shared pack protection improved.',
  'shaman:spiritwalker':
    'First ordered own-turn command earns Spirit; displacement alone does not. Command investment remains distinct from Totemist cultivation.',
  'spellblade:blademaster':
    'First Sword each turn gives four Barrier; existing draw and per-hit bonus remain.',
  'spellblade:archmage':
    'Two additional Power each own turn supplies paid spell cycling without changing the first-spell damage/refund rule.',
  'necromancer:soulreaper':
    'Restless Spirits has three full scaling triggers per Aura/own turn, then a reduced payoff; Harvest and Reap stay intact.',
  'necromancer:bonelord':
    'The Drowned King+ now costs one Mana; HP conversion and companion growth remain. Requires checking throughput and the opportunity to answer commands.',
  'assassin:bloodletter':
    'Bloodburst now costs two Mana, slowing repeated immediate ticks without altering the Bleed identity.',
};
const ratings = prior.ratings.map((p) => {
  const r = summary.rows.find((r) => r.id === p.id);
  const ao = r.arena_optimized.pct,
    ag = r.arena_good.pct,
    bo = r.boss_optimized.pct,
    bg = r.boss_good.pct;
  // Descriptive warning bands, deliberately not new letter-tier claims.
  const arena =
    Math.max(ao, ag) > 65
      ? 'Upper-outlier signal'
      : Math.min(ao, ag) < 35
        ? 'Lower-outlier signal'
        : 'Competitive candidate';
  const boss =
    bo === 0
      ? 'No demonstrated clear'
      : bo < 20
        ? 'Very fragile'
        : bg < 20
          ? 'Refinement dependent'
          : bo > 90
            ? 'Difficulty review'
            : 'Viable candidate';
  return {
    ...p,
    previousArena: p.arena.overall,
    previousProjection: { campaign: p.campaign, arena: p.arena },
    campaign: {
      developing: 'Not retested',
      deep: 'Not retested',
      endgame: boss,
      openingFight: 'Unrated',
      extendedFight: 'Unrated',
    },
    arena: { overall: arena, opening: 'Unrated', extended: 'Unrated', long: 'Not established' },
    pacing:
      'Global final-field pacing is recorded in the simulation summary. Do not infer per-build turn-ten parity from win rates.',
    rationale:
      (changed[p.id] ??
        'No direct passive change; shared-card, opponent-field, boss and recipe changes can alter results.') +
      ` Final Arena tuned/good ${ao.toFixed(1)}%/${ag.toFixed(1)}%; boss ${bo.toFixed(1)}%/${bg.toFixed(1)}%. These are limited bot/deck benchmarks.`,
    scaling: changed[p.id] ?? p.scaling,
    recovery:
      p.recovery +
      (p.id === 'engineer:golemancer'
        ? ' Hero protection now follows a surviving invested machine.'
        : ''),
    watch:
      p.watch +
      ' Recheck revised recipes with human decisions; preserve unresolved fights and deck-quality differences.',
    confidence:
      'Low for human strength. 116 Arena games and 50 boss attempts per quality; warning bands describe this benchmark, not letter grades.',
    evidence: [
      'simulations/0.199.0/RESULTS.md',
      'simulations/0.199.0/METHOD.md',
      '../BALANCE_REVISION_2026-11-05.md',
    ],
    benchmark: r,
  };
});
const result = {
  ...prior,
  date: '2026-11-05',
  version: '0.199.0',
  rules: 82,
  status:
    'Local implementation only; not pushed or deployed. Letter-tier claims withheld pending broader validation.',
  source:
    'Release c644dfc01d74114eb23b87b199155b98c39872a4 plus documented local changes; exact database and outcome hashes in simulations/0.199.0/archive-manifest.json.',
  measuredMatches: 0,
  simulatedMatches: 6480,
  gradeMode: 'review-signals',
  basis:
    'Final bot evaluation and hand-costed revisions. Zero human matches. Current labels are descriptive review signals, not automated letter grades; previous projections are preserved separately in every row. Early/deep campaign bands were not rerun and are marked accordingly. Setup, rare reliance and qualitative scaling retain prior hypotheses unless explicitly revised.',
  starters: prior.starters.map((s) => ({
    ...s,
    grade: 'Not retested',
    previousGrade: s.grade,
    rationale:
      s.rationale +
      ' Prior projection retained; no full starter/campaign acquisition simulation in this revision.',
  })),
  ratings,
  corrections: [
    'The all-A projection was contradicted by the v0.198.0 benchmark and is not reasserted.',
    'Final comparison combines rule and deck changes; frozen candidate-b isolates rule changes separately.',
    'Valerion is an isolated full-health fight with fixed Boons, not a full campaign success rate.',
    'No new early/deep campaign or human letter grades are inferred from boss/Arena bot wins.',
  ],
};
writeFileSync(root + '0.199.0.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  'Saved all 30 assessment rows with prior projections, conditional benchmark signals and explicit untested bands.',
);
