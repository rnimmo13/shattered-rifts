import type { ArtProgress } from './art/assets';

/** Controls the HTML splash that paints before either the game or native save bootstrap. */
export function startupSplash(): {
  skip: Promise<void>;
  update: (progress: ArtProgress) => void;
  finish: () => void;
} {
  const status = document.getElementById('startup-status');
  const bar = document.getElementById('startup-progress') as HTMLProgressElement | null;
  const button = document.getElementById('startup-continue') as HTMLButtonElement | null;
  let continueLoading: () => void = () => undefined;
  const skip = new Promise<void>((resolve) => {
    continueLoading = resolve;
  });
  const timer = window.setTimeout(() => {
    if (button) button.hidden = false;
  }, 4000);
  if (button) button.onclick = continueLoading;
  return {
    skip,
    update: ({ completed, total, stage }) => {
      if (status)
        status.textContent =
          stage === 'manifest'
            ? 'Finding your Riftwalkers…'
            : stage === 'ready'
              ? 'Preparing your deck…'
              : `Loading Riftwalkers · ${completed} / ${total}`;
      if (bar && total > 0) {
        bar.max = total;
        bar.value = completed;
      }
    },
    finish: () => {
      window.clearTimeout(timer);
      if (button) button.onclick = null;
    },
  };
}

/** A failed native save bootstrap must stay blocked rather than opening a different save. */
export function showStartupError(message: string, quit?: () => void): void {
  const status = document.getElementById('startup-status');
  if (status) {
    status.textContent = message;
    status.setAttribute('role', 'alert');
  }
  const bar = document.getElementById('startup-progress');
  if (bar) bar.hidden = true;
  const retry = document.getElementById('startup-continue') as HTMLButtonElement | null;
  if (retry) {
    retry.hidden = false;
    retry.textContent = 'Try again';
    retry.onclick = () => location.reload();
  }
  const exit = document.getElementById('startup-quit') as HTMLButtonElement | null;
  if (exit && quit) {
    exit.hidden = false;
    exit.onclick = quit;
  }
}
