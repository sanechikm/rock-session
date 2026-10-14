// components/Hero.tsx
// Hero-блок: ближайшее предстоящее событие из Supabase.
// Фон — обложка события (image), если нет — /hero-bg.jpg из public.
// Если нет ни одной будущей афиши — блок не рендерится.

import { supabase } from '@/lib/supabase';
import AnchorLink from './AnchorLink';

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const monthIndex = (m: string) => {
  const i = MONTHS_RU.indexOf(m);
  return i === -1 ? 0 : i;
};

const formatPrice = (n: number) => n.toLocaleString('ru-RU');

type Poster = {
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
};

export default async function Hero() {
  /* Все будущие видимые афиши — найдём ближайшую по дате */
  const { data: events } = await supabase
    .from('posters')
    .select('title, description, day, month, time, venue, price_from, price_to, ticket_url, image')
    .eq('is_past', false)
    .eq('visible', true)
    .order('sort_order', { ascending: true });

  if (!events || events.length === 0) return null;

  const year = new Date().getFullYear();
  const event = (events as Poster[]).reduce((nearest, p) => {
    const t = new Date(year, monthIndex(p.month), parseInt(p.day, 10)).getTime();
    const nt = new Date(year, monthIndex(nearest.month), parseInt(nearest.day, 10)).getTime();
    return t < nt ? p : nearest;
  });

  const bg = event.image || '/hero-bg.jpg';

  return (
    <>
      <style>{HERO_CSS}</style>

      <section className="rsc-hero" id="hero">
        {/* Фоновое изображение + затемнение */}
        <div
          className="rsc-hero__bg"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden="true"
        />

        <div className="rsc-hero__content">
          <p className="rsc-hero__tag">Ближайшее событие</p>

          <h1 className="rsc-hero__title">{event.title}</h1>

          {event.description && (
            <p className="rsc-hero__description">{event.description}</p>
          )}

          <div className="rsc-hero__info">
            <span className="rsc-hero__info-item">
              {event.day} {event.month} · {event.time}
            </span>
            {event.venue && (
              <span className="rsc-hero__info-item">{event.venue}</span>
            )}
            {event.price_from != null && (
              <span className="rsc-hero__info-item">
                {event.price_to != null && event.price_to !== event.price_from
                  ? `${formatPrice(event.price_from)}–${formatPrice(event.price_to)} ₽`
                  : `от ${formatPrice(event.price_from)} ₽`}
              </span>
            )}
          </div>

          <div className="rsc-hero__actions">
            {event.ticket_url && (
              <a
                href={event.ticket_url}
                className="rsc-hero__btn rsc-hero__btn--primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Купить билет
              </a>
            )}
            <AnchorLink
              href="#posters"
              className="rsc-hero__btn rsc-hero__btn--outline"
            >
              Афиша
            </AnchorLink>
          </div>
        </div>
      </section>
    </>
  );
}

const HERO_CSS = `
  .rsc-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #060606;
  }

  .rsc-hero__bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.45);
  }

  .rsc-hero__bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(6, 6, 6, 0.35) 0%,
      rgba(6, 6, 6, 0) 30%,
      rgba(6, 6, 6, 0) 60%,
      #060606 100%
    );
  }

  .rsc-hero__content {
    position: relative;
    z-index: 1;
    max-width: 1100px;
    padding: 140px 24px 80px;
    text-align: center;
  }

  .rsc-hero__tag {
    margin: 0 0 16px;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: 20px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-hero__title {
    margin: 0 0 24px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(48px, 9vw, 110px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: 0.01em;
  }

  .rsc-hero__description {
    margin: 0 auto 36px;
    max-width: 720px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(16px, 2vw, 20px);
    font-weight: 300;
    line-height: 1.6;
    color: #8e8e93;
  }

  .rsc-hero__info {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px 56px;
    margin-bottom: 44px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(16px, 2vw, 20px);
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-hero__actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .rsc-hero__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 220px;
    padding: 18px 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 17px;
    font-weight: 500;
    text-decoration: none;
    border: 2px solid var(--accent, #00c3d0);
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
  }

  .rsc-hero__btn:hover { transform: translateY(-2px); }
  .rsc-hero__btn:active { transform: translateY(0); }

  .rsc-hero__btn--primary {
    background: var(--accent, #00c3d0);
    color: #060606;
  }

  .rsc-hero__btn--primary:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-hero__btn--outline {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-hero__btn--outline:hover {
    background: var(--accent, #00c3d0);
    color: #060606;
  }

  @media (max-width: 640px) {
    .rsc-hero__content {
      padding: 120px 20px 60px;
    }

    .rsc-hero__info {
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 36px;
    }

    .rsc-hero__actions {
      flex-direction: column;
      align-items: stretch;
    }

    .rsc-hero__btn {
      width: 100%;
      min-width: 0;
    }
  }
`;