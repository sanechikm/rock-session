// components/Barcode.tsx
// Штрихкод для корешка билета: горизонтальные линии хаотичной толщины,
// как на настоящих билетах. Паттерн фиксированный — одинаков на всех билетах.

export default function Barcode({ dark = false }: { dark?: boolean }) {
  const color = dark ? '#060606' : '#ffffff';

  /* Последовательность толщин линий (псевдохаотичная) */
  const pattern = [
    3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 1, 4, 2, 1, 3, 1, 1,
    2, 1, 1, 4, 1, 2, 3, 1, 1, 1, 2, 4, 1, 1, 3, 2, 1, 1, 2, 1,
    4, 1, 1, 2, 3, 1, 1, 1, 2, 1, 4, 2, 1, 3, 1, 1, 2, 1, 1, 3,
  ];
  /* Промежуток после каждой линии */
  const gaps = pattern.map((_, i) => (i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 3));

  /* Считаем общую высоту и собираем координаты линий */
  let y = 0;
  const lines = pattern.map((h, i) => {
    const line = { y, h };
    y += h + gaps[i];
    return line;
  });
  const totalH = y;

  return (
    <svg
      className="rsc-barcode"
      viewBox={`0 0 100 ${totalH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <rect key={i} x="0" y={l.y} width="100" height={l.h} fill={color} />
      ))}
    </svg>
  );
}