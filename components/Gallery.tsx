// components/Gallery.tsx
// Блок «Галерея» — плитка (masonry через CSS-колонки): 4 колонки, острые углы,
// хаотичная высота, фото плавно уходят в затемнение снизу.
// Данные из Supabase (visible + sort_order из админки).

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Photo = {
  id: number;
  src: string;
  alt: string | null;
};

const INITIAL_COUNT = 12;
const LOAD_STEP = 8;

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  /* Появление блока при прокрутке */
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  /* Количество колонок: 4 на десктопе, 2 на мобильном.
     Фото распределяются по индексу — колонка каждого фото фиксирована,
     поэтому подгрузка новых не меняет расстановку. */
  const [colCount, setColCount] = useState(3);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setColCount(mq.matches ? 2 : 3);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const visiblePhotos = photos.slice(0, visibleCount);
  const columns = Array.from({ length: colCount }, (_, c) =>
    visiblePhotos.filter((_, i) => i % colCount === c)
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('gallery')
        .select('id, src, alt')
        .eq('visible', true)
        .is('poster_id', null) /* только общая галерея (без привязки к афишам) */
        .order('sort_order', { ascending: true });
      setPhotos(data || []);
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
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  const hasMore = visibleCount < photos.length;

  const showMore = () => {
    setVisibleCount((c) => Math.min(c + LOAD_STEP, photos.length));
  };

  if (!loading && photos.length === 0) return null;

  return (
    <>
      <style>{GALLERY_CSS}</style>

      <section
        className={'rsc-gallery' + (inView ? ' rsc-gallery--in' : '')}
        id="gallery"
        ref={sectionRef}
      >
        <div className="rsc-gallery__inner">
          <h2 className="rsc-gallery__heading">Галерея</h2>
          <p className="rsc-gallery__subheading">
            Живые кадры, которые остаются в памяти
          </p>

          <div className="rsc-gallery__grid-wrap">
            {/* Колонки распределяются вручную: при подгрузке новых фото
                расстановка существующих не меняется */}
            <div className="rsc-gallery__grid">
              {columns.map((col, c) => (
                <div className="rsc-gallery__col" key={c}>
                  {col.map((photo, i) => {
                    const globalIndex = c + i * columns.length;
                    return (
                      <button
                        key={photo.id}
                        className="rsc-gallery__item"
                        onClick={() => setLightbox(photo)}
                        aria-label="Открыть фото"
                        style={{
                          transitionDelay: inView ? `${0.15 + globalIndex * 0.05}s` : '0s',
                        }}
                      >
                        <img
                          src={photo.src}
                          alt={photo.alt || 'Фото с мероприятия RockSession Club'}
                          className="rsc-gallery__img"
                          loading="lazy"
                        />
                        <span className="rsc-gallery__hover" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
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
    overflow-x: clip;
  }

  .rsc-gallery__inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* ---------- Появление ---------- */
  .rsc-gallery__heading,
  .rsc-gallery__subheading,
  .rsc-gallery__item {
    transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  .rsc-gallery:not(.rsc-gallery--in) .rsc-gallery__heading,
  .rsc-gallery:not(.rsc-gallery--in) .rsc-gallery__subheading,
  .rsc-gallery:not(.rsc-gallery--in) .rsc-gallery__item {
    opacity: 0;
    transform: translateY(24px);
  }

  .rsc-gallery--in .rsc-gallery__heading { transition-delay: 0s; }
  .rsc-gallery--in .rsc-gallery__subheading { transition-delay: 0.1s; }

  .rsc-gallery__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-gallery__subheading {
    margin: 0 0 56px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-gallery__grid-wrap {
    position: relative;
  }

  /* ---------- Плитка: колонки фиксированы, острые углы ---------- */
  .rsc-gallery__grid {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .rsc-gallery__col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    /* Каждая колонка плавно растворяется ровно по своему низу —
       никаких пустот и обрывов в затемнении */
    -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 99%);
    mask-image: linear-gradient(to bottom, #000 62%, transparent 99%);
  }

  .rsc-gallery__item {
    position: relative;
    display: block;
    width: 100%;
    padding: 0;
    background: #141414;
    border: none; /* острые углы */
    overflow: hidden;
    cursor: zoom-in;
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
    background: linear-gradient(to top, color-mix(in srgb, var(--accent, #00c3d0) 22%, transparent), transparent 55%);
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


  .rsc-gallery__more {
    position: relative;
    margin-top: -50px;
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

  /* ---------- Адаптив ---------- */
  @media (max-width: 640px) {
    .rsc-gallery {
      padding: 80px 16px 90px;
    }

    .rsc-gallery__grid,
    .rsc-gallery__col {
      gap: 10px;
    }
  }
`;