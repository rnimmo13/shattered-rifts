// Worker thread: plays a batch of games and posts the results back.
import { parentPort } from 'node:worker_threads';
import { playGame, type GameResult, type GameTask } from './play';

if (!parentPort) throw new Error('sim worker must run in a worker thread');
const port = parentPort;

port.on('message', (tasks: GameTask[]) => {
  const results: GameResult[] = tasks.map((t) => playGame(t));
  port.postMessage(results);
});
