// components/News.tsx
// Блок «Новости» — прокручиваемая лента с затемнением снизу.
// Данные из Supabase (visible + sort_order из админки).
// Клик по новости — модальное окно с полным текстом.

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type NewsItem = {
  id: number;
  title: string;
  date: string;
  excerpt: string | null;
  content: string | null;
};

const LIST_MAX_HEIGHT = 640;

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('news')
        .select('id, title, date, excerpt, content')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  const openItem = items.find((n) => n.id === openId) || null;

  /* Блокируем скролл при открытой модалке */
  useEffect(() => {
    document.body.style.overflow = openId !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <>
      <style>{NEWS_CSS}</style>

      <section className="rsc-news" id="news">
        <div className="rsc-news__inner">
          <h2 className="rsc-news__heading">Новости</h2>
          <p className="rsc-news__subheading">Что нового у RockSession</p>

          <div className="rsc-news__list-wrap">
            <ul className="rsc-news__list" style={{ maxHeight: LIST_MAX_HEIGHT }}>
              {items.map((item) => (
                <li key={item.id} className="rsc-news__item">
                  <button
                    className="rsc-news__link"
                    onClick={() => setOpenId(item.id)}
                  >
                    <span className="rsc-news__date">{item.date}</span>
                    <span className="rsc-news__divider" aria-hidden="true" />
                    <span className="rsc-news__text">
                      <span className="rsc-news__title">{item.title}</span>
                      {item.excerpt && (
                        <span className="rsc-news__excerpt">{item.excerpt}</span>
                      )}
                    </span>
                    <svg
                      className="rsc-news__arrow"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div className="rsc-news__fade" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ---------- МОДАЛКА С ПОЛНОЙ НОВОСТЬЮ ---------- */}
      {openItem && (
        <>
          <div
            className="rsc-nm-overlay"
            onClick={() => setOpenId(null)}
            aria-hidden="true"
          />

          <div className="rsc-nm" role="dialog" aria-modal="true">
            <button
              className="rsc-nm__close"
              onClick={() => setOpenId(null)}
              aria-label="Закрыть"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <span className="rsc-nm__date">{openItem.date}</span>
            <h3 className="rsc-nm__title">{openItem.title}</h3>

            <div className="rsc-nm__body">
              {openItem.content ? (
                <p className="rsc-nm__text">{openItem.content}</p>
              ) : (
                <p className="rsc-nm__text">
                  {openItem.excerpt || 'Текст новости скоро появится.'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

const NEWS_CSS = `
  .rsc-news {
    background: #060606;
    padding: 110px 24px 120px;
  }

  .rsc-news__inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  .rsc-news__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-news__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-news__list-wrap {
    position: relative;
  }

  .rsc-news__list {
    margin: 0;
    padding: 0 24px 40px 0;
    list-style: none;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--accent, #00c3d0) #141414;
  }

  .rsc-news__list::-webkit-scrollbar {
    width: 5px;
  }

  .rsc-news__list::-webkit-scrollbar-track {
    background: #141414;
    border-radius: 3px;
  }

  .rsc-news__list::-webkit-scrollbar-thumb {
    background: var(--accent, #00c3d0);
    border-radius: 3px;
  }

  .rsc-news__item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .rsc-news__link {
    display: flex;
    align-items: center;
    gap: 32px;
    width: 100%;
    padding: 28px 8px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.25s ease;
  }

  .rsc-news__link:hover {
    background: rgba(0, 195, 208, 0.05);
  }

  .rsc-news__date {
    flex-shrink: 0;
    width: 110px;
    font-family: 'Poppins', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--accent, #00c3d0);
  }

  .rsc-news__divider {
    flex-shrink: 0;
    width: 2px;
    align-self: stretch;
    min-height: 48px;
    background: var(--accent, #00c3d0);
    opacity: 0.6;
  }

  .rsc-news__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rsc-news__title {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(17px, 2vw, 22px);
    font-weight: 600;
    line-height: 1.35;
    color: #ffffff;
    text-align: left;
    transition: color 0.25s ease;
  }

  .rsc-news__link:hover .rsc-news__title {
    color: var(--accent, #00c3d0);
  }

  .rsc-news__excerpt {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: #8e8e93;
    text-align: left;
  }

  .rsc-news__arrow {
    flex-shrink: 0;
    color: #464646;
    transition: color 0.25s ease, transform 0.25s ease;
  }

  .rsc-news__link:hover .rsc-news__arrow {
    color: var(--accent, #00c3d0);
    transform: translateX(4px);
  }

  .rsc-news__fade {
    position: absolute;
    left: 0; right: 5px; bottom: 0;
    height: 45%;
    background: linear-gradient(
      to bottom,
      rgba(6, 6, 6, 0) 0%,
      rgba(6, 6, 6, 0.75) 60%,
      #060606 100%
    );
    pointer-events: none;
  }

  /* ---------- МОДАЛКА ---------- */
  .rsc-nm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    animation: rsc-nm-fade 0.25s ease;
  }

  @keyframes rsc-nm-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .rsc-nm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(620px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: 36px 36px 32px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    transform: translate(-50%, -50%);
    animation: rsc-nm-in 0.25s ease;
  }

  @keyframes rsc-nm-in {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .rsc-nm__close {
    position: absolute;
    top: 14px;
    right: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: none;
    color: #8e8e93;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .rsc-nm__close:hover {
    color: #ffffff;
  }

  .rsc-nm__date {
    display: block;
    margin-bottom: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent, #00c3d0);
  }

  .rsc-nm__title {
    margin: 0 0 20px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(19px, 2.4vw, 24px);
    font-weight: 600;
    line-height: 1.35;
    color: #ffffff;
  }

  .rsc-nm__body {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }

  .rsc-nm__text {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.8;
    color: #8e8e93;
    white-space: pre-wrap; /* сохраняет переносы строк из админки */
  }

  /* ---------- Мобилка ---------- */
  @media (max-width: 640px) {
    .rsc-news {
      padding: 80px 16px 90px;
    }

    .rsc-news__list {
      padding-right: 14px;
    }

    .rsc-news__fade {
      right: 5px;
    }

    .rsc-news__link {
      flex-wrap: wrap;
      gap: 12px 16px;
      padding: 22px 4px;
    }

    .rsc-news__date {
      width: auto;
      font-size: 16px;
    }

    .rsc-news__divider {
      width: 100%;
      height: 2px;
      min-height: 0;
      order: 3;
    }

    .rsc-news__arrow {
      display: none;
    }

    .rsc-nm {
      padding: 28px 20px 24px;
    }
  }
`;