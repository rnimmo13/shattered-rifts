// `pnpm pvpsmoke [ws://host:port]`: plays whole PvP matches against a running server (`pnpm --filter @sr/server dev`).
// Two simulated players each keep their own copy of the match (as the browsers do), play with the greedy bot, and check
// that the server's hash after every move equals their own: a desync would show here. Runs a friend-code match, then a
// queue match, then a rejoin (one player drops and comes back mid-match).

import { chooseAction } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { Match, type ClientMsg, type Entry, type Seat, type ServerMsg } from '@sr/pvp';

const BASE = (process.argv[2] ?? 'ws://127.0.0.1:8787').replace(/\/$/, '');
const entryOf = (hero: HeroId, name: string, tier = 1): Entry => ({
  name,
  hero,
  deck: [...RIFTWALKERS[hero].starter],
  boons: [],
  tier,
});

/** a few random letters, so a room code is never one the server remembers from an earlier run */
const rnd = (): string => Math.random().toString(36).slice(2, 6).toUpperCase();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface Bot {
  name: string;
  id: string;
  ws: WebSocket;
  inbox: ServerMsg[];
  seat: Seat | null;
  match: Match | null;
  ended: ServerMsg | null;
  desync: string | null;
  moves: number;
  /** history still to arrive before it is my turn to think */
  replay: number;
  /** stop playing (to test a rejoin) */
  paused: boolean;
  /** what this player answers when asked who goes first */
  wantsFirst: boolean;
  toss: { random: boolean } | null;
}

function connect(path: string, name: string, id: string, wantsFirst = true): Promise<Bot> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${BASE}${path}`);
    const bot: Bot = {
      name,
      id,
      ws,
      inbox: [],
      seat: null,
      match: null,
      ended: null,
      desync: null,
      moves: 0,
      replay: 0,
      paused: false,
      wantsFirst,
      toss: null,
    };
    ws.addEventListener('open', () => resolve(bot));
    ws.addEventListener('error', () => reject(new Error(`could not connect to ${BASE}${path}`)));
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(String(e.data)) as ServerMsg;
      bot.inbox.push(msg);
      handle(bot, msg);
    });
  });
}

const send = (b: Bot, m: ClientMsg): void => b.ws.send(JSON.stringify(m));

function handle(b: Bot, m: ServerMsg): void {
  if (m.type === 'choose') {
    if (!m.chosen) send(b, { type: 'order', first: b.wantsFirst });
  } else if (m.type === 'start') {
    b.toss = m.toss;
    b.seat = m.seat;
    b.replay = m.replay;
    b.match = new Match(m.seed, m.a, m.b, Date.now());
    pump(b);
  } else if (m.type === 'action' && b.match) {
    const r = b.match.submit(m.seat, m.seq, m.action, Date.now());
    if (!r.ok) b.desync = `seq ${m.seq}: ${r.message}`;
    else if (m.hash && r.hash !== m.hash) b.desync = `seq ${m.seq}: hash ${r.hash} != ${m.hash}`;
    pump(b);
  } else if (m.type === 'end') b.ended = m;
  else if (m.type === 'error') console.log(`  [${b.name}] error: ${m.code} ${m.message}`);
}

/** If it is my turn, play one move with the bot. */
function pump(b: Bot): void {
  const m = b.match;
  if (!m || m.over || b.paused || b.seat !== m.active || m.log.length < b.replay) return;
  const action = chooseAction(COMBAT_DB, m.state);
  b.moves++;
  send(b, { type: 'action', seq: m.log.length + 1, action });
}

async function until(cond: () => boolean, what: string, ms = 60_000): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(20);
  }
}

async function playRoom(code: string, label: string, rejoin = false): Promise<void> {
  console.log(`${label}: room ${code}`);
  const a = await connect(`/pvp/room/${code}`, 'Ann', 'player-ann');
  send(a, { type: 'join', playerId: a.id, entry: entryOf('maren', 'Ann') });
  await until(() => a.inbox.some((m) => m.type === 'waiting'), 'the waiting message');
  const b = await connect(`/pvp/room/${code}`, 'Bob', 'player-bob');
  send(b, { type: 'join', playerId: b.id, entry: entryOf('kesh', 'Bob') });
  await until(() => a.match !== null && b.match !== null, 'both starts');
  if (a.toss?.random !== true) throw new Error('both wanted first: the coin should have decided');
  console.log(`  both wanted to go first: the coin made Ann seat ${a.seat}, Bob seat ${b.seat}`);
  if (rejoin) {
    await until(() => (a.match?.log.length ?? 0) >= 4, 'a few moves');
    a.paused = true;
    a.ws.close();
    await sleep(300);
    const again = await connect(`/pvp/room/${code}`, 'Ann', a.id);
    send(again, { type: 'join', playerId: again.id, entry: entryOf('maren', 'Ann') });
    await until(() => again.match !== null, 'the rejoin');
    // the rejoined player replays every move so far, then plays on
    await until(() => again.ended !== null || b.ended !== null, 'the end after a rejoin');
    if (again.desync || b.desync) throw new Error(`desync: ${again.desync ?? b.desync}`);
    console.log(
      `  ok: finished after a rejoin (${b.match?.log.length} moves), winner ${String(b.match?.over?.winner)}`,
    );
    again.ws.close();
    b.ws.close();
    return;
  }
  await until(() => a.ended !== null && b.ended !== null, 'the end');
  if (a.desync || b.desync) throw new Error(`desync: ${a.desync ?? b.desync}`);
  if (a.match?.log.length !== b.match?.log.length)
    throw new Error('the two copies have different lengths');
  console.log(
    `  ok: ${a.match?.log.length} moves, winner ${JSON.stringify(a.ended && a.ended.type === 'end' ? a.ended.winner : null)}, hashes agreed`,
  );
  a.ws.close();
  b.ws.close();
}

async function playQueue(): Promise<void> {
  console.log('queue:');
  const a = await connect('/pvp/queue', 'Cat', 'player-cat');
  send(a, { type: 'queue', playerId: a.id, entry: entryOf('vesper', 'Cat', 1) });
  const b = await connect('/pvp/queue', 'Dan', 'player-dan');
  send(b, { type: 'queue', playerId: b.id, entry: entryOf('rivet', 'Dan', 2) });
  await until(
    () => a.inbox.some((m) => m.type === 'matched') && b.inbox.some((m) => m.type === 'matched'),
    'a match',
  );
  const room = (
    a.inbox.find((m) => m.type === 'matched') as Extract<ServerMsg, { type: 'matched' }>
  ).room;
  const other = (
    b.inbox.find((m) => m.type === 'matched') as Extract<ServerMsg, { type: 'matched' }>
  ).room;
  if (room !== other) throw new Error('the two players were sent to different rooms');
  console.log(`  matched into ${room}`);
  const ca = await connect(`/pvp/room/${room}`, 'Cat', a.id, true);
  send(ca, { type: 'join', playerId: ca.id, entry: entryOf('vesper', 'Cat', 1) });
  const cb = await connect(`/pvp/room/${room}`, 'Dan', b.id, false);
  send(cb, { type: 'join', playerId: cb.id, entry: entryOf('rivet', 'Dan', 2) });
  await until(() => ca.match !== null && cb.match !== null, 'both starts');
  // they asked for different things, so they get them: no coin, Cat first, Dan second with 10 more HP
  if (ca.seat !== 'a' || cb.seat !== 'b' || ca.toss?.random !== false)
    throw new Error(`wrong order: Cat ${ca.seat}, Dan ${cb.seat}, coin ${JSON.stringify(ca.toss)}`);
  const hp = (bot: Bot): number =>
    (bot.match!.state.sides.b.units.find((u) => u.kind === 'hero') as { maxHp: number }).maxHp;
  const base = RIFTWALKERS.rivet.hero.maxHp;
  if (hp(cb) !== base + 10)
    throw new Error(`the second player has ${hp(cb)} HP, expected ${base + 10}`);
  console.log(`  order: Cat first, Dan second with ${hp(cb)} HP (no coin)`);
  await until(() => ca.ended !== null && cb.ended !== null, 'the end');
  if (ca.desync || cb.desync) throw new Error(`desync: ${ca.desync ?? cb.desync}`);
  console.log(`  ok: ${ca.match?.log.length} moves`);
  ca.ws.close();
  cb.ws.close();
}

async function refusals(): Promise<void> {
  console.log('refusals:');
  const bad = await connect(`/pvp/room/BAD${rnd()}`, 'Eve', 'player-eve');
  send(bad, {
    type: 'join',
    playerId: bad.id,
    entry: { name: 'Eve', hero: 'maren', deck: ['strike'], boons: [], tier: 1 },
  });
  await until(() => bad.inbox.some((m) => m.type === 'error'), 'a deck error');
  console.log(`  a one-card deck: ${(bad.inbox[0] as { message: string }).message}`);
  const full = `FULL${rnd()}`;
  const p1 = await connect(`/pvp/room/${full}`, 'p1', 'p1');
  send(p1, { type: 'join', playerId: 'p1', entry: entryOf('maren', 'p1') });
  const p2 = await connect(`/pvp/room/${full}`, 'p2', 'p2');
  send(p2, { type: 'join', playerId: 'p2', entry: entryOf('kesh', 'p2') });
  await until(() => p1.match !== null && p2.match !== null, 'a start');
  p1.paused = true;
  p2.paused = true;
  const p3 = await connect(`/pvp/room/${full}`, 'p3', 'p3');
  send(p3, { type: 'join', playerId: 'p3', entry: entryOf('rivet', 'p3') });
  await until(() => p3.inbox.some((m) => m.type === 'error'), 'room full');
  console.log('  a third player: refused as expected');
  // a move out of turn is refused and changes nothing
  const wrongSeat = p1.seat === p1.match?.active ? p2 : p1;
  send(wrongSeat, { type: 'action', seq: 1, action: { type: 'endTurn' } });
  await until(() => wrongSeat.inbox.some((m) => m.type === 'error'), 'not your turn');
  console.log('  a move out of turn: refused as expected');
  send(p1, { type: 'resign' });
  await until(() => p1.ended !== null && p2.ended !== null, 'the resignation');
  console.log('  resign: ended');
  // nothing is accepted after the end
  send(p2, { type: 'action', seq: p2.match!.log.length + 1, action: { type: 'endTurn' } });
  await until(
    () => p2.inbox.some((m) => m.type === 'error' && m.code === 'no-match'),
    'a refusal after the end',
  );
  console.log('  a move after the end: refused as expected');
  // a player who leaves before the match starts does not leave a ghost in the seat
  const ghostRoom = `GHOST${rnd()}`;
  const g1 = await connect(`/pvp/room/${ghostRoom}`, 'g1', 'g1');
  send(g1, { type: 'join', playerId: 'g1', entry: entryOf('maren', 'g1') });
  await until(() => g1.inbox.some((m) => m.type === 'waiting'), 'g1 waiting');
  g1.ws.close();
  await sleep(300);
  const g2 = await connect(`/pvp/room/${ghostRoom}`, 'g2', 'g2');
  send(g2, { type: 'join', playerId: 'g2', entry: entryOf('kesh', 'g2') });
  await until(() => g2.inbox.length > 0, 'a reply for g2');
  if (g2.inbox.some((m) => m.type === 'start'))
    throw new Error('a match started against a player who had left');
  console.log('  a player who left before the start: not matched with a ghost');
  g2.ws.close();
  for (const b of [bad, p1, p2, p3]) b.ws.close();
}

/** The server-side Vault: save, list, refuse bad input, replace when full, drop. */
async function vault(): Promise<void> {
  console.log('vault:');
  const http = BASE.replace(/^ws/, 'http');
  const code = Array.from(
    { length: 16 },
    () => 'ABCDEFGHJKMNPQRSTVWXYZ23456789'[Math.floor(Math.random() * 30)],
  ).join('');
  const post = async (action: string, body: Record<string, unknown>) => {
    const r = await fetch(`${http}/pvp/vault/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, ...body }),
    });
    return {
      status: r.status,
      ...((await r.json()) as { ok: boolean; error?: string; decks?: { id: string }[] }),
    };
  };
  const mk = (id: string) => ({
    id,
    hero: 'maren',
    tier: 1,
    deck: [...RIFTWALKERS.maren.starter],
    boons: ['iron-sigil'],
    bankedAt: 1,
  });
  const need = (c: boolean, what: string) => {
    if (!c) throw new Error(`vault: ${what}`);
  };
  need((await post('list', {})).decks?.length === 0, 'a new Vault is empty');
  for (let i = 0; i < 10; i++) need((await post('bank', { deck: mk(`d${i}`) })).ok, 'bank');
  need((await post('bank', { deck: mk('d0') })).decks?.length === 10, 'banking twice keeps one');
  const full = await post('bank', { deck: mk('dx') });
  need(full.status === 409 && full.error === 'full', 'a full Vault refuses');
  const swap = await post('bank', { deck: mk('dx'), replaceId: 'd0' });
  need(
    swap.ok &&
      swap.decks?.some((d) => d.id === 'dx') === true &&
      !swap.decks?.some((d) => d.id === 'd0'),
    'replace',
  );
  need(
    (await post('bank', { deck: { ...mk('bad'), deck: ['nope'] } })).status === 400,
    'a bad deck is refused',
  );
  need((await post('drop', { id: 'dx' })).decks?.length === 9, 'drop');
  const other = await fetch(`${http}/pvp/vault/list`, {
    method: 'POST',
    body: JSON.stringify({ code: 'short' }),
  });
  need(other.status === 400, 'a bad code is refused');
  const get = await fetch(`${http}/pvp/vault/list`);
  need(get.status === 404, 'only POST');
  const kept = await post('list', {});
  need(
    JSON.stringify((kept.decks as { boons?: string[] }[] | undefined)?.[0]?.boons) ===
      JSON.stringify(['iron-sigil']),
    'Boons are kept with the deck',
  );
  console.log('  save, list, replace, drop, refusals: as expected');
}

const health = await fetch(`${BASE.replace(/^ws/, 'http')}/pvp/health`);
console.log('health:', await health.text());
const tag = rnd();
await playRoom(`SMOKE${tag}`, 'friend code');
await playQueue();
await playRoom(`REJOIN${tag}`, 'friend code with a rejoin', true);
await refusals();
await vault();
console.log('all good');
process.exit(0);
