// #/models: every Riftwalker, companion and enemy standing side by side, so look-alikes are easy to spot (a dev page; no link).

import { useEffect, useRef } from 'react';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { heroFigure, unitFigure } from './art';
import '../play/play.css';

function Figure(props: { src: HTMLCanvasElement; name: string; note: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    const k = Math.min(c.width / props.src.width, c.height / props.src.height);
    const w = props.src.width * k;
    const h = props.src.height * k;
    g.drawImage(props.src, (c.width - w) / 2, c.height - h, w, h);
  }, [props.src]);
  return (
    <figure className="bestiary__fig">
      <canvas ref={ref} width={200} height={260} />
      <figcaption>
        <b>{props.name}</b>
        <small>{props.note}</small>
      </figcaption>
    </figure>
  );
}

export function Bestiary() {
  const units = Object.values(COMBAT_DB.units).filter((u) => !u.id.endsWith('+'));
  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <h1 className="setup__title">Models</h1>
      <h2 className="setup__h">Riftwalkers</h2>
      <div className="bestiary">
        {Object.values(RIFTWALKERS).map((r) => (
          <Figure key={r.hero.id} src={heroFigure(r.hero.id)} name={r.hero.name} note={r.role} />
        ))}
      </div>
      <h2 className="setup__h">Companions</h2>
      <div className="bestiary">
        {units
          .filter((u) => u.brain.kind === 'ally')
          .map((u) => (
            <Figure key={u.id} src={unitFigure(u.id)} name={u.name} note={`${u.maxHp} HP`} />
          ))}
      </div>
      <h2 className="setup__h">Enemies</h2>
      <div className="bestiary">
        {units
          .filter((u) => u.brain.kind === 'enemy')
          .map((u) => (
            <Figure key={u.id} src={unitFigure(u.id)} name={u.name} note={`${u.maxHp} HP`} />
          ))}
      </div>
    </main>
  );
}
