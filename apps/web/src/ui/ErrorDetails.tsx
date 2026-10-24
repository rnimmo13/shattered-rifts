// The text of an error, selectable, with a button that copies it (plus the build and browser) for a bug report.

import { useRef, useState } from 'react';
import { errorReport } from './errorReport';

export function ErrorDetails({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  const text = errorReport(message);
  const box = useRef<HTMLPreElement>(null);
  const copy = (): void => {
    const done = (): void => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };
    // the clipboard API needs a secure page; fall back to selecting the text so Ctrl+C still works
    const select = (): void => {
      const el = box.current;
      if (el) window.getSelection()?.selectAllChildren(el);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, select);
    else select();
  };
  return (
    <div className="errdetails">
      <pre className="errdetails__text" tabIndex={0} ref={box}>
        {text}
      </pre>
      <button className="btn btn--small" onClick={copy}>
        <span>{copied ? 'Copied' : 'Copy the error'}</span>
      </button>
    </div>
  );
}
