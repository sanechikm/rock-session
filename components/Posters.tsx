// components/Posters.tsx
// Блок «Афиши» — серверный компонент: загружает афиши из Supabase
// и отдаёт клиентскому PostersClient (список билетов + модалка «Подробнее»).

import { supabase } from '@/lib/supabase';
import PostersClient from './PostersClient';

export type SitePoster = {
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
};

export default async function Posters() {
  const { data: events } = await supabase
    .from('posters')
    .select('*')
    .eq('is_past', false)
    .eq('visible', true)
    .order('sort_order', { ascending: true });

  const posters: SitePoster[] = events || [];

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
            <PostersClient posters={posters} />
          )}
        </div>
      </section>
    </>
  );
}

const POSTERS_CSS = `
  .rsc-posters {
    background: #060606;
    padding: 110px 24px 110px;
    overflow-x: clip; /* сдвиг билета при hover не расширяет страницу */
  }

  .rsc-posters__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  .rsc-posters__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-posters__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
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

  /* ---------- БИЛЕТ ---------- */
  .rsc-ticket {
    position: relative;
    display: flex;
    align-items: stretch;
    transition: transform 0.35s cubic-bezier(0.22, 0.8, 0.3, 1),
      opacity 0.6s ease;
  }

  /* Билеты скрыты, пока список не попал в зону видимости */
  .rsc-posters__list:not(.rsc-posters__list--in) .rsc-ticket {
    opacity: 0;
    transform: translateY(30px);
  }

  /* При наведении весь билет чуть едет вправо (только десктоп) */
  @media (hover: hover) {
    .rsc-ticket:hover {
      transform: translateX(8px);
    }
  }

  /* SVG-рамка: вырезы по краям + перфорация корешка */
  .rsc-ticket-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Контент поверх рамки */
  .rsc-ticket__inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: stretch;
    width: 100%;
  }

  .rsc-ticket--accent {
    background: none;
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
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: 54px;
    font-weight: 600;
    line-height: 1;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__day { color: #060606; }

  .rsc-ticket__month {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #ffffff;
  }

  .rsc-ticket--accent .rsc-ticket__month { color: #060606; }

  .rsc-ticket__body {
    flex: 1;
    padding: 32px 40px 24px 36px; /* справа воздух до перфорации */
    min-width: 0;
  }

  .rsc-ticket__title {
    margin: 0 0 12px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(24px, 3vw, 36px);
    line-height: 1.1;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__title { color: #060606; }

  .rsc-ticket__description {
    margin: 0 0 12px;
    max-width: 620px; /* длинный текст не тянется к корешку */
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.6;
    color: #8e8e93;
  }

  .rsc-ticket--accent .rsc-ticket__description { color: rgba(6, 6, 6, 0.75); }

  .rsc-ticket__venue {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
  }

  .rsc-ticket--accent .rsc-ticket__venue { color: #060606; }

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

  .rsc-ticket--accent .rsc-ticket__price { color: #060606; }

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
    border: 2px solid var(--accent, #00c3d0);
    background: transparent;
    color: var(--accent, #00c3d0);
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
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

  .rsc-ticket__btn--outline:hover {
    background: var(--accent, #00c3d0);
    color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn { border-color: #060606; }

  .rsc-ticket--accent .rsc-ticket__btn--primary {
    background: #060606;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket--accent .rsc-ticket__btn--primary:hover {
    background: transparent;
    color: #060606;
  }

  .rsc-ticket--accent .rsc-ticket__btn--outline { color: #060606; }

  .rsc-ticket--accent .rsc-ticket__btn--outline:hover {
    background: #060606;
    color: var(--accent, #00c3d0);
  }

  .rsc-ticket__qr {
    position: relative;
    flex-shrink: 0;
    width: 160px;
    display: flex;
    padding: 20px 32px 20px 26px; /* слева зона перфорации, штрихкод в стабе */
    align-items: stretch;
  }

  /* Перфорация: вертикальный ряд точек — корешок как будто можно оторвать.
     На десктопе её рисует SVG-рамка; точки — только мобильная версия. */
  .rsc-ticket__qr::before {
    content: none;
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 7px;
    width: 12px;
    background-image: radial-gradient(circle 2.2px, rgba(255, 255, 255, 0.9) 97%, transparent 100%);
    background-size: 12px 22px;
    background-position: center 0;
    background-repeat: repeat-y;
  }

  .rsc-ticket--accent .rsc-ticket__qr::before {
    background-image: radial-gradient(circle 2.2px, #060606 97%, transparent 100%);
  }


  /* Штрихкод (SVG с хаотичной толщиной линий) */
  .rsc-barcode {
    flex: 1;
    width: 100%;
    height: auto;
  }

  /* ---------- Мобильный: вертикальный билет с перфорацией ---------- */

  .rsc-ticket-frame-mobile {
    display: none; /* только на мобильном */
  }

  @media (max-width: 760px) {
    .rsc-posters {
      padding: 80px 16px;
    }

    .rsc-ticket__inner {
      position: relative;
      z-index: 1;
      flex-direction: column;
      padding: 22px 0px;
      background: transparent; /* фон рисует SVG-фрейм */
      border-radius: 0;
    }

    /* Вертикальная рамка вместо горизонтальной */
    .rsc-ticket-frame {
      display: none;
    }

    .rsc-ticket-frame-mobile {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    /* Дата и время — строкой */
    .rsc-ticket__date {
      width: auto;
      flex-direction: row;
      align-items: baseline;
      gap: 10px;
      padding: 0 0;
    }

    .rsc-ticket__day {
      font-size: 42px;
    }

    /* Кнопки — во всю ширину, в столбик */
    .rsc-ticket__actions {
      width: 100%;
      flex-direction: column;
      gap: 8px;
    }

    .rsc-ticket__btn {
      width: 100%;
      min-width: 0;
      padding: 12px 20px;
      font-size: 14px;
    }

    /* Акцентный билет: «Подробнее» — контурная, «Купить» — тёмная */
    .rsc-ticket--accent .rsc-ticket__btn--outline {
      background: transparent;
      color: #060606;
      border-color: #060606;
    }

    .rsc-ticket--accent .rsc-ticket__btn--primary {
      background: #060606;
      color: var(--accent, #00c3d0);
      border-color: #060606;
    }

    /* Штрихкод со стабом на мобильном не нужен */
    .rsc-ticket__qr {
      display: none;
    }

    /* Узкий экран — меньше полей по краям списка */
    .rsc-posters__list {
      padding-left: 12px;
      padding-right: 12px;
    }
  }
`;