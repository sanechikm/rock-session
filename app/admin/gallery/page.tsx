// app/admin/gallery/page.tsx
// Вкладка «Галерея»: список фото с превью.
// Фильтр: «Общая галерея» (главная) или конкретная афиша.
// Загруженное фото привязывается к выбранной афише (poster_id),
// либо остаётся в общей галерее при «Общая галерея».
// Удаление, видимость, drag & drop как раньше.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image';

const BUCKET = 'gallery';

type Photo = {
  id: number;
  src: string;
  alt: string | null;
  visible: boolean;
  sort_order: number;
  poster_id: number | null;
};

type PosterOption = {
  id: number;
  title: string;
  day: string;
  month: string;
};

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posters, setPosters] = useState<PosterOption[]>([]);
  const [filterId, setFilterId] = useState<number | ''>(''); // '' = общая галерея
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPhotos(next);
  };

  const handleGripDown = (e: React.PointerEvent, index: number) => {
    if (e.pointerType !== 'touch') return;
    e.currentTarget.setPointerCapture(e.pointerId); /* события идут, даже если палец соскользнул */
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
    if (t?.active) saveOrder(photos);
    touchRef.current = null;
    setTouchDrag(null);
  };

  /* ---------- Загрузка списка фото (с учётом фильтра) ---------- */
  const fetchPhotos = useCallback(async () => {
    let query = supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true });

    // '' = общая галерея (poster_id IS NULL), иначе фото конкретной афиши
    if (filterId === '') {
      query = query.is('poster_id', null);
    } else {
      query = query.eq('poster_id', filterId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError('Не удалось загрузить фото: ' + fetchError.message);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, [filterId]);

  /* ---------- Загрузка афиш для выпадающего списка ---------- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posters')
        .select('id, title, day, month')
        .order('sort_order', { ascending: true });
      setPosters(data || []);
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPhotos();
  }, [fetchPhotos]);

  /* ---------- Сохранение порядка ---------- */
  const saveOrder = async (list: Photo[]) => {
    await Promise.all(
      list.map((p, i) =>
        supabase.from('gallery').update({ sort_order: i }).eq('id', p.id)
      )
    );
  };

  /* ---------- Загрузка файлов (несколько за раз) ---------- */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = ''; // сбрасываем input, чтобы можно было выбрать те же файлы повторно

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });

    let sortOrder = photos.length;
    let failed = 0;

    // Загружаем по очереди: так видно прогресс и не упираемся в лимиты Storage
    for (let i = 0; i < files.length; i++) {
      const file = await compressImage(files[i]);
      setUploadProgress({ current: i + 1, total: files.length });

      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        failed++;
        continue; // пропускаем битый файл, грузим остальные
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      // poster_id: null для общей галереи, id афиши для привязки
      const { error: insertError } = await supabase.from('gallery').insert({
        src: urlData.publicUrl,
        alt: file.name,
        sort_order: sortOrder++,
        poster_id: filterId === '' ? null : filterId,
      });

      if (insertError) failed++;
    }

    setUploading(false);
    setUploadProgress(null);

    if (failed > 0) {
      setError(`Не удалось загрузить ${failed} из ${files.length} файлов`);
    }

    fetchPhotos();
  };

  /* ---------- Удаление ---------- */
  const remove = async (photo: Photo) => {
    if (!confirm('Удалить фото?')) return;

    const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', photo.id);

    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }

    const fileName = photo.src.split('/').pop();
    if (fileName) {
      await supabase.storage.from(BUCKET).remove([fileName]);
    }

    fetchPhotos();
  };

  /* ---------- Видимость ---------- */
  const toggleVisible = async (photo: Photo) => {
    await supabase
      .from('gallery')
      .update({ visible: !photo.visible })
      .eq('id', photo.id);
    fetchPhotos();
  };

  /* ---------- Drag & drop ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...photos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setPhotos(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(photos);
  };

  return (
    <>
      <style>{GALLERY_CSS}</style>

      <div className="gl">
        {/* Шапка */}
        <div className="gl__header">
          <div>
            <h1 className="gl__title">Фото</h1>
            <p className="gl__subtitle">
              {filterId === '' ? 'Общая галерея' : 'Фото афиши'} · {photos.length}{' '}
              {photos.length === 1 ? 'фото' : 'фото'}
            </p>
          </div>
          <button
            className="gl__add-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Можно выбрать несколько файлов"
            disabled={uploading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {uploading && uploadProgress
              ? `Загрузка ${uploadProgress.current}/${uploadProgress.total}…`
              : 'Добавить'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleUpload}
          />
        </div>

        {/* Фильтр: общая галерея или афиша */}
        <div className="gl__filter">
          <label className="gl__filter-label" htmlFor="gl-poster">
            Раздел:
          </label>
          <select
            id="gl-poster"
            className="gl__select"
            value={filterId}
            onChange={(e) =>
              setFilterId(e.target.value === '' ? '' : parseInt(e.target.value, 10))
            }
          >
            <option value="">Общая галерея (главная страница)</option>
            {posters.map((p) => (
              <option key={p.id} value={p.id}>
                Афиша: {p.title} ({p.day} {p.month})
              </option>
            ))}
          </select>
          <p className="gl__filter-hint">
            {filterId === ''
              ? 'Фото сюда попадают в галерею на главной странице'
              : 'Фото сюда попадают в модалку «Подробнее» этой афиши'}
          </p>
        </div>

        {error && <p className="gl__error">{error}</p>}
        {loading && <p className="gl__status">Загрузка…</p>}

        {!loading && photos.length === 0 && (
          <p className="gl__status">
            {filterId === ''
              ? 'В общей галерее пока нет фото'
              : 'У этой афиши пока нет фото'}
          </p>
        )}

        {/* Список фото */}
        <ul className="gl__list" ref={listRef}>
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className={
                'gl__row' +
                (dragIndex === index || touchDrag === index ? ' gl__row--dragging' : '') +
                (!photo.visible ? ' gl__row--hidden' : '')
              }
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="gl__thumb">
                <img src={photo.src} alt={photo.alt || 'Фото галереи'} />
              </div>

              <div className="gl__controls">
                <button
                  className="gl__icon-btn"
                  onClick={() => remove(photo)}
                  aria-label="Удалить"
                  title="Удалить"
                >
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                  </svg>
                </button>

                <button
                  className="gl__icon-btn"
                  onClick={() => toggleVisible(photo)}
                  aria-label={photo.visible ? 'Скрыть' : 'Показать'}
                  title={photo.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
                >
                  {photo.visible ? (
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
                  className="gl__grip"
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

        <p className="gl__hint">
          Перетаскивайте строки за рукоятку для изменения порядка на сайте.
        </p>
      </div>
    </>
  );
}

const GALLERY_CSS = `
  .gl {
    max-width: 900px;
    animation: gl-in 0.4s ease;
  }

  @keyframes gl-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .gl__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .gl__title {
    margin: 0 0 4px;
    font-family: 'Poppins', sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .gl__subtitle {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .gl__add-btn {
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

  .gl__add-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .gl__add-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  /* Фильтр по афише */
  .gl__filter {
    margin-bottom: 20px;
    padding: 18px 20px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    animation: gl-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.05s both;
  }

  @keyframes gl-section-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .gl__filter-label {
    display: block;
    margin-bottom: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .gl__select {
    width: 100%;
    padding: 13px 44px 13px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    background-color: #181818;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .gl__select:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .gl__select:focus {
    border-color: var(--accent, #00c3d0);
  }

  /* Выпадающий список опций — тёмный */
  .gl__select option {
    background: #141414;
    color: #ffffff;
    padding: 10px;
  }

  .gl__select option {
    background: #141414;
    color: #ffffff;
  }

  .gl__filter-hint {
    margin: 8px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #464646;
  }

  .gl__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  .gl__status {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .gl__list {
    margin: 0;
    padding: 20px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    animation: gl-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.12s both;
  }

  .gl__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  }

  .gl__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .gl__row:active {
    cursor: grabbing;
  }

  .gl__row--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .gl__grip {
    touch-action: none; /* жест на рукоятке не скроллит страницу */
  }

  .gl__row--hidden .gl__thumb {
    opacity: 0.3;
  }

  .gl__thumb {
    width: 88px;
    height: 88px;
    border-radius: 10px;
    overflow: hidden;
    background: #141414;
    flex-shrink: 0;
    transition: opacity 0.2s ease;
  }

  .gl__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .gl__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .gl__icon-btn {
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

  .gl__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .gl__grip {
    display: flex;
    margin-left: 8px;
    color: #464646;
  }

  .gl__hint {
    margin: 16px 0 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
  }
`;