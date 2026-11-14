// #/support: the alpha's support page (Robert, 2026-11-14, DECISIONS #802). Donations on Ko-fi while the game is free in alpha, before
// Steam Early Access. A gift, not a purchase: it unlocks nothing in the game (no pay-to-win, ever), and promises no keys or Steam access.
// Turn SUPPORT_OPEN off at the Early Access launch: the page and every link to it go with it.

/** The support page and its links are shown (the alpha only). */
export const SUPPORT_OPEN = true;
/** Robert's Ko-fi page. */
export const KOFI_URL = 'https://ko-fi.com/chiefsharkbait';

export function SupportScreen() {
  return (
    <main className="learn support">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">Support the game</h1>
      <p className="learn__note">
        Shattered Rifts is made by one person, Chief Sharkbait, and it is free to play while it is
        in alpha. New cards, classes, art and balance changes go out almost every day, shaped by
        what players say. The plan is to launch on Steam in Early Access.
      </p>
      <p className="learn__note">
        If you enjoy it and would like to help it grow, you can buy me a coffee on Ko-fi. It goes
        into art, servers and the time to build more of the game.
      </p>
      <p className="support__cta">
        <a className="btn btn--primary" href={KOFI_URL} target="_blank" rel="noreferrer">
          <span>Support on Ko-fi</span>
        </a>
      </p>
      <p className="learn__note support__small">
        Support is a thank-you, not a purchase: it does not unlock anything in the game, and
        everyone plays the same game. Thank you for being here this early.
      </p>
      <p className="learn__note support__small">
        <a href="#/roadmap">See the roadmap</a> for where the game is going.
      </p>
    </main>
  );
}
