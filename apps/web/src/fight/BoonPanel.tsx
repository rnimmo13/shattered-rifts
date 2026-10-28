// A side's Boons on the battle screen, in a panel the player can move, resize and fold like the Auras lists (FloatPanel).

import { BoonChip } from './BoonChip';
import { FloatPanel } from './FloatPanel';

export function BoonPanel(props: {
  /** remembered by this name */
  panel: string;
  title: string;
  boons: readonly string[];
}) {
  return (
    <FloatPanel
      id={props.panel}
      className="fight__aux fight__aux--boons"
      title={`${props.title} · ${props.boons.length}`}
    >
      <div className="fight__boons" aria-label={props.title}>
        {props.boons.map((id) => (
          <BoonChip key={id} id={id} />
        ))}
      </div>
    </FloatPanel>
  );
}
