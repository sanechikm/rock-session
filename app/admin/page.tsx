// app/admin/page.tsx
// Вкладка «Настройки»: акцентный цвет (8 вариантов) и блоки лендинга
// (порядок + видимость). Данные — в Supabase, таблица settings.

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- 8 акцентных цветов ---------- */
const ACCENT_COLORS = [
  { id: 'cyan', name: 'Бирюзовый', value: '#00C3D0' },
  { id: 'blue', name: 'Синий', value: '#0A84FF' },
  { id: 'purple', name: 'Фиолетовый', value: '#7B61FF' },
  { id: 'pink', name: 'Розовый', value: '#FF2D87' },
  { id: 'red', name: 'Красный', value: '#FF3B30' },
  { id: 'orange', name: 'Оранжевый', value: '#FF9500' },
  { id: 'yellow', name: 'Жёлтый', value: '#FFCC00' },
  { id: 'green', name: 'Зелёный', value: '#34C759' },
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
  { id: 'past', title: 'Отыграли', visible: true },
  { id: 'partners', title: 'Партнёры', visible: true },
  { id: 'news', title: 'Новости', visible: true },
  { id: 'gallery', title: 'Галерея', visible: true },
  { id: 'videos', title: 'Видео', visible: true },
  { id: 'contacts', title: 'Контакты', visible: true },
];

const DEFAULT_ACCENT = ACCENT_COLORS[0].value;

/* Слияние сохранённых блоков с дефолтами:
   порядок и видимость из базы сохраняются, а новые блоки
   (например, «Отыграли») подставляются после своего «соседа»
   даже если настройки были сохранены до их появления. */
function mergeBlocks(
  defaults: LandingBlock[],
  saved: LandingBlock[] | null
): LandingBlock[] {
  if (!saved) return defaults;

  // известные блоки — в сохранённом порядке
  const result = saved.filter((b) => defaults.some((d) => d.id === b.id));

  // недостающие дефолтные — вставляем после предыдущего блока из дефолтов
  for (const d of defaults) {
    if (result.some((b) => b.id === d.id)) continue;
    const prev = defaults[defaults.indexOf(d) - 1];
    const prevIndex = prev ? result.findIndex((b) => b.id === prev.id) : -1;
    if (prevIndex >= 0) result.splice(prevIndex + 1, 0, d);
    else result.push(d);
  }

  return result;
}

const KEY_COLOR = 'accent_color';
const KEY_BLOCKS = 'landing_blocks';

export default function AdminSettingsPage() {
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const [blocks, setBlocks] = useState<LandingBlock[]>(DEFAULT_BLOCKS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /* Перетаскивание пальцем (touch): жест начинается с рукоятки */
  const listRef = useRef<HTMLUListElement>(null);
  const [touchDrag, setTouchDrag] = useState<number | null>(null);
  const touchRef = useRef<{
    index: number;
    startY: number;
    dy: number;
    active: boolean;
  } | null>(null);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Загрузка ---------- */
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

      if (!data || data.length === 0) {
        await saveSettings(DEFAULT_ACCENT, DEFAULT_BLOCKS, false);
        setLoading(false);
        return;
      }

      for (const row of data) {
        if (row.key === KEY_COLOR) setAccent(row.value as string);
        if (row.key === KEY_BLOCKS) {
          const saved = row.value as LandingBlock[];
          const merged = mergeBlocks(DEFAULT_BLOCKS, saved);
          setBlocks(merged);
          // Подлечиваем запись в базе: добавляем новые блоки
          // («Отыграли» и далее), чтобы админка и сайт не расходились
          if (JSON.stringify(merged) !== JSON.stringify(saved)) {
            void supabase.from('settings').upsert(
              {
                key: KEY_BLOCKS,
                value: merged,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'key' }
            );
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  /* ---------- Сохранение ---------- */
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

  /* ---------- Touch: палец на рукоятке ---------- */
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlocks(next);
  };

  const handleGripDown = (e: React.PointerEvent, index: number) => {
    if (e.pointerType !== 'touch') return; /* мышь — HTML5 dnd */
    touchRef.current = { index, startY: e.clientY, dy: 0, active: false };
  };

  const handleGripMove = (e: React.PointerEvent) => {
    const t = touchRef.current;
    if (!t) return;
    t.dy = e.clientY - t.startY;

    /* Порог: меньше 14px — считаем тапом/скроллом */
    if (!t.active && Math.abs(t.dy) > 14) {
      t.active = true;
      setTouchDrag(t.index);
    }
    if (!t.active || !listRef.current) return;

    /* Пункт под пальцем — переставляем в реальном времени */
    const rows = Array.from(listRef.current.children) as HTMLElement[];
    let target = t.index;
    rows.forEach((row, i) => {
      const rect = row.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) target = i;
    });
    if (target !== t.index) {
      reorder(t.index, target);
      t.index = target;
      setTouchDrag(target);
    }
  };

  const handleGripUp = () => {
    const t = touchRef.current;
    if (t?.active) saveSettings(accent, blocks); /* фиксируем порядок */
    touchRef.current = null;
    setTouchDrag(null);
  };

  if (loading) {
    return (
      <>
        <style>{SETTINGS_CSS}</style>
        <div className="set">
          <p className="set__loading">Загрузка настроек…</p>
        </div>
      </>
    );
  }

  const activeColorName =
    ACCENT_COLORS.find((c) => c.value === accent)?.name || 'Пользовательский';

  return (
    <>
      <style>{SETTINGS_CSS}</style>

      <div className="set">
        {/* Шапка страницы */}
        <div className="set__header">
          <h1 className="set__title">Настройки</h1>
          <p className="set__subtitle">
            Оформление и структура главной страницы сайта
          </p>
        </div>

        {error && (
          <div className="set__error">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.5" />
            </svg>
            {error}
          </div>
        )}

        {/* ---------- Секция: цвет ---------- */}
        <section className="set__section">
          <div className="set__section-head">
            <h2 className="set__section-title">Акцентный цвет</h2>
            <span className="set__accent-name" style={{ color: accent }}>
              {activeColorName} · {accent}
            </span>
          </div>

          <div className="set__colors">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                className={'set__color' + (accent === color.value ? ' set__color--active' : '')}
                style={{ background: color.value }}
                onClick={() => selectColor(color.value)}
                aria-label={color.name}
                aria-pressed={accent === color.value}
                title={color.name}
              >
                {/* Галочка на выбранном */}
                <svg
                  className="set__color-check"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke={color.value}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12.5l5 5L20 6.5" />
                </svg>
              </button>
            ))}
          </div>

          <p className="set__hint">
            Цвет применяется ко всему сайту и админке сразу после выбора
          </p>
        </section>

        {/* ---------- Секция: блоки ---------- */}
        <section className="set__section">
          <div className="set__section-head">
            <h2 className="set__section-title">Блоки главной страницы</h2>
            <span className="set__section-note">
              {blocks.filter((b) => b.visible).length} из {blocks.length} видимы
            </span>
          </div>

          <ul className="set__blocks" ref={listRef}>
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className={
                  'set__block' +
                  (dragIndex === index || touchDrag === index
                    ? ' set__block--dragging'
                    : '') +
                  (!block.visible ? ' set__block--hidden' : '')
                }
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="set__block-num">{index + 1}</span>
                <span className="set__block-title">{block.title}</span>

                <div className="set__block-controls">
                  {/* Видимость */}
                  <button
                    className={
                      'set__icon-btn' +
                      (block.visible ? ' set__icon-btn--visible' : ' set__icon-btn--hidden-eye')
                    }
                    onClick={() => toggleVisible(block.id)}
                    aria-label={block.visible ? 'Скрыть блок' : 'Показать блок'}
                    title={block.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
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
                      className="set__icon-btn set__icon-btn--sm"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Выше"
                    >
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 14 6-6 6 6" />
                      </svg>
                    </button>
                    <button
                      className="set__icon-btn set__icon-btn--sm"
                      onClick={() => move(index, 1)}
                      disabled={index === blocks.length - 1}
                      aria-label="Ниже"
                    >
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 10 6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* Рукоятка */}
                  <span
                    className="set__grip"
                    aria-hidden="true"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => handleGripDown(e, index)}
                    onPointerMove={handleGripMove}
                    onPointerUp={handleGripUp}
                    onPointerCancel={handleGripUp}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="set__hint">
            Перетаскивайте блоки за рукоятку или стрелками. Глаз — видимость
            блока на главной странице.
          </p>
        </section>

        {/* Тост сохранения */}
        {saved && (
          <div className="set__saved" role="status">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            Сохранено
          </div>
        )}
      </div>
    </>
  );
}

const SETTINGS_CSS = `
  .set {
    max-width: 880px;
    animation: set-in 0.4s ease;
  }

  @keyframes set-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .set__loading {
    font-family: 'Poppins', sans-serif;
    color: #8e8e93;
  }

  /* ---------- Шапка ---------- */
  .set__header {
    margin-bottom: 36px;
  }

  .set__title {
    margin: 0 0 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .set__subtitle {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .set__error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  /* ---------- Секции ---------- */
  .set__section {
    margin-bottom: 40px;
    padding: 28px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    animation: set-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  }

  .set__section:nth-of-type(1) { animation-delay: 0.05s; }
  .set__section:nth-of-type(2) { animation-delay: 0.15s; }

  @keyframes set-section-in {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .set__section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 22px;
  }

  .set__section-title {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }

  .set__accent-name {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .set__section-note {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  /* ---------- Цвета ---------- */
  .set__colors {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .set__color {
    position: relative;
    width: 52px;
    height: 52px;
    padding: 0;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .set__color:hover {
    transform: scale(1.1);
  }

  /* Выбранный: двойное кольцо */
  .set__color--active {
    box-shadow: 0 0 0 3px #060606, 0 0 0 5px currentColor;
    transform: scale(1.05);
  }

  .set__color--active:hover {
    transform: scale(1.12);
  }

  .set__color-check {
    position: absolute;
    inset: 0;
    margin: auto;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .set__color--active .set__color-check {
    opacity: 1;
    transform: scale(1);
  }

  /* ---------- Блоки ---------- */
  .set__blocks {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .set__block {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 15px 18px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease,
      transform 0.2s ease, background 0.2s ease;
  }

  .set__block:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .set__block:active {
    cursor: grabbing;
  }

  .set__block--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .set__grip {
    touch-action: none; /* жест на рукоятке не скроллит страницу */
  }

  .set__block-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #5a5a5e;
    background: #101010;
    border-radius: 8px;
  }

  .set__block--hidden .set__block-title,
  .set__block--hidden .set__block-num {
    color: #464646;
  }

  .set__block-title {
    flex: 1;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
    transition: color 0.2s ease;
  }

  .set__block-controls {
    display: flex;
    align-items: center;
    gap: 14px;
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
    border-radius: 10px;
    color: #8e8e93;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .set__icon-btn:hover:not(:disabled) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .set__icon-btn:disabled {
    opacity: 0.2;
    cursor: default;
  }

  .set__icon-btn--visible {
    color: var(--accent, #00c3d0);
  }

  .set__icon-btn--hidden-eye {
    color: #464646;
  }

  .set__icon-btn--sm {
    width: 30px;
    height: 26px;
    border-radius: 7px;
  }

  .set__arrows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px;
    background: #101010;
    border-radius: 9px;
  }

  .set__grip {
    display: flex;
    color: #3a3a3a;
    transition: color 0.2s ease;
  }

  .set__block:hover .set__grip {
    color: #6a6a6e;
  }

  /* ---------- Прочее ---------- */
  .set__hint {
    margin: 16px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #5a5a5e;
  }

  .set__saved {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 22px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: set-toast 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
  }

  @keyframes set-toast {
    from { opacity: 0; transform: translateY(14px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 640px) {
    .set__section {
      padding: 20px 16px;
      border-radius: 14px;
    }

    .set__block {
      padding: 12px 14px;
    }
  }
`;