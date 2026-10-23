// components/EventModal.tsx
// Модалка события: минимальный каркас — только открытие/закрытие.
// Содержимое добавляем отдельными шагами.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import LavaButton from './LavaButton';

export type EventData = {
  id: number;
  title: string;
  description: string | null;
  description_full?: string | null;
  day: string;
  month: string;
  time: string;
  venue: string | null;
  price_from: number | null;
  price_to: number | null;
  ticket_url: string | null;
  image: string | null;
  artists: { name: string; role?: string; photo?: string }[] | null;
  event_partners: { name: string; role?: string; photo?: string }[] | null;
  is_past?: boolean;
};

/* Горизонтальная лента: уходит вправо с затемнением, стрелки, ползунок скрыт */
function Rail({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    check();
  }, [check, children]);

  useEffect(() => {
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [check]);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.8 * dir, behavior: 'smooth' });
  };

  return (
    <div className="rsc-pm__rail">
      <div
        className="rsc-pm__rail-track"
        ref={trackRef}
        onScroll={check}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>

      {canRight && <div className="rsc-pm__rail-fade" aria-hidden="true" />}

      {canLeft && (
        <button
          type="button"
          className="rsc-pm__rail-arrow rsc-pm__rail-arrow--left"
          onClick={() => scroll(-1)}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      {canRight && (
        <button
          type="button"
          className="rsc-pm__rail-arrow rsc-pm__rail-arrow--right"
          onClick={() => scroll(1)}
          aria-label="Вперёд"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function EventModal({
  poster,
  onClose,
}: {
  poster: EventData;
  onClose: () => void;
}) {
  /* Блокируем скролл + закрытие по Escape */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const [photos, setPhotos] = useState<{ id: number; src: string; alt: string | null }[]>([]);

  /* Фото события из галереи (привязаны к афише через poster_id) */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('gallery')
        .select('id, src, alt')
        .eq('poster_id', poster.id)
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setPhotos(data || []);
    })();
  }, [poster.id]);

  /* Блок появляется только если есть хотя бы одна запись с именем */
  const acts = (poster.artists ?? []).filter((a) => a.name?.trim());
  const crew = (poster.event_partners ?? []).filter((c) => c.name?.trim());

  return (
    <>
      <style>{MODAL_CSS}</style>

      <div className="rsc-pm-overlay" onClick={onClose} aria-hidden="true" />

      <div className="rsc-pm" role="dialog" aria-modal="true">
        <button className="rsc-pm__close" onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Обложка: на всю ширину, к верхнему краю */}
        <div className="rsc-pm__hero">
          {poster.image ? (
            <img src={poster.image} alt={poster.title} />
          ) : (
            <span className="rsc-pm__hero-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="72" height="72" fill="currentColor">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
              </svg>
            </span>
          )}
        </div>

        <div className="rsc-pm__content">
          {/* Дата + название */}
          <div className="rsc-pm__head">
            <div className="rsc-pm__head-date">
              <span className="rsc-pm__head-day">{poster.day}</span>
              <span className="rsc-pm__head-myo">
                {poster.month} · {poster.time}
              </span>
            </div>
            <h3 className="rsc-pm__head-title">{poster.title}</h3>
          </div>

          {/* О концерте */}
          {(poster.description_full || poster.description) && (
            <section className="rsc-pm__section">
              <h4 className="rsc-pm__section-title">О концерте</h4>
              <p className="rsc-pm__description">
                {poster.description_full || poster.description}
              </p>
            </section>
          )}

          {/* Исполнители: строка карточек */}
          {acts.length > 0 && (
            <section className="rsc-pm__section">
              <h4 className="rsc-pm__section-title">Исполнители</h4>
              <Rail ariaLabel="Исполнители">
                {acts.map((act, i) => (
                  <figure key={i} className="rsc-pm__act">
                    {act.photo ? (
                      <img src={act.photo} alt={act.name} />
                    ) : (
                      <span className="rsc-pm__act-letter" aria-hidden="true">
                        {act.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <figcaption className="rsc-pm__act-name">{act.name}</figcaption>
                  </figure>
                ))}
              </Rail>
            </section>
          )}

          {/* Партнёры: строка карточек */}
          {crew.length > 0 && (
            <section className="rsc-pm__section">
              <h4 className="rsc-pm__section-title">Партнёры</h4>
              <Rail ariaLabel="Партнёры">
                {crew.map((person, i) => (
                  <figure key={i} className="rsc-pm__act">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} />
                    ) : (
                      <span className="rsc-pm__act-letter" aria-hidden="true">
                        {person.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <figcaption className="rsc-pm__act-name">{person.name}</figcaption>
                    {person.role && (
                      <span className="rsc-pm__act-role">{person.role}</span>
                    )}
                  </figure>
                ))}
              </Rail>
            </section>
          )}

          {/* Галерея: лента фото */}
          {photos.length > 0 && (
            <section className="rsc-pm__section">
              <h4 className="rsc-pm__section-title">Галерея</h4>
              <Rail ariaLabel="Галерея события">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rsc-pm__gallery-item"
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt || `Фото с события ${poster.title}`}
                      loading="lazy"
                    />
                  </a>
                ))}
              </Rail>
            </section>
          )}

          {/* Место проведения */}
          {poster.venue && (
            <section className="rsc-pm__section">
              <h4 className="rsc-pm__section-title">Место проведения</h4>
              <p className="rsc-pm__venue">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {poster.venue}
              </p>
              <iframe
                className="rsc-pm__map"
                src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(poster.venue)}`}
                loading="lazy"
                title="Карта места проведения"
                allowFullScreen
              />
            </section>
          )}

          {/* Купить билет — по центру (виджет Lava) */}
          {poster.ticket_url && !poster.is_past && (
            <div className="rsc-pm__ticket-wrap">
              <LavaButton ticketUrl={poster.ticket_url} className="rsc-pm__ticket" />
            </div>
          )}
          {poster.is_past && (
            <p className="rsc-pm__past-note">Событие прошло</p>
          )}
        </div>
      </div>
    </>
  );
}

const MODAL_CSS = `
  .rsc-pm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.8);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    animation: rsc-pm-fade 0.25s ease;
  }

  @keyframes rsc-pm-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .rsc-pm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(760px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    transform: translate(-50%, -50%);
    animation: rsc-pm-in 0.3s ease;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .rsc-pm::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  @keyframes rsc-pm-in {
    from { opacity: 0; transform: translate(-50%, -47%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .rsc-pm__close {
    position: sticky;
    top: 14px;
    margin-left: calc(100% - 50px);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: rgba(20, 20, 20, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: #ffffff;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .rsc-pm__close:hover {
    color: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
  }

  /* Обложка: во всю ширину окна, к верхнему краю (под крестик) */
  .rsc-pm__hero {
    position: relative;
    margin-top: -50px;
    aspect-ratio: 16 / 7;
    overflow: hidden;
    border-radius: 14px 14px 0 0;
    background: linear-gradient(135deg, #1a1a1a 0%, #060606 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rsc-pm__hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .rsc-pm__hero-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgba(255, 255, 255, 0.08);
  }

  .rsc-pm__content {
    padding: 0 32px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    color: #ffffff;
  }

  /* Дата + название */
  .rsc-pm__head {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: nowrap; /* дата слева, название справа — в одну строку */
    margin-top: 24px;
  }

  .rsc-pm__head-date {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex-shrink: 0;
  }

  .rsc-pm__head-day {
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(38px, 5vw, 56px);
    line-height: 1;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__head-myo {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ffffff;
  }

  .rsc-pm__head-title {
    flex: 1 1 auto;
    min-width: 0; /* название занимает всё место справа и переносится в 2 строки */
    margin: 0;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(22px, 2.6vw, 34px);
    line-height: 1.1;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-pm__section {
    margin-top: 28px;
  }

  .rsc-pm__section-title {
    margin: 0 0 16px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: 20px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__description {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.8;
    color: #e9e9ec;
    white-space: pre-wrap;
  }

  /* Исполнители: строка карточек */
  .rsc-pm__acts {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  /* Карточка: квадратное фото + имя под ним. Всё. */
  .rsc-pm__act {
    width: 170px;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    background: #0d0d0d;
  }

  .rsc-pm__act img {
    display: block;
    width: 170px;
    height: 170px;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    object-fit: cover;
  }

  .rsc-pm__act-letter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    font-family: var(--font-tablon), sans-serif;
    font-size: 64px;
    line-height: 1;
    color: color-mix(in srgb, var(--accent, #00c3d0) 35%, transparent);
    text-transform: uppercase;
    background: linear-gradient(150deg, #1e1e1e 0%, #0b0b0b 100%);
  }

  .rsc-pm__act-name {
    display: block;
    padding: 12px 8px;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    background: #0d0d0d;
  }

  /* Роль — под именем, акцентом (у карточек партнёров) */
  .rsc-pm__act-role {
    display: block;
    padding: 0 8px 12px;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: var(--accent, #00c3d0);
    font-weight: 500;
    background: #0d0d0d;
  }

  /* Место проведения */
  .rsc-pm__venue {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .rsc-pm__venue svg {
    flex-shrink: 0;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__map {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: none;
    background: #0c0c0c;
    filter: grayscale(1) invert(0.92) contrast(0.9);
  }

  /* Купить билет — по центру снизу */
  .rsc-pm__ticket-wrap {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }

  .rsc-pm__ticket {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 0;
    min-width: 240px;
    padding: 15px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: 2px solid var(--accent, #00c3d0);
    transition: background 0.25s ease, color 0.25s ease;
  }

  .rsc-pm__ticket:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__past-note {
    margin: 32px 0 0;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8e8e93;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }

  /* Галерея: фото лентой */
  .rsc-pm__gallery-item {
    flex-shrink: 0;
    display: block;
    overflow: hidden;
  }

  .rsc-pm__gallery-item img {
    display: block;
    height: 180px;
    width: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .rsc-pm__gallery-item:hover img {
    transform: scale(1.05);
  }

  /* Лента: трек уходит вправо, затемнение на краю */
  .rsc-pm__rail {
    position: relative;
  }

  .rsc-pm__rail-track {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 6px;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .rsc-pm__rail-track::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .rsc-pm__rail-track .rsc-pm__act {
    flex-shrink: 0;
  }

  .rsc-pm__rail-fade {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 6px;
    width: 90px;
    pointer-events: none;
    background: linear-gradient(to right, rgba(20, 20, 20, 0) 0%, #141414 100%);
  }

  .rsc-pm__rail-arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    color: #ffffff;
    background: rgba(12, 12, 12, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    cursor: pointer;
    transform: translateY(-50%);
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .rsc-pm__rail-arrow:hover {
    color: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
  }

  .rsc-pm__rail-arrow--left  { left: 8px; }
  .rsc-pm__rail-arrow--right { right: 8px; }

`;