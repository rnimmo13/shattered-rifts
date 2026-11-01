// The moment an Ascendancy is chosen (DECISIONS #522): the screen darkens, the crest rises, the old class name burns away and the new one is
// written in gold. The choice has already been made and saved: a click, or the end of the moment, only clears it from the screen.

import { useEffect } from 'react';
import { crestPic } from '../fight/fxMoments';
import '../fight/fx.css';
import { Picture } from '../ui/Picture';

/** How long it stays, in milliseconds, if it is not clicked away. */
const LASTS = 3600;

export function AscendReveal(props: {
  id: string;
  from: string;
  to: string;
  text: string;
  onDone: () => void;
}) {
  const { onDone } = props;
  useEffect(() => {
    const t = window.setTimeout(onDone, LASTS);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <button className="ascendrise" onClick={onDone} aria-label={`You are now the ${props.to}. Continue.`}>
      <Picture id={crestPic(props.id)} className="ascendrise__crest">
        {null}
      </Picture>
      <span className="ascendrise__names">
        <span className="ascendrise__old">{props.from}</span>
        <span className="ascendrise__new">{props.to}</span>
      </span>
      <small>{props.text}</small>
    </button>
  );
}
