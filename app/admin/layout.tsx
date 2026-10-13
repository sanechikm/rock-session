// app/admin/layout.tsx
// Каркас админ-панели: меню слева + контент справа.
// Страница логина (/admin/login) рендерится БЕЗ этого каркаса.

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ---------- Вкладки меню ---------- */
const MENU = [
  { id: 'settings', label: 'Настройки', href: '/admin', icon: 'settings' },
  { id: 'posters', label: 'Афиши', href: '/admin/posters', icon: 'ticket' },
  { id: 'gallery', label: 'Галерея', href: '/admin/gallery', icon: 'gallery' },
  { id: 'videos', label: 'Видео', href: '/admin/videos', icon: 'video' },
  { id: 'news', label: 'Новости', href: '/admin/news', icon: 'news' },
  { id: 'partners', label: 'Партнёры', href: '/admin/partners', icon: 'partners' },
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
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  /* Страница логина рендерится БЕЗ каркаса админки (без меню) */
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  /* Выход: завершаем сессию и уходим на страницу логина */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      <style>{ADMIN_LAYOUT_CSS}</style>

      <div className="adm">
        {/* ---------- Меню слева ---------- */}
        <aside className="adm__sidebar">
          <nav className="adm__menu" aria-label="Меню админ-панели">
            {MENU.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={'adm__menu-item' + (isActive ? ' adm__menu-item--active' : '')}
                >
                  <span className="adm__menu-icon">{ICONS[item.icon]}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Низ сайдбара: на сайт + выйти */}
          <div className="adm__sidebar-bottom">
            <Link href="/" className="adm__back">
              ← На сайт
            </Link>
            <button className="adm__back adm__logout" onClick={handleLogout}>
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

  /* Сайдбар */
  .adm__sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 240px;
    height: 100vh;
    padding: 24px 16px;
    background: #0c0c0c;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .adm__menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .adm__menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8e8e93;
    text-decoration: none;
    border-radius: 10px;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .adm__menu-item:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .adm__menu-item--active {
    color: #ffffff;
    background: #1e1e1e;
  }

  .adm__menu-icon {
    display: flex;
    align-items: center;
  }

  .adm__sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .adm__back {
    display: block;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #464646;
    text-decoration: none;
    border-radius: 10px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .adm__back:hover {
    color: #00c3d0;
  }

  /* Контент */
  .adm__content {
    flex: 1;
    padding: 48px;
    min-width: 0;
  }

  /* ---------- Мобилка: меню сверху ---------- */
  @media (max-width: 820px) {
    .adm {
      flex-direction: column;
    }

    .adm__sidebar {
      position: static;
      width: 100%;
      height: auto;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      overflow-x: auto;
    }

    .adm__menu {
      flex-direction: row;
      gap: 6px;
    }

    .adm__menu-item {
      white-space: nowrap;
      padding: 10px 14px;
    }

    .adm__sidebar-bottom {
      flex-direction: row;
      gap: 4px;
    }

    .adm__back {
      white-space: nowrap;
      padding: 10px 12px;
    }

    .adm__content {
      padding: 24px 16px;
    }
  }
`;