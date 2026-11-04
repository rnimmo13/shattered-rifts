// Functional local-server check: account claims and socket admission only. No simulated battles.
import { strict as assert } from 'node:assert';
import { randomInt } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { RIFTWALKERS } from '@sr/content/v2';
import { RULES_VERSION, VAULT_CODE_ALPHABET, VAULT_CODE_LENGTH } from '@sr/pvp';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8792');
if (!['127.0.0.1', 'localhost'].includes(base.hostname))
  throw new Error('This probe is restricted to a local test server.');
const code = Array.from(
  { length: VAULT_CODE_LENGTH },
  () => VAULT_CODE_ALPHABET[randomInt(VAULT_CODE_ALPHABET.length)],
).join('');
async function post(path: string, body: object, token = '') {
  const response = await fetch(new URL(path, base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sr-play-token': token },
    body: JSON.stringify({ code, ...body }),
  });
  return { status: response.status, data: (await response.json()) as Record<string, unknown> };
}
const sockets: WebSocket[] = [];
async function connect(room: string, token: string) {
  const url = new URL(`/pvp/room/${room}`, base);
  url.protocol = 'ws:';
  url.search = new URLSearchParams({ code, play: token }).toString();
  const ws = new WebSocket(url);
  sockets.push(ws);
  const messages: { type?: string; message?: string }[] = [];
  ws.addEventListener('message', (event) => {
    messages.push(JSON.parse(String(event.data)) as (typeof messages)[number]);
  });
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', () => reject(new Error('Socket admission failed')));
  });
  return { ws, messages };
}
async function waitFor(messages: { type?: string; message?: string }[], type: string) {
  for (let i = 0; i < 100; i++) {
    const message = messages.find((x) => x.type === type);
    if (message) return message;
    await delay(50);
  }
  throw new Error(`Expected ${type}; got ${JSON.stringify(messages)}`);
}
let currentToken = '';
try {
  const claim = await post('/pvp/play/claim', { holder: 'test-desktop' });
  assert.equal(claim.status, 200);
  assert.equal(typeof claim.data.token, 'string');
  currentToken = claim.data.token as string;
  assert.equal((await post('/pvp/play/claim', { holder: 'test-mobile' })).status, 409);
  assert.equal((await post('/pvp/vault/list', {})).status, 200);
  assert.equal(
    (await post('/pvp/vault/runsave', { runs: [], revision: 0, replays: {} })).status,
    409,
  );
  const saved = await post('/pvp/vault/runsave', { runs: [], revision: 0, replays: { 'sr.fightlog:probe': '{"seed":"probe","moves":[]}' } }, currentToken);
  assert.equal(saved.status, 200); assert.equal(saved.data.revision, 1);
  assert.equal((await post('/pvp/vault/runsave', { runs: [], revision: 0, replays: {} }, currentToken)).status, 409);
  const room = `SR${randomInt(100000, 999999)}`;
  const first = await connect(room, currentToken);
  const join = {
    type: 'join',
    rules: RULES_VERSION,
    playerId: 'client-chosen-id',
    decks: [
      {
        name: 'Protocol Test',
        hero: 'knight',
        tier: 4,
        deck: [
          ...RIFTWALKERS.knight.starter,
          'alarm-bell',
          'catch-breath',
          'glimpse-ahead',
          'haft-strike',
          'heave',
        ],
        boons: [],
      },
    ],
  };
  first.ws.send(JSON.stringify(join));
  await waitFor(first.messages, 'waiting');
  const oldToken = currentToken;
  await post('/pvp/play/release', {}, currentToken);
  const second = await post('/pvp/play/claim', { holder: 'test-mobile' });
  assert.equal(second.status, 200);
  currentToken = second.data.token as string;
  first.ws.send(JSON.stringify({ type: 'resign' }));
  assert.ok(
    (await waitFor(first.messages, 'error')).message?.includes('Gameplay is active elsewhere'),
  );
  assert.equal((await post('/pvp/play/renew', {}, oldToken)).status, 409);
  const resumed = await connect(room, currentToken);
  resumed.ws.send(JSON.stringify({ ...join, playerId: 'different-device-id' }));
  // The new device resumes the same account's seat; it must not become its own opponent.
  await waitFor(resumed.messages, 'waiting');
  assert.equal(
    resumed.messages.some((m) => m.type === 'choose'),
    false,
  );
  console.log(
    'PASS: second-device exclusion, read-only browsing, fenced saves, Arena admission, stale socket rejection, account-based reconnect.',
  );
} finally {
  for (const ws of sockets) ws.close();
  if (currentToken) await post('/pvp/play/release', {}, currentToken);
}
