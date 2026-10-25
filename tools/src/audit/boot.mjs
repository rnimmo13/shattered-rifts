// Worker entry: register the TypeScript loader (worker threads do not inherit tsx), then load the real worker.
import { register } from 'tsx/esm/api';

register();
await import('./worker.ts');
