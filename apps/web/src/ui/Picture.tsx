// A painted picture from public/art/icons (tools/pack-icons.ps1), or what it stands in for if its file fails to load.

import { useState, type ReactNode } from 'react';
import { iconUrl } from '../art/gameIcons';

export function Picture(props: {
  id: string;
  className?: string;
  /** its height and width in pixels, if the style sheet does not set them */
  size?: number;
  /** what shows without the picture */
  children: ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === props.id) return <>{props.children}</>;
  return (
    <img
      {...(props.className ? { className: props.className } : {})}
      {...(props.size ? { width: props.size, height: props.size } : {})}
      src={iconUrl(props.id)}
      alt=""
      draggable={false}
      onError={() => setFailed(props.id)}
    />
  );
}
