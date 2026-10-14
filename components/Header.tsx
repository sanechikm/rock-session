// components/Header.tsx
// Шапка лендинга RockSession Club.
// Отступы: 60px между словами, 72px до логотипа.
// Hover — простое изменение цвета на акцентный.

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NAV_LEFT = [
  { label: 'О клубе', href: '#about' },
  { label: 'Афиши', href: '#posters' },
  { label: 'Партнёры', href: '#partners' },
];

const NAV_RIGHT = [
  { label: 'Новости', href: '#news' },
  { label: 'Галерея', href: '#gallery' },
  { label: 'Контакты', href: '#contacts' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  /* Блокируем скролл страницы, пока открыто мобильное меню */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* Закрытие по Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeMenu = () => setIsOpen(false);

  /* Плавный переход к якорю: работает и при повторном клике */
  const scrollToAnchor = (e: React.MouseEvent, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    history.replaceState(null, '', href);
  };

  return (
    <>
      <style>{HEADER_CSS}</style>

      <header className="rsc-header">
        <div className="rsc-header__inner">
          {/* Левая часть навигации */}
          <nav className="rsc-header__nav rsc-header__nav--left" aria-label="Основная навигация">
            {NAV_LEFT.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rsc-header__link"
                onClick={(e) => scrollToAnchor(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Логотип по центру */}
          <Link href="/" className="rsc-header__logo" aria-label="RockSession Club — на главную">
            <Image
              src="/logo.png"
              alt="RockSession Club"
              width={52}
              height={52}
              priority
            />
          </Link>

          {/* Правая часть навигации */}
          <nav className="rsc-header__nav rsc-header__nav--right" aria-label="Дополнительная навигация">
            {NAV_RIGHT.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rsc-header__link"
                onClick={(e) => scrollToAnchor(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Бургер (только мобилка) */}
          <button
            className={'rsc-header__burger' + (isOpen ? ' rsc-header__burger--open' : '')}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Затемнение фона при открытом меню */}
      <div
        className={'rsc-overlay' + (isOpen ? ' rsc-overlay--visible' : '')}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Мобильное меню — выезжает справа */}
      <aside
        className={'rsc-mobile-menu' + (isOpen ? ' rsc-mobile-menu--open' : '')}
        aria-hidden={!isOpen}
      >
        <nav className="rsc-mobile-menu__nav" aria-label="Мобильная навигация">
          {[...NAV_LEFT, ...NAV_RIGHT].map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="rsc-mobile-menu__link"
              onClick={(e) => {
                closeMenu();
                setTimeout(() => scrollToAnchor(e, item.href), 80);
              }}
              style={{ transitionDelay: isOpen ? `${0.08 + index * 0.05}s` : '0s' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="rsc-mobile-menu__footer">
          <Link href="/" className="rsc-mobile-menu__logo" onClick={closeMenu}>
            <Image src="/logo.png" alt="RockSession Club" width={44} height={44} />
          </Link>
        </div>
      </aside>
    </>
  );
}

const HEADER_CSS = `
  html { scroll-behavior: smooth; }

  /* ---------- Шапка ---------- */
  .rsc-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(6, 6, 6, 0.55);
    -webkit-backdrop-filter: blur(14px) saturate(1.4);
    backdrop-filter: blur(14px) saturate(1.4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Вся группа (ссылки + логотип + ссылки) центрируется как единое целое */
  .rsc-header__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 72px; /* отступ от логотипа до крайних ссылок */
  }

  .rsc-header__nav {
    display: flex;
    gap: 60px; /* между словами */
  }

  /* Hover — просто акцентный цвет, без подчёркиваний */
  .rsc-header__link {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: #ffffff;
    text-decoration: none;
    letter-spacing: 0.02em;
    padding: 6px 0;
    transition: color 0.25s ease;
  }

  .rsc-header__link:hover {
    color: var(--accent, #00c3d0);
  }

  .rsc-header__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    flex-shrink: 0;
    transition: opacity 0.25s ease;
  }

  .rsc-header__logo:hover {
    opacity: 0.8;
  }

  /* ---------- Бургер ---------- */
  .rsc-header__burger {
    display: none;
    justify-self: flex-end;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    width: 44px;
    height: 44px;
    padding: 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 130;
  }

  .rsc-header__burger span {
    display: block;
    width: 100%;
    height: 2px;
    background: #ffffff;
    border-radius: 2px;
    transition: transform 0.35s ease, opacity 0.25s ease;
  }

  /* Анимация бургера в крестик */
  .rsc-header__burger--open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
  .rsc-header__burger--open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .rsc-header__burger--open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

  /* ---------- Затемнение фона ---------- */
  .rsc-overlay {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgba(0, 0, 0, 0.6);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.35s ease, visibility 0.35s ease;
  }

  .rsc-overlay--visible {
    opacity: 1;
    visibility: visible;
  }

  /* ---------- Мобильное меню (выезжает справа, тёмный фон) ---------- */
  .rsc-mobile-menu {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    z-index: 120;
    width: min(320px, 85vw);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 100px 32px 32px;
    background: rgba(8, 8, 8, 0.97); /* заметно темнее, чем шапка */
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    transform: translateX(100%);
    visibility: hidden;
    transition: transform 0.45s cubic-bezier(0.32, 0.72, 0.28, 1), visibility 0.45s;
  }

  .rsc-mobile-menu--open {
    transform: translateX(0);
    visibility: visible;
  }

  .rsc-mobile-menu__nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Пункты меню появляются каскадом при открытии */
  .rsc-mobile-menu__link {
    font-family: 'Poppins', sans-serif;
    font-size: 22px;
    font-weight: 500;
    color: #ffffff;
    text-decoration: none;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    opacity: 0;
    transform: translateX(24px);
    transition: opacity 0.35s ease, transform 0.35s ease, color 0.25s ease;
  }

  .rsc-mobile-menu--open .rsc-mobile-menu__link {
    opacity: 1;
    transform: translateX(0);
  }

  .rsc-mobile-menu__link:hover,
  .rsc-mobile-menu__link:active {
    color: var(--accent, #00c3d0);
  }

  .rsc-mobile-menu__footer {
    display: flex;
    justify-content: center;
  }

  /* ---------- Адаптив ---------- */
  @media (max-width: 900px) {
    .rsc-header__inner {
      justify-content: space-between; /* логотип слева, бургер справа */
      height: 64px;
    }

    .rsc-header__nav { display: none; }
    .rsc-header__burger { display: flex; }
  }

  @media (max-width: 480px) {
    .rsc-header__inner { padding: 0 16px; }
  }
`;