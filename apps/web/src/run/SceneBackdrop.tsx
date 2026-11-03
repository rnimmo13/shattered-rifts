// The painted scene behind a stop (public/art/events/<scene>.jpg, packed by tools/pack-scenes.ps1): an event's own place,
// the merchant's stall or the shrine. It fills the screen behind the run's panels and fades in once loaded; without a picture
// (an elite event, an event saved by an older build, a file not painted yet) nothing is shown and the screen looks as it did.
import { useState } from 'react';

/** `side`: the panel stands in the quiet right part of the picture (an event); `dim`: the whole picture is dimmed (a shop). */
export function SceneBackdrop(props: { scene: string | undefined; mode: 'side' | 'dim' }) {
  const scene = props.scene && /^[a-z0-9-]+$/.test(props.scene) ? props.scene : null;
  if (!scene) return null;
  return <Picture key={scene} scene={scene} mode={props.mode} />;
}

function Picture(props: { scene: string; mode: 'side' | 'dim' }) {
  const [state, setState] = useState<'loading' | 'in' | 'none'>('loading');
  if (state === 'none') return null;
  return (
    <div
      className={`scenebg scenebg--${props.mode}${state === 'in' ? ' scenebg--in' : ''}`}
      aria-hidden="true"
    >
      <img
        src={`${import.meta.env.BASE_URL}art/events/${props.scene}.jpg`}
        alt=""
        decoding="async"
        onLoad={() => setState('in')}
        onError={() => setState('none')}
      />
    </div>
  );
}
