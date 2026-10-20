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

  /* ---------- МОДАЛКА СОБЫТИЯ ---------- */
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

  /* Обложка */
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

  /* Заглушка обложки: иконка ноты на фоне */
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

  /* Название */
  .rsc-pm__title {
    margin: 20px 0 14px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.05;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* Дата и время */
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
    font-weight: 300;
    line-height: 1.75;
    color: #8e8e93;
    white-space: pre-wrap;
  }

  /* Место */
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

  /* Карта */
  .rsc-pm__map {
    margin-top: 14px;
    width: 100%;
    aspect-ratio: 16 / 8;
    border: none;
    border-radius: 10px;
    background: #0c0c0c;
    filter: grayscale(1) invert(0.92) contrast(0.9); /* тёмная тема карты */
  }

  /* Исполнители (карточки групп) */
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
    font-family: var(--font-tablon), sans-serif;
    font-size: 24px;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 50%;
  }

  .rsc-pm__act-avatar--icon { color: rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.06); }

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

  /* Партнёры (фото/видео/ведущие) */
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
    font-family: var(--font-tablon), sans-serif;
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

  /* Галерея */
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

  /* Заглушка галереи */
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

  @media (max-width: 760px) {
    .rsc-posters { padding: 80px 16px 20px; }

    .rsc-ticket {
      flex-direction: column;
      /* SVG-рамка на мобильном не используется (сильное искажение) —
         дырки рисуем точками на верхнем и нижнем краях */
      background-image:
        radial-gradient(circle 5.5px, #060606 97%, transparent 100%),
        radial-gradient(circle 5.5px, #060606 97%, transparent 100%);
      background-color: #141414;
      background-size: 26px 11px, 26px 11px;
      background-position: 13px -5.5px, 13px calc(100% + 5.5px);
      background-repeat: repeat-x, repeat-x;
    }

    .rsc-ticket--accent {
      background-color: var(--accent, #00c3d0);
    }

    .rsc-ticket-frame {
      display: none;
    }

    .rsc-ticket__inner {
      flex-direction: column;
    }

    .rsc-ticket__date {
      width: 100%;
      flex-direction: row;
      gap: 12px;
      padding: 22px 24px 14px;
    }

    .rsc-ticket__day { font-size: 38px; }
    .rsc-ticket__body { padding: 18px 24px 24px; }

    .rsc-ticket__footer {
      flex-direction: column;
      align-items: stretch;
    }

    .rsc-ticket__actions { flex-direction: column; }
    .rsc-ticket__btn { width: 100%; min-width: 0; }

    /* В мобильной версии корешка со штрихкодом нет */
    .rsc-ticket__qr {
      display: none;
    }

    /* При нажатии на билет он чуть приподнимается вверх */
    .rsc-ticket:active {
      transform: translateY(-4px);
    }

    .rsc-pm__content { padding: 0 20px 24px; }
    .rsc-pm__gallery { grid-template-columns: repeat(2, 1fr); }
    .rsc-pm__acts, .rsc-pm__crew { grid-template-columns: 1fr 1fr; }
  }
`;