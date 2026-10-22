// Worker threads don't inherit tsx's TypeScript support, so register it here, then load the
// worker module named in workerData.module (default: the sim worker).
import { workerData } from 'node:worker_threads';
import { register } from 'tsx/esm/api';

register();
await import(workerData?.module ?? './worker.ts');
