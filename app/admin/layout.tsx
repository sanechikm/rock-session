// app/admin/layout.tsx
// Каркас админ-панели: меню слева + контент справа.
// Страница логина (/admin/login) рендерится БЕЗ этого каркаса.
// Акцентный цвет подтягивается из настроек сайта (меняется вместе с лендингом).

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- Вкладки меню ---------- */
const MENU = [
  { id: 'settings', label: 'Настройки', href: '/admin', icon: 'settings' },
  { id: 'posters', label: 'Афиши', href: '/admin/posters', icon: 'ticket' },
  { id: 'gallery', label: 'Галерея', href: '/admin/gallery', icon: 'gallery' },
  { id: 'videos', label: 'Видео', href: '/admin/videos', icon: 'video' },
  { id: 'news', label: 'Новости', href: '/admin/news', icon: 'news' },
  { id: 'partners', label: 'Партнёры', href: '/admin/partners', icon: 'partners' },
  { id: 'faq', label: 'FAQ', href: '/admin/faq', icon: 'faq' },
];

const ICONS: Record<string, React.ReactNode> = {
  settings: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-6z" />
      <path d="M14 5v2M14 11v2M14 17v2" />
    </svg>
  ),
  gallery: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-4.5-4.5L6 21" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 8h5M8 12h5M8 16h3" />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3 20v-.5a6 6 0 0 1 6-6h1a6 6 0 0 1 3 .8" />
      <path d="M14.5 20v-.5a4.5 4.5 0 0 1 6-4.2" />
    </svg>
  ),
  faq: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.7 2.7 0 0 1 5.3.7c0 1.7-2.5 2.1-2.5 3.6" />
      <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
    </svg>
  ),
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [accent, setAccent] = useState('#00C3D0');
  const [menuOpen, setMenuOpen] = useState(false);

  /* Акцентный цвет сайта из настроек */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'accent_color')
        .single();
      if (data?.value) setAccent(data.value as string);
    })();
  }, [pathname]); /* обновляем при переходе в «Настройки» */

  /* Выход: завершаем сессию и уходим на страницу логина */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  /* Блокируем скролл, пока открыто мобильное меню */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  /* Закрытие по Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Страница логина рендерится БЕЗ каркаса админки */
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{`:root { --accent: ${accent}; }`}</style>
      <style>{ADMIN_LAYOUT_CSS}</style>

      <div className="adm">
        {/* ---------- Мобильная шапка: логотип + бургер ---------- */}
        <header className="adm__topbar">
          <Link href="/admin" className="adm__topbar-logo" onClick={closeMenu}>
            <Image src="/logo.png" alt="RockSession Club" width={34} height={34} />
          </Link>
          <button
            className={'adm__burger' + (menuOpen ? ' adm__burger--open' : '')}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {/* Затемнение при открытом меню */}
        <div
          className={'adm__overlay' + (menuOpen ? ' adm__overlay--visible' : '')}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* ---------- Меню (сайдбар / мобильная панель) ---------- */}
        <aside className={'adm__sidebar' + (menuOpen ? ' adm__sidebar--open' : '')}>
          {/* Логотип */}
          <Link href="/admin" className="adm__logo" onClick={closeMenu}>
            <Image src="/logo.png" alt="RockSession Club" width={40} height={40} />
            <span className="adm__logo-text">Админка</span>
          </Link>

          {/* Пункты меню */}
          <nav className="adm__menu" aria-label="Меню админ-панели">
            {MENU.map((item, index) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={'adm__menu-item' + (isActive ? ' adm__menu-item--active' : '')}
                  onClick={closeMenu}
                  style={{ transitionDelay: menuOpen ? `${0.08 + index * 0.05}s` : '0s' }}
                >
                  <span className="adm__menu-icon">{ICONS[item.icon]}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Низ сайдбара */}
          <div className="adm__sidebar-bottom">
            <Link href="/" className="adm__back">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              На сайт
            </Link>
            <button className="adm__back adm__logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Выйти
            </button>
          </div>
        </aside>

        {/* ---------- Контент справа ---------- */}
        <main className="adm__content">{children}</main>
      </div>
    </>
  );
}

const ADMIN_LAYOUT_CSS = `
  .adm {
    display: flex;
    min-height: 100vh;
    background: #060606;
  }

  /* ---------- Сайдбар ---------- */
  .adm__sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    width: 248px;
    height: 100vh;
    padding: 20px 14px 16px;
    background: linear-gradient(180deg, #0e0e0e 0%, #080808 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    flex-shrink: 0;
  }

  /* Логотип */
  .adm__logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px 20px;
    margin-bottom: 12px;
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    transition: opacity 0.2s ease;
  }

  .adm__logo:hover {
    opacity: 0.8;
  }

  .adm__logo-text {
    font-family: 'Tablon', 'Arial Narrow', 'Arial', sans-serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* Пункты меню */
  .adm__menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .adm__menu-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: #8e8e93;
    text-decoration: none;
    border-radius: 10px;
    overflow: hidden;
    transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  }

  /* Лёгкий сдвиг при наведении */
  .adm__menu-item:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(3px);
  }

  /* Активный пункт: акцентная подложка + индикатор слева */
  .adm__menu-item--active {
    color: var(--accent, #00c3d0);
    background: color-mix(in srgb, var(--accent, #00c3d0) 12%, transparent);
    font-weight: 500;
  }

  .adm__menu-item--active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    background: var(--accent, #00c3d0);
    border-radius: 0 3px 3px 0;
    animation: adm-indicator 0.25s ease;
  }

  @keyframes adm-indicator {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }

  .adm__menu-icon {
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .adm__menu-item:hover .adm__menu-icon {
    transform: scale(1.1);
  }

  /* Низ сайдбара */
  .adm__sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  .adm__back {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #5a5a5e;
    text-decoration: none;
    border: none;
    background: none;
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .adm__back:hover {
    color: var(--accent, #00c3d0);
    background: rgba(255, 255, 255, 0.04);
  }

  .adm__logout:hover {
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
  }

  /* Контент */
  .adm__content {
    flex: 1;
    padding: 48px;
    min-width: 0;
    animation: adm-content-in 0.35s ease;
  }

  @keyframes adm-content-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ---------- Мобильная шапка (только ≤820px) ---------- */
  .adm__topbar {
    display: none;
  }

  @media (max-width: 820px) {
    .adm {
      flex-direction: column;
    }

    /* Шапка: логотип слева, бургер справа — как на главной */
    .adm__topbar {
      position: sticky;
      top: 0;
      z-index: 140;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: rgba(6, 6, 6, 0.75);
      -webkit-backdrop-filter: blur(14px);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .adm__topbar-logo {
      display: flex;
      line-height: 0;
    }

    /* Бургер */
    .adm__burger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 42px;
      height: 42px;
      padding: 10px;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 160;
    }

    .adm__burger span {
      display: block;
      width: 100%;
      height: 2px;
      background: #ffffff;
      border-radius: 2px;
      transition: transform 0.35s ease, opacity 0.25s ease;
    }

    .adm__burger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .adm__burger--open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .adm__burger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Затемнение фона */
    .adm__overlay {
      position: fixed;
      inset: 0;
      z-index: 145;
      background: rgba(0, 0, 0, 0.6);
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s ease, visibility 0.35s ease;
    }

    .adm__overlay--visible {
      opacity: 1;
      visibility: visible;
    }

    /* Панель меню — выезжает справа */
    .adm__sidebar {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 150;
      width: min(300px, 85vw);
      height: 100vh;
      padding: 90px 22px 24px;
      background: rgba(8, 8, 8, 0.97);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border-right: none;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      transform: translateX(100%);
      visibility: hidden;
      transition: transform 0.45s cubic-bezier(0.32, 0.72, 0.28, 1), visibility 0.45s;
    }

    .adm__sidebar--open {
      transform: translateX(0);
      visibility: visible;
    }

    .adm__logo {
      padding: 0 10px 18px;
      margin-bottom: 14px;
    }

    /* Каскад появления пунктов */
    .adm__menu-item {
      opacity: 0;
      transform: translateX(24px);
      transition: opacity 0.35s ease, transform 0.35s ease, color 0.2s ease,
        background 0.2s ease;
    }

    .adm__sidebar--open .adm__menu-item {
      opacity: 1;
      transform: translateX(0);
    }

    .adm__menu-item:hover {
      transform: translateX(3px);
    }

    .adm__sidebar--open .adm__menu-item:hover {
      transform: translateX(3px);
    }

    .adm__menu-item--active::before {
      top: 20%;
      bottom: 20%;
      left: 0;
      right: auto;
      width: 3px;
      height: auto;
      border-radius: 0 3px 3px 0;
    }

    .adm__content {
      padding: 24px 16px;
    }
  }
`;