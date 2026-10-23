// components/JaggedDivider.tsx
// «Рваный» разделитель между блоками. SVG берутся из /public/dividers/.
// Для мобильного — отдельный набор (public/dividers/mobile/), рисуется
// толще под узкий экран; пока файла нет, на мобильном показывается десктопная.
// Вставляется автоматически между секциями на главной, в админке не управляется.

'use client'; /* onError у мобильной картинки — нужен клиентский компонент */

/* Сколько вариантов линий лежит в public/dividers/ (1.svg, 2.svg, …) */
const VARIANT_COUNT = 3;

export default function JaggedDivider({ index }: { index: number }) {
  /* Варианты чередуются по порядку: 1, 2, 3, 1, 2… */
  const variant = (index % VARIANT_COUNT) + 1;

  return (
    <>
      <style>{DIVIDER_CSS}</style>

      {/* Десктопная линия */}
      <img
        src={`/dividers/${variant}.svg`}
        alt=""
        aria-hidden="true"
        className="rsc-divider rsc-divider--desktop"
        loading="lazy"
        draggable={false}
      />

      {/* Мобильная линия (только ≤640px). Если файла ещё нет —
          onError скрывает картинку и остаётся десктопная */}
      <img
        src={`/dividers/mobile/${variant}.svg`}
        alt=""
        aria-hidden="true"
        className="rsc-divider rsc-divider--mobile"
        loading="lazy"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    </>
  );
}

const DIVIDER_CSS = `
  .rsc-divider {
    display: block;
    width: 100%;
    height: auto; /* высота задаётся пропорциями SVG */
    margin: 0;
    user-select: none;
    pointer-events: none; /* линия — чисто декоративная, клики проходят сквозь */
    background: #060606;
  }

  /* По умолчанию показываем десктопную линию, мобильную прячем */
  .rsc-divider--mobile {
    display: none;
  }

  @media (max-width: 640px) {
    .rsc-divider--desktop {
      display: none;
    }

    .rsc-divider--mobile {
      display: block;
    }
  }
`;