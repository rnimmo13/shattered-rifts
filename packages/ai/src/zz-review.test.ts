import { it } from 'vitest';
import { createEngine, nextInt, seedRng, stableStringify } from '@sr/engine';
import { CARD_DB, CHARACTERS, randomLegalDeck } from '@sr/content';
import { HeuristicAi, PERSONALITIES } from './index';

it('ai robustness on random pool decks', () => {
  const engine = createEngine(CARD_DB);
  const errs = new Map<string, number>();
  let fallbacks = 0,
    decisions = 0,
    unfinished = 0,
    games = 0;
  const N = Number(process.env.AIGAMES ?? 12);
  for (let g = 0; g < N; g++) {
    const rng = seedRng(`aireview:${g}`);
    const side = () => ({
      deck: randomLegalDeck(CARD_DB, 20 + nextInt(rng, 10), (k) => nextInt(rng, k)),
      sigil: CHARACTERS[nextInt(rng, 4)]!.sigil,
    });
    let s = engine.createGame({ seed: `aig${g}`, players: [side(), side()] });
    const ais = [0, 1].map((i) => {
      const ai = new HeuristicAi({
        db: CARD_DB,
        seed: `x${g}${i}`,
        personality: PERSONALITIES.balanced,
      });
      const sim = (ai as any).sim;
      const orig = sim.applyAction.bind(sim);
      sim.applyAction = (st: any, a: any) => {
        try {
          return orig(st, a);
        } catch (e: any) {
          const k = `${a.type}: ${String(e.message).slice(0, 90)}`;
          errs.set(k, (errs.get(k) ?? 0) + 1);
          throw e;
        }
      };
      const od = (ai as any).decide.bind(ai);
      (ai as any).decide = (...args: any[]) => {
        const r = od(...args);
        (ai as any).__last = r;
        return r;
      };
      return ai;
    });
    for (let i = 0; i < 20000; i++) {
      const p = engine.toAct(s);
      if (p === null) break;
      const ai: any = ais[p];
      ai.__last = undefined;
      const act = ai.choose(engine, s, p);
      decisions++;
      if (ai.__last && stableStringify(ai.__last) !== stableStringify(act)) fallbacks++;
      s = engine.applyAction(s, act).state;
    }
    games++;
    if (s.winner === null) unfinished++;
  }
  console.log(
    'AIREV',
    JSON.stringify({ games, decisions, fallbacks, unfinished, errs: [...errs.entries()] }),
  );
}, 900_000);
