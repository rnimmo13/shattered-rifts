import { describe, expect, it, vi } from 'vitest';
import { Matchmaker } from './matchmaker';
import { MatchRoom } from './room';

const context = () => ({
  setWebSocketAutoResponse: () => undefined,
  blockConcurrencyWhile: () => Promise.resolve(),
  getWebSockets: () => [],
});
const socket = () => ({
  deserializeAttachment: () => ({
    playerId: 'a',
    seat: 'a',
    play: { vault: 'account', token: 'expired' },
  }),
  send: vi.fn(),
  close: vi.fn(),
});
describe('existing Arena connections cannot outlive their account claim', () => {
  it.each(['room', 'queue'] as const)(
    'rejects an old %s socket before gameplay processing',
    async (kind) => {
      vi.stubGlobal('WebSocketRequestResponsePair', class {});
      const env = {
        VAULT: {
          idFromName: (name: string) => name,
          get: () => ({ fetch: () => Promise.resolve(new Response('{}', { status: 409 })) }),
        },
      };
      const ctx = context();
      const object =
        kind === 'room'
          ? new MatchRoom(
              ctx as unknown as ConstructorParameters<typeof MatchRoom>[0],
              env as unknown as ConstructorParameters<typeof MatchRoom>[1],
            )
          : new Matchmaker(
              ctx as unknown as ConstructorParameters<typeof Matchmaker>[0],
              env as unknown as ConstructorParameters<typeof Matchmaker>[1],
            );
      const ws = socket();
      await object.webSocketMessage(
        ws as unknown as WebSocket,
        JSON.stringify({ type: 'action', seq: 1, action: { type: 'endTurn' } }),
      );
      expect(ws.close).toHaveBeenCalledWith(1008, 'play-required');
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('Gameplay is active elsewhere'));
      vi.unstubAllGlobals();
    },
  );
});
