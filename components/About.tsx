// components/About.tsx
// Блок «О клубе» в виде плеера.
// Автоматически листает «треки»: прогресс движется, в конце — следующий заголовок и текст.
// Можно переключать треки кнопками и ставить на паузу.

'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Длительность одного «трека» в мс (скорость прогресса)
const TRACK_DURATION = 12000;
// Шаг обновления прогресса
const TICK = 50;
/* -------------------------------------------------- */

export default function About() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0–100
  const [isPlaying, setIsPlaying] = useState(true);

  const track = TRACKS[trackIndex];

  const goTo = useCallback((index: number) => {
    setTrackIndex((index + TRACKS.length) % TRACKS.length);
    setProgress(0);
  }, []);

  const next = useCallback(() => goTo(trackIndex + 1), [goTo, trackIndex]);
  const prev = useCallback(() => goTo(trackIndex - 1), [goTo, trackIndex]);

  // Движение прогресса; на 100% — автоматически следующий трек
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress((p) => {
        const nextP = p + (TICK / TRACK_DURATION) * 100;
        if (nextP >= 100) {
          // Переключение трека после заполнения полосы
          setTrackIndex((i) => (i + 1) % TRACKS.length);
          return 0;
        }
        return nextP;
      });
    }, TICK);

    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <>
      <style>{ABOUT_CSS}</style>

      <section className="rsc-about" id="about">
        <div className="rsc-about__inner">
          {/* Заголовки блока */}
          <h2 className="rsc-about__heading">RockSession Club</h2>
          <p className="rsc-about__subheading">Философия клуба</p>

          {/* Обложка «альбома» — акцентный квадрат с логотипом */}
          <div className="rsc-about__cover">
            <Image
              src="/logo.png" // если есть чёрная версия логотипа — укажите её, будет как на макете
              alt="RockSession Club"
              width={140}
              height={140}
            />
          </div>

          {/* Название «трека» */}
          <h3 className="rsc-about__track-title" key={track.title}>
            {track.title}
          </h3>

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

/* Стили в константе — проверенный подход */
const ABOUT_CSS = `
  .rsc-about {
    background: #060606;
    padding: 110px 24px 130px;
  }

  .rsc-about__inner {
    max-width: 1100px;
    margin: 0 auto;
    text-align: center;
  }

  /* Главный заголовок — Tablon */
  .rsc-about__heading {
    margin: 0 0 10px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 72px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* Подзаголовок — Belepotan, акцентный */
  .rsc-about__subheading {
    margin: 0 0 56px;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(18px, 2.4vw, 26px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
  }

  /* Обложка: акцентный квадрат с логотипом */
  .rsc-about__cover {
    width: 220px;
    height: 220px;
    margin: 0 auto 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    border-radius: 4px;
    overflow: hidden;
  }

  /* Название «трека» — Tablon */
  .rsc-about__track-title {
    margin: 0 0 40px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(32px, 5vw, 56px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* Прогресс-бар */
  .rsc-about__progress {
    position: relative;
    max-width: 640px;
    height: 4px;
    margin: 0 auto 36px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 2px;
    cursor: pointer;
  }

  .rsc-about__progress-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: var(--accent);
    border-radius: 2px;
    transition: none; /* движение через JS, transition не нужен */
  }

  /* Кружок на полосе прогресса */
  .rsc-about__progress-knob {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    background: var(--accent);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 8px rgba(0, 195, 208, 0.6);
  }

  /* Кнопки плеера */
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
    color: var(--accent);
    transform: scale(1.1);
  }

  .rsc-about__control-btn:active {
    transform: scale(0.95);
  }

  .rsc-about__control-btn--play {
    width: 64px;
    height: 64px;
  }

  /* Описание — меняется вместе с треком */
  .rsc-about__description {
    max-width: 780px;
    margin: 0 auto;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.8vw, 18px);
    font-weight: 300;
    line-height: 1.75;
    color: #8e8e93;
  }

  /* ---------- Мобилка ---------- */
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