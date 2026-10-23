import { COMBAT_DB, RIFTWALKERS, heroesByRealm } from '@sr/content/v2';
import { KEYWORD_INFO, STATUS_INFO } from '../fight/info';
import { TIP_RULES } from '../fight/tips';

/** #/learn: every mechanic in plain words, for anyone who wants to read it before (or between) fights. */
export function LearnScreen() {
  const basics = TIP_RULES.find((t) => t.id === 'basics');
  const runes = Object.values(COMBAT_DB.runes ?? {});
  return (
    <main className="learn">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">How to play</h1>

      <section>
        <h2>The basics</h2>
        <p>{basics?.text}</p>
        <p>
          A run is five stages. Between fights you add cards to your deck, rest, shop, and face
          events. Win a fight and you keep your HP; lose and you spend Resolve. Clear all five
          stages and you can bank your deck or press on at a higher Rift Tier.
        </p>
      </section>

      <section>
        <h2>Your Riftwalker</h2>
        {heroesByRealm().map((g) => (
          <div key={g.realm} className="learn__realm">
            <h3>{g.name}</h3>
            {g.heroes.map((h) => (
              <article key={h} className="learn__hero">
                <h4>{RIFTWALKERS[h].hero.name}</h4>
                <ul>
                  {RIFTWALKERS[h].howTo.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2>Statuses</h2>
        <dl>
          {Object.values(STATUS_INFO).map((s) => (
            <div key={s.name} className="learn__row">
              <dt>
                {s.glyph} {s.name}
              </dt>
              <dd>{s.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Keywords</h2>
        <dl>
          {Object.values(KEYWORD_INFO).map((k) => (
            <div key={k.name} className="learn__row">
              <dt>{k.name}</dt>
              <dd>{k.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Runes</h2>
        <dl>
          {runes.map((r) => (
            <div key={r.id} className="learn__row">
              <dt>{r.name}</dt>
              <dd>{r.text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
