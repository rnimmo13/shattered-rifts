import { desktopBridge } from '../desktopBridge';
import { hasUsername } from './config';
import { takeName } from './takeName';

/** Steam names still pass the same uniqueness and content rules as website names. */
export async function useSteamName(): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge) return;
  const status = await bridge.status();
  if (status.mode === 'steam' && status.online && status.name && !hasUsername()) {
    await takeName(status.name);
    window.dispatchEvent(new Event('sr-desktop-identity'));
  }
}
