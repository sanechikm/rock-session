// app/admin/posters/page.tsx
// Вкладка «Афиши»: список актуальных афиш + история (прошедшие).
// Кнопка «Добавить» открывает модальное окно создания/редактирования.
// CRUD через Supabase, таблица posters.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- Типы ---------- */
type Poster = {
  id: number;
  title: string;
  description: string | null;
  day: string;
  month: string;
  time: string;
  venue: string | null;
  price_from: number | null;
  price_to: number | null;
  ticket_url: string | null;
  slug: string;
  is_past: boolean;
  visible: boolean;
  sort_order: number;
};

type PosterForm = {
  title: string;
  date: string;       // input type="date" — '2026-10-25'
  time: string;       // '19:00'
  venue: string;
  price_from: string;
  price_to: string;
  ticket_url: string;
  description: string;
  is_past: boolean;
};

const EMPTY_FORM: PosterForm = {
  title: '',
  date: '',
  time: '19:00',
  venue: '',
  price_from: '',
  price_to: '',
  ticket_url: '',
  description: '',
  is_past: false,
};

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

/* Формат даты '2026-10-25' → '25.10.2026' */
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};

export default function AdminPostersPage() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Модалка: null = закрыта, 'new' = создание, число = id редактируемой */
  const [modal, setModal] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<PosterForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- Загрузка ---------- */
  const fetchPosters = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('posters')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) {
      setError('Не удалось загрузить афиши: ' + fetchError.message);
    } else {
      setPosters(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  /* ---------- Открытие модалки ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal('new');
  };

  const openEdit = (poster: Poster) => {
    // Собираем date обратно из day/month (год не храним — ставим текущий)
    const year = new Date().getFullYear();
    const monthIndex = MONTHS_RU.indexOf(poster.month);
    const mm = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '01';
    const dd = poster.day.padStart(2, '0');
    setForm({
      title: poster.title,
      date: `${year}-${mm}-${dd}`,
      time: poster.time,
      venue: poster.venue || '',
      price_from: poster.price_from?.toString() || '',
      price_to: poster.price_to?.toString() || '',
      ticket_url: poster.ticket_url || '',
      description: poster.description || '',
      is_past: poster.is_past,
    });
    setFormError(null);
    setModal(poster.id);
  };

  const closeModal = () => setModal(null);

  /* Блокируем скролл при открытой модалке */
  useEffect(() => {
    document.body.style.overflow = modal !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  /* ---------- Сохранение (create / update) ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Введите название');
    if (!form.date) return setFormError('Укажите дату');
    if (!form.time) return setFormError('Укажите время');

    setSaving(true);

    const [, month, day] = form.date.split('-');
    const monthName = MONTHS_RU[parseInt(month, 10) - 1] || '';
    const slug = `${form.title.toLowerCase().slice(0, 30).replace(/\s+/g, '-')}-${day}${month}`;

    const record = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      day,
      month: monthName,
      time: form.time,
      venue: form.venue.trim() || null,
      price_from: form.price_from ? parseInt(form.price_from, 10) : null,
      price_to: form.price_to ? parseInt(form.price_to, 10) : null,
      ticket_url: form.ticket_url.trim() || null,
      slug,
      is_past: form.is_past,
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('posters')
        .insert({ ...record, sort_order: posters.length });
      saveError = error;
    } else {
      const { error } = await supabase
        .from('posters')
        .update(record)
        .eq('id', modal);
      saveError = error;
    }

    setSaving(false);

    if (saveError) {
      setFormError('Ошибка сохранения: ' + saveError.message);
      return;
    }

    closeModal();
    fetchPosters();
  };

  /* ---------- Действия в списке ---------- */
  const toggleVisible = async (poster: Poster) => {
    await supabase
      .from('posters')
      .update({ visible: !poster.visible })
      .eq('id', poster.id);
    fetchPosters();
  };

  const togglePast = async (poster: Poster) => {
    await supabase
      .from('posters')
      .update({ is_past: !poster.is_past })
      .eq('id', poster.id);
    fetchPosters();
  };

  const remove = async (poster: Poster) => {
    if (!confirm(`Удалить афишу «${poster.title}»?`)) return;
    await supabase.from('posters').delete().eq('id', poster.id);
    fetchPosters();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /* ---------- Рендер ---------- */
  const current = posters.filter((p) => !p.is_past);
  const history = posters.filter((p) => p.is_past);

  const renderRow = (poster: Poster) => (
    <li
      key={poster.id}
      className={'pt__row' + (!poster.visible ? ' pt__row--hidden' : '')}
    >
      <div className="pt__row-info">
        <span className="pt__row-date">
          {poster.day}.{String(MONTHS_RU.indexOf(poster.month) + 1).padStart(2, '0')} — {poster.time}
        </span>
        <span className="pt__row-title">{poster.title}</span>
      </div>

      <div className="pt__row-controls">
        {/* Удалить */}
        <button className="pt__icon-btn" onClick={() => remove(poster)} aria-label="Удалить" title="Удалить">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
          </svg>
        </button>

        {/* Редактировать */}
        <button className="pt__icon-btn" onClick={() => openEdit(poster)} aria-label="Редактировать" title="Редактировать">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
          </svg>
        </button>

        {/* Видимость */}
        <button
          className="pt__icon-btn"
          onClick={() => toggleVisible(poster)}
          aria-label={poster.visible ? 'Скрыть' : 'Показать'}
          title={poster.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
        >
          {poster.visible ? (
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

        {/* Перенос в историю / обратно */}
        <button
          className="pt__icon-btn"
          onClick={() => togglePast(poster)}
          aria-label={poster.is_past ? 'Вернуть в афишу' : 'В историю'}
          title={poster.is_past ? 'Вернуть в афишу' : 'Перенести в историю'}
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {poster.is_past ? (
              <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></>
            ) : (
              <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></>
            )}
          </svg>
        </button>
      </div>
    </li>
  );

  return (
    <>
      <style>{POSTERS_CSS}</style>

      <div className="pt">
        {/* Шапка: заголовок + кнопка добавления */}
        <div className="pt__header">
          <h1 className="pt__title">Афиши</h1>
          <button className="pt__add-btn" onClick={openNew}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить
          </button>
        </div>

        {error && <p className="pt__error">{error}</p>}
        {loading && <p className="pt__status">Загрузка…</p>}

        {!loading && (
          <>
            {/* Актуальные афиши */}
            <section className="pt__section">
              {current.length > 0 && (
                <ul className="pt__list">{current.map(renderRow)}</ul>
              )}
              {current.length === 0 && (
                <p className="pt__empty">Нет актуальных афиш — добавьте первую</p>
              )}
            </section>

            {/* История */}
            {history.length > 0 && (
              <section className="pt__section">
                <h2 className="pt__section-title">История</h2>
                <ul className="pt__list">{history.map(renderRow)}</ul>
              </section>
            )}
          </>
        )}
      </div>

      {/* ---------- МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ---------- */}
      {modal !== null && (
        <>
          <div className="ptm-overlay" onClick={closeModal} aria-hidden="true" />

          <div className="ptm" role="dialog" aria-modal="true">
            <button className="ptm__close" onClick={closeModal} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="ptm__title">
              {modal === 'new' ? 'Новая афиша' : 'Редактировать афишу'}
            </h2>

            <form className="ptm__form" onSubmit={handleSubmit} noValidate>
              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-title">Название *</label>
                <input
                  id="pt-title"
                  className="ptm__input"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ритмы Ростова"
                />
              </div>

              <div className="ptm__row">
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-date">Дата *</label>
                  <input
                    id="pt-date"
                    className="ptm__input"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-time">Время *</label>
                  <input
                    id="pt-time"
                    className="ptm__input"
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-venue">Площадка</label>
                <input
                  id="pt-venue"
                  className="ptm__input"
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="Ресторан «Полёт» · ул. Красноармейская, 168/99"
                />
              </div>

              <div className="ptm__row">
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-price-from">Цена от, ₽</label>
                  <input
                    id="pt-price-from"
                    className="ptm__input"
                    type="number"
                    name="price_from"
                    value={form.price_from}
                    onChange={handleChange}
                    placeholder="6400"
                    min="0"
                  />
                </div>
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-price-to">Цена до, ₽</label>
                  <input
                    id="pt-price-to"
                    className="ptm__input"
                    type="number"
                    name="price_to"
                    value={form.price_to}
                    onChange={handleChange}
                    placeholder="6900"
                    min="0"
                  />
                </div>
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-ticket">Ссылка на покупку (Lava)</label>
                <input
                  id="pt-ticket"
                  className="ptm__input"
                  type="url"
                  name="ticket_url"
                  value={form.ticket_url}
                  onChange={handleChange}
                  placeholder="https://…"
                />
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-desc">Описание</label>
                <textarea
                  id="pt-desc"
                  className="ptm__input ptm__input--textarea"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Короткое описание события"
                  rows={3}
                />
              </div>

              <label className="ptm__checkbox">
                <input
                  type="checkbox"
                  name="is_past"
                  checked={form.is_past}
                  onChange={handleChange}
                />
                Событие уже прошло (показывать в истории)
              </label>

              {formError && <p className="ptm__error">{formError}</p>}

              <button type="submit" className="ptm__submit" disabled={saving}>
                {saving ? 'Сохранение…' : modal === 'new' ? 'Создать афишу' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const POSTERS_CSS = `
  .pt {
    max-width: 900px;
  }

  .pt__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 32px;
  }

  .pt__title {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
  }

  .pt__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .pt__add-btn:hover {
    border-color: var(--accent, #00c3d0);
    color: var(--accent, #00c3d0);
  }

  .pt__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.1);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 10px;
  }

  .pt__status,
  .pt__empty {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #464646;
  }

  .pt__section {
    margin-bottom: 40px;
  }

  .pt__section-title {
    margin: 0 0 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
  }

  .pt__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Строка афиши */
  .pt__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 24px;
    background: #1e1e1e;
    border-radius: 14px;
  }

  .pt__row--hidden .pt__row-title,
  .pt__row--hidden .pt__row-date {
    color: #464646;
  }

  .pt__row-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .pt__row-date {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .pt__row-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
  }

  .pt__row-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .pt__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #8e8e93;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .pt__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  /* ---------- МОДАЛКА ---------- */
  .ptm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .ptm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    transform: translate(-50%, -50%);
    animation: ptm-in 0.25s ease;
  }

  @keyframes ptm-in {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .ptm__close {
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

  .ptm__close:hover {
    color: #ffffff;
  }

  .ptm__title {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .ptm__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ptm__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ptm__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ptm__label {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .ptm__input {
    padding: 12px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    color-scheme: dark; /* тёмный календарь у date/time инпутов */
    transition: border-color 0.2s ease;
  }

  .ptm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .ptm__input::placeholder {
    color: #464646;
  }

  .ptm__input--textarea {
    resize: vertical;
    min-height: 70px;
  }

  .ptm__checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #8e8e93;
    cursor: pointer;
  }

  .ptm__checkbox input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent, #00c3d0);
  }

  .ptm__error {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .ptm__submit {
    margin-top: 8px;
    padding: 14px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .ptm__submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 640px) {
    .ptm__row {
      grid-template-columns: 1fr;
    }

    .pt__row {
      padding: 14px 16px;
    }
  }
`;