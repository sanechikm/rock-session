// app/admin/gallery/page.tsx
// Вкладка «Галерея»: список фото с превью.
// Добавление (загрузка в Supabase Storage), удаление, видимость, drag & drop.
// Таблица gallery + bucket 'gallery' (public).

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'gallery';

type Photo = {
  id: number;
  src: string;
  alt: string | null;
  visible: boolean;
  sort_order: number;
};

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Скрытый input для выбора файлов
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Загрузка списка ---------- */
  const fetchPhotos = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) {
      setError('Не удалось загрузить фото: ' + fetchError.message);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /* ---------- Сохранение порядка ---------- */
  const saveOrder = async (list: Photo[]) => {
    // Обновляем sort_order у всех строк
    await Promise.all(
      list.map((p, i) =>
        supabase.from('gallery').update({ sort_order: i }).eq('id', p.id)
      )
    );
  };

  /* ---------- Загрузка файла ---------- */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сбрасываем input, чтобы можно было выбрать тот же файл повторно
    e.target.value = '';

    setUploading(true);
    setError(null);

    // Имя файла: уникальное (timestamp), чтобы не перезаписывать
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // 1. Грузим файл в Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      setError('Ошибка загрузки файла: ' + uploadError.message);
      setUploading(false);
      return;
    }

    // 2. Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    // 3. Создаём запись в таблице
    const { error: insertError } = await supabase.from('gallery').insert({
      src: urlData.publicUrl,
      alt: file.name,
      sort_order: photos.length,
    });

    if (insertError) {
      setError('Ошибка сохранения: ' + insertError.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    fetchPhotos();
  };

  /* ---------- Удаление ---------- */
  const remove = async (photo: Photo) => {
    if (!confirm('Удалить фото?')) return;

    // Удаляем запись из таблицы
    const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', photo.id);

    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }

    // Пытаемся удалить файл из Storage (имя — последний сегмент URL)
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
          <h1 className="gl__title">Фото</h1>
          <button
            className="gl__add-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {uploading ? 'Загрузка…' : 'Добавить'}
          </button>
          {/* Скрытый input для выбора файла */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleUpload}
          />
        </div>

        {error && <p className="gl__error">{error}</p>}
        {loading && <p className="gl__status">Загрузка…</p>}

        {!loading && photos.length === 0 && (
          <p className="gl__status">Фото пока нет — загрузите первое</p>
        )}

        {/* Список фото */}
        <ul className="gl__list">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className={
                'gl__row' +
                (dragIndex === index ? ' gl__row--dragging' : '') +
                (!photo.visible ? ' gl__row--hidden' : '')
              }
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Превью */}
              <div className="gl__thumb">
                <img src={photo.src} alt={photo.alt || 'Фото галереи'} />
              </div>

              <div className="gl__controls">
                {/* Удалить */}
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

                {/* Видимость */}
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

                {/* Рукоятка drag */}
                <span className="gl__grip" aria-hidden="true">
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
  }

  .gl__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 32px;
  }

  .gl__title {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
  }

  .gl__add-btn {
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

  .gl__add-btn:hover:not(:disabled) {
    border-color: var(--accent, #00c3d0);
    color: var(--accent, #00c3d0);
  }

  .gl__add-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .gl__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.1);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 10px;
  }

  .gl__status {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #464646;
  }

  .gl__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gl__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
    background: #1e1e1e;
    border: 1px solid transparent;
    border-radius: 14px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease;
  }

  .gl__row:active {
    cursor: grabbing;
  }

  .gl__row--dragging {
    border-color: var(--accent, #00c3d0);
    opacity: 0.7;
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