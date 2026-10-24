import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearDuelStarted, clearSavedRun } from './saves';
import { ErrorDetails } from '../ui/ErrorDetails';
import { looksLikeNewVersion } from '../ui/errorReport';

/** If a screen of the run ever crashes, show a way out instead of a blank page. */
export class RunErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; message: string }
> {
  override state = { failed: false, message: '' };

  static getDerivedStateFromError(error: unknown): { failed: boolean; message: string } {
    return {
      failed: true,
      message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[run] screen crashed', error, info.componentStack);
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
        {looksLikeNewVersion(this.state.message) && (
          <p className="errdetails__hint">
            A new version was released while this page was open. Reloading the page gets it.
          </p>
        )}
        <ErrorDetails message={this.state.message} />
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
