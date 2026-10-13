// components/Hero.tsx
// Hero-блок: ближайшее событие на весь экран.
// Пока нет админки и БД — данные берутся из заглушки PLACEHOLDER_EVENT ниже.
// Фон: положите изображение в /public (путь задаётся в image).

'use client';

import Link from 'next/link';

/* ---------- ЗАГЛУШКА: заменится данными из Supabase, когда появится админка ---------- */
export type HeroEvent = {
  tag: string;        // надпись сверху, напр. «Ближайшее событие»
  title: string;      // название события
  description: string;
  date: string;       // напр. «25 сентября»
  time: string;       // напр. «19:00»
  venue: string;      // площадка
  priceFrom: number;  // цена от
  priceTo: number;    // цена до
  ticketUrl: string;  // ссылка на покупку (Lava)
  image: string;      // фоновое изображение из /public
};

const PLACEHOLDER_EVENT: HeroEvent = {
  tag: 'Ближайшее событие',
  title: 'Ритмы Ростова',
  description:
    'В честь 277-летия города RockSession Club приглашает вас на очередную встречу клуба.',
  date: '25 сентября',
  time: '19:00',
  venue: 'Ресторан «Полёт»',
  priceFrom: 6400,
  priceTo: 6900,
  ticketUrl: '#', // TODO: вставить ссылку Lava
  image: '/hero-bg.jpg', // TODO: положить файл в /public
};
/* ------------------------------------------------------------------------------------- */

// Форматирование цены: 6400 -> «6 400»
const formatPrice = (n: number) => n.toLocaleString('ru-RU');

export default function Hero({ event = PLACEHOLDER_EVENT }: { event?: HeroEvent }) {
  return (
    <>
      <style>{HERO_CSS}</style>

      <section className="rsc-hero" id="hero">
        {/* Фоновое изображение + затемнение */}
        <div
          className="rsc-hero__bg"
          style={{ backgroundImage: `url(${event.image})` }}
          aria-hidden="true"
        />

        <div className="rsc-hero__content">
          {/* Надпись сверху — шрифт Belepotan */}
          <p className="rsc-hero__tag">{event.tag}</p>

          {/* Название события — шрифт Tablon */}
          <h1 className="rsc-hero__title">{event.title}</h1>

          {/* Описание — Poppins */}
          <p className="rsc-hero__description">{event.description}</p>

          {/* Строка с информацией */}
          <div className="rsc-hero__info">
            <span className="rsc-hero__info-item">
              {event.date} · {event.time}
            </span>
            <span className="rsc-hero__info-item">{event.venue}</span>
            <span className="rsc-hero__info-item">
              {formatPrice(event.priceFrom)}–{formatPrice(event.priceTo)} ₽
            </span>
          </div>

          {/* Кнопки */}
          <div className="rsc-hero__actions">
            <a
              href={event.ticketUrl}
              className="rsc-hero__btn rsc-hero__btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Купить билет
            </a>
            <Link href="#posters" className="rsc-hero__btn rsc-hero__btn--outline">
              Афиша
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* Стили в константе — проверенный подход */
const HERO_CSS = `
  .rsc-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #060606; /* фон на случай, пока картинка не загружена */
  }

  /* Фоновое изображение с затемнением */
  .rsc-hero__bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.45); /* затемнение, чтобы текст читался */
  }

  /* Дополнительный градиент снизу для плавного перехода к следующему блоку */
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
    position: relative; /* поверх фона */
    z-index: 1;
    max-width: 1100px;
    padding: 140px 24px 80px; /* отступ сверху под фиксированную шапку */
    text-align: center;
  }

  /* «Ближайшее событие» — Belepotan, акцентный цвет */
  .rsc-hero__tag {
    margin: 0 0 16px;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: 20px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }

  /* Название — Tablon, большое */
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

  /* Строка: дата · площадка · цена */
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

  /* Базовая кнопка */
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
    border: 2px solid var(--accent);
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
  }

  .rsc-hero__btn:hover { transform: translateY(-2px); }
  .rsc-hero__btn:active { transform: translateY(0); }

  /* Основная кнопка — заливка акцентом */
  .rsc-hero__btn--primary {
    background: var(--accent);
    color: #060606;
  }

  .rsc-hero__btn--primary:hover {
    background: transparent;
    color: var(--accent);
  }

  /* Контурная кнопка */
  .rsc-hero__btn--outline {
    background: transparent;
    color: var(--accent);
  }

  .rsc-hero__btn--outline:hover {
    background: var(--accent);
    color: #060606;
  }

  /* ---------- Мобилка ---------- */
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