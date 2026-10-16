// app/admin/news/page.tsx
// Вкладка «Новости»: список с датой, заголовком и описанием.
// Добавление/редактирование через модалку, удаление, видимость,
// drag & drop. Таблица news.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type NewsItem = {
  id: number;
  title: string;
  date: string;      // '25.10.2026'
  excerpt: string | null;
  content: string | null;
  slug: string;
  visible: boolean;
  sort_order: number;
};

type NewsForm = {
  title: string;
  date: string;      // input type="date"
  excerpt: string;
  content: string;
};

const EMPTY_FORM: NewsForm = {
  title: '',
  date: '',
  excerpt: '',
  content: '',
};

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /* Перетаскивание пальцем (touch) */
  const listRef = useRef<HTMLUListElement>(null);
  const [touchDrag, setTouchDrag] = useState<number | null>(null);
  const touchRef = useRef<{
    index: number;
    startY: number;
    active: boolean;
  } | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...news];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setNews(next);
  };

  const handleGripDown = (e: React.PointerEvent, index: number) => {
    if (e.pointerType !== 'touch') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    touchRef.current = { index, startY: e.clientY, active: false };
  };

  const handleGripMove = (e: React.PointerEvent) => {
    const t = touchRef.current;
    if (!t) return;
    if (!t.active && Math.abs(e.clientY - t.startY) > 14) {
      t.active = true;
      setTouchDrag(t.index);
    }
    if (!t.active || !listRef.current) return;
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
    if (t?.active) saveOrder(news);
    touchRef.current = null;
    setTouchDrag(null);
  };

  /* Модалка: null = закрыта, 'new' = создание, число = id редактируемой */
  const [modal, setModal] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<NewsForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- Загрузка ---------- */
  const fetchNews = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('news')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) {
      setError('Не удалось загрузить новости: ' + fetchError.message);
    } else {
      setNews(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  /* ---------- Порядок ---------- */
  const saveOrder = async (list: NewsItem[]) => {
    await Promise.all(
      list.map((n, i) =>
        supabase.from('news').update({ sort_order: i }).eq('id', n.id)
      )
    );
  };

  /* ---------- Модалка ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal('new');
  };

  const openEdit = (item: NewsItem) => {
    // date '25.10.2026' → '2026-10-25' для input type="date"
    const [d, m, y] = item.date.split('.');
    setForm({
      title: item.title,
      date: `${y}-${m}-${d}`,
      excerpt: item.excerpt || '',
      content: item.content || '',
    });
    setFormError(null);
    setModal(item.id);
  };

  const closeModal = () => setModal(null);

  useEffect(() => {
    document.body.style.overflow = modal !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ---------- Сохранение ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Введите заголовок');
    if (!form.date) return setFormError('Укажите дату');

    setSaving(true);

    const [y, m, d] = form.date.split('-');
    const dateStr = `${d}.${m}.${y}`;
    const slug = `${form.title.toLowerCase().slice(0, 30).replace(/\s+/g, '-')}-${d}${m}`;

    const record = {
      title: form.title.trim(),
      date: dateStr,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      slug,
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('news')
        .insert({ ...record, sort_order: news.length });
      saveError = error;
    } else {
      const { error } = await supabase.from('news').update(record).eq('id', modal);
      saveError = error;
    }

    setSaving(false);

    if (saveError) {
      setFormError('Ошибка сохранения: ' + saveError.message);
      return;
    }

    closeModal();
    fetchNews();
  };

  /* ---------- Удаление ---------- */
  const remove = async (item: NewsItem) => {
    if (!confirm(`Удалить новость «${item.title}»?`)) return;
    const { error: deleteError } = await supabase
      .from('news')
      .delete()
      .eq('id', item.id);
    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }
    fetchNews();
  };

  /* ---------- Видимость ---------- */
  const toggleVisible = async (item: NewsItem) => {
    await supabase
      .from('news')
      .update({ visible: !item.visible })
      .eq('id', item.id);
    fetchNews();
  };

  /* ---------- Drag & drop ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...news];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setNews(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(news);
  };

  return (
    <>
      <style>{NEWS_CSS}</style>

      <div className="nw">
        {/* Шапка */}
        <div className="nw__header">
          <div>
            <h1 className="nw__title">Новости</h1>
            <p className="nw__subtitle">{news.length} публикаций</p>
          </div>
          <button className="nw__add-btn" onClick={openNew}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить
          </button>
        </div>

        {error && <p className="nw__error">{error}</p>}
        {loading && <p className="nw__status">Загрузка…</p>}

        {!loading && news.length === 0 && (
          <p className="nw__status">Новостей пока нет — добавьте первую</p>
        )}

        {/* Список */}
        <ul className="nw__list" ref={listRef}>
          {news.map((item, index) => (
            <li
              key={item.id}
              className={
                'nw__row' +
                (dragIndex === index || touchDrag === index ? ' nw__row--dragging' : '') +
                (!item.visible ? ' nw__row--hidden' : '')
              }
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Текст: дата, заголовок, описание */}
              <div className="nw__info">
                <span className="nw__row-date">{item.date}</span>
                <span className="nw__row-title">{item.title}</span>
                {item.excerpt && (
                  <span className="nw__row-excerpt">{item.excerpt}</span>
                )}
              </div>

              <div className="nw__controls">
                {/* Удалить */}
                <button className="nw__icon-btn" onClick={() => remove(item)} aria-label="Удалить" title="Удалить">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                  </svg>
                </button>

                {/* Редактировать */}
                <button className="nw__icon-btn" onClick={() => openEdit(item)} aria-label="Редактировать" title="Редактировать">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
                  </svg>
                </button>

                {/* Видимость */}
                <button
                  className="nw__icon-btn"
                  onClick={() => toggleVisible(item)}
                  aria-label={item.visible ? 'Скрыть' : 'Показать'}
                  title={item.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
                >
                  {item.visible ? (
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
                      <circle cx="12" cy="12" r="2.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.7-.3 3.8-.7" />
                      <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
                    </svg>
                  )}
                </button>

                {/* Рукоятка */}
                <span
                  className="nw__grip"
                  aria-hidden="true"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => handleGripDown(e, index)}
                  onPointerMove={handleGripMove}
                  onPointerUp={handleGripUp}
                  onPointerCancel={handleGripUp}
                >
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

        <p className="nw__hint">
          Перетаскивайте строки за рукоятку для изменения порядка на сайте.
        </p>
      </div>

      {/* ---------- МОДАЛКА ---------- */}
      {modal !== null && (
        <>
          <div className="nwm-overlay" onClick={closeModal} aria-hidden="true" />

          <div className="nwm" role="dialog" aria-modal="true">
            <button className="nwm__close" onClick={closeModal} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="nwm__title">
              {modal === 'new' ? 'Новая новость' : 'Редактировать новость'}
            </h2>

            <form className="nwm__form" onSubmit={handleSubmit} noValidate>
              <div className="nwm__field">
                <label className="nwm__label" htmlFor="nw-title">Заголовок *</label>
                <input
                  id="nw-title"
                  className="nwm__input"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Открыта продажа билетов на Symphony of Rock"
                />
              </div>

              <div className="nwm__field">
                <label className="nwm__label" htmlFor="nw-date">Дата *</label>
                <input
                  id="nw-date"
                  className="nwm__input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              <div className="nwm__field">
                <label className="nwm__label" htmlFor="nw-excerpt">Короткое описание</label>
                <textarea
                  id="nw-excerpt"
                  className="nwm__input nwm__input--textarea"
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  placeholder="Показывается в списке новостей на главной"
                  rows={2}
                />
              </div>

              <div className="nwm__field">
                <label className="nwm__label" htmlFor="nw-content">Полный текст</label>
                <textarea
                  id="nw-content"
                  className="nwm__input nwm__input--textarea"
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Текст страницы новости (пока страницу не делаем — можно оставить пустым)"
                  rows={5}
                />
              </div>

              {formError && <p className="nwm__error">{formError}</p>}

              <button type="submit" className="nwm__submit" disabled={saving}>
                {saving ? 'Сохранение…' : modal === 'new' ? 'Создать новость' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const NEWS_CSS = `
  .nw {
    max-width: 900px;
    animation: nw-in 0.4s ease;
  }

  @keyframes nw-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nw__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .nw__title {
    margin: 0 0 4px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .nw__subtitle {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .nw__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 22px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .nw__add-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .nw__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  .nw__status {
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .nw__list {
    margin: 0;
    padding: 20px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    animation: nw-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.08s both;
  }

  @keyframes nw-section-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nw__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  }

  .nw__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .nw__row:active {
    cursor: grabbing;
  }

  .nw__row--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .nw__grip {
    touch-action: none;
  }

  .nw__row--hidden .nw__row-title,
  .nw__row--hidden .nw__row-date,
  .nw__row--hidden .nw__row-excerpt {
    color: #464646;
  }

  .nw__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .nw__row-date {
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .nw__row-title {
    font-family: var(--font-poppins), sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .nw__row-excerpt {
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    font-weight: 300;
    line-height: 1.5;
    color: #8e8e93;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nw__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .nw__icon-btn {
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

  .nw__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .nw__grip {
    display: flex;
    margin-left: 8px;
    color: #464646;
  }

  .nw__hint {
    margin: 16px 0 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #464646;
  }

  /* ---------- МОДАЛКА ---------- */
  .nwm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .nwm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    transform: translate(-50%, -50%);
    animation: nwm-in 0.3s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .nwm::-webkit-scrollbar { display: none; }

  @keyframes nwm-in {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .nwm__close {
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

  .nwm__close:hover {
    color: #ffffff;
  }

  .nwm__title {
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .nwm__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .nwm__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .nwm__label {
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .nwm__input {
    padding: 12px 14px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    color-scheme: dark;
    transition: border-color 0.2s ease;
  }

  .nwm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .nwm__input::placeholder {
    color: #464646;
  }

  .nwm__input--textarea {
    resize: vertical;
    min-height: 60px;
  }

  .nwm__error {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .nwm__submit {
    margin-top: 8px;
    padding: 14px 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .nwm__submit:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;