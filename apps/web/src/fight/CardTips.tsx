// The keyword explanations for the card in your hand under the pointer, placed beside the lifted card (on whichever side has
// room) instead of in a fixed corner. It never takes the pointer.

export interface CardTipItem {
  name: string;
  text: string;
}

export function CardTips(props: { items: CardTipItem[]; rect: DOMRect; cardWidth: number }) {
  const { rect, cardWidth: w } = props;
  const width = 320;
  const cx = rect.left + rect.width / 2;
  const half = w * 0.75; // the lifted card is 1.5x wide
  const gap = 14;
  const roomRight = cx + half + gap + width <= window.innerWidth - 8;
  const left = roomRight ? cx + half + gap : Math.max(8, cx - half - gap - width);
  // aligned with the top of the lifted card, kept on screen
  const top = Math.max(70, Math.min(rect.bottom - w * 2.72, window.innerHeight - 280));
  return (
    <aside className="tip tip--keywords" style={{ left, top, width }} aria-hidden>
      {props.items.map((k) => (
        <p key={k.name} className="tip__line">
          <b>{k.name}</b> {k.text}
        </p>
      ))}
    </aside>
  );
}
