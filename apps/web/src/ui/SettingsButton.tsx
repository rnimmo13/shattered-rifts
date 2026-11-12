// The button that opens the Settings menu (DECISIONS #571), on the title screen, the run's bar and in a fight. In the run's bar and a
// fight it is a gear icon at the far right, the same place on every screen (Robert, 2026-11-11, DECISIONS #758).

import { openSettings } from '../app/settings';
import { LineIcon } from '../app/HomeLinks';

export function SettingsButton(props: { className?: string; iconOnly?: boolean }) {
  return (
    <button
      type="button"
      className={`btn btn--small btn--ghost${props.iconOnly ? ' iconbtn' : ''}${props.className ? ` ${props.className}` : ''}`}
      onClick={openSettings}
      aria-haspopup="dialog"
      aria-label="Settings"
      title="Settings"
    >
      {props.iconOnly ? (
        <LineIcon name="settings" size={20} />
      ) : (
        <span>
          <span aria-hidden>⚙</span>
          <span className="settings-button__label"> Settings</span>
        </span>
      )}
    </button>
  );
}
