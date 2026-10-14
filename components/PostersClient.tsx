// components/PostersClient.tsx
// Клиентская часть блока «Афиши»: список билетов + модалка события (EventModal).

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SitePoster } from './Posters';
import EventModal from './EventModal';
import TicketFrame from './TicketFrame';
import Barcode from './Barcode';

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const monthIndex = (m: string) => {
  const i = MONTHS_RU.indexOf(m);
  return i === -1 ? 0 : i;
};

const formatPrice = (n: number) => n.toLocaleString('ru-RU');

export default function PostersClient({ posters }: { posters: SitePoster[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  const openPoster = posters.find((p) => p.id === openId) || null;

  /* Появление списка при прокрутке */
  const listRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Ближайшее событие — акцентная карточка */
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

  const close = useCallback(() => setOpenId(null), []);

  return (
    <>
      {/* ---------- Список билетов ---------- */}
      <div
        className={'rsc-posters__list' + (inView ? ' rsc-posters__list--in' : '')}
        ref={listRef}
      >
        {posters.map((event, index) => {
          const isNearest = index === nearestIndex;
          return (
            <article
              key={event.id}
              className={'rsc-ticket' + (isNearest ? ' rsc-ticket--accent' : '')}
              style={{ transitionDelay: inView ? `${index * 0.09}s` : '0s' }}
            >
              <TicketFrame accent={isNearest} />
              <div className="rsc-ticket__inner">
              <div className="rsc-ticket__date">
                <span className="rsc-ticket__day">{event.day}</span>
                <span className="rsc-ticket__month">
                  {event.month} · {event.time}
                </span>
              </div>

              <div className="rsc-ticket__body">
                <h3 className="rsc-ticket__title">{event.title}</h3>
                {event.description && (
                  <p className="rsc-ticket__description">{event.description}</p>
                )}
                {event.venue && <p className="rsc-ticket__venue">{event.venue}</p>}

                <div className="rsc-ticket__footer">
                  <span className="rsc-ticket__price">
                    {event.price_from != null && event.price_to != null
                      ? `${formatPrice(event.price_from)}–${formatPrice(event.price_to)} ₽`
                      : event.price_from != null
                        ? `от ${formatPrice(event.price_from)} ₽`
                        : ''}
                  </span>

                  <div className="rsc-ticket__actions">
                    <button
                      className="rsc-ticket__btn rsc-ticket__btn--outline"
                      onClick={() => setOpenId(event.id)}
                    >
                      Подробнее
                    </button>
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

              <div className="rsc-ticket__qr" aria-hidden="true">
                <Barcode dark={isNearest} />
              </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ---------- Модалка ---------- */}
      {openPoster && <EventModal poster={openPoster} onClose={close} />}
    </>
  );
}