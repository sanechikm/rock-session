// components/Gallery.tsx
// Блок «Галерея» — «хоть и ровная, но хаотичная» плитка (masonry через CSS-колонки).
// Данные из Supabase: таблица gallery (visible + sort_order из админки).
// Показ по 8, затем по 6; клик — лайтбокс.

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Photo = {
  id: number;
  src: string;
  alt: string | null;
};

const INITIAL_COUNT = 8;
const LOAD_STEP = 6;

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('gallery')
        .select('id, src, alt')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setPhotos(data || []);
      setLoading(false);
    })();
  }, []);

  const hasMore = visibleCount < photos.length;

  const showMore = () => {
    setVisibleCount((c) => Math.min(c + LOAD_STEP, photos.length));
  };

  if (!loading && photos.length === 0) return null;

  return (
    <>
      <style>{GALLERY_CSS}</style>

      <section className="rsc-gallery" id="gallery">
        <div className="rsc-gallery__inner">
          <h2 className="rsc-gallery__heading">Галерея</h2>
          <p className="rsc-gallery__subheading">
            Живые кадры, которые остаются в памяти
          </p>

          <div className="rsc-gallery__grid-wrap">
            <div className="rsc-gallery__grid">
              {photos.slice(0, visibleCount).map((photo) => (
                <button
                  key={photo.id}
                  className="rsc-gallery__item"
                  onClick={() => setLightbox(photo)}
                  aria-label="Открыть фото"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt || 'Фото с мероприятия RockSession Club'}
                    className="rsc-gallery__img"
                    loading="lazy"
                  />
                  <span className="rsc-gallery__hover" aria-hidden="true" />
                </button>
              ))}
            </div>

            {hasMore && <div className="rsc-gallery__fade" aria-hidden="true" />}
          </div>

          {hasMore && (
            <div className="rsc-gallery__more">
              <button className="rsc-gallery__more-btn" onClick={showMore}>
                Посмотреть еще
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Лайтбокс */}
      {lightbox && (
        <div
          className="rsc-lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          <button className="rsc-lightbox__close" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt || 'Фото'}
            className="rsc-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

const GALLERY_CSS = `
  .rsc-gallery {
    background: #060606;
    padding: 110px 24px 120px;
  }

  .rsc-gallery__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-gallery__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-gallery__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-gallery__grid-wrap {
    position: relative;
  }

  .rsc-gallery__grid {
    column-count: 3;
    column-gap: 16px;
  }

  .rsc-gallery__item {
    position: relative;
    display: block;
    width: 100%;
    margin: 0 0 16px;
    padding: 0;
    background: #141414;
    border: none;
    border-radius: 6px;
    overflow: hidden;
    cursor: zoom-in;
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
  }

  .rsc-gallery__img {
    display: block;
    width: 100%;
    height: auto;
    transition: transform 0.4s ease;
  }

  .rsc-gallery__hover {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 195, 208, 0.25), transparent 55%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .rsc-gallery__item:hover .rsc-gallery__hover {
    opacity: 1;
  }

  .rsc-gallery__item:hover .rsc-gallery__img {
    transform: scale(1.04);
  }

  .rsc-gallery__fade {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 45%;
    background: linear-gradient(
      to bottom,
      rgba(6, 6, 6, 0) 0%,
      rgba(6, 6, 6, 0.75) 60%,
      #060606 100%
    );
    pointer-events: none;
  }

  .rsc-gallery__more {
    position: relative;
    margin-top: -70px;
    text-align: center;
    z-index: 1;
  }

  .rsc-gallery__more-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 260px;
    padding: 16px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: 2px solid var(--accent, #00c3d0);
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
  }

  .rsc-gallery__more-btn:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
    transform: translateY(-2px);
  }

  /* Лайтбокс */
  .rsc-lightbox {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background: rgba(0, 0, 0, 0.88);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    cursor: zoom-out;
    animation: rsc-lb-fade 0.25s ease;
  }

  @keyframes rsc-lb-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .rsc-lightbox__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
    cursor: default;
    animation: rsc-lb-zoom 0.25s ease;
  }

  @keyframes rsc-lb-zoom {
    from { transform: scale(0.94); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  .rsc-lightbox__close {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .rsc-lightbox__close:hover {
    color: var(--accent, #00c3d0);
  }

  @media (max-width: 900px) {
    .rsc-gallery__grid {
      column-count: 2;
    }
  }

  @media (max-width: 560px) {
    .rsc-gallery {
      padding: 80px 16px 90px;
    }

    .rsc-gallery__grid {
      column-gap: 10px;
    }

    .rsc-gallery__item {
      margin-bottom: 10px;
      border-radius: 4px;
    }
  }
`;