// #/arena-rules: what makes a deck one the Arena takes, linked from every "not valid for the Arena" message.

import { ArenaRules } from './ArenaRules';
import '../play/play.css';

export default function ArenaRulesScreen() {
  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/arena">
        <span>Arena</span>
      </a>
      <ArenaRules />
      <p className="arenarules__links">
        <a href="#/decks">See your saved decks</a>
      </p>
    </main>
  );
}
