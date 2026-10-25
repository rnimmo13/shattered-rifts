// Choosing a username. Names are unique: the server only confirms one that nobody else has, and the campaign and the Arena need
// one before they start (the campaign board and the Arena board show it).

import { useState, type ReactNode } from 'react';
import { getName, hasUsername } from './config';
import { takeName } from './takeName';

/** An input and a button that claim a username. */
export function NameClaim(props: {
  /** the heading line above the field */
  label: string;
  button?: string;
  onDone: (name: string) => void;
  /** when the server cannot be reached the player may go on without a confirmed name (offer this) */
  offline?: { label: string; onGo: () => void };
}) {
  const [value, setValue] = useState(() => (hasUsername() ? getName() : ''));
  const [error, setError] = useState<string | null>(null);
  const [down, setDown] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const problem = await takeName(value);
    setBusy(false);
    setDown(problem?.unreachable === true);
    if (problem) setError(problem.message);
    else props.onDone(getName());
  };

  return (
    <form
      className="nameclaim"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="pvp__field">
        {props.label}
        <input
          value={value}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="Choose a name"
          aria-label="Username"
          aria-invalid={error !== null}
        />
      </label>
      {error && (
        <p className="nameclaim__error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn--primary" type="submit" disabled={busy || value.trim().length < 3}>
        <span>{busy ? 'Checking…' : (props.button ?? 'Save name')}</span>
      </button>
      {down && props.offline && (
        <button className="btn btn--ghost" type="button" onClick={props.offline.onGo}>
          <span>{props.offline.label}</span>
        </button>
      )}
    </form>
  );
}

/** Shows its children once the player has a username; until then asks for one (the campaign needs it to be on the board). */
export function NameGate(props: { children: ReactNode }) {
  const [named, setNamed] = useState(hasUsername);
  if (named) return <>{props.children}</>;
  return (
    <main className="setup nameclaim__gate">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <h1 className="setup__h">Choose a username</h1>
      <p className="setup__lead">
        Your runs go on the campaign leaderboard under this name, and it is the name your opponents
        see in the Arena. No two players can share one, so pick one that is yours.
      </p>
      <NameClaim
        label="Username (3 to 20 characters)"
        button="Start playing"
        onDone={() => setNamed(true)}
        offline={{ label: 'Play without the leaderboard for now', onGo: () => setNamed(true) }}
      />
    </main>
  );
}
