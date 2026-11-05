import { useEffect, useState } from 'react';
import { formatRunTime, type RunClock } from './runClock';
import './runTimer.css';

export function RunTimer({ clock }: { clock: RunClock }) {
  const [elapsed, setElapsed] = useState(() => clock.elapsed());
  useEffect(() => {
    const tick = () => setElapsed(clock.elapsed());
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [clock]);
  return (
    <span
      className="run-timer"
      aria-label={`Run time ${formatRunTime(elapsed)}`}
      title="Time spent in this run, including idle time"
    >
      <small>Run time</small>
      <time>{formatRunTime(elapsed)}</time>
    </span>
  );
}
