// components/Videos.tsx
// Блок «Видео» — горизонтальная лента с затемнением справа.
// Данные из Supabase: таблица videos (visible + sort_order из админки).
// Клик по превью — переход по ссылке на видео.

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Video = {
  id: number;
  title: string;
  date: string;
  preview: string | null;
  video_url: string;
};

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, title, date, preview, video_url')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setVideos(data || []);
      setLoading(false);
    })();
  }, []);

  // Проверяем, можно ли листать дальше вправо
  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, videos]);

  const scrollRight = () => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75, behavior: 'smooth' });
  };

  if (!loading && videos.length === 0) return null;

  return (
    <>
      <style>{VIDEOS_CSS}</style>

      <section className="rsc-videos" id="videos">
        <div className="rsc-videos__inner">
          <h2 className="rsc-videos__heading">Видео с наших вечеров</h2>
          <p className="rsc-videos__subheading">Драйв, эмоции и живой звук</p>

          <div className="rsc-videos__carousel">
            {/* Горизонтальная лента */}
            <div className="rsc-videos__track" ref={trackRef} onScroll={checkScroll}>
              {videos.map((video) => (
                <article key={video.id} className="rsc-videos__card">
                  <a
                    href={video.video_url}
                    className="rsc-videos__preview"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Смотреть: ${video.title}`}
                  >
                    {video.preview ? (
                      <img
                        src={video.preview}
                        alt={video.title}
                        className="rsc-videos__img"
                        loading="lazy"
                      />
                    ) : (
                      <span className="rsc-videos__placeholder" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
                        </svg>
                      </span>
                    )}
                    <span className="rsc-videos__shade" aria-hidden="true" />
                    <span className="rsc-videos__play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </a>

                  <div className="rsc-videos__meta">
                    <h3 className="rsc-videos__title">{video.title}</h3>
                    <span className="rsc-videos__date">{video.date}</span>
                  </div>
                </article>
              ))}
            </div>

            {canScrollRight && (
              <div className="rsc-videos__fade" aria-hidden="true" />
            )}

            {canScrollRight && (
              <button
                className="rsc-videos__arrow"
                onClick={scrollRight}
                aria-label="Листать вправо"
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const VIDEOS_CSS = `
  .rsc-videos {
    background: #060606;
    padding: 110px 24px 120px;
  }

  .rsc-videos__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-videos__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1.05;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-videos__subheading {
    margin: 0 0 56px;
    text-align: center;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-videos__carousel {
    position: relative;
  }

  .rsc-videos__track {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
  }

  .rsc-videos__track::-webkit-scrollbar {
    display: none;
  }

  .rsc-videos__card {
    flex-shrink: 0;
    width: min(520px, 82vw);
  }

  .rsc-videos__preview {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    overflow: hidden;
    background: #141414;
  }

  .rsc-videos__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  /* Заглушка, если превью нет */
  .rsc-videos__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #464646;
  }

  .rsc-videos__shade {
    position: absolute;
    inset: 0;
    background: rgba(6, 6, 6, 0.35);
    transition: background 0.3s ease;
  }

  .rsc-videos__play {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    color: #ffffff;
    transform: translate(-50%, -50%);
    transition: color 0.3s ease, transform 0.3s ease;
  }

  .rsc-videos__preview:hover .rsc-videos__img {
    transform: scale(1.05);
  }

  .rsc-videos__preview:hover .rsc-videos__shade {
    background: color-mix(in srgb, var(--accent, #00c3d0) 15%, transparent);
  }

  .rsc-videos__preview:hover .rsc-videos__play {
    color: var(--accent, #00c3d0);
    transform: translate(-50%, -50%) scale(1.12);
  }

  .rsc-videos__meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 4px 0;
  }

  .rsc-videos__title {
    margin: 0;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(17px, 2vw, 22px);
    line-height: 1.2;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-videos__date {
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8e8e93;
  }

  .rsc-videos__fade {
    position: absolute;
    top: 0; right: 0; bottom: 8px;
    width: 22%;
    background: linear-gradient(
      to right,
      rgba(6, 6, 6, 0) 0%,
      rgba(6, 6, 6, 0.75) 60%,
      #060606 100%
    );
    pointer-events: none;
  }

  .rsc-videos__arrow {
    position: absolute;
    top: 32%;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    padding: 0;
    background: rgba(20, 20, 20, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: #ffffff;
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease, border-color 0.25s ease;
  }

  .rsc-videos__arrow:hover {
    background: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
    color: #060606;
    transform: translateX(3px);
  }

  @media (max-width: 640px) {
    .rsc-videos {
      padding: 80px 16px 90px;
    }

    .rsc-videos__card {
      width: 85vw;
    }

    .rsc-videos__play {
      width: 56px;
      height: 56px;
    }

    .rsc-videos__arrow {
      width: 44px;
      height: 44px;
      right: 8px;
    }
  }
`;