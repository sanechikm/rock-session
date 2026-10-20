// components/Marquee.tsx
// Бегущая строка после Hero.
// Структура: чёрный отступ — чёрная линия — текст — чёрная линия — чёрный отступ.
// Управления не требует — текст задан константой ниже. Чистый CSS.

'use client';

/* Текст ленты */
const ITEMS = [
  'Живой звук',
  'Закрытый клуб',
  'Мировые хиты',
  'Живые эмоции',
  'Фотосъёмка',
  'Проф. ведущий',
  'Конкурсы и призы',
];''

/* Одна копия ленты:
   - элементы «◆  Текст» склеены двумя пробелами
   - набор слов повторён 3 раза — чтобы копия была длиннее любого экрана
     (иначе на широких мониторах между копиями виден пустой участок)
   - в конце — два неразрывных пробела: шов между копиями ровно такой же,
     как расстояние между элементами внутри ленты */
const SEQUENCE =
  Array(3).fill(ITEMS).flat().map((t) => `◆  ${t}`).join('  ') + '  ';

export default function Marquee() {
  return (
    <>
      <style>{MARQUEE_CSS}</style>

      <div className="rsc-marquee" aria-hidden="true">
        <div className="rsc-marquee__band">
          <div className="rsc-marquee__track">
            {/* Две копии ленты: бесшовная прокрутка */}
            <span className="rsc-marquee__text">{SEQUENCE}</span>
            <span className="rsc-marquee__text">{SEQUENCE}</span>
          </div>
        </div>
      </div>
    </>
  );
}

const MARQUEE_CSS = `
  /* Отступы от краёв (чёрные поля сверху и снизу) */
  .rsc-marquee {
    background: var(--accent, #00c3d0);
    padding: 8px 0;
  }

  /* Лента: чёрные линии прижаты к тексту */
  .rsc-marquee__band {
    overflow: hidden;
    background: var(--accent, #00c3d0);
    border-top: 2px solid #060606;
    border-bottom: 2px solid #060606;
    padding: 16px 0;
  }

  .rsc-marquee__track {
    display: flex;
    width: max-content;
    animation: rsc-marquee-scroll 40s linear infinite;
    will-change: transform;
  }

  .rsc-marquee__text {
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: pre; /* сохраняем двойные пробелы и nbsp у шва */
    color: #060606;
  }

  @keyframes rsc-marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); } /* ровно одна копия ленты */
  }

  /* Уважение к настройке «меньше движения» в системе пользователя */
  @media (prefers-reduced-motion: reduce) {
    .rsc-marquee__track {
      animation: none;
    }
  }
`;