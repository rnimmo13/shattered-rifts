// The card reader: hover any card in your hand or any card on the board and it appears here at a readable size,
// with its current HP/Damage and a plain-language explanation of every keyword on it.

import type { CardDef } from '@sr/engine';
import { Card } from '../cards/Card';
import { KEYWORD_HELP, TYPE_HELP } from './keywordHelp';

export interface InspectInfo {
  def: CardDef;
  /** Current layered stats when the card is on the board. */
  stats?: { power: number; guard: number; maxGuard: number } | undefined;
  /** 'yours' | "enemy's" | 'hand' */
  where?: string | undefined;
}

export function Inspector(props: { info: InspectInfo | null }) {
  const info = props.info;
  if (!info) return null;
  const { def, stats } = info;
  // on short screens the card shrinks so the text under it always fits
  const cardW = window.innerHeight < 700 ? 190 : window.innerHeight < 800 ? 230 : 270;
  const keywords = [...new Set(def.keywords ?? [])];
  const isUnit = def.type === 'unit' || def.type === 'token';
  return (
    <aside className="inspect" style={{ width: cardW }} aria-label={`Card: ${def.name}`}>
      <Card def={def} width={cardW} />
      <div
        className="inspect__body"
        style={{ maxHeight: `calc(100vh - 6.5rem - ${Math.round(cardW * 1.4)}px - 9rem)` }}
      >
        <p className="inspect__title">
          <b>{def.name}</b>
          {info.where && <i> · {info.where}</i>}
        </p>
        {isUnit && (
          <p className="inspect__stats">
            <span className="inspect__hp">
              HP <b>{stats ? `${stats.guard}/${stats.maxGuard}` : (def.guard ?? 0)}</b>
            </span>
            <span className="inspect__dmg">
              Damage <b>{stats ? stats.power : (def.power ?? 0)}</b>
            </span>
            <span className="inspect__cost">
              Cost <b>{def.cost}</b>
            </span>
          </p>
        )}
        {!isUnit && (
          <p className="inspect__stats">
            <span className="inspect__cost">
              Cost <b>{def.cost}</b>
            </span>
          </p>
        )}
        <p className="inspect__type">{TYPE_HELP[def.type] ?? ''}</p>
        {keywords.length > 0 && (
          <dl className="inspect__kw">
            {keywords.map((k) => (
              <div key={k}>
                <dt>{KEYWORD_HELP[k].name}</dt>
                <dd>{KEYWORD_HELP[k].text}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </aside>
  );
}
