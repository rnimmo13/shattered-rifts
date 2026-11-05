import { writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { COMBAT_DB } from '@sr/content/v2';
const file = process.argv[2];
if (!file || existsSync(file)) throw Error('Provide a new snapshot filename');
writeFileSync(file, gzipSync(JSON.stringify(COMBAT_DB), { level: 9 }));
console.log('Saved immutable combat data snapshot: ' + file);
