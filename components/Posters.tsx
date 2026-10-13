// components/Posters.tsx
// Блок «Афиши» — билеты на концерт. Данные из Supabase.
// Акцентным подсвечено ближайшее по дате событие.

import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Poster = {
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
  slug: string;
  sort_order: number;
};

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

// Месяц в номер для сравнения дат
const monthIndex = (m: string) => {
  const i = MONTHS_RU.indexOf(m);
  return i === -1 ? 0 : i;
};

const formatPrice = (n: number) => n.toLocaleString('ru-RU');

export default async function Posters() {
  const { data: events } = await supabase
    .from('posters')
    .select('*')
    .eq('is_past', false)
    .eq('visible', true)
    .order('sort_order', { ascending: true });

  const posters: Poster[] = events || [];

  // Индекс ближайшего события (минимальная дата, текущий год)
  const year = new Date().getFullYear();
  let nearestIndex = -1;
  let nearestTime = Infinity;
  posters.forEach((p, i) => {
    const t = new Date(year, monthIndex(p.month), parseInt(p.day, 10)).getTime();
    if (t < nearestTime) {
      nearestTime = t;
      nearestIndex = i;
    }
  });

  return (
    <>
      <style>{POSTERS_CSS}</style>

      <section className="rsc-posters" id="posters">
        <div className="rsc-posters__inner">
          <h2 className="rsc-posters__heading">Афиши</h2>
          <p className="rsc-posters__subheading">
            Не пропустите главные рок-вечера сезона
          </p>

          {posters.length === 0 ? (
            <p className="rsc-posters__empty">Скоро анонсируем новые события</p>
          ) : (
            <div className="rsc-posters__list">
              {posters.map((event, index) => {
                const isNearest = index === nearestIndex;
                return (
                  <article
                    key={event.id}
                    className={'rsc-ticket' + (isNearest ? ' rsc-ticket--accent' : '')}
                  >
                    {/* Дата */}
                    <div className="rsc-ticket__date">
                      <span className="rsc-ticket__day">{event.day}</span>
                      <span className="rsc-ticket__month">
                        {event.month} · {event.time}
                      </span>
                    </div>

                    {/* Тело билета */}
                    <div className="rsc-ticket__body">
                      <h3 className="rsc-ticket__title">{event.title}</h3>
                      {event.description && (
                        <p className="rsc-ticket__description">{event.description}</p>
                      )}
                      {event.venue && (
                        <p className="rsc-ticket__venue">{event.venue}</p>
                      )}

                      <div className="rsc-ticket__footer">
                        <span className="rsc-ticket__price">
                          {event.price_from != null && event.price_to != null
                            ? `${formatPrice(event.price_from)}–${formatPrice(event.price_to)} ₽`
                            : event.price_from != null
                              ? `от ${formatPrice(event.price_from)} ₽`
                              : ''}
                        </span>

                        <div className="rsc-ticket__actions">
                          <Link
                            href={`/afisha/${event.slug}`}
                            className="rsc-ticket__btn rsc-ticket__btn--outline"
                          >
                            Подробнее
                          </Link>
                          {event.ticket_url && (
                            <a
                              href={event.ticket_url}
                              className="rsc-ticket__btn rsc-ticket__btn--primary"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Купить билет
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* «QR-код» справа */}
                    <div className="rsc-ticket__qr" aria-hidden="true">
                      <span className="rsc-ticket__qr-dots" />
                      <span className="rsc-ticket__qr-bars" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="rsc-posters__more">
            <Link href="/afisha" className="rsc-posters__more-btn">
              Посмотреть все
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const POSTERS_CSS = `
  .rsc-posters {
    background: #060606;
    padding: 110px 24px 120px;
  }

  .rsc-posters__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-posters__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-posters__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-posters__empty {
    text-align: center;
    font-family: 'Poppins', sans-serif;
    color: #8e8e93;
  }

  .rsc-posters__list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .rsc-ticket {
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

  .rsc-ticket--accent {
    background: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
  }

  .rsc-ticket__date {
    flex-shrink: 0;
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 32px 16px;
  }

  .rsc-ticket__day {
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: 54px;
    line-height: 1;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__day {
    color: #060606;
  }

  .rsc-ticket__month {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #ffffff;
  }

  .rsc-ticket--accent .rsc-ticket__month {
    color: #060606;
  }

  .rsc-ticket__body {
    flex: 1;
    padding: 32px 36px;
    min-width: 0;
  }

  .rsc-ticket__title {
    margin: 0 0 12px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(24px, 3vw, 36px);
    line-height: 1.1;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__title {
    color: #060606;
  }

  .rsc-ticket__description {
    margin: 0 0 12px;
    max-width: 720px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.6;
    color: #8e8e93;
  }

  .rsc-ticket--accent .rsc-ticket__description {
    color: rgba(6, 6, 6, 0.75);
  }

  .rsc-ticket__venue {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-ticket--accent .rsc-ticket__venue {
    color: #060606;
  }

  .rsc-ticket__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .rsc-ticket__price {
    font-family: 'Poppins', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__price {
    color: #060606;
  }

  .rsc-ticket__actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .rsc-ticket__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 180px;
    padding: 14px 28px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    border: 2px solid var(--accent, #00c3d0);
    transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
  }

  .rsc-ticket__btn:hover { transform: translateY(-2px); }
  .rsc-ticket__btn:active { transform: translateY(0); }

  .rsc-ticket__btn--primary {
    background: var(--accent, #00c3d0);
    color: #060606;
  }

  .rsc-ticket__btn--primary:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket__btn--outline {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket__btn--outline:hover {
    background: var(--accent, #00c3d0);
    color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn {
    border-color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn--primary {
    background: #060606;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__btn--primary:hover {
    background: transparent;
    color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn--outline {
    color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn--outline:hover {
    background: #060606;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket__qr {
    flex-shrink: 0;
    width: 120px;
    display: flex;
    gap: 10px;
    padding: 20px 18px;
    border-left: 2px dashed rgba(255, 255, 255, 0.3);
    align-items: stretch;
  }

  .rsc-ticket--accent .rsc-ticket__qr {
    border-left-color: rgba(6, 6, 6, 0.35);
  }

  .rsc-ticket__qr-dots {
    flex: 1;
    background-image: radial-gradient(circle, #ffffff 2.2px, transparent 2.6px);
    background-size: 11px 15px;
    background-position: center;
  }

  .rsc-ticket__qr-bars {
    flex: 1.4;
    background-image: repeating-linear-gradient(
      0deg,
      #ffffff 0 2.5px,
      transparent 2.5px 7px
    );
  }

  .rsc-ticket--accent .rsc-ticket__qr-dots {
    background-image: radial-gradient(circle, #060606 2.2px, transparent 2.6px);
  }

  .rsc-ticket--accent .rsc-ticket__qr-bars {
    background-image: repeating-linear-gradient(
      0deg,
      #060606 0 2.5px,
      transparent 2.5px 7px
    );
  }

  .rsc-posters__more {
    margin-top: 48px;
    text-align: center;
  }

  .rsc-posters__more-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 260px;
    padding: 16px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: 2px solid var(--accent, #00c3d0);
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
  }

  .rsc-posters__more-btn:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
    transform: translateY(-2px);
  }

  @media (max-width: 760px) {
    .rsc-posters {
      padding: 80px 16px 90px;
    }

    .rsc-ticket {
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

    .rsc-ticket__date {
      width: 100%;
      flex-direction: row;
      gap: 12px;
      padding: 22px 24px 14px;
    }

    .rsc-ticket__day {
      font-size: 38px;
    }

    .rsc-ticket__body {
      padding: 18px 24px 24px;
    }

    .rsc-ticket__footer {
      flex-direction: column;
      align-items: stretch;
    }

    .rsc-ticket__actions {
      flex-direction: column;
    }

    .rsc-ticket__btn {
      width: 100%;
      min-width: 0;
    }

    .rsc-ticket__qr {
      width: 100%;
      height: 56px;
      border-left: none;
      border-top: 2px dashed rgba(255, 255, 255, 0.3);
      padding: 12px 24px;
    }

    .rsc-ticket--accent .rsc-ticket__qr {
      border-top-color: rgba(6, 6, 6, 0.35);
    }
  }
`;