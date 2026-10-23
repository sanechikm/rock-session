// components/PastEvents.tsx
// Блок «Отыграли» — архив прошедших концертов.
// Карточка-чек с пунктирными разделителями: десктоп — горизонтальная
// лента со стрелками, мобильный — вертикальный стек на всю ширину.
// «Подробнее» открывает ту же модалку события, что и в «Афишах».

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import EventModal, { type EventData } from './EventModal';

/* Формат суммы: 6400 → «6 400» */
const formatPrice = (value: number | null | undefined) =>
  value ? Number(value).toLocaleString('ru-RU') : null;

export default function PastEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  /* Лента: скролл, стрелки, затемнение */
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [checkScroll, events]);

  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Мобильный: ровно на один билет (ширина карточки + отступ ленты).
    // Десктоп: как раньше — шаг 0.7 экрана.
    const card = el.querySelector('.rsc-past-t') as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).gap) || 0;
    const step =
      window.innerWidth <= 760 && card
        ? card.getBoundingClientRect().width + gap
        : el.clientWidth * 0.7;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posters')
        .select('*')
        .eq('is_past', true)
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setEvents((data || []).map((e) => ({ ...e, is_past: true })));
      setLoading(false);
    })();
  }, []);

  const openPoster = events.find((e) => e.id === openId) || null;
  const close = useCallback(() => setOpenId(null), []);

  if (loading || events.length === 0) return null;

  return (
    <>
      <style>{PAST_CSS}</style>

      <section className="rsc-past" id="past">
        <div className="rsc-past__inner">
          <h2 className="rsc-past__heading">Отыграли</h2>
          <p className="rsc-past__subheading">История концертов</p>

          <div className="rsc-past__rail">
            <div
              className="rsc-past__track"
              ref={trackRef}
              onScroll={checkScroll}
              role="region"
              aria-label="Прошедшие концерты"
            >
              {events.map((event) => {
                const price = formatPrice(event.price_from);
                return (
                  <article key={event.id} className="rsc-past-t">
                    {/* Название */}
                    <h3 className="rsc-past-t__title">{event.title}</h3>

                    <div className="rsc-past-t__divider" aria-hidden="true" />

                    {/* Основные данные */}
                    <div className="rsc-past-t__rows">
                      <div className="rsc-past-t__row">
                        <span className="rsc-past-t__label">Статус:</span>
                        <span className="rsc-past-t__value rsc-past-t__value--accent">
                          Закончился
                        </span>
                      </div>
                      <div className="rsc-past-t__row">
                        <span className="rsc-past-t__label">Дата:</span>
                        <span className="rsc-past-t__value">
                          {event.day} {event.month}
                        </span>
                      </div>
                      <div className="rsc-past-t__row">
                        <span className="rsc-past-t__label">Время:</span>
                        <span className="rsc-past-t__value">{event.time}</span>
                      </div>
                      {event.venue && (
                        <div className="rsc-past-t__row">
                          <span className="rsc-past-t__label">Место:</span>
                          <span className="rsc-past-t__value">{event.venue}</span>
                        </div>
                      )}
                    </div>

                    {/* Описание: блок всегда занимает максимум места,
                        даже если текст пустой */}
                    <div className="rsc-past-t__desc">
                      <div className="rsc-past-t__divider" aria-hidden="true" />
                      {event.description && (
                        <div className="rsc-past-t__row rsc-past-t__row--top">
                          <span className="rsc-past-t__label">Описание:</span>
                          <span className="rsc-past-t__value rsc-past-t__value--dim rsc-past-t__value--clamp">
                            {event.description}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Сумма */}
                    {price && (
                      <>
                        <div className="rsc-past-t__divider" aria-hidden="true" />
                        <div className="rsc-past-t__row">
                          <span className="rsc-past-t__label">Сумма:</span>
                          <span className="rsc-past-t__value rsc-past-t__value--big">
                            от {price} ₽
                          </span>
                        </div>
                      </>
                    )}

                    <div className="rsc-past-t__divider" aria-hidden="true" />

                    {/* Кнопка */}
                    <button
                      type="button"
                      className="rsc-past-t__btn"
                      onClick={() => setOpenId(event.id)}
                    >
                      Подробнее
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Затемнение уходящей вправо ленты (десктоп) */}
            {canRight && <div className="rsc-past__fade" aria-hidden="true" />}

            {/* Стрелки (десктоп) */}
            {canLeft && (
              <button
                type="button"
                className="rsc-past__arrow rsc-past__arrow--left"
                onClick={() => scrollBy(-1)}
                aria-label="Назад"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            {canRight && (
              <button
                type="button"
                className="rsc-past__arrow rsc-past__arrow--right"
                onClick={() => scrollBy(1)}
                aria-label="Вперёд"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Модалка прошедшего события */}
      {openPoster && <EventModal poster={openPoster} onClose={close} />}
    </>
  );
}

const PAST_CSS = `
  .rsc-past {
    background: #060606;
    padding: 120px 24px 120px;
    overflow-x: clip;
  }

  .rsc-past__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-past__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-past__subheading {
    margin: 0 0 56px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  /* ---------- Лента ---------- */
  .rsc-past__rail {
    position: relative;
  }

  .rsc-past__track {
    display: flex;
    gap: 32px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
  }

  .rsc-past__track::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .rsc-past__fade {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 8px;
    width: 110px;
    pointer-events: none;
    background: linear-gradient(to right, rgba(6, 6, 6, 0) 0%, #060606 100%);
  }

  .rsc-past__arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    color: #ffffff;
    background: rgba(12, 12, 12, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    cursor: pointer;
    transform: translateY(-50%);
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .rsc-past__arrow:hover {
    color: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
  }

  .rsc-past__arrow--left  { left: 10px; }
  .rsc-past__arrow--right { right: 10px; }

  /* ---------- Карточка-чек ---------- */
  .rsc-past-t {
    flex-shrink: 0;
    scroll-snap-align: center;
    display: flex;
    flex-direction: column;
    width: min(460px, 84vw);
    min-height: 430px;
    padding: 30px 34px 18px; /* снизу минимум — без отступа после кнопки */
    background: #0a0a0a;
    border: 1px solid rgba(255, 255, 255, 0.45);
  }

  .rsc-past-t__title {
    margin: 0;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(24px, 2.4vw, 30px);
    line-height: 1.1;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  /* Пунктирные разделители: крупные штрихи с большим интервалом */
  .rsc-past-t__divider {
    height: 2px;
    margin: 20px 0;
    border: none;
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 50%
    );
    background-size: 26px 2px;
    background-repeat: repeat-x;
  }

  /* Описание забирает всё свободное место карточки */
  .rsc-past-t__desc {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .rsc-past-t__desc .rsc-past-t__divider {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .rsc-past-t__rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .rsc-past-t__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 28px;
  }

  .rsc-past-t__row--top {
    align-items: flex-start;
  }

  .rsc-past-t__label {
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.3vw, 18px);
    font-weight: 600;
    color: #ffffff;
  }

  .rsc-past-t__value {
    text-align: right;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.3vw, 18px);
    font-weight: 500;
    color: #ffffff;
    min-width: 0;
  }

  .rsc-past-t__value--accent {
    color: var(--accent, #00c3d0);
  }

  .rsc-past-t__value--dim {
    color: rgba(255, 255, 255, 0.38);
  }

  .rsc-past-t__value--clamp {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .rsc-past-t__value--big {
    font-size: clamp(20px, 1.8vw, 26px);
    font-weight: 700;
  }

  .rsc-past-t__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px 28px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.3vw, 18px);
    font-weight: 600;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: none;
    cursor: pointer;
    transition: filter 0.25s ease;
  }

  .rsc-past-t__btn:hover {
    filter: brightness(1.1);
  }

  /* ---------- Мобильный: та же горизонтальная лента, карточки меньше ---------- */
  @media (max-width: 760px) {
    .rsc-past {
      padding: 80px 16px 80px;
    }

    .rsc-past__subheading {
      margin-bottom: 36px;
    }

    .rsc-past__track {
      gap: 18px;
      padding-left: calc(50% - min(310px, 76vw) / 2);
      padding-right: calc(50% - min(310px, 76vw) / 2);
      scroll-snap-type: x mandatory;
    }

    .rsc-past__fade {
      width: 56px;
    }

    .rsc-past__arrow {
      width: 36px;
      height: 36px;
    }

    .rsc-past-t {
      width: min(310px, 76vw);
      min-height: 400px;
      padding: 22px 20px 14px;
    }

    .rsc-past-t__divider {
      height: 1px;
      margin: 16px 0;
      background-size: 20px 1px;
    }

    .rsc-past-t__rows {
      gap: 10px;
    }

    .rsc-past-t__row {
      gap: 14px;
    }

    .rsc-past-t__label {
      font-size: 15px;
    }

    .rsc-past-t__value {
      font-size: 15px;
    }

    .rsc-past-t__value--big {
      font-size: 20px;
    }

    .rsc-past-t__btn {
      padding: 12px 20px;
      font-size: 15px;
    }
  }
`;