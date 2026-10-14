// components/EventModal.tsx
// Общая модалка события: обложка → название → дата/время → описание →
// место → карта → исполнители → партнёры → галерея → кнопка покупки.
// Используется в блоках «Афиши» и «Отыграли».

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type EventData = {
  id: number;
  title: string;
  description: string | null;
  day: string;
  month: string;
  time: string;
  venue: string | null;
  price_from: number | null;
  price_to: number | null;
  ticket_url: string | null;
  image: string | null;
  artists: { name: string; role?: string }[] | null;
  event_partners: { name: string; role?: string }[] | null;
  is_past?: boolean;
};

type Photo = { id: number; src: string; alt: string | null };

/* Заглушки исполнителей */
const PLACEHOLDER_ACTS = [
  { name: 'Название группы', role: 'Хедлайнер' },
  { name: 'Название группы', role: 'Специальный гость' },
  { name: 'Название группы', role: 'Согревающий состав' },
];

/* Заглушки партнёров */
const PLACEHOLDER_CREW = [
  { name: 'Имя Фамилия', role: 'Фотограф' },
  { name: 'Имя Фамилия', role: 'Видеограф' },
  { name: 'Имя Фамилия', role: 'Ведущий' },
];

const formatPrice = (n: number) => n.toLocaleString('ru-RU');

export default function EventModal({
  poster,
  onClose,
}: {
  poster: EventData;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  /* Фото события из галереи (poster_id) */
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

  /* Реальные данные или заглушки */
  const acts =
    poster.artists && poster.artists.length > 0 ? poster.artists : PLACEHOLDER_ACTS;

  const crew =
    poster.event_partners && poster.event_partners.length > 0
      ? poster.event_partners
      : PLACEHOLDER_CREW;

  const mapQuery = poster.venue || 'Ростов-на-Дону';

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

        {/* 1. Обложка */}
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
          {/* 2. Название */}
          <h3 className="rsc-pm__title">{poster.title}</h3>

          {/* 3. Дата и время */}
          <span className="rsc-pm__datetime">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {poster.day} {poster.month} · {poster.time}
          </span>

          {/* 4. Описание */}
          <section className="rsc-pm__section">
            <h4 className="rsc-pm__section-title">О концерте</h4>
            {poster.description ? (
              <p className="rsc-pm__description">{poster.description}</p>
            ) : (
              <p className="rsc-pm__description">
                Описание концерта появится позже. Следите за анонсами —
                мы расскажем о программе вечера, составе музыкантов
                и особенностях площадки.
              </p>
            )}
          </section>

          {/* 5. Место */}
          <section className="rsc-pm__section">
            <h4 className="rsc-pm__section-title">Место проведения</h4>
            <p className="rsc-pm__venue">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {poster.venue || 'Место уточняется — следите за афишей'}
            </p>

            {/* 6. Карта */}
            <iframe
              className="rsc-pm__map"
              src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(mapQuery)}`}
              loading="lazy"
              title="Карта места проведения"
              allowFullScreen
            />
          </section>

          {/* 7. Исполнители */}
          <section className="rsc-pm__section">
            <h4 className="rsc-pm__section-title">Исполнители</h4>
            <div className="rsc-pm__acts">
              {acts.map((act, i) => (
                <div key={i} className="rsc-pm__act">
                  <div
                    className={
                      'rsc-pm__act-avatar' +
                      (poster.artists && poster.artists.length > 0 ? '' : ' rsc-pm__act-avatar--icon')
                    }
                    aria-hidden="true"
                  >
                    {poster.artists && poster.artists.length > 0 ? (
                      act.name.trim().charAt(0).toUpperCase()
                    ) : (
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
                      </svg>
                    )}
                  </div>
                  <span className="rsc-pm__act-name">{act.name}</span>
                  {act.role && <span className="rsc-pm__act-role">{act.role}</span>}
                </div>
              ))}
            </div>
          </section>

          {/* 8. Партнёры */}
          <section className="rsc-pm__section">
            <h4 className="rsc-pm__section-title">Партнёры</h4>
            <div className="rsc-pm__crew">
              {crew.map((person, i) => (
                <div key={i} className="rsc-pm__crew-card">
                  <div className="rsc-pm__crew-avatar" aria-hidden="true">
                    {person.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="rsc-pm__crew-info">
                    <span className="rsc-pm__crew-name">{person.name}</span>
                    {person.role && (
                      <span className="rsc-pm__crew-role">{person.role}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9. Галерея */}
          <section className="rsc-pm__section">
            <h4 className="rsc-pm__section-title">Галерея</h4>
            {photos.length > 0 ? (
              <div className="rsc-pm__gallery">
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
              </div>
            ) : (
              <div className="rsc-pm__gallery">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rsc-pm__gallery-ph" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-4.5-4.5L6 21" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Купить билет (только для будущих событий) */}
          {poster.ticket_url && !poster.is_past && (
            <a
              href={poster.ticket_url}
              className="rsc-pm__ticket"
              target="_blank"
              rel="noopener noreferrer"
            >
              Купить билет
            </a>
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

  .rsc-pm__hero {
    position: relative;
    aspect-ratio: 16 / 7;
    margin-top: -50px;
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
  }

  .rsc-pm__title {
    margin: 20px 0 14px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.05;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-pm__datetime {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    padding: 10px 18px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 8px;
  }

  .rsc-pm__section {
    margin-top: 28px;
  }

  .rsc-pm__section-title {
    margin: 0 0 16px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: 20px;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__description {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.75;
    color: #8e8e93;
    white-space: pre-wrap;
  }

  .rsc-pm__venue {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-pm__venue svg {
    flex-shrink: 0;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__map {
    margin-top: 14px;
    width: 100%;
    aspect-ratio: 16 / 8;
    border: none;
    border-radius: 10px;
    background: #0c0c0c;
    filter: grayscale(1) invert(0.92) contrast(0.9);
  }

  .rsc-pm__acts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }

  .rsc-pm__act {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: linear-gradient(150deg, #1e1e1e 0%, #0c0c0c 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    text-align: center;
  }

  .rsc-pm__act-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    font-family: 'Tablon', sans-serif;
    font-size: 24px;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 50%;
  }

  .rsc-pm__act-avatar--icon {
    color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
  }

  .rsc-pm__act-name {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
  }

  .rsc-pm__act-role {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #8e8e93;
  }

  .rsc-pm__crew {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }

  .rsc-pm__crew-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: #0c0c0c;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
  }

  .rsc-pm__crew-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    font-family: 'Tablon', sans-serif;
    font-size: 18px;
    color: #060606;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 50%;
  }

  .rsc-pm__crew-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .rsc-pm__crew-name {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .rsc-pm__crew-role {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #8e8e93;
  }

  .rsc-pm__gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .rsc-pm__gallery-item {
    display: block;
    border-radius: 8px;
    overflow: hidden;
  }

  .rsc-pm__gallery-item img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .rsc-pm__gallery-item:hover img { transform: scale(1.05); }

  .rsc-pm__gallery-ph {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    background: linear-gradient(150deg, #1e1e1e 0%, #0c0c0c 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.1);
  }

  .rsc-pm__ticket {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 32px;
    min-width: 220px;
    padding: 15px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: 2px solid var(--accent, #00c3d0);
    transition: background 0.25s ease, color 0.25s ease;
  }

  .rsc-pm__ticket:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-pm__past-note {
    margin: 32px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8e8e93;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }

  @media (max-width: 640px) {
    .rsc-pm__content { padding: 0 20px 24px; }
    .rsc-pm__gallery { grid-template-columns: repeat(2, 1fr); }
    .rsc-pm__acts, .rsc-pm__crew { grid-template-columns: 1fr 1fr; }
  }
`;