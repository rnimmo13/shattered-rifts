import type { ReactNode } from 'react';

/** Shared alignment for preferences and native account controls. Hints get their own line. */
export function SettingsRow(props: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="settings__row">
      <div className="settings__label">
        <span>{props.label}</span>
        {props.hint && <small>{props.hint}</small>}
      </div>
      <div className="settings__control">{props.children}</div>
    </div>
  );
}
