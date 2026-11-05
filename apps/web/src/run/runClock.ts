/** A monotonic display clock, independent for each mounted Campaign run. */
export class RunClock {
  private accumulated: number;
  private since: number | null = null;
  constructor(
    elapsedMs = 0,
    private readonly now = () => performance.now(),
  ) {
    this.accumulated = elapsedMs;
  }
  elapsed(): number {
    return Math.floor(
      this.accumulated + (this.since === null ? 0 : Math.max(0, this.now() - this.since)),
    );
  }
  resume(): void {
    this.since ??= this.now();
  }
  pause(): void {
    this.accumulated = this.elapsed();
    this.since = null;
  }
  restore(elapsedMs: number): void {
    const additional = elapsedMs - this.elapsed();
    if (additional > 0) this.accumulated += additional;
  }
}

export function formatRunTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

let checkpoint: (() => void) | null = null;
export function registerRunTimeCheckpoint(next: () => void): () => void {
  checkpoint = next;
  return () => {
    if (checkpoint === next) checkpoint = null;
  };
}
export function checkpointRunTime(): void {
  checkpoint?.();
}
