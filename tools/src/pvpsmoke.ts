// `pnpm pvpsmoke [ws://host:port]`: plays whole PvP matches against a running server (`pnpm --filter @sr/server dev`).
// Two simulated players each keep their own copy of the match (as the browsers do), play with the greedy bot, and check
// that the server's hash after every move equals their own: a desync would show here. Runs a friend-code match, then a
// queue match, then a rejoin (one player drops and comes back mid-match).

import { chooseAction } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import {
  ARENA_HP_MULT,
  Match,
  SECOND_PLAYER_HP,
  type ClientMsg,
  type Entry,
  type Seat,
  type ServerMsg,
} from '@sr/pvp';

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
  /** a game of the best of three is over and the next has not started */
  between: boolean;
  /** games finished so far in this match */
  games: number;
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
      between: false,
      games: 0,
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
    // (between games only the player who lost is asked; the other waits)
    if (!m.chosen && m.chooser !== false && !b.paused) send(b, { type: 'order', first: b.wantsFirst });
  } else if (m.type === 'start') {
    b.between = false;
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
  } else if (m.type === 'end') {
    // a game that is not the last of the best of three only ends the game
    b.games++;
    if (m.series && !m.series.over) b.between = true;
    else b.ended = m;
  } else if (m.type === 'error') console.log(`  [${b.name}] error: ${m.code} ${m.message}`);
}

/** If it is my turn, play one move with the bot. */
function pump(b: Bot): void {
  const m = b.match;
  if (!m || m.over || b.between || b.paused || b.seat !== m.active || m.log.length < b.replay) return;
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

async function playRoom(
  code: string,
  label: string,
  rejoin = false,
  who?: [string, string],
  names: [string, string] = ['Ann', 'Bob'],
): Promise<void> {
  console.log(`${label}: room ${code}`);
  const a = await connect(`/pvp/room/${code}`, 'Ann', 'player-ann');
  send(a, {
    type: 'join',
    playerId: a.id,
    entry: { ...entryOf('knight', names[0]), ...(who ? { who: who[0] } : {}) },
  });
  await until(() => a.inbox.some((m) => m.type === 'waiting'), 'the waiting message');
  const b = await connect(`/pvp/room/${code}`, 'Bob', 'player-bob');
  send(b, {
    type: 'join',
    playerId: b.id,
    entry: { ...entryOf('hunter', names[1]), ...(who ? { who: who[1] } : {}) },
  });
  await until(() => a.match !== null && b.match !== null, 'both starts');
  if (who) {
    // a leaderboard id is a player's secret: it must never reach the other player
    for (const bot of [a, b])
      for (const m of bot.inbox)
        if (who.some((w) => JSON.stringify(m).includes(w)))
          throw new Error(`a leaderboard id was sent to a player in a ${m.type} message`);
  }
  if (a.toss?.random !== true) throw new Error('both wanted first: the coin should have decided');
  console.log(`  both wanted to go first: the coin made Ann seat ${a.seat}, Bob seat ${b.seat}`);
  if (rejoin) {
    await until(() => (a.match?.log.length ?? 0) >= 4, 'a few moves');
    a.paused = true;
    a.ws.close();
    await sleep(300);
    const again = await connect(`/pvp/room/${code}`, 'Ann', a.id);
    send(again, { type: 'join', playerId: again.id, entry: entryOf('knight', 'Ann') });
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
  send(a, { type: 'queue', playerId: a.id, entry: entryOf('trapper', 'Cat', 1) });
  const b = await connect('/pvp/queue', 'Dan', 'player-dan');
  send(b, { type: 'queue', playerId: b.id, entry: entryOf('engineer', 'Dan', 2) });
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
  send(ca, { type: 'join', playerId: ca.id, entry: entryOf('trapper', 'Cat', 1) });
  const cb = await connect(`/pvp/room/${room}`, 'Dan', b.id, false);
  send(cb, { type: 'join', playerId: cb.id, entry: entryOf('engineer', 'Dan', 2) });
  await until(() => ca.match !== null && cb.match !== null, 'both starts');
  // they asked for different things, so they get them: no coin, Cat first, Dan second with more HP
  if (ca.seat !== 'a' || cb.seat !== 'b' || ca.toss?.random !== false)
    throw new Error(`wrong order: Cat ${ca.seat}, Dan ${cb.seat}, coin ${JSON.stringify(ca.toss)}`);
  const hp = (bot: Bot): number =>
    (bot.match!.state.sides.b.units.find((u) => u.kind === 'hero') as { maxHp: number }).maxHp;
  const base = RIFTWALKERS.engineer.hero.maxHp * ARENA_HP_MULT + SECOND_PLAYER_HP;
  if (hp(cb) !== base) throw new Error(`the second player has ${hp(cb)} HP, expected ${base}`);
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
    entry: { name: 'Eve', hero: 'knight', deck: ['strike'], boons: [], tier: 1 },
  });
  await until(() => bad.inbox.some((m) => m.type === 'error'), 'a deck error');
  console.log(`  a one-card deck: ${(bad.inbox[0] as { message: string }).message}`);
  const full = `FULL${rnd()}`;
  const p1 = await connect(`/pvp/room/${full}`, 'p1', 'p1');
  send(p1, { type: 'join', playerId: 'p1', entry: entryOf('knight', 'p1') });
  const p2 = await connect(`/pvp/room/${full}`, 'p2', 'p2');
  send(p2, { type: 'join', playerId: 'p2', entry: entryOf('hunter', 'p2') });
  await until(() => p1.match !== null && p2.match !== null, 'a start');
  p1.paused = true;
  p2.paused = true;
  const p3 = await connect(`/pvp/room/${full}`, 'p3', 'p3');
  send(p3, { type: 'join', playerId: 'p3', entry: entryOf('engineer', 'p3') });
  await until(() => p3.inbox.some((m) => m.type === 'error'), 'room full');
  console.log('  a third player: refused as expected');
  // a move out of turn is refused and changes nothing
  const wrongSeat = p1.seat === p1.match?.active ? p2 : p1;
  send(wrongSeat, { type: 'action', seq: 1, action: { type: 'endTurn' } });
  await until(() => wrongSeat.inbox.some((m) => m.type === 'error'), 'not your turn');
  console.log('  a move out of turn: refused as expected');
  send(p1, { type: 'resign' });
  await until(() => p1.between && p2.between, 'the resignation');
  const afterOne = p2.inbox.filter((m) => m.type === 'end').pop();
  if (afterOne?.type !== 'end' || afterOne.series?.over !== false || afterOne.series.wins.a + afterOne.series.wins.b !== 1)
    throw new Error(`a resignation should end one game of three: ${JSON.stringify(afterOne)}`);
  console.log('  resign: one game lost, the match goes on');
  // nothing is accepted between games
  send(p2, { type: 'action', seq: p2.match!.log.length + 1, action: { type: 'endTurn' } });
  await until(
    () => p2.inbox.some((m) => m.type === 'error' && m.code === 'no-match'),
    'a refusal after the end',
  );
  console.log('  a move after the end: refused as expected');
  // a player who leaves before the match starts does not leave a ghost in the seat
  const ghostRoom = `GHOST${rnd()}`;
  const g1 = await connect(`/pvp/room/${ghostRoom}`, 'g1', 'g1');
  send(g1, { type: 'join', playerId: 'g1', entry: entryOf('knight', 'g1') });
  await until(() => g1.inbox.some((m) => m.type === 'waiting'), 'g1 waiting');
  g1.ws.close();
  await sleep(300);
  const g2 = await connect(`/pvp/room/${ghostRoom}`, 'g2', 'g2');
  send(g2, { type: 'join', playerId: 'g2', entry: entryOf('hunter', 'g2') });
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
    hero: 'knight',
    tier: 1,
    stage: 2,
    deck: [...RIFTWALKERS.knight.starter],
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
  need(
    (kept.decks as { stage?: number }[] | undefined)?.[0]?.stage === 2,
    'the stage is kept with the deck',
  );
  console.log('  save, list, replace, drop, refusals: as expected');
}

/** The leaderboards: a played match is recorded for both players, a run's progress only moves forward a stage at a time. */
async function board(tag: string): Promise<void> {
  console.log('leaderboards:');
  const http = BASE.replace(/^ws/, 'http');
  const need = (c: boolean, what: string): void => {
    if (!c) throw new Error(`board: ${what}`);
  };
  const code = (): string =>
    Array.from(
      { length: 16 },
      () => 'ABCDEFGHJKMNPQRSTVWXYZ23456789'[Math.floor(Math.random() * 30)],
    ).join('');
  const post = async (what: string, body: Record<string, unknown>) => {
    const r = await fetch(`${http}/pvp/board/${what}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return {
      status: r.status,
      ...((await r.json()) as Record<string, unknown>),
    } as { status: number } & Record<string, unknown>;
  };
  const codes = [code(), code()] as const;
  const ids = [await post('id', { code: codes[0] }), await post('id', { code: codes[1] })];
  need(
    typeof ids[0]?.['id'] === 'string' && /^[0-9a-f]{64}$/.test(ids[0]['id']),
    'a board id is a hash',
  );
  need(ids[0]?.['id'] !== ids[1]?.['id'], 'two codes, two ids');
  need((await post('id', { code: 'short' })).status === 401, 'a bad code is refused');
  // an Arena match between them
  const who: [string, string] = [ids[0]?.['id'] as string, ids[1]?.['id'] as string];
  const names: [string, string] = [`Ann${tag}`, `Bob${tag}`];
  // usernames: a run does not count without one, no two players share one, and a name must be an acceptable one
  const early = await post('run', { code: codes[0], run: `early${tag}`, name: names[0], hero: 'knight', tier: 1, stage: 1 });
  need(early['counted'] === false && early['error'] === 'no-name', 'a run without a username is not counted');
  need((await post('claim', { code: codes[0], name: names[0] }))['ok'] === true, 'a free name is claimed');
  need((await post('claim', { code: codes[1], name: names[0].toUpperCase() }))['error'] === 'taken', 'a name another player has is taken, however it is written');
  need((await post('claim', { code: codes[1], name: 'ab' }))['error'] === 'bad-name', 'a name that is too short is refused');
  need((await post('claim', { code: codes[1], name: names[1] }))['ok'] === true, 'the other player claims their own');
  need((await post('claim', { code: codes[0], name: names[0] }))['ok'] === true, 'a player may claim the name they already have');
  await playRoom(`BOARD${tag}`, 'friend code (recorded)', false, who, names);
  await sleep(500);
  const pvp = (await (await fetch(`${http}/pvp/board/pvp?period=week`)).json()) as {
    ok: boolean;
    board: { name: string; wins: number; losses: number; heroes: { hero: string }[] }[];
  };
  const ann = pvp.board.find((s) => s.name === names[0]);
  const bob = pvp.board.find((s) => s.name === names[1]);
  need(!!ann && !!bob, 'both players are on the Arena board');
  need((ann?.wins ?? 0) + (bob?.wins ?? 0) === 1, 'one win between them');
  need(
    ann?.heroes[0]?.hero === 'knight' && bob?.heroes[0]?.hero === 'hunter',
    'the characters are listed',
  );
  // a player who is known is told where they stand; one who is not just sees the board
  const seen = await post('view', { code: codes[0], kind: 'pvp', period: 'week' });
  const you = seen['you'] as { rank: number; name: string; wins: number } | null;
  need(!!you && you.name === names[0] && you.rank >= 1, 'a known player sees their own place');
  need(
    ((seen['board'] as { name: string }[] | undefined) ?? []).length <= 100,
    'a board shows at most 100 places',
  );
  const stranger = await post('view', { kind: 'pvp', period: 'week' });
  need(
    stranger.status === 200 && stranger['you'] === null,
    'a visitor with no id sees the board only',
  );
  // a run
  const run = (stage: number, extra: Record<string, unknown> = {}) =>
    post('run', {
      code: codes[0],
      run: `r${tag}`,
      name: names[0],
      hero: 'knight',
      tier: 1,
      stage,
      ...extra,
    });
  need((await run(1))['counted'] === true, 'a first stage cleared is counted');
  need((await run(3))['counted'] === false, 'a jump of two stages is not believed');
  need((await run(2))['counted'] === true, 'the next stage is');
  need((await run(2))['counted'] === false, 'the same progress twice is not');
  need((await run(1))['counted'] === false, 'going backwards is not');
  need((await run(2, { hero: 'nobody' })).status === 400, 'an unknown character is refused');
  // a second character is its own place on the board
  need((await run(1, { run: `second${tag}`, hero: 'barbarian' }))['counted'] === true, 'a second character counts');
  const runs = (await (await fetch(`${http}/pvp/board/runs?period=month`)).json()) as {
    board: { name: string; tier: number; stage: number; total: number }[];
  };
  const mine = runs.board.find((s) => s.name === names[0] && (s as { hero?: string }).hero === 'knight');
  need(
    runs.board.filter((s) => s.name === names[0]).length === 2,
    'one player is on the campaign board once for each character',
  );
  need(
    mine?.tier === 1 && mine.stage === 2 && mine.total === 2,
    'the run board shows the furthest point',
  );
  need((await fetch(`${http}/pvp/board/nope`)).status === 404, 'an unknown board is not found');
  console.log(
    '  match recorded for both, characters listed, run progress moves one stage at a time',
  );
}

/** A ghost: a deck that has played in the Arena, with the computer at the controls. Needs the board test to have run first. */
async function ghost(tag: string): Promise<void> {
  console.log('ghosts:');
  const http = BASE.replace(/^ws/, 'http');
  const hex = (): string =>
    Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const me = hex();
  const name = `Gus${tag}`;
  const entry = { ...entryOf('spellblade', name), who: me };
  // a queue socket asks for a ghost, and is sent to a room
  const q = await connect('/pvp/queue', name, `player-${name}`);
  send(q, { type: 'ghost', playerId: q.id, entry });
  await until(() => q.inbox.some((m) => m.type === 'matched' || m.type === 'error'), 'a ghost');
  const found = q.inbox.find((m) => m.type === 'matched' || m.type === 'error') as ServerMsg;
  if (found.type !== 'matched' || found.ghost !== true)
    throw new Error(`no ghost was offered: ${JSON.stringify(found)}`);
  console.log(`  a ghost was found: room ${found.room}`);
  const a = await connect(`/pvp/room/${found.room}`, name, q.id, true);
  send(a, { type: 'join', playerId: a.id, entry });
  await until(() => a.match !== null, 'the match to start', 30_000);
  const start = a.inbox.find((m) => m.type === 'start') as Extract<ServerMsg, { type: 'start' }>;
  if (start.ghost === undefined || start.ghost === a.seat)
    throw new Error('the match does not say which seat the ghost has');
  const foeEntry = a.seat === 'a' ? start.b : start.a;
  if (foeEntry.who !== undefined) throw new Error('a ghost entry carries a leaderboard id');
  if (!/ghost$/.test(foeEntry.name))
    throw new Error(`the ghost is not named as one: ${foeEntry.name}`);
  await until(() => a.ended !== null, 'the end of the match', 600_000);
  if (a.desync) throw new Error(`desync: ${a.desync}`);
  console.log(
    `  ok: played ${a.match?.log.length} moves against ${foeEntry.name} (${foeEntry.hero}), ended ${JSON.stringify(a.ended && a.ended.type === 'end' ? [a.ended.winner, a.ended.reason] : null)}, hashes agreed`,
  );
  a.ws.close();
  await sleep(600);
  const board = (await (await fetch(`${http}/pvp/board/ghosts?period=week`)).json()) as {
    ok: boolean;
    ghosts: { name: string; wins: number; losses: number }[];
    players: { name: string; wins: number; losses: number }[];
  };
  const you = board.players.find((x) => x.name === name);
  if (!you || you.wins + you.losses !== 1)
    throw new Error('the match is not on the players-against-ghosts board');
  const ghostName = foeEntry.name.replace(/'s ghost$/, '');
  const row = board.ghosts.find((g) => g.name === ghostName);
  if (!row || row.wins + row.losses < 1) throw new Error('the ghost has no record');
  // the Arena board does not count it
  const arena = (await (await fetch(`${http}/pvp/board/pvp?period=week`)).json()) as {
    board: { name: string }[];
  };
  if (arena.board.some((x) => x.name === name))
    throw new Error('a ghost match counted as an Arena match');
  console.log(
    `  recorded: ${name} is ${you.wins}-${you.losses} against ghosts; ${ghostName}'s ghost is ${row.wins}-${row.losses}`,
  );
}

const health = await fetch(`${BASE.replace(/^ws/, 'http')}/pvp/health`);
console.log('health:', await health.text());
const tag = rnd();
await playRoom(`SMOKE${tag}`, 'friend code');
await playQueue();
await playRoom(`REJOIN${tag}`, 'friend code with a rejoin', true);
await refusals();
await vault();
await board(tag);
await ghost(tag);
console.log('all good');
process.exit(0);
