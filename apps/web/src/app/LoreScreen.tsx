import { useEffect, useRef, useState } from 'react';
import { RIFTWALKERS } from '@sr/content/v2';
import { LORE_CHAPTERS, LORE_WORLDS, loreImage } from './lore';
import { loadGraphicsQuality, loadEffectsMode } from '../duel/effects';
import { useSettingsChanged } from './settings';
import { SettingsButton } from '../ui/SettingsButton';
import { setActiveRun } from '../run/saves';
import './lore.css';

const gallery = [
  ...LORE_CHAPTERS.flatMap((c) =>
    c.panels.map((p) => ({ image: p.image, title: p.title, text: p.alt })),
  ),
  ...LORE_WORLDS.map((w) => ({ image: w.image, title: w.name, text: w.text })),
];
const reduceMotion = (): boolean =>
  loadGraphicsQuality() === 'low' ||
  loadEffectsMode() === 'reduced' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export default function LoreScreen() {
  const page = useRef<HTMLElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<number | null>(null),
    [still, setStill] = useState(reduceMotion);
  useSettingsChanged(() => setStill(reduceMotion()));
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = (): void => setStill(reduceMotion());
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const panels = page.current?.querySelectorAll('.lore__panel');
    if (!panels || still || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    panels.forEach((panel) => {
      panel.classList.add('is-observed');
      observer.observe(panel);
    });
    return () => {
      observer.disconnect();
      panels.forEach((panel) => panel.classList.remove('is-observed'));
    };
  }, [still]);
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  const show = (image: string): void =>
    setSelected(gallery.findIndex((item) => item.image === image));
  const item = selected === null ? null : gallery[selected];
  return (
    <main className="lore" ref={page}>
      <header className="lore__bar">
        <a className="btn btn--small btn--ghost" href="#/">
          Home
        </a>
        <span>The Chronicle</span>
        <SettingsButton />
      </header>
      <section className="lore__hero" aria-labelledby="lore-title">
        <img
          src={loreImage('key-art')}
          srcSet={`${loreImage('key-art', true)} 640w, ${loreImage('key-art')} 1440w`}
          sizes="100vw"
          fetchPriority="high"
          width="1440"
          height="810"
          alt="The default Knight, Engineer, Trickster and Spellblade stand before worlds joined by a broken Ward."
        />
        <div className="lore__intro">
          <p className="lore__eyebrow">The story of Shattered Rifts</p>
          <h1 id="lore-title">
            A world to save.
            <br />A shard to take.
          </h1>
          <p>
            There were many worlds, and for an age they never touched. Each was sealed inside the
            Ward, and each had a Warden to keep it.
          </p>
          <p>
            Then Valerion shattered a vast section of the Ward. A few can walk the Rifts and live.
            They are the Riftwalkers—and there are not enough shards for everyone.
          </p>
          <button
            className="btn btn--small"
            onClick={() =>
              document
                .getElementById('worlds-apart')
                ?.scrollIntoView({ behavior: still ? 'instant' : 'smooth' })
            }
          >
            Begin the story ↓
          </button>
        </div>
      </section>
      <nav className="lore__chapters" aria-label="Story chapters">
        {LORE_CHAPTERS.map((chapter, i) => (
          <button
            key={chapter.id}
            onClick={() =>
              document
                .getElementById(chapter.id)
                ?.scrollIntoView({ behavior: still ? 'instant' : 'smooth' })
            }
          >
            <span>0{i + 1}</span>
            {chapter.title.replace('The ', '')}
          </button>
        ))}
        <button
          onClick={() =>
            document
              .getElementById('lore-worlds')
              ?.scrollIntoView({ behavior: still ? 'instant' : 'smooth' })
          }
        >
          The Worlds
        </button>
      </nav>
      <div className="lore__story">
        {LORE_CHAPTERS.map((chapter, i) => (
          <section
            className="lore__chapter"
            id={chapter.id}
            key={chapter.id}
            aria-labelledby={`${chapter.id}-title`}
          >
            <header>
              <p className="lore__eyebrow">Chapter 0{i + 1}</p>
              <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
              <p>{chapter.subtitle}</p>
            </header>
            {chapter.introduction && (
              <div className="lore__chapterIntro">
                {chapter.introduction.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}
            {chapter.panels.map((panel, j) => (
              <article
                className={`lore__panel${j % 2 ? ' lore__panel--reverse' : ''}`}
                key={panel.image}
              >
                <button
                  className="lore__art"
                  onClick={() => show(panel.image)}
                  aria-label={`Enlarge artwork: ${panel.title}`}
                >
                  <img
                    src={loreImage(panel.image)}
                    srcSet={`${loreImage(panel.image, true)} 640w, ${loreImage(panel.image)} 1440w`}
                    sizes="(max-width: 750px) 100vw, 60vw"
                    loading="lazy"
                    decoding="async"
                    width="1440"
                    height="960"
                    alt={panel.alt}
                  />
                  <span>View artwork ↗</span>
                </button>
                <div className="lore__caption">
                  <span className="lore__number">
                    {String(i + 1).padStart(2, '0')} / {String(j + 1).padStart(2, '0')}
                  </span>
                  <h3>{panel.title}</h3>
                  <p>{panel.text}</p>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
      <section className="lore__worlds" id="lore-worlds" aria-labelledby="lore-worlds-title">
        <header>
          <p className="lore__eyebrow">Eight places in a broken universe</p>
          <h2 id="lore-worlds-title">The Worlds</h2>
          <p>Every world has its own laws. Every Riftwalker has a home worth saving.</p>
        </header>
        <div className="lore__worldGrid">
          {LORE_WORLDS.map((world) => (
            <article className="lore__world" key={world.id}>
              <button
                className="lore__worldArt"
                onClick={() => show(world.image)}
                aria-label={`Enlarge artwork: ${world.name}`}
              >
                <img
                  src={loreImage(world.image)}
                  srcSet={`${loreImage(world.image, true)} 640w, ${loreImage(world.image)} 1440w`}
                  sizes="(max-width: 750px) 100vw, 45vw"
                  loading="lazy"
                  width="1440"
                  height="960"
                  alt={`${world.name}: ${world.text}`}
                />
              </button>
              <div className="lore__worldText">
                <h3>{world.name}</h3>
                <p>{world.text}</p>
                {world.note && <small>{world.note}</small>}
                <div className="lore__heroes">
                  {world.heroes.map((id) => (
                    <figure key={id}>
                      <img
                        src={`${import.meta.env.BASE_URL}art/figures/hero-${id}.png`}
                        loading="lazy"
                        width="56"
                        height="80"
                        alt={`Default ${RIFTWALKERS[id].hero.name}`}
                      />
                      <figcaption>{RIFTWALKERS[id].hero.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="lore__end">
        <img
          src={`${import.meta.env.BASE_URL}branding/logo-192.png`}
          width="72"
          height="72"
          alt=""
        />
        <h2>Which world will you fight for?</h2>
        <p>The Ward is broken. The road is open.</p>
        <a className="btn" href="#/run" onClick={() => setActiveRun(null)}>
          Walk the Rifts
        </a>
        <a href="#/learn">Learn how to play</a>
        <small>AI-assisted concept artwork · The story continues to grow.</small>
      </footer>
      <dialog
        className="lore__viewer"
        ref={dialog}
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (selected === null) return;
          if (event.key === 'ArrowRight') setSelected((selected + 1) % gallery.length);
          if (event.key === 'ArrowLeft')
            setSelected((selected + gallery.length - 1) % gallery.length);
        }}
      >
        {item && (
          <div>
            <header>
              <h2>{item.title}</h2>
              <button className="btn btn--small" autoFocus onClick={() => setSelected(null)}>
                Close
              </button>
            </header>
            <img src={loreImage(item.image)} alt={item.text} />
            <p>{item.text}</p>
            <nav aria-label="Artwork">
              <button
                className="btn btn--small"
                onClick={() => setSelected(((selected ?? 0) + gallery.length - 1) % gallery.length)}
              >
                ← Previous
              </button>
              <span>
                {(selected ?? 0) + 1} / {gallery.length}
              </span>
              <button
                className="btn btn--small"
                onClick={() => setSelected(((selected ?? 0) + 1) % gallery.length)}
              >
                Next →
              </button>
            </nav>
          </div>
        )}
      </dialog>
    </main>
  );
}
