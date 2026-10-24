// Helpers for error screens (see ErrorDetails.tsx).

import { BUILD } from '../build';

/** What a bug report needs: the message, which build, which browser. */
export function errorReport(message: string): string {
  return `${message}\n\nBuild ${BUILD.label} (${BUILD.commit})\n${navigator.userAgent}`;
}

/** A page left open across a deploy asks for files that no longer exist: that is not a bug, a reload fixes it. */
export function looksLikeNewVersion(message: string): boolean {
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(
    message,
  );
}
