// components/Hero.tsx
// Hero-блок: ближайшее предстоящее событие из Supabase.
// Фон — обложка события (image), если нет — /hero-bg.jpg из public.
// Если будущих афиш нет — блок не рендерится.

import { supabase } from '@/lib/supabase';
import LavaButton from './LavaButton';
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
  use_as_hero: boolean | null;
};

export default async function Hero() {
  const { data: events } = await supabase
    .from('posters')
    .select('title, description, day, month, time, venue, price_from, price_to, ticket_url, image, use_as_hero')
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

  /* Обложка как фон — только если включена галочка у этого события */
  const bg = event.use_as_hero && event.image ? event.image : '/hero-bg.jpg';

  return (
    <>
      <style>{HERO_CSS}</style>

      <section className="rsc-hero" id="hero">
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
              <LavaButton
                ticketUrl={event.ticket_url}
                className="rsc-hero__btn rsc-hero__btn--primary"
              />
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
    animation: rsc-hero-zoom 12s ease-out forwards; /* лёгкий наезд фона при загрузке */
  }

  @keyframes rsc-hero-zoom {
    from { transform: scale(1.06); }
    to   { transform: scale(1); }
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
    max-width: 980px;
    padding: 140px 24px 80px;
    text-align: center;
  }

  /* Каскадное появление контента при загрузке */
  .rsc-hero__tag,
  .rsc-hero__title,
  .rsc-hero__description,
  .rsc-hero__info,
  .rsc-hero__actions {
    animation: rsc-hero-rise 0.8s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  }
  .rsc-hero__tag        { animation-delay: 0.1s; }
  .rsc-hero__title      { animation-delay: 0.2s; }
  .rsc-hero__description{ animation-delay: 0.35s; }
  .rsc-hero__info       { animation-delay: 0.5s; }
  .rsc-hero__actions    { animation-delay: 0.65s; }

  @keyframes rsc-hero-rise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rsc-hero__tag {
    margin: 0 0 18px;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(16px, 1.8vw, 20px);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  /* Заголовок */
  .rsc-hero__title {
    margin: 0 0 26px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(40px, 6.5vw, 72px);
    line-height: 1;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-hero__description {
    margin: 0 auto 38px;
    max-width: 680px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.8vw, 18px);
    font-weight: 300;
    line-height: 1.65;
    color: #8e8e93;
  }

  .rsc-hero__info {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 14px 48px;
    margin-bottom: 40px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.8vw, 18px);
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-hero__actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  /* Кнопки: компактнее — уменьшены отступы и ширина */
  .rsc-hero__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    min-width: 190px;
    padding: 13px 26px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    border: 2px solid var(--accent, #00c3d0);
    cursor: pointer;
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
      margin-bottom: 32px;
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