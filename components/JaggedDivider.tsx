// components/JaggedDivider.tsx
// «Рваный» разделитель между блоками. SVG берётся из /public/dividers/.
// Вставляется автоматически между секциями на главной, в админке не управляется.

/* Сколько вариантов линий лежит в public/dividers/ (1.svg, 2.svg, …) */
const VARIANT_COUNT = 8;

export default function JaggedDivider({ index }: { index: number }) {
  /* Варианты чередуются по порядку: 1, 2, 3, 4, 5, 1, 2… */
  const variant = (index % VARIANT_COUNT) + 1;

  return (
    <>
      <style>{DIVIDER_CSS}</style>

      <img
        src={`/dividers/${variant}.svg`}
        alt=""
        aria-hidden="true"
        className="rsc-divider"
        loading="lazy"
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
  }
`;