// components/PastEvents.tsx
// Блок «Отыграли» — архив прошедших концертов. Данные из Supabase.
// Пагинация по 3 + затемнение + «Посмотреть еще».
// «Подробнее» открывает ту же модалку события, что и в «Афишах».

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import EventModal, { type EventData } from './EventModal';

const VISIBLE_COUNT = 3;

export default function PastEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_COUNT);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

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

  const hasMore = visibleCount < events.length;
  const openPoster = events.find((e) => e.id === openId) || null;
  const close = useCallback(() => setOpenId(null), []);

  const showMore = () => {
    setVisibleCount((c) => Math.min(c + VISIBLE_COUNT, events.length));
  };

  if (loading || events.length === 0) return null;

  return (
    <>
      <style>{PAST_CSS}</style>

      <section className="rsc-past" id="past">
        <div className="rsc-past__inner">
          <h2 className="rsc-past__heading">Отыграли</h2>
          <p className="rsc-past__subheading">История концертов</p>

          <div className="rsc-past__list-wrap">
            <div className="rsc-past__list">
              {events.slice(0, visibleCount).map((event) => (
                <article key={event.id} className="rsc-past-ticket">
                  <div className="rsc-past-ticket__date">
                    <span className="rsc-past-ticket__day">{event.day}</span>
                    <span className="rsc-past-ticket__month">
                      {event.month} · {event.time}
                    </span>
                  </div>

                  <div className="rsc-past-ticket__body">
                    <h3 className="rsc-past-ticket__title">{event.title}</h3>
                    {event.description && (
                      <p className="rsc-past-ticket__description">{event.description}</p>
                    )}
                    {event.venue && (
                      <p className="rsc-past-ticket__venue">{event.venue}</p>
                    )}

                    <div className="rsc-past-ticket__footer">
                      <span className="rsc-past-ticket__status">Прошло</span>
                      <div className="rsc-past-ticket__actions">
                        <button
                          className="rsc-past-ticket__btn"
                          onClick={() => setOpenId(event.id)}
                        >
                          Подробнее
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rsc-past-ticket__qr" aria-hidden="true">
                    <span className="rsc-past-ticket__qr-dots" />
                    <span className="rsc-past-ticket__qr-bars" />
                  </div>
                </article>
              ))}
            </div>

            {hasMore && <div className="rsc-past__fade" aria-hidden="true" />}
          </div>

          {hasMore && (
            <div className="rsc-past__more">
              <button className="rsc-past__more-btn" onClick={showMore}>
                Посмотреть еще
              </button>
            </div>
          )}
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
    padding: 40px 24px 120px;
  }

  .rsc-past__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-past__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-past__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-past__list-wrap {
    position: relative;
  }

  .rsc-past__list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .rsc-past-ticket {
    position: relative;
    display: flex;
    align-items: stretch;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.35);
    -webkit-mask-image:
      radial-gradient(circle 9px at 0 50%, transparent 98%, #000 100%),
      radial-gradient(circle 9px at 100% 50%, transparent 98%, #000 100%);
    mask-image:
      radial-gradient(circle 9px at 0 50%, transparent 98%, #000 100%),
      radial-gradient(circle 9px at 100% 50%, transparent 98%, #000 100%);
    -webkit-mask-size: 100% 26px, 100% 26px;
    mask-size: 100% 26px, 100% 26px;
    -webkit-mask-repeat: repeat-y, repeat-y;
    mask-repeat: repeat-y, repeat-y;
  }

  .rsc-past-ticket__date {
    flex-shrink: 0;
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 32px 16px;
  }

  .rsc-past-ticket__day {
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: 54px;
    line-height: 1;
    color: var(--accent, #00c3d0);
  }

  .rsc-past-ticket__month {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #ffffff;
  }

  .rsc-past-ticket__body {
    flex: 1;
    padding: 32px 36px;
    min-width: 0;
  }

  .rsc-past-ticket__title {
    margin: 0 0 12px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(24px, 3vw, 36px);
    line-height: 1.1;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-past-ticket__description {
    margin: 0 0 12px;
    max-width: 720px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.6;
    color: #8e8e93;
  }

  .rsc-past-ticket__venue {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-past-ticket__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .rsc-past-ticket__status {
    font-family: 'Poppins', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: var(--accent, #00c3d0);
  }

  .rsc-past-ticket__actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .rsc-past-ticket__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 180px;
    padding: 14px 28px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    border: 2px solid var(--accent, #00c3d0);
    background: transparent;
    color: var(--accent, #00c3d0);
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
  }

  .rsc-past-ticket__btn:hover {
    background: var(--accent, #00c3d0);
    color: #060606;
    transform: translateY(-2px);
  }

  .rsc-past-ticket__btn:active {
    transform: translateY(0);
  }

  .rsc-past-ticket__qr {
    flex-shrink: 0;
    width: 120px;
    display: flex;
    gap: 10px;
    padding: 20px 18px;
    border-left: 2px dashed rgba(255, 255, 255, 0.3);
    align-items: stretch;
  }

  .rsc-past-ticket__qr-dots {
    flex: 1;
    background-image: radial-gradient(circle, #ffffff 2.2px, transparent 2.6px);
    background-size: 11px 15px;
    background-position: center;
  }

  .rsc-past-ticket__qr-bars {
    flex: 1.4;
    background-image: repeating-linear-gradient(0deg, #ffffff 0 2.5px, transparent 2.5px 7px);
  }

  .rsc-past__fade {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 55%;
    min-height: 160px;
    background: linear-gradient(
      to bottom,
      rgba(6, 6, 6, 0) 0%,
      rgba(6, 6, 6, 0.55) 45%,
      #060606 100%
    );
    pointer-events: none;
  }

  .rsc-past__more {
    position: relative;
    margin-top: -70px;
    text-align: center;
    z-index: 1;
  }

  .rsc-past__more-btn {
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

  .rsc-past__more-btn:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
    transform: translateY(-2px);
  }

  @media (max-width: 760px) {
    .rsc-past {
      padding: 20px 16px 90px;
    }

    .rsc-past-ticket {
      flex-direction: column;
      -webkit-mask-image:
        radial-gradient(circle 9px at 50% 0, transparent 98%, #000 100%),
        radial-gradient(circle 9px at 50% 100%, transparent 98%, #000 100%);
      mask-image:
        radial-gradient(circle 9px at 50% 0, transparent 98%, #000 100%),
        radial-gradient(circle 9px at 50% 100%, transparent 98%, #000 100%);
      -webkit-mask-size: 26px 100%, 26px 100%;
      mask-size: 26px 100%, 26px 100%;
      -webkit-mask-repeat: repeat-x, repeat-x;
      mask-repeat: repeat-x, repeat-x;
    }

    .rsc-past-ticket__date {
      width: 100%;
      flex-direction: row;
      gap: 12px;
      padding: 22px 24px 14px;
    }

    .rsc-past-ticket__day { font-size: 38px; }

    .rsc-past-ticket__body { padding: 18px 24px 24px; }

    .rsc-past-ticket__footer {
      flex-direction: column;
      align-items: stretch;
    }

    .rsc-past-ticket__btn { width: 100%; min-width: 0; }

    .rsc-past-ticket__qr {
      width: 100%;
      height: 56px;
      border-left: none;
      border-top: 2px dashed rgba(255, 255, 255, 0.3);
      padding: 12px 24px;
    }

    .rsc-past__fade { height: 40%; }
  }
`;