import { parentPort } from 'node:worker_threads';
import { fight, type Job } from './fight';
parentPort!.on('message', (job: Job) => {
  try {
    parentPort!.postMessage({ ok: true, result: fight(job) });
  } catch (e) {
    parentPort!.postMessage({
      ok: false,
      id: job.id,
      error: String(e),
      stack: e instanceof Error ? e.stack : '',
    });
  }
});
