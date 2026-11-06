import { spawn } from 'node:child_process';

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;

/**
 * A hidden PowerShell watcher that reopens the game after a silent update. It waits for this
 * process to exit, then for the downloaded NSIS installer to finish, and starts the game only if
 * the installer's own run-after-install has not already done so. A duplicate start is harmless:
 * the single-instance lock focuses the existing window.
 */
export function relaunchScript(exe: string, pid: number): string {
  return [
    `$exe = ${quote(exe)}`,
    `$deadline = (Get-Date).AddSeconds(60)`,
    `while ((Get-Date) -lt $deadline -and (Get-Process -Id ${Math.trunc(pid)} -ErrorAction SilentlyContinue)) { Start-Sleep -Milliseconds 250 }`,
    `Start-Sleep -Seconds 2`,
    `$deadline = (Get-Date).AddMinutes(5)`,
    `while ((Get-Date) -lt $deadline -and (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and ($_.Path -like '*\\pending\\*' -or $_.ProcessName -like 'Shattered-Rifts-Setup*') })) { Start-Sleep -Milliseconds 500 }`,
    `Start-Sleep -Seconds 3`,
    `if (-not (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })) { if (Test-Path -LiteralPath $exe) { Start-Process -FilePath $exe } }`,
  ].join('; ');
}

export function scheduleRelaunchAfterUpdate(exe: string, pid = process.pid): void {
  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-Command',
      relaunchScript(exe, pid),
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  child.on('error', () => undefined);
  child.unref();
}
