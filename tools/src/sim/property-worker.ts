import { parentPort } from 'node:worker_threads';
import { runPropertyGame, type PropertyResult } from './propertyGame';

if (!parentPort) throw new Error('property worker must run in a worker thread');
const port = parentPort;

port.on('message', (msg: { indices: number[]; seed: string }) => {
  const results: PropertyResult[] = msg.indices.map((i) => runPropertyGame(i, msg.seed));
  port.postMessage(results);
});
