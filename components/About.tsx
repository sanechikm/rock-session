// components/About.tsx
// Блок «О клубе» в виде плеера.
// Автопрокрутка треков; смена: старый заголовок уезжает в сторону переключения,
// новый выезжает с противоположной. Появление блока — при прокрутке.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

/* ---------- ДАННЫЕ (позже — из Supabase) ---------- */
type Track = {
  title: string;
  description: string;
};

const TRACKS: Track[] = [
  {
    title: 'О нас',
    description:
      'Мы собираемся в лучших локациях города, чтобы разделить живой звук, изысканный ужин и атмосферу абсолютного доверия. Здесь каждый гость — не случайный человек. Мы в ответе за тех, кого пригласили.',
  },
  {
    title: 'Премиум',
    description:
      'Каждая встреча клуба — это закрытый формат с продуманной программой, где сервис, кухня и звук работают на один результат — ваше впечатление.',
  },
  {
    title: 'Преимущества',
    description:
      'Живой звук без фонограмм, камерная аудитория и уют лучших ресторанов города. Никаких случайных людей — только гости по списку.',
  },
  {
    title: 'Настроение',
    description:
      'Мы создаём атмосферу, в которую хочется возвращаться: свет, музыка и люди складываются в один вечер, который хочется переслушать.',
  },
  {
    title: 'Качество',
    description:
      'Профессиональные музыканты, отборные локации и внимание к каждой детали — от звука до сервировки. Для нас качество — не опция, а стандарт.',
  },
];

/* Длительность «трека»: скорость прогресса (мс) */
const TRACK_DURATION = 12000;
/* Шаг обновления прогресса */
const TICK = 50;
/* -------------------------------------------------- */

type SlideDir = 'next' | 'prev';

export default function About() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0–100
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideDir, setSlideDir] = useState<SlideDir>('next');
  /* Уезжающий трек (для анимации исчезновения) */
  const [exiting, setExiting] = useState<{ title: string; dir: SlideDir } | null>(null);
  /* Появление блока при прокрутке */
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const track = TRACKS[trackIndex];

  /* ---------- Появление блока в зоне видимости ---------- */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ---------- Переключение трека с анимацией ---------- */
  const goTo = useCallback(
    (index: number, dir: SlideDir) => {
      setExiting({ title: TRACKS[trackIndex].title, dir });
      setSlideDir(dir);
      setTrackIndex((index + TRACKS.length) % TRACKS.length);
      setProgress(0);
      // Убираем уезжающий заголовок после конца анимации
      setTimeout(() => setExiting(null), 650);
    },
    [trackIndex]
  );

  const next = useCallback(() => goTo(trackIndex + 1, 'next'), [goTo, trackIndex]);
  const prev = useCallback(() => goTo(trackIndex - 1, 'prev'), [goTo, trackIndex]);

  /* ---------- Движение прогресса; на 100% — следующий трек ---------- */
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress((p) => {
        const nextP = p + (TICK / TRACK_DURATION) * 100;
        if (nextP >= 100) {
          // Автопереключение — как «вперёд»
          setExiting({ title: TRACKS[trackIndex].title, dir: 'next' });
          setSlideDir('next');
          setTrackIndex((i) => (i + 1) % TRACKS.length);
          setTimeout(() => setExiting(null), 650);
          return 0;
        }
        return nextP;
      });
    }, TICK);

    return () => clearInterval(timer);
  }, [isPlaying, trackIndex]);

  return (
    <>
      <style>{ABOUT_CSS}</style>

      <section
        className={'rsc-about' + (inView ? ' rsc-about--in' : '')}
        id="about"
        ref={sectionRef}
      >
        <div className="rsc-about__inner">
          {/* Заголовки блока */}
          <h2 className="rsc-about__heading">RockSession Club</h2>
          <p className="rsc-about__subheading">Философия клуба</p>

          {/* Обложка «альбома» */}
          <div className="rsc-about__cover">
            <Image
              src="/logo_black.png"
              alt="RockSession Club"
              width={140}
              height={140}
            />
          </div>

          {/* Название «трека»: уезжающий + новый */}
          <div className="rsc-about__track-window" aria-live="polite">
            {exiting && (
              <h3
                key={'exit-' + exiting.title}
                className={
                  'rsc-about__track-title rsc-about__track-title--exit' +
                  (exiting.dir === 'next'
                    ? ' rsc-about__track-title--exit-left'
                    : ' rsc-about__track-title--exit-right')
                }
              >
                {exiting.title}
              </h3>
            )}
            <h3
              key={track.title}
              className={
                'rsc-about__track-title' +
                (slideDir === 'next'
                  ? ' rsc-about__track-title--in-right'
                  : ' rsc-about__track-title--in-left')
              }
            >
              {track.title}
            </h3>
          </div>

          {/* Прогресс-бар */}
          <div
            className="rsc-about__progress"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="rsc-about__progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="rsc-about__progress-knob"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Кнопки управления */}
          <div className="rsc-about__controls">
            <button
              className="rsc-about__control-btn"
              onClick={prev}
              aria-label="Предыдущий"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>

            <button
              className="rsc-about__control-btn rsc-about__control-btn--play"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Пауза' : 'Играть'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              className="rsc-about__control-btn"
              onClick={next}
              aria-label="Следующий"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>
          </div>

          {/* Описание текущего «трека» */}
          <p className="rsc-about__description" key={track.description}>
            {track.description}
          </p>
        </div>
      </section>
    </>
  );
}

const ABOUT_CSS = `
  .rsc-about {
    background: #060606;
    padding: 110px 24px 130px;
    opacity: 0;
    transform: translateY(36px);
    transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  /* Появление блока при прокрутке */
  .rsc-about--in {
    opacity: 1;
    transform: translateY(0);
  }

  .rsc-about__inner {
    max-width: 1100px;
    margin: 0 auto;
    text-align: center;
  }

  .rsc-about__heading {
    margin: 0 0 10px;
    font-family: 'Tablon', 'Arial Narrow', 'Arial', sans-serif;
    font-size: clamp(34px, 5.5vw, 64px);
    line-height: 1;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-about__subheading {
    margin: 0 0 56px;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-about__cover {
    width: 220px;
    height: 220px;
    margin: 0 auto 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent, #00c3d0);
    border-radius: 4px;
    overflow: hidden;
  }

  /* ---------- Окно названия трека: обрезает уезжающие заголовки ---------- */
  .rsc-about__track-window {
    position: relative;
    height: clamp(40px, 5vw, 62px);
    margin: 0 0 40px;
    overflow: hidden;
  }

  .rsc-about__track-title {
    position: absolute;
    inset: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Tablon', 'Arial Narrow', 'Arial', sans-serif;
    font-size: clamp(32px, 5vw, 54px);
    line-height: 1;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
    white-space: nowrap;
  }

  /* Въезд нового: справа (при «вперёд») или слева (при «назад») */
  .rsc-about__track-title--in-right {
    animation: rsc-title-in-right 0.35s cubic-bezier(0.22, 0.8, 0.3, 1) 0.18s both;
  }
  .rsc-about__track-title--in-left {
    animation: rsc-title-in-left 0.35s cubic-bezier(0.22, 0.8, 0.3, 1) 0.18s both;
  }

  /* Выезд старого: влево (при «вперёд») или вправо (при «назад») */
  .rsc-about__track-title--exit {
    animation-duration: 0.35s;
    animation-timing-function: cubic-bezier(0.55, 0, 0.8, 0.4);
    animation-fill-mode: both;
  }
  .rsc-about__track-title--exit-left {
    animation-name: rsc-title-out-left;
  }
  .rsc-about__track-title--exit-right {
    animation-name: rsc-title-out-right;
  }

  @keyframes rsc-title-in-right {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes rsc-title-in-left {
    from { opacity: 0; transform: translateX(-48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes rsc-title-out-left {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-48px); }
  }
  @keyframes rsc-title-out-right {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(48px); }
  }

  /* ---------- Прогресс-бар ---------- */
  .rsc-about__progress {
    position: relative;
    max-width: 640px;
    height: 4px;
    margin: 0 auto 36px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 2px;
  }

  .rsc-about__progress-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: var(--accent, #00c3d0);
    border-radius: 2px;
  }

  .rsc-about__progress-knob {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    background: var(--accent, #00c3d0);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 8px rgba(0, 195, 208, 0.6);
  }

  .rsc-about__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48px;
    margin-bottom: 56px;
  }

  .rsc-about__control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    padding: 0;
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    transition: color 0.25s ease, transform 0.2s ease;
  }

  .rsc-about__control-btn:hover {
    color: var(--accent, #00c3d0);
    transform: scale(1.1);
  }

  .rsc-about__control-btn:active {
    transform: scale(0.95);
  }

  .rsc-about__control-btn--play {
    width: 64px;
    height: 64px;
  }

  /* Описание: лёгкая смена с той же разноскоростью */
  .rsc-about__description {
    max-width: 780px;
    margin: 0 auto;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.8vw, 18px);
    font-weight: 300;
    line-height: 1.75;
    color: #8e8e93;
    animation: rsc-desc-in 0.5s ease both;
  }

  @keyframes rsc-desc-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .rsc-about {
      padding: 80px 20px 90px;
    }

    .rsc-about__cover {
      width: 170px;
      height: 170px;
      margin-bottom: 36px;
    }

    .rsc-about__controls {
      gap: 32px;
      margin-bottom: 44px;
    }
  }
`;