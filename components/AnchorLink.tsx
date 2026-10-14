// components/AnchorLink.tsx
// Ссылка на якорь (#block) с плавным скроллом.
// Работает и при повторном клике на тот же пункт: вместо стандартного
// поведения браузера (игнор, если hash совпадает) всегда scrollIntoView.
// Для обычных (не-якорных) href работает как обычная ссылка.

'use client';

export default function AnchorLink({
  href,
  className,
  children,
  onClick,
  ariaLabel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (!href.startsWith('#')) return; // внешние ссылки — стандартное поведение
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Обновляем hash без дёрганья истории
    history.replaceState(null, '', href);
    onClick?.();
  };

  return (
    <a href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}