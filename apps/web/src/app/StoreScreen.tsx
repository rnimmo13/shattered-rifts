// #/store: the Store. It will sell cosmetics only (never power: the game's pillars rule out pay-to-win); for now it says what is
// coming. Each shelf is a kind of cosmetic, shown as a locked tile with the Store's mark.

import { StoreIcon } from './StoreIcon';
import './store.css';

const SHELVES: { name: string; text: string }[] = [
  { name: 'Card backs', text: 'New designs for the back of every card you draw.' },
  { name: 'Riftwalker looks', text: 'Other outfits and colours for your Riftwalkers.' },
  { name: 'Battlefields', text: 'Arenas to fight on, from drowned halls to burning skies.' },
  { name: 'Card frames', text: 'Foil and gilded frames for the cards you love most.' },
  { name: 'Titles and banners', text: 'Show them on your Arena player card.' },
  { name: 'Emotes', text: 'Something to say to your opponent in the Arena.' },
];

export function StoreScreen() {
  return (
    <main className="store">
      <a className="btn btn--small store__back" href="#/">
        <span>Back</span>
      </a>
      <header className="store__head">
        <StoreIcon size={56} className="store__mark" />
        <div>
          <h1 className="store__title">Store</h1>
          <p className="store__lead">
            Coming soon. The Store will sell cosmetics only: ways to make the game look like yours.
            Nothing in it will ever make a deck stronger.
          </p>
        </div>
      </header>
      <ul className="store__shelves">
        {SHELVES.map((s) => (
          <li key={s.name} className="store__shelf">
            <StoreIcon size={34} />
            <b>{s.name}</b>
            <span>{s.text}</span>
            <i className="store__soon">Coming soon</i>
          </li>
        ))}
      </ul>
    </main>
  );
}
