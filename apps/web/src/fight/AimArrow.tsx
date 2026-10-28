// The aiming arrow, from the card being played to the pointer. Over a figure that can be chosen it locks on: its point snaps to
// the figure's centre, the line goes solid and a ring closes round the target (the figure itself is lit by Fighters.setHover).

export function AimArrow(props: {
  from: { x: number; y: number };
  /** where the pointer is */
  to: { x: number; y: number };
  /** the centre of the figure it has locked onto (client px), if any */
  lock?: { x: number; y: number } | null;
  className: string;
}) {
  const { from } = props;
  const end = props.lock ?? props.to;
  const locked = !!props.lock;
  const id = `${props.className}-ah`;
  return (
    <svg
      className={`${props.className} aimarrow${locked ? ' is-locked' : ''}`}
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--aim)" />
        </marker>
      </defs>
      <path
        d={`M ${from.x} ${from.y} Q ${(from.x + end.x) / 2} ${Math.min(end.y, from.y) - 140} ${end.x} ${end.y}`}
        fill="none"
        stroke="var(--aim)"
        strokeWidth={locked ? 6 : 5}
        strokeDasharray={locked ? '14 6' : '2 10'}
        strokeLinecap="round"
        markerEnd={`url(#${id})`}
      />
      {locked && (
        <g className="aimarrow__lock" transform={`translate(${end.x} ${end.y})`}>
          <circle r="34" fill="none" stroke="var(--aim)" strokeWidth="3" />
          <circle r="5" fill="var(--aim)" />
          {[0, 90, 180, 270].map((a) => (
            <line
              key={a}
              x1="40"
              y1="0"
              x2="52"
              y2="0"
              stroke="var(--aim)"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${a})`}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
