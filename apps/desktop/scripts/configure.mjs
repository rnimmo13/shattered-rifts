import { mkdirSync, writeFileSync } from 'node:fs';
import { appIdOf } from '../out/steam.js';
import { ACHIEVEMENTS } from '../out/saveData.js';
const appId = appIdOf(process.env.SR_STEAM_APP_ID);
mkdirSync('out', { recursive: true });
writeFileSync('out/steam-config.json', JSON.stringify({ appId }));
writeFileSync('out/steam-achievements.json', JSON.stringify(ACHIEVEMENTS, null, 2));
