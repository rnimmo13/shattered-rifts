// @sr/pvp: the rules of a PvP match, deck checks and the matchmaking queue. Pure, like the engine.

export * from './protocol';
export * from './trophies';
export * from './ranks';
export * from './seasons';
export * from './replays';
export {
  checkEntry,
  checkArenaEntry,
  checkArenaDecks,
  cleanName,
  isProfane,
  MAX_BOONS,
  MAX_DECK,
  MAX_NAME,
  type Checked,
  type Rejected,
} from './deck';
export { enqueue, leave, pairUp, type Pairing, type Waiting } from './queue';
export { decideOrder, seatsFor, type Arrival, type Order } from './order';
export { newSeries, scoreGame, seriesFor, seriesWinner, type SeriesState } from './series';
export {
  BOARD_KEEP_DAYS,
  BOARD_SIZE,
  GHOST_FRESH_DAYS,
  GHOST_WINS_PER_DAY,
  pickGhost,
  ghostCleared,
  pickGhostBoss,
  GHOST_BOSS_EXCLUDE_MAX,
  GHOST_BOSS_TIERS_BELOW,
  rankGhosts,
  rankVsGhosts,
  standingsPvp,
  standingsRuns,
  standingsVsGhosts,
  withoutPlayer,
  type GhostDeck,
  type GhostGame,
  type GhostStanding,
  IP_NEW_RUNS_PER_DAY,
  IP_REPORTS_PER_HOUR,
  NEW_RUNS_PER_DAY,
  RUN_MAX_TIER,
  RUN_MIN_STAGE_MS,
  RUN_REPORTS_PER_HOUR,
  RUN_START_GRACE,
  RUN_STEP_ALLOWANCE,
  SAME_FOE_PER_DAY,
  WINS_PER_DAY,
  believableStages,
  checkUsername,
  civilMonth,
  cleanBoardName,
  isHero,
  storedHero,
  LEGACY_HERO_IDS,
  periodEnd,
  periodStart,
  rankPvp,
  rankRuns,
  stagesInAll,
  type Period,
  type PvpRow,
  type PvpStanding,
  type RunRow,
  type RunStanding,
} from './board';
export { Match, other, setupFor, type Accepted, type Outcome, type Refused } from './match';
export {
  bankInto,
  runOf,
  runKey,
  oneEach,
  RUN_PREFIX,
  cleanDeck,
  cleanVault,
  dropFrom,
  mergeVaults,
  normaliseCode,
  safeId,
  showCode,
  VAULT_CODE_ALPHABET,
  VAULT_CODE_LENGTH,
  VAULT_SLOTS,
  type Banked,
  type VaultDeck,
} from './vault';
export { deckToPlay, picksDone } from './picks';
export * from './runsync';
