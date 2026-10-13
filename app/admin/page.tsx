// app/admin/page.tsx
// Вкладка «Настройки»: выбор акцентного цвета (8 вариантов) и
// управление блоками лендинга — порядок (drag & drop) и видимость.
// Данные хранятся в Supabase, таблица settings (ключ-значение).

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- 8 акцентных цветов ---------- */
const ACCENT_COLORS = [
  { id: 'cyan', value: '#00C3D0' },
  { id: 'blue', value: '#0A84FF' },
  { id: 'purple', value: '#7B61FF' },
  { id: 'pink', value: '#FF2D87' },
  { id: 'red', value: '#FF3B30' },
  { id: 'orange', value: '#FF9500' },
  { id: 'yellow', value: '#FFCC00' },
  { id: 'green', value: '#34C759' },
];

/* ---------- Блоки лендинга ---------- */
export type LandingBlock = {
  id: string;
  title: string;
  visible: boolean;
};

const DEFAULT_BLOCKS: LandingBlock[] = [
  { id: 'about', title: 'О нас', visible: true },
  { id: 'posters', title: 'Афиши', visible: true },
  { id: 'partners', title: 'Партнёры', visible: true },
  { id: 'news', title: 'Новости', visible: true },
  { id: 'gallery', title: 'Галерея', visible: true },
  { id: 'videos', title: 'Видео', visible: true },
  { id: 'faq', title: 'FAQ', visible: true },
  { id: 'contacts', title: 'Контакты', visible: true },
];

const DEFAULT_ACCENT = ACCENT_COLORS[0].value;

/* Ключи записей в таблице settings */
const KEY_COLOR = 'accent_color';
const KEY_BLOCKS = 'landing_blocks';

export default function AdminSettingsPage() {
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const [blocks, setBlocks] = useState<LandingBlock[]>(DEFAULT_BLOCKS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Загрузка настроек из Supabase ---------- */
  useEffect(() => {
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [KEY_COLOR, KEY_BLOCKS]);

      if (fetchError) {
        setError('Не удалось загрузить настройки: ' + fetchError.message);
        setLoading(false);
        return;
      }

      // Если записей нет — сохраняем дефолтные
      if (!data || data.length === 0) {
        await saveSettings(DEFAULT_ACCENT, DEFAULT_BLOCKS, false);
        setLoading(false);
        return;
      }

      for (const row of data) {
        if (row.key === KEY_COLOR) setAccent(row.value as string);
        if (row.key === KEY_BLOCKS) setBlocks(row.value as LandingBlock[]);
      }
      setLoading(false);
    })();
  }, []);

  /* ---------- Сохранение в Supabase ---------- */
  const saveSettings = async (
    color: string,
    bl: LandingBlock[],
    showToast = true
  ) => {
    const { error: upsertError } = await supabase.from('settings').upsert(
      [
        { key: KEY_COLOR, value: color, updated_at: new Date().toISOString() },
        { key: KEY_BLOCKS, value: bl, updated_at: new Date().toISOString() },
      ],
      { onConflict: 'key' }
    );

    if (upsertError) {
      setError('Ошибка сохранения: ' + upsertError.message);
      return;
    }

    if (showToast) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  /* ---------- Цвет ---------- */
  const selectColor = (value: string) => {
    setAccent(value);
    saveSettings(value, blocks);
  };

  /* ---------- Блоки: видимость ---------- */
  const toggleVisible = (id: string) => {
    const next = blocks.map((b) =>
      b.id === id ? { ...b, visible: !b.visible } : b
    );
    setBlocks(next);
    saveSettings(accent, next);
  };

  /* ---------- Блоки: перетаскивание ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setBlocks(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveSettings(accent, blocks);
  };

  /* ---------- Блоки: стрелки ---------- */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    saveSettings(accent, next);
  };

  if (loading) {
    return (
      <>
        <style>{SETTINGS_CSS}</style>
        <div className="set">
          <p className="set__status">Загрузка настроек…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SETTINGS_CSS}</style>

      <div className="set">
        <h1 className="set__title">Настройки</h1>

        {error && <p className="set__error">{error}</p>}

        {/* ---------- Настройка цвета ---------- */}
        <section className="set__section">
          <h2 className="set__section-title">Настройка цвета</h2>
          <div className="set__colors">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                className={'set__color' + (accent === color.value ? ' set__color--active' : '')}
                style={{ background: color.value }}
                onClick={() => selectColor(color.value)}
                aria-label={`Цвет ${color.value}`}
                aria-pressed={accent === color.value}
                title={color.value}
              />
            ))}
          </div>
          <p className="set__hint">
            Акцентный цвет: <code>{accent}</code>
          </p>
        </section>

        {/* ---------- Блоки ---------- */}
        <section className="set__section">
          <h2 className="set__section-title">Блоки</h2>

          <ul className="set__blocks">
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className={
                  'set__block' +
                  (dragIndex === index ? ' set__block--dragging' : '') +
                  (!block.visible ? ' set__block--hidden' : '')
                }
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="set__block-title">{block.title}</span>

                <div className="set__block-controls">
                  {/* Видимость */}
                  <button
                    className="set__icon-btn"
                    onClick={() => toggleVisible(block.id)}
                    aria-label={block.visible ? 'Скрыть блок' : 'Показать блок'}
                    title={block.visible ? 'Скрыть' : 'Показать'}
                  >
                    {block.visible ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
                        <circle cx="12" cy="12" r="2.8" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.7-.3 3.8-.7" />
                        <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
                      </svg>
                    )}
                  </button>

                  {/* Стрелки */}
                  <div className="set__arrows">
                    <button
                      className="set__icon-btn"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Выше"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 14 6-6 6 6" />
                      </svg>
                    </button>
                    <button
                      className="set__icon-btn"
                      onClick={() => move(index, 1)}
                      disabled={index === blocks.length - 1}
                      aria-label="Ниже"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 10 6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* Рукоятка drag */}
                  <span className="set__grip" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="set__hint">
            Перетаскивайте блоки за рукоятку или используйте стрелки. Глаз —
            включает/выключает блок на главной.
          </p>
        </section>

        {saved && <div className="set__saved">Сохранено ✓</div>}
      </div>
    </>
  );
}

const SETTINGS_CSS = `
  .set {
    max-width: 860px;
  }

  .set__title {
    margin: 0 0 40px;
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
  }

  .set__status {
    font-family: 'Poppins', sans-serif;
    color: #8e8e93;
  }

  .set__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.1);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 10px;
  }

  .set__section {
    margin-bottom: 48px;
  }

  .set__section-title {
    margin: 0 0 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: #ffffff;
  }

  .set__colors {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .set__color {
    width: 48px;
    height: 48px;
    padding: 0;
    border: 3px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .set__color:hover {
    transform: scale(1.08);
  }

  .set__color--active {
    border-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
  }

  .set__blocks {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .set__block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 24px;
    background: #1e1e1e;
    border: 1px solid transparent;
    border-radius: 14px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease;
  }

  .set__block:active {
    cursor: grabbing;
  }

  .set__block--dragging {
    border-color: #00c3d0;
    opacity: 0.7;
  }

  .set__block--hidden .set__block-title {
    color: #464646;
  }

  .set__block-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
    transition: color 0.2s ease;
  }

  .set__block-controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .set__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #8e8e93;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .set__icon-btn:hover:not(:disabled) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .set__icon-btn:disabled {
    opacity: 0.25;
    cursor: default;
  }

  .set__arrows {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .set__arrows .set__icon-btn {
    width: 30px;
    height: 24px;
  }

  .set__grip {
    display: flex;
    color: #464646;
  }

  .set__hint {
    margin: 16px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
  }

  .set__hint code {
    color: #00c3d0;
  }

  .set__saved {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 22px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #060606;
    background: #00c3d0;
    border-radius: 10px;
    animation: set-fade 0.25s ease;
  }

  @keyframes set-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;