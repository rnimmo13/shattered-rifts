// @sr/pvp: the rules of a PvP match, deck checks and the matchmaking queue. Pure, like the engine.

export * from './protocol';
export { checkEntry, cleanName, MAX_DECK, MAX_NAME, type Checked, type Rejected } from './deck';
export { enqueue, leave, pairUp, type Pairing, type Waiting } from './queue';
export { decideOrder, seatsFor, type Arrival, type Order } from './order';
export { Match, other, setupFor, type Accepted, type Outcome, type Refused } from './match';
export {
  bankInto,
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
