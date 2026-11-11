// One face-down card of a card back, upright (the Collection, the earned popup and log), and the words for a cosmetic and for an
// entry of the earned log (DECISIONS #739).

import { useState } from 'react';
import { RIFTWALKERS, cosmeticDef, skinDef, type HeroId } from '@sr/content/v2';
import type { Earned } from '@sr/pvp';
import { skinName } from '../art/skins';
import { cardBackCrestUrl, cardBackFaceUrl } from './cardBack';
import './cardback.css';

/** A card back as one card: `back` undefined is the one everyone starts with (the S|R crest). */
export function CardBackFace(props: {
  back?: string | undefined;
  width?: number;
  locked?: boolean;
}) {
  const face = cardBackFaceUrl(props.back);
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`cardback${props.locked ? ' is-locked' : ''}`}
      style={props.width ? { width: props.width } : undefined}
      aria-hidden
    >
      {face && !failed ? (
        <img className="cardback__face" src={face} alt="" onError={() => setFailed(true)} />
      ) : (
        <img className="cardback__crest" src={cardBackCrestUrl(props.back)} alt="" />
      )}
    </span>
  );
}

const heroName = (hero: string): string =>
  Object.hasOwn(RIFTWALKERS, hero) ? RIFTWALKERS[hero as HeroId].hero.name : hero;

/** A cosmetic's name as players see it. */
export function cosmeticName(id: string): string {
  const def = cosmeticDef(id);
  if (!def) return id;
  if (def.kind === 'skin') {
    const skin = skinDef(id);
    return skin ? `${skinName(skin)} (${heroName(skin.hero)})` : id;
  }
  if (def.crest) return `${heroName(def.crest)} card back`;
  return def.kind === 'cardBack' ? 'Card back' : 'Name plate';
}

/** An entry of the earned log in words: what happened, and what it gave. */
export function earnedWords(e: Earned): { title: string; text: string } {
  const def = cosmeticDef(e.cosmetic);
  const name = cosmeticName(e.cosmetic);
  if (e.why === 'mastery' && def?.crest) {
    const hero = heroName(def.crest);
    return {
      title: `${hero} mastered`,
      text: `You cleared the campaign as the ${hero}. The ${name} is yours to keep: its crest on the back of every card you draw.`,
    };
  }
  if (e.why === 'season') return { title: 'Season reward', text: `${name}, yours to keep.` };
  return { title: 'A gift', text: `${name}, yours to keep.` };
}
