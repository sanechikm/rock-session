// components/ScrollTop.tsx
// Кнопка «наверх»: появляется после прокрутки вниз (>600px),
// плавно возвращает к началу страницы.

'use client';

import { useState, useEffect } from 'react';

const SHOW_AFTER = 600;

export default function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style>{SCROLL_TOP_CSS}</style>

      <button
        className={'rsc-top' + (visible ? ' rsc-top--visible' : '')}
        onClick={scrollToTop}
        aria-label="Наверх"
        title="Наверх"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>
    </>
  );
}

const SCROLL_TOP_CSS = `
  .rsc-top {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 150;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease,
      background 0.2s ease, color 0.2s ease;
  }

  .rsc-top--visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .rsc-top:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
    box-shadow: 0 0 0 2px var(--accent, #00c3d0);
  }

  @media (max-width: 640px) {
    .rsc-top {
      right: 16px;
      bottom: 16px;
      width: 44px;
      height: 44px;
    }
  }
`;