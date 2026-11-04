import { contextBridge, ipcRenderer } from 'electron';

// Named capabilities only. No raw IPC, token, filesystem or Steam SDK reaches the page.
contextBridge.exposeInMainWorld('shatteredRiftsDesktop', {
  bootstrap: (keys: string[]): Promise<unknown> => ipcRenderer.invoke('desktop:bootstrap', keys),
  save: (entries: Record<string, string>): Promise<unknown> =>
    ipcRenderer.invoke('desktop:save', entries),
  status: (): Promise<unknown> => ipcRenderer.invoke('desktop:status'),
  updateStatus: (): Promise<unknown> => ipcRenderer.invoke('desktop:update-status'),
  checkUpdate: (): Promise<unknown> => ipcRenderer.invoke('desktop:update-check'),
  installUpdate: (): Promise<unknown> => ipcRenderer.invoke('desktop:update-install'),
  ready: (): Promise<unknown> => ipcRenderer.invoke('desktop:ready'),
  quit: (): void => ipcRenderer.send('desktop:quit'),
  switchMode: (local: boolean): Promise<unknown> =>
    ipcRenderer.invoke('desktop:switch-mode', local),
});
