import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(
  new URL('../../../docs/balance-history/simulations/0.199.0/', import.meta.url),
);
const decks = JSON.parse(readFileSync(dir + 'decks.json'));
const golem = decks.arena.optimized.find((d) => d.id === 'engineer:golemancer');
golem.deck = golem.deck.map((id) => (id === 'static-field+' ? 'bulwark-frame+' : id));
golem.selectedVariant = 'posthoc-bulwark-substitution';
writeFileSync(dir + 'golem-probe-decks.json', JSON.stringify(decks, null, 2) + '\n');
