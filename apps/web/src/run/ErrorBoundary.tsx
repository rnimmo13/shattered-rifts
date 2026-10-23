import { Component, type ReactNode } from 'react';
import { clearDuelStarted, clearSavedRun } from './saves';

/** If a screen of the run ever crashes, show a way out instead of a blank page. */
export class RunErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="setup">
        <h1 className="setup__title">The run hit a problem</h1>
        <p className="setup__lead">
          Something went wrong showing this screen. Your saved run is kept in this browser; if
          reloading does not help, clear it and start a new run.
        </p>
        <div className="modal__row">
          <button
            className="btn"
            onClick={() => {
              // a crash is not the player's fault: reloading must not count the fight as left unfinished
              clearDuelStarted();
              window.location.reload();
            }}
          >
            <span>Reload</span>
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              clearSavedRun();
              window.location.reload();
            }}
          >
            <span>Clear the saved run</span>
          </button>
          <a className="btn btn--ghost" href="#/">
            <span>Title</span>
          </a>
        </div>
      </main>
    );
  }
}
