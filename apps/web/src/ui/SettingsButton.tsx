// The button that opens the Settings menu (DECISIONS #571), on the title screen, the run's bar and in a fight.

import { openSettings } from '../app/settings';

export function SettingsButton(props: { className?: string }) {
  return (
    <button
      type="button"
      className={`btn btn--small btn--ghost${props.className ? ` ${props.className}` : ''}`}
      onClick={openSettings}
      aria-haspopup="dialog"
    >
      <span>
        <span aria-hidden>⚙</span> Settings
      </span>
    </button>
  );
}
