// A tiny, always-visible build label in the corner of every screen, so a bug report can say which build it came from.

import { BUILD } from '../build';
import { tipAttrs } from './tip';

export function BuildBadge() {
  return (
    <div
      className="buildbadge"
      {...tipAttrs({
        kicker: 'Build',
        title: `Version ${BUILD.version}`,
        text: `Commit ${BUILD.commit}${BUILD.dirty ? ' (with local changes)' : ''}. Built ${BUILD.date || 'locally'}.`,
        hint: 'Include this when you report a bug.',
      })}
    >
      {BUILD.label}
    </div>
  );
}
