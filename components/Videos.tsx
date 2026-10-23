// components/Videos.tsx
// Блок «Видео» — горизонтальная лента с затемнением справа.
// Стрелки с обеих сторон для листания; стрелки гаснут на краях ленты.
// Данные из Supabase (visible + sort_order из админки).

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
  const [playing, setPlaying] = useState<Video | null>(null); // видео, открытое в плеере
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  /* Появление блока при прокрутке */
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

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

  useEffect(() => {
    if (loading) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  /* Проверяем, можно ли листать в каждую сторону */
  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, videos]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75 * dir, behavior: 'smooth' });
  };

  if (!loading && videos.length === 0) return null;

  return (
    <>
      <style>{VIDEOS_CSS}</style>

      <section
        className={'rsc-videos' + (inView ? ' rsc-videos--in' : '')}
        id="videos"
        ref={sectionRef}
      >
        <div className="rsc-videos__inner">
          <h2 className="rsc-videos__heading">Видео с наших вечеров</h2>
          <p className="rsc-videos__subheading">Драйв, эмоции и живой звук</p>

          <div className="rsc-videos__carousel">
            {/* Горизонтальная лента */}
            <div
              className={
                'rsc-videos__track' +
                (videos.length > 2 ? '' : ' rsc-videos__track--few')
              }
              ref={trackRef}
              onScroll={checkScroll}
            >
              {videos.map((video, i) => (
                <article
                  key={video.id}
                  className="rsc-videos__card"
                  style={{ transitionDelay: inView ? `${0.2 + i * 0.08}s` : '0s' }}
                >
                  <button
                    type="button"
                    onClick={() => setPlaying(video)}
                    className="rsc-videos__preview"
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
                  </button>

                  <div className="rsc-videos__meta">
                    <h3 className="rsc-videos__title">{video.title}</h3>
                    <span className="rsc-videos__date">{video.date}</span>
                  </div>
                </article>
              ))}
            </div>

            {/* Затемнение справа — пока можно листать дальше */}
            {canScrollRight && (
              <div className="rsc-videos__fade" aria-hidden="true" />
            )}

            {/* Стрелка влево */}
            {canScrollLeft && (
              <button
                className="rsc-videos__arrow rsc-videos__arrow--left"
                onClick={() => scrollBy(-1)}
                aria-label="Листать влево"
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
              </button>
            )}

            {/* Стрелка вправо */}
            {canScrollRight && (
              <button
                className="rsc-videos__arrow rsc-videos__arrow--right"
                onClick={() => scrollBy(1)}
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
      {/* Плеер: видео хранится у нас в Storage, открываем в модалке */}
      {playing && (
        <div
          className="rsc-videos__modal"
          onClick={() => setPlaying(null)}
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
        >
          <button
            className="rsc-videos__modal-close"
            onClick={() => setPlaying(null)}
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <video
            src={playing.video_url}
            controls
            autoPlay
            playsInline
            className="rsc-videos__modal-video"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

const VIDEOS_CSS = `
  .rsc-videos {
    background: #060606;
    padding: 120px 24px 120px;
    overflow-x: clip;
  }

  .rsc-videos__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  /* ---------- Появление ---------- */
  .rsc-videos__heading,
  .rsc-videos__subheading,
  .rsc-videos__card {
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  .rsc-videos:not(.rsc-videos--in) .rsc-videos__heading,
  .rsc-videos:not(.rsc-videos--in) .rsc-videos__subheading,
  .rsc-videos:not(.rsc-videos--in) .rsc-videos__card {
    opacity: 0;
    transform: translateY(28px);
  }

  .rsc-videos--in .rsc-videos__heading { transition-delay: 0s; }
  .rsc-videos--in .rsc-videos__subheading { transition-delay: 0.1s; }

  .rsc-videos__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1.05;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-videos__subheading {
    margin: 0 0 56px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
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

  /* Два видео и меньше — карточки по центру.
     На узком экране две карточки не помещаются рядом —
     там лента остаётся обычной, чтобы ничего не обрезалось. */
  @media (min-width: 1080px) {
    .rsc-videos__track--few {
      justify-content: center;
    }
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
    width: 100%;
    padding: 0;
    border: none;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    overflow: hidden;
    background: #141414;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .rsc-videos__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

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
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(17px, 2vw, 22px);
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-videos__date {
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8e8e93;
  }

  /* Затемнение справа */
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

  /* Стрелки: с обеих сторон */
  .rsc-videos__arrow {
    position: absolute;
    top: 32%;
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
    z-index: 2;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease,
      border-color 0.25s ease;
  }

  .rsc-videos__arrow--left {
    left: 12px;
  }

  .rsc-videos__arrow--right {
    right: 12px;
  }

  .rsc-videos__arrow--left:hover {
    background: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
    color: #060606;
    transform: translateX(-3px);
  }

  .rsc-videos__arrow--right:hover {
    background: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
    color: #060606;
    transform: translateX(3px);
  }

  @media (max-width: 640px) {
    .rsc-videos {
      padding: 80px 16px 80px;
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
    }

    .rsc-videos__arrow--left { left: 8px; }
    .rsc-videos__arrow--right { right: 8px; }
  }


  /* ---------- Плеер-модалка ---------- */
  .rsc-videos__modal {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    padding: 24px;
    animation: rsc-videos-modal-in 0.25s ease;
  }

  @keyframes rsc-videos-modal-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .rsc-videos__modal-video {
    width: 100%;
    max-width: 960px;
    max-height: 85vh;
    border-radius: 6px;
    background: #000;
  }

  .rsc-videos__modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: #ffffff;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .rsc-videos__modal-close:hover {
    color: var(--accent, #00c3d0);
  }
`;