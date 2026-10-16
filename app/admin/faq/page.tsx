// app/admin/faq/page.tsx
// Вкладка «FAQ»: вопросы и ответы сайта.
// Создание/редактирование через модалку, удаление, видимость, drag & drop.
// Таблица faq.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  visible: boolean;
  sort_order: number;
};

type FaqForm = {
  question: string;
  answer: string;
};

const EMPTY_FORM: FaqForm = { question: '', answer: '' };

export default function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
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
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
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
    if (t?.active) saveOrder(items);
    touchRef.current = null;
    setTouchDrag(null);
  };

  /* Модалка: null / 'new' / id */
  const [modal, setModal] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- Загрузка ---------- */
  const fetchItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('faq')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) setError('Не удалось загрузить вопросы: ' + fetchError.message);
    else setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /* ---------- Порядок ---------- */
  const saveOrder = async (list: FaqItem[]) => {
    await Promise.all(
      list.map((f, i) =>
        supabase.from('faq').update({ sort_order: i }).eq('id', f.id)
      )
    );
  };

  /* ---------- Модалка ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal('new');
  };

  const openEdit = (item: FaqItem) => {
    setForm({ question: item.question, answer: item.answer });
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

    if (!form.question.trim()) return setFormError('Введите вопрос');
    if (!form.answer.trim()) return setFormError('Введите ответ');

    setSaving(true);

    const record = {
      question: form.question.trim(),
      answer: form.answer.trim(),
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('faq')
        .insert({ ...record, sort_order: items.length });
      saveError = error;
    } else {
      const { error } = await supabase.from('faq').update(record).eq('id', modal);
      saveError = error;
    }

    setSaving(false);

    if (saveError) {
      setFormError('Ошибка сохранения: ' + saveError.message);
      return;
    }

    closeModal();
    fetchItems();
  };

  /* ---------- Удаление ---------- */
  const remove = async (item: FaqItem) => {
    if (!confirm(`Удалить вопрос «${item.question}»?`)) return;
    const { error: deleteError } = await supabase
      .from('faq')
      .delete()
      .eq('id', item.id);
    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }
    fetchItems();
  };

  /* ---------- Видимость ---------- */
  const toggleVisible = async (item: FaqItem) => {
    await supabase.from('faq').update({ visible: !item.visible }).eq('id', item.id);
    fetchItems();
  };

  /* ---------- Drag & drop ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setItems(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(items);
  };

  return (
    <>
      <style>{FAQ_CSS}</style>

      <div className="fq">
        <div className="fq__header">
          <div>
            <h1 className="fq__title">FAQ</h1>
            <p className="fq__subtitle">{items.length} вопросов</p>
          </div>
          <button className="fq__add-btn" onClick={openNew}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить
          </button>
        </div>

        {error && <p className="fq__error">{error}</p>}
        {loading && <p className="fq__status">Загрузка…</p>}

        {!loading && items.length === 0 && (
          <p className="fq__status">Вопросов пока нет — добавьте первый</p>
        )}

        <ul className="fq__list" ref={listRef}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className={
                'fq__row' +
                (dragIndex === index || touchDrag === index ? ' fq__row--dragging' : '') +
                (!item.visible ? ' fq__row--hidden' : '')
              }
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="fq__info">
                <span className="fq__row-question">{item.question}</span>
                <span className="fq__row-answer">{item.answer}</span>
              </div>

              <div className="fq__controls">
                <button className="fq__icon-btn" onClick={() => remove(item)} aria-label="Удалить" title="Удалить">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                  </svg>
                </button>

                <button className="fq__icon-btn" onClick={() => openEdit(item)} aria-label="Редактировать" title="Редактировать">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
                  </svg>
                </button>

                <button
                  className="fq__icon-btn"
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

                <span
                  className="fq__grip"
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

        <p className="fq__hint">
          Перетаскивайте строки за рукоятку для изменения порядка на сайте.
        </p>
      </div>

      {/* ---------- МОДАЛКА ---------- */}
      {modal !== null && (
        <>
          <div className="fqm-overlay" onClick={closeModal} aria-hidden="true" />

          <div className="fqm" role="dialog" aria-modal="true">
            <button className="fqm__close" onClick={closeModal} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="fqm__title">
              {modal === 'new' ? 'Новый вопрос' : 'Редактировать вопрос'}
            </h2>

            <form className="fqm__form" onSubmit={handleSubmit} noValidate>
              <div className="fqm__field">
                <label className="fqm__label" htmlFor="faq-question">Вопрос *</label>
                <input
                  id="faq-question"
                  className="fqm__input"
                  type="text"
                  name="question"
                  value={form.question}
                  onChange={handleChange}
                  placeholder="Где проходят мероприятия?"
                />
              </div>

              <div className="fqm__field">
                <label className="fqm__label" htmlFor="faq-answer">Ответ *</label>
                <textarea
                  id="faq-answer"
                  className="fqm__input fqm__input--textarea"
                  name="answer"
                  value={form.answer}
                  onChange={handleChange}
                  placeholder="Полный текст ответа"
                  rows={5}
                />
              </div>

              {formError && <p className="fqm__error">{formError}</p>}

              <button type="submit" className="fqm__submit" disabled={saving}>
                {saving ? 'Сохранение…' : modal === 'new' ? 'Создать вопрос' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const FAQ_CSS = `
  .fq {
    max-width: 900px;
    animation: fq-in 0.4s ease;
  }

  @keyframes fq-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fq__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .fq__title {
    margin: 0 0 4px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .fq__subtitle {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .fq__add-btn {
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

  .fq__add-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .fq__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  .fq__status {
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .fq__list {
    margin: 0;
    padding: 20px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    animation: fq-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.08s both;
  }

  @keyframes fq-section-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fq__row {
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

  .fq__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .fq__row:active { cursor: grabbing; }

  .fq__row--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .fq__grip {
    touch-action: none;
  }

  .fq__row--hidden .fq__row-question,
  .fq__row--hidden .fq__row-answer {
    color: #464646;
  }

  .fq__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .fq__row-question {
    font-family: var(--font-poppins), sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .fq__row-answer {
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

  .fq__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .fq__icon-btn {
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

  .fq__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .fq__grip {
    display: flex;
    margin-left: 8px;
    color: #464646;
  }

  .fq__hint {
    margin: 16px 0 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #464646;
  }

  /* ---------- МОДАЛКА ---------- */
  .fqm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .fqm {
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
    animation: fqm-in 0.3s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .fqm::-webkit-scrollbar { display: none; }

  @keyframes fqm-in {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .fqm__close {
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

  .fqm__close:hover { color: #ffffff; }

  .fqm__title {
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .fqm__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .fqm__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .fqm__label {
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .fqm__input {
    padding: 12px 14px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .fqm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .fqm__input::placeholder { color: #464646; }

  .fqm__input--textarea {
    resize: vertical;
    min-height: 100px;
  }

  .fqm__error {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .fqm__submit {
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

  .fqm__submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 640px) {
    .fq__row { padding: 14px 16px; gap: 12px; }
  }
`;