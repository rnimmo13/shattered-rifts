// Drawing on the act map (DECISIONS #506): a pen with a choice of colours and an eraser, to plan a path. Pick a tool and drag on the map;
// a tap on a stop you can go to still goes there, so nobody has to put the pen down to move on.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TOOL_ICONS } from '../art/gameIcons';
import { GameIcon } from '../ui/GameIcon';
import {
  MAX_STROKES,
  PEN_COLORS,
  eraseInk,
  extendStroke,
  loadInk,
  loadPenColor,
  saveInk,
  savePenColor,
  strokePath,
  type InkStroke,
} from './inkDrawing';

type Tool = 'pen' | 'eraser' | null;
const ERASER_RADIUS = 14;
/** A press that stays this close to where it began (px) is a tap. */
const TAP_PX = 5;

export interface MapInkState {
  strokes: InkStroke[];
  setStrokes: (s: InkStroke[]) => void;
  /** after a stroke or a rub is finished */
  commit: (s: InkStroke[]) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
}

/** The drawing for one map. `inkKey` names the map; with none, nothing is kept. */
export function useMapInk(inkKey: string | undefined): MapInkState {
  const [strokes, setStrokes] = useState<InkStroke[]>(() => (inkKey ? loadInk(inkKey) : []));
  const [tool, setTool] = useState<Tool>(null);
  const [color, setColorState] = useState(loadPenColor);
  // (turning the screen shows another layout with its own drawing, and a new act its own map)
  const shown = useRef(inkKey);
  useEffect(() => {
    if (shown.current === inkKey) return;
    shown.current = inkKey;
    setStrokes(inkKey ? loadInk(inkKey) : []);
  }, [inkKey]);
  return {
    strokes,
    setStrokes,
    commit: (s) => {
      const kept = s.slice(-MAX_STROKES);
      setStrokes(kept);
      if (inkKey) saveInk(inkKey, kept);
    },
    tool,
    setTool,
    color,
    setColor: (c) => {
      setColorState(c);
      savePenColor(c);
    },
  };
}

/** The pen, its colours, the eraser and a button that wipes the drawing. */
export function MapInkTools({ ink }: { ink: MapInkState }) {
  const toggle = (t: Exclude<Tool, null>) => ink.setTool(ink.tool === t ? null : t);
  return (
    <div className="mapink__dock">
      <div className="mapink" role="toolbar" aria-label="Draw on the map">
        <button
          type="button"
          className={`mapink__tool${ink.tool === 'pen' ? ' is-on' : ''}`}
          aria-pressed={ink.tool === 'pen'}
          onClick={() => toggle('pen')}
        >
          <GameIcon art={TOOL_ICONS.pen} />
          Draw
        </button>
        <span className="mapink__colors" role="group" aria-label="Pen colour">
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`mapink__color${ink.color === c.id ? ' is-on' : ''}`}
              style={{ background: c.id }}
              aria-label={c.name}
              aria-pressed={ink.color === c.id}
              title={c.name}
              onClick={() => {
                ink.setColor(c.id);
                ink.setTool('pen');
              }}
            />
          ))}
        </span>
        <button
          type="button"
          className={`mapink__tool${ink.tool === 'eraser' ? ' is-on' : ''}`}
          aria-pressed={ink.tool === 'eraser'}
          onClick={() => toggle('eraser')}
        >
          <GameIcon art={TOOL_ICONS.eraser} />
          Erase
        </button>
        <button
          type="button"
          className="mapink__tool"
          disabled={ink.strokes.length === 0}
          onClick={() => {
            ink.commit([]);
            if (ink.tool === 'eraser') ink.setTool(null);
          }}
        >
          <GameIcon art={TOOL_ICONS.clear} />
          Clear
        </button>
      </div>
    </div>
  );
}

/** A tap (no drag) with a tool in hand: the stop under it, if it can be gone to. */
function openStopAt(x: number, y: number): HTMLButtonElement | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const stop = el.closest<HTMLButtonElement>('button.mapnode');
    if (stop) return stop.disabled ? null : stop;
  }
  return null;
}

/** The drawing itself, over the map's w x h. It only catches the pointer while a tool is in hand. */
export function MapInkLayer({ ink, w, h }: { ink: MapInkState; w: number; h: number }) {
  const svg = useRef<SVGSVGElement>(null);
  // (one pointer draws at a time, with the tool it started with. What it has done so far lives here and not in state: several moves can
  // arrive before the screen redraws, and the last one comes just before the pointer lifts)
  const drag = useRef<{
    id: number;
    tool: Exclude<Tool, null>;
    start: { x: number; y: number };
    last: { x: number; y: number };
    moved: boolean;
    pts: number[];
    strokes: InkStroke[];
  } | null>(null);
  const [draft, setDraft] = useState<number[] | null>(null);
  const [rubber, setRubber] = useState<{ x: number; y: number } | null>(null);

  const local = (e: ReactPointerEvent): { x: number; y: number } => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * h) / r.height };
  };

  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!ink.tool || e.button !== 0 || drag.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const at = local(e);
    const d = {
      id: e.pointerId,
      tool: ink.tool,
      start: at,
      last: at,
      moved: false,
      pts: extendStroke([], at.x, at.y, w, h),
      strokes: ink.strokes,
    };
    drag.current = d;
    if (d.tool === 'pen') {
      setDraft(d.pts);
    } else {
      d.strokes = eraseInk(d.strokes, at, at, ERASER_RADIUS, w, h);
      ink.setStrokes(d.strokes);
    }
  };

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (d && d.id !== e.pointerId) return;
    const at = local(e);
    if (ink.tool === 'eraser') setRubber(at);
    if (!d) return;
    // (how far from where it began, so a slow line is still a line and not a tap)
    if (Math.hypot(at.x - d.start.x, at.y - d.start.y) >= TAP_PX) d.moved = true;
    if (d.tool === 'pen') {
      d.pts = extendStroke(d.pts, at.x, at.y, w, h);
      setDraft(d.pts);
    } else {
      d.strokes = eraseInk(d.strokes, d.last, at, ERASER_RADIUS, w, h);
      ink.setStrokes(d.strokes);
    }
    d.last = at;
  };

  const onUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const stop = d.moved ? null : openStopAt(e.clientX, e.clientY);
    if (d.tool === 'pen') {
      if (!stop) ink.commit([...ink.strokes, { color: ink.color, pts: d.pts }]);
      setDraft(null);
    } else {
      ink.commit(d.strokes);
    }
    stop?.click();
  };

  const onCancel = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDraft(null);
    if (d.tool === 'eraser') ink.commit(d.strokes);
  };

  return (
    <svg
      ref={svg}
      className={`mapink__layer${ink.tool ? ` is-${ink.tool}` : ''}`}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      onPointerLeave={() => setRubber(null)}
      aria-hidden
    >
      {ink.strokes.map((s, i) => (
        <path key={i} className="mapink__stroke" d={strokePath(s.pts, w, h)} stroke={s.color} />
      ))}
      {draft && <path className="mapink__stroke" d={strokePath(draft, w, h)} stroke={ink.color} />}
      {ink.tool === 'eraser' && rubber && (
        <circle className="mapink__rubber" cx={rubber.x} cy={rubber.y} r={ERASER_RADIUS} />
      )}
    </svg>
  );
}
