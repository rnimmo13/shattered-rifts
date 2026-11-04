import { Component, type ReactNode } from 'react';
import { SettingsButton } from './SettingsButton';

/** Keep Settings and the safe-update prompt alive if a deployed-away screen chunk fails. */
export class ScreenErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="setup">
        <h1 className="setup__title">This screen could not open</h1>
        <p className="setup__lead">
          Your saved progress is kept. If an update is available, use the update prompt or Settings
          to load the new version.
        </p>
        <a className="btn" href="#/">
          Return home
        </a>
        <SettingsButton />
      </main>
    );
  }
}
