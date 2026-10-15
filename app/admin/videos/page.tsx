// app/admin/videos/page.tsx
// Вкладка «Видео»: список с превью (16:9), названием и датой.
// Добавление через модалку (превью — загрузка картинки или URL),
// удаление, видимость, drag & drop. Таблица videos, превью — в Storage (bucket 'gallery').

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'gallery'; // превью видео храним в том же bucket

type Video = {
  id: number;
  title: string;
  date: string;
  preview: string | null;
  video_url: string;
  visible: boolean;
  sort_order: number;
};

type VideoForm = {
  title: string;
  date: string;      // input type="date" — '2026-10-25'
  video_url: string;
  previewUrl: string; // URL превью (заполняется загрузкой или вручную)
};

const EMPTY_FORM: VideoForm = {
  title: '',
  date: '',
  video_url: '',
  previewUrl: '',
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /* Модалка */
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<VideoForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);

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
    const next = [...videos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setVideos(next);
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
    if (t?.active) saveOrder(videos);
    touchRef.current = null;
    setTouchDrag(null);
  };

  /* ---------- Загрузка списка ---------- */
  const fetchVideos = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) {
      setError('Не удалось загрузить видео: ' + fetchError.message);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  /* ---------- Порядок ---------- */
  const saveOrder = async (list: Video[]) => {
    await Promise.all(
      list.map((v, i) =>
        supabase.from('videos').update({ sort_order: i }).eq('id', v.id)
      )
    );
  };

  /* ---------- Загрузка превью в Storage ---------- */
  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingPreview(true);
    setFormError(null);

    const ext = file.name.split('.').pop();
    const fileName = `video-preview-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      setFormError('Ошибка загрузки превью: ' + uploadError.message);
      setUploadingPreview(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    setForm((f) => ({ ...f, previewUrl: urlData.publicUrl }));
    setUploadingPreview(false);
  };

  /* ---------- Модалка ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ---------- Сохранение ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Введите название');
    if (!form.date) return setFormError('Укажите дату');
    if (!form.video_url.trim()) return setFormError('Вставьте ссылку на видео');

    setSaving(true);

    const [, m, d] = form.date.split('-');
    const dateStr = `${d}.${m}`; // формат '25.10' как на сайте

    const { error: insertError } = await supabase.from('videos').insert({
      title: form.title.trim(),
      date: dateStr,
      preview: form.previewUrl.trim() || null,
      video_url: form.video_url.trim(),
      sort_order: videos.length,
    });

    setSaving(false);

    if (insertError) {
      setFormError('Ошибка сохранения: ' + insertError.message);
      return;
    }

    closeModal();
    fetchVideos();
  };

  /* ---------- Удаление ---------- */
  const remove = async (video: Video) => {
    if (!confirm(`Удалить видео «${video.title}»?`)) return;

    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', video.id);

    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }

    // Удаляем превью из Storage, если оно загружено у нас
    if (video.preview?.includes(`/${BUCKET}/`)) {
      const fileName = video.preview.split('/').pop();
      if (fileName) await supabase.storage.from(BUCKET).remove([fileName]);
    }

    fetchVideos();
  };

  /* ---------- Видимость ---------- */
  const toggleVisible = async (video: Video) => {
    await supabase
      .from('videos')
      .update({ visible: !video.visible })
      .eq('id', video.id);
    fetchVideos();
  };

  /* ---------- Drag & drop ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...videos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setVideos(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(videos);
  };

  return (
    <>
      <style>{VIDEOS_CSS}</style>

      <div className="vd">
        {/* Шапка */}
        <div className="vd__header">
          <div>
            <h1 className="vd__title">Видео</h1>
            <p className="vd__subtitle">{videos.length} видео в ленте</p>
          </div>
          <button className="vd__add-btn" onClick={openNew}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить
          </button>
        </div>

        {error && <p className="vd__error">{error}</p>}
        {loading && <p className="vd__status">Загрузка…</p>}

        {!loading && videos.length === 0 && (
          <p className="vd__status">Видео пока нет — добавьте первое</p>
        )}

        {/* Список */}
        <ul className="vd__list" ref={listRef}>
          {videos.map((video, index) => (
            <li
              key={video.id}
              className={
                'vd__row' +
                (dragIndex === index || touchDrag === index ? ' vd__row--dragging' : '') +
                (!video.visible ? ' vd__row--hidden' : '')
              }
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Превью 16:9 */}
              <div className="vd__thumb">
                {video.preview ? (
                  <img src={video.preview} alt={video.title} />
                ) : (
                  <span className="vd__thumb-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Название и дата */}
              <div className="vd__info">
                <span className="vd__row-date">{video.date}</span>
                <span className="vd__row-title">{video.title}</span>
              </div>

              <div className="vd__controls">
                {/* Удалить */}
                <button className="vd__icon-btn" onClick={() => remove(video)} aria-label="Удалить" title="Удалить">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                  </svg>
                </button>

                {/* Видимость */}
                <button
                  className="vd__icon-btn"
                  onClick={() => toggleVisible(video)}
                  aria-label={video.visible ? 'Скрыть' : 'Показать'}
                  title={video.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
                >
                  {video.visible ? (
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
                  className="vd__grip"
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

        <p className="vd__hint">
          Перетаскивайте строки за рукоятку для изменения порядка на сайте.
        </p>
      </div>

      {/* ---------- МОДАЛКА ДОБАВЛЕНИЯ ---------- */}
      {modal && (
        <>
          <div className="vdm-overlay" onClick={closeModal} aria-hidden="true" />

          <div className="vdm" role="dialog" aria-modal="true">
            <button className="vdm__close" onClick={closeModal} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="vdm__title">Новое видео</h2>

            <form className="vdm__form" onSubmit={handleSubmit} noValidate>
              <div className="vdm__field">
                <label className="vdm__label" htmlFor="vd-title">Название *</label>
                <input
                  id="vd-title"
                  className="vdm__input"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ритмы Ростова"
                />
              </div>

              <div className="vdm__field">
                <label className="vdm__label" htmlFor="vd-date">Дата съёмки *</label>
                <input
                  id="vd-date"
                  className="vdm__input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              <div className="vdm__field">
                <label className="vdm__label" htmlFor="vd-url">Ссылка на видео *</label>
                <input
                  id="vd-url"
                  className="vdm__input"
                  type="url"
                  name="video_url"
                  value={form.video_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/… или https://vk.com/video…"
                />
              </div>

              {/* Превью: загрузка или URL */}
              <div className="vdm__field">
                <span className="vdm__label">Превью (обложка)</span>

                {form.previewUrl ? (
                  <div className="vdm__preview-ready">
                    <img src={form.previewUrl} alt="Превью" />
                    <button
                      type="button"
                      className="vdm__preview-remove"
                      onClick={() => setForm((f) => ({ ...f, previewUrl: '' }))}
                    >
                      Убрать
                    </button>
                  </div>
                ) : (
                  <div className="vdm__preview-actions">
                    <button
                      type="button"
                      className="vdm__upload-btn"
                      onClick={() => previewInputRef.current?.click()}
                      disabled={uploadingPreview}
                    >
                      {uploadingPreview ? 'Загрузка…' : 'Загрузить картинку'}
                    </button>
                    <span className="vdm__or">или URL:</span>
                    <input
                      className="vdm__input"
                      type="url"
                      name="previewUrl"
                      value={form.previewUrl}
                      onChange={handleChange}
                      placeholder="https://…"
                    />
                  </div>
                )}

                <input
                  ref={previewInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePreviewUpload}
                />
              </div>

              {formError && <p className="vdm__error">{formError}</p>}

              <button type="submit" className="vdm__submit" disabled={saving}>
                {saving ? 'Сохранение…' : 'Добавить видео'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const VIDEOS_CSS = `
  .vd {
    max-width: 900px;
    animation: vd-in 0.4s ease;
  }

  @keyframes vd-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .vd__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .vd__title {
    margin: 0 0 4px;
    font-family: 'Poppins', sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .vd__subtitle {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .vd__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 22px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .vd__add-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .vd__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  .vd__status {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .vd__list {
    margin: 0;
    padding: 20px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    animation: vd-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.08s both;
  }

  @keyframes vd-section-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .vd__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  }

  .vd__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .vd__row:active {
    cursor: grabbing;
  }

  .vd__row--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .vd__grip {
    touch-action: none;
  }

  .vd__row--hidden .vd__thumb,
  .vd__row--hidden .vd__row-title,
  .vd__row--hidden .vd__row-date {
    opacity: 0.35;
  }

  /* Превью 16:9 */
  .vd__thumb {
    width: 130px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    overflow: hidden;
    background: #141414;
    flex-shrink: 0;
    transition: opacity 0.2s ease;
  }

  .vd__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .vd__thumb-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #464646;
  }

  .vd__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .vd__row-date {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .vd__row-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
  }

  .vd__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .vd__icon-btn {
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

  .vd__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .vd__grip {
    display: flex;
    margin-left: 8px;
    color: #464646;
  }

  .vd__hint {
    margin: 16px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
  }

  /* ---------- МОДАЛКА ---------- */
  .vdm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .vdm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    transform: translate(-50%, -50%);
    animation: vdm-in 0.3s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .vdm::-webkit-scrollbar { display: none; }

  @keyframes vdm-in {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .vdm__close {
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

  .vdm__close:hover {
    color: #ffffff;
  }

  .vdm__title {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .vdm__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .vdm__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vdm__label {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .vdm__input {
    padding: 12px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    color-scheme: dark;
    transition: border-color 0.2s ease;
  }

  .vdm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .vdm__input::placeholder {
    color: #464646;
  }

  /* Превью в форме */
  .vdm__preview-ready {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .vdm__preview-ready img {
    width: 130px;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 8px;
  }

  .vdm__preview-remove {
    padding: 8px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
    background: transparent;
    border: 1px solid rgba(255, 90, 90, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .vdm__preview-remove:hover {
    background: rgba(255, 90, 90, 0.1);
  }

  .vdm__preview-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .vdm__preview-actions .vdm__input {
    flex: 1;
    min-width: 160px;
  }

  .vdm__upload-btn {
    padding: 11px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ffffff;
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s ease;
    white-space: nowrap;
  }

  .vdm__upload-btn:hover:not(:disabled) {
    border-color: var(--accent, #00c3d0);
  }

  .vdm__upload-btn:disabled {
    opacity: 0.6;
  }

  .vdm__or {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
    white-space: nowrap;
  }

  .vdm__error {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .vdm__submit {
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

  .vdm__submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 640px) {
    .vd__row {
      padding: 14px 16px;
      gap: 12px;
    }

    .vd__thumb {
      width: 96px;
    }
  }
`;