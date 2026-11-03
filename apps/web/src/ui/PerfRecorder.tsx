// The pill shown while a performance report is being recorded (DECISIONS #572): the player plays as usual, then stops it here,
// and the Settings menu opens with the report to copy.

import { useEffect, useState } from 'react';
import { isRecording, onRecordingChange, stopRecording } from '../app/perfReport';
import { openSettings } from '../app/settings';

export function PerfRecorder() {
  const [on, setOn] = useState(isRecording);
  useEffect(() => onRecordingChange(() => setOn(isRecording())), []);
  if (!on) return null;
  return (
    <div className="perfpill" role="status">
      <span className="perfpill__dot" aria-hidden />
      <span>Recording performance</span>
      <button
        type="button"
        className="btn btn--small"
        onClick={() => {
          stopRecording();
          openSettings();
        }}
      >
        <span>Stop</span>
      </button>
    </div>
  );
}
