// app/admin/posters/page.tsx
// Вкладка «Афиши»: список актуальных + история. Модалка создания/редактирования:
// обложка (загрузка в Storage), дата/время/площадка/цены/ссылка Lava,
// артисты (имя, должность, соцсеть) и партнёры события (список названий).

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image';

const BUCKET = 'gallery';

/* ---------- Типы ---------- */
type Artist = { name: string; photo?: string };
type CrewMember = { name: string; role: string; photo?: string };

type Poster = {
  id: number;
  title: string;
  description: string | null;
  description_full?: string | null; // подробное описание для модалки
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
  image: string | null;
  use_as_hero: boolean;
  artists: Artist[] | null;
  event_partners: CrewMember[] | null;
};

type PosterForm = {
  title: string;
  date: string;
  time: string;
  venue: string;
  price_from: string;
  price_to: string;
  ticket_url: string;
  description: string;      // краткое — на билете афиши
  description_full: string; // подробное — в модальном окне
  is_past: boolean;
  imageUrl: string;
  use_as_hero: boolean;
  artists: Artist[];
  partners: CrewMember[];
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
  description_full: '',
  is_past: false,
  imageUrl: '',
  use_as_hero: false,
  artists: [],
  partners: [],
};

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export default function AdminPostersPage() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<PosterForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Загрузка ---------- */
  const fetchPosters = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('posters')
      .select('*')
      .order('sort_order', { ascending: true });

    if (fetchError) setError('Не удалось загрузить афиши: ' + fetchError.message);
    else setPosters(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  /* ---------- Обложка ---------- */
  const personPhotoInputRef = useRef<HTMLInputElement>(null);
  const [personPhotoTarget, setPersonPhotoTarget] = useState<
    { kind: 'artist' | 'partner'; index: number } | null
  >(null);
  const [uploadingPersonPhoto, setUploadingPersonPhoto] = useState(false);

  /* ---------- Загрузка фото исполнителя/партнёра ---------- */
  const handlePersonPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = personPhotoTarget;
    if (!file || !target) return;
    e.target.value = '';

    setUploadingPersonPhoto(true);
    setFormError(null);

    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop();
      const fileName = `person-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setFormError('Ошибка загрузки фото: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      if (target.kind === 'artist') {
        setForm((f) => ({
          ...f,
          artists: f.artists.map((ar, i) =>
            i === target.index ? { ...ar, photo: urlData.publicUrl } : ar
          ),
        }));
      } else {
        setForm((f) => ({
          ...f,
          partners: f.partners.map((p, i) =>
            i === target.index ? { ...p, photo: urlData.publicUrl } : p
          ),
        }));
      }
    } finally {
      setUploadingPersonPhoto(false);
      setPersonPhotoTarget(null);
    }
  };

  const pickPersonPhoto = (kind: 'artist' | 'partner', index: number) => {
    setPersonPhotoTarget({ kind, index });
    personPhotoInputRef.current?.click();
  };

  const removePersonPhoto = (kind: 'artist' | 'partner', index: number) => {
    if (kind === 'artist') {
      setForm((f) => ({
        ...f,
        artists: f.artists.map((ar, i) => (i === index ? { ...ar, photo: undefined } : ar)),
      }));
    } else {
      setForm((f) => ({
        ...f,
        partners: f.partners.map((p, i) => (i === index ? { ...p, photo: undefined } : p)),
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingImage(true);
    setFormError(null);

    const ext = file.name.split('.').pop();
    const fileName = `poster-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      setFormError('Ошибка загрузки обложки: ' + uploadError.message);
      setUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setForm((f) => ({ ...f, imageUrl: urlData.publicUrl }));
    setUploadingImage(false);
  };

  /* ---------- Модалка ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal('new');
  };

  const openEdit = (poster: Poster) => {
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
      description_full: poster.description_full || '',
      is_past: poster.is_past,
      imageUrl: poster.image || '',
      use_as_hero: poster.use_as_hero ?? false,
      artists: (poster.artists || []).map((a) => ({ name: a.name || '', photo: a.photo || '' })),
      partners: (poster.event_partners || []).map((p) =>
        typeof p === 'string'
          ? { name: p, role: '', photo: '' }
          : { name: p.name || '', role: p.role || '', photo: p.photo || '' }
      ),
    });
    setFormError(null);
    setModal(poster.id);
  };

  const closeModal = () => setModal(null);

  useEffect(() => {
    document.body.style.overflow = modal !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  /* ---------- Поля формы ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /* Артисты: изменение поля i-го артиста */
  const handleArtistChange = (index: number, field: keyof Artist, value: string) => {
    setForm((f) => ({
      ...f,
      artists: f.artists.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const addArtist = () =>
    setForm((f) => ({ ...f, artists: [...f.artists, { name: '', photo: '' }] }));

  const removeArtist = (index: number) =>
    setForm((f) => ({ ...f, artists: f.artists.filter((_, i) => i !== index) }));

  /* Партнёры: i-я строка */
  const handlePartnerChange = (index: number, field: 'name' | 'role', value: string) => {
    setForm((f) => ({
      ...f,
      partners: f.partners.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const addPartner = () =>
    setForm((f) => ({ ...f, partners: [...f.partners, { name: '', role: '', photo: '' }] }));

  const removePartner = (index: number) =>
    setForm((f) => ({ ...f, partners: f.partners.filter((_, i) => i !== index) }));

  /* ---------- Сохранение ---------- */
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
      description_full: form.description_full.trim() || null,
      day,
      month: monthName,
      time: form.time,
      venue: form.venue.trim() || null,
      price_from: form.price_from ? parseInt(form.price_from, 10) : null,
      price_to: form.price_to ? parseInt(form.price_to, 10) : null,
      ticket_url: form.ticket_url.trim() || null,
      slug,
      is_past: form.is_past,
      image: form.imageUrl.trim() || null,
      use_as_hero: form.use_as_hero,
      artists: form.artists
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          photo: a.photo || undefined,
        })),
      event_partners: form.partners
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          role: p.role.trim() || undefined,
          photo: p.photo || undefined,
        })),
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('posters')
        .insert({ ...record, sort_order: posters.length });
      saveError = error;
    } else {
      const { error } = await supabase.from('posters').update(record).eq('id', modal);
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
    await supabase.from('posters').update({ visible: !poster.visible }).eq('id', poster.id);
    fetchPosters();
  };

  const togglePast = async (poster: Poster) => {
    await supabase.from('posters').update({ is_past: !poster.is_past }).eq('id', poster.id);
    fetchPosters();
  };

  const remove = async (poster: Poster) => {
    if (!confirm(`Удалить афишу «${poster.title}»?`)) return;
    await supabase.from('posters').delete().eq('id', poster.id);
    fetchPosters();
  };

  /* ---------- Рендер ---------- */
  /* Сортировка по дате: актуальные — ближайшие сверху, история — недавние сверху */
  const byDate = (a: Poster, b: Poster, dir: 1 | -1) => {
    const year = new Date().getFullYear();
    const ta = new Date(year, MONTHS_RU.indexOf(a.month), parseInt(a.day, 10)).getTime();
    const tb = new Date(year, MONTHS_RU.indexOf(b.month), parseInt(b.day, 10)).getTime();
    return (ta - tb) * dir;
  };
  const current = posters.filter((p) => !p.is_past).sort((a, b) => byDate(a, b, 1));
  const history = posters.filter((p) => p.is_past).sort((a, b) => byDate(a, b, -1));

  const renderRow = (poster: Poster) => (
    <li key={poster.id} className={'pt__row' + (!poster.visible ? ' pt__row--hidden' : '')}>
      <div className="pt__row-info">
        <span className="pt__row-date">
          {poster.day}.{String(MONTHS_RU.indexOf(poster.month) + 1).padStart(2, '0')} — {poster.time}
        </span>
        <span className="pt__row-title">{poster.title}</span>
      </div>

      <div className="pt__row-controls">
        <button className="pt__icon-btn" onClick={() => remove(poster)} aria-label="Удалить" title="Удалить">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
          </svg>
        </button>

        <button className="pt__icon-btn" onClick={() => openEdit(poster)} aria-label="Редактировать" title="Редактировать">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
          </svg>
        </button>

        <button className="pt__icon-btn" onClick={() => toggleVisible(poster)} aria-label="Видимость" title="Видимость на сайте">
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

        <button className="pt__icon-btn" onClick={() => togglePast(poster)} aria-label="В историю/обратно" title={poster.is_past ? 'Вернуть в афишу' : 'В историю'}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
            <path d="M12 8v4l3 2" />
          </svg>
        </button>
      </div>
    </li>
  );

  return (
    <>
      <style>{POSTERS_CSS}</style>

      <div className="pt">
        <div className="pt__header">
          <div>
            <h1 className="pt__title">Афиши</h1>
            <p className="pt__subtitle">
              {current.length} актуальных · {history.length} в истории
            </p>
          </div>
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
            <section className="pt__section">
              {current.length > 0 ? (
                <ul className="pt__list">{current.map(renderRow)}</ul>
              ) : (
                <p className="pt__empty">Нет актуальных афиш — добавьте первую</p>
              )}
            </section>

            {history.length > 0 && (
              <section className="pt__section">
                <h2 className="pt__section-title">История</h2>
                <ul className="pt__list">{history.map(renderRow)}</ul>
              </section>
            )}
          </>
        )}
      </div>

      {/* ---------- МОДАЛКА ---------- */}
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
              {/* Обложка */}
              <div className="ptm__field">
                <span className="ptm__label">Обложка (изображение с названием на странице)</span>

                {form.imageUrl ? (
                  <div className="ptm__image-ready">
                    <img src={form.imageUrl} alt="Обложка" />
                    <button
                      type="button"
                      className="ptm__image-remove"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    >
                      Убрать
                    </button>
                  </div>
                ) : (
                  <div className="ptm__image-actions">
                    <button
                      type="button"
                      className="ptm__upload-btn"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Загрузка…' : 'Загрузить обложку'}
                    </button>
                    <span className="ptm__or">или URL:</span>
                    <input
                      className="ptm__input"
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://…"
                    />
                  </div>
                )}

                <input
                  ref={personPhotoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePersonPhotoUpload}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />

                <label className="ptm__checkbox">
                  <input
                    type="checkbox"
                    name="use_as_hero"
                    checked={form.use_as_hero}
                    onChange={handleChange}
                  />
                  Использовать обложку как фон главной страницы (Hero)
                </label>
              </div>

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
                  <input id="pt-date" className="ptm__input" type="date" name="date" value={form.date} onChange={handleChange} />
                </div>
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-time">Время *</label>
                  <input id="pt-time" className="ptm__input" type="time" name="time" value={form.time} onChange={handleChange} />
                </div>
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-venue">Площадка</label>
                <input id="pt-venue" className="ptm__input" type="text" name="venue" value={form.venue} onChange={handleChange} placeholder="Ресторан «Полёт» · ул. Красноармейская, 168/99" />
              </div>

              <div className="ptm__row">
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-price-from">Цена от, ₽</label>
                  <input id="pt-price-from" className="ptm__input" type="number" name="price_from" value={form.price_from} onChange={handleChange} placeholder="6400" min="0" />
                </div>
                <div className="ptm__field">
                  <label className="ptm__label" htmlFor="pt-price-to">Цена до, ₽</label>
                  <input id="pt-price-to" className="ptm__input" type="number" name="price_to" value={form.price_to} onChange={handleChange} placeholder="6900" min="0" />
                </div>
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-ticket">Ссылка на покупку (Lava)</label>
                <input id="pt-ticket" className="ptm__input" type="url" name="ticket_url" value={form.ticket_url} onChange={handleChange} placeholder="https://llava.ru/e/… — ссылка на событие Lava" />
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-desc">Краткое описание (на билет афиши)</label>
                <textarea id="pt-desc" className="ptm__input ptm__input--textarea" name="description" value={form.description} onChange={handleChange} placeholder="Пара предложений — они попадут на сам билет" rows={3} />
              </div>

              <div className="ptm__field">
                <label className="ptm__label" htmlFor="pt-desc-full">Подробное описание (в модальное окно)</label>
                <textarea id="pt-desc-full" className="ptm__input ptm__input--textarea" name="description_full" value={form.description_full} onChange={handleChange} placeholder="Полный текст о концерте: программа, истории, состав…" rows={8} />
              </div>

              {/* ---------- АРТИСТЫ ---------- */}
              <div className="ptm__field">
                <span className="ptm__label">Исполнители (группы)</span>

                {form.artists.map((artist, i) => (
                  <div key={i} className="ptm__artist">
                    {/* Фото исполнителя */}
                    <div className="ptm__person-photo">
                      {artist.photo ? (
                        <>
                          <img src={artist.photo} alt="" />
                          <button
                            type="button"
                            className="ptm__person-photo-remove"
                            onClick={() => removePersonPhoto('artist', i)}
                            aria-label="Убрать фото"
                            title="Убрать фото"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="ptm__person-photo-add"
                          onClick={() => pickPersonPhoto('artist', i)}
                          disabled={uploadingPersonPhoto}
                          aria-label="Загрузить фото"
                          title="Загрузить фото"
                        >
                          {uploadingPersonPhoto && personPhotoTarget?.kind === 'artist' && personPhotoTarget.index === i
                            ? '…'
                            : '+'}
                        </button>
                      )}
                    </div>
                    <div className="ptm__artist-fields">
                      <input
                        className="ptm__input"
                        type="text"
                        placeholder="Имя *"
                        value={artist.name}
                        onChange={(e) => handleArtistChange(i, 'name', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="ptm__remove-btn"
                      onClick={() => removeArtist(i)}
                      aria-label="Удалить артиста"
                      title="Удалить"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button type="button" className="ptm__add-small" onClick={addArtist}>
                  + Добавить исполнителя
                </button>
              </div>

              {/* ---------- ПАРТНЁРЫ СОБЫТИЯ ---------- */}
              <div className="ptm__field">
                <span className="ptm__label">Партнёры события (фото, видео, ведущие)</span>

                {form.partners.map((partner, i) => (
                  <div key={i} className="ptm__partner">
                    {/* Фото партнёра */}
                    <div className="ptm__person-photo">
                      {partner.photo ? (
                        <>
                          <img src={partner.photo} alt="" />
                          <button
                            type="button"
                            className="ptm__person-photo-remove"
                            onClick={() => removePersonPhoto('partner', i)}
                            aria-label="Убрать фото"
                            title="Убрать фото"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="ptm__person-photo-add"
                          onClick={() => pickPersonPhoto('partner', i)}
                          disabled={uploadingPersonPhoto}
                          aria-label="Загрузить фото"
                          title="Загрузить фото"
                        >
                          {uploadingPersonPhoto && personPhotoTarget?.kind === 'partner' && personPhotoTarget.index === i
                            ? '…'
                            : '+'}
                        </button>
                      )}
                    </div>
                    <div className="ptm__partner-fields">
                      <input
                        className="ptm__input"
                        type="text"
                        placeholder="Имя / название"
                        value={partner.name}
                        onChange={(e) => handlePartnerChange(i, 'name', e.target.value)}
                      />
                      <input
                        className="ptm__input"
                        type="text"
                        placeholder="Роль (Фотограф, Видеограф, Ведущий…)"
                        value={partner.role}
                        onChange={(e) => handlePartnerChange(i, 'role', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="ptm__remove-btn"
                      onClick={() => removePartner(i)}
                      aria-label="Удалить партнёра"
                      title="Удалить"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button type="button" className="ptm__add-small" onClick={addPartner}>
                  + Добавить партнёра
                </button>
              </div>

              <label className="ptm__checkbox">
                <input type="checkbox" name="is_past" checked={form.is_past} onChange={handleChange} />
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
    animation: pt-in 0.4s ease;
  }

  @keyframes pt-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pt__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
  }

  .pt__title {
    margin: 0 0 4px;
    font-family: 'Poppins', sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .pt__subtitle {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .pt__add-btn {
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

  .pt__add-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .pt__error {
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

  .pt__status, .pt__empty {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .pt__section {
    margin-bottom: 32px;
    padding: 24px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    animation: pt-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  }

  .pt__section:nth-of-type(1) { animation-delay: 0.05s; }
  .pt__section:nth-of-type(2) { animation-delay: 0.12s; }

  @keyframes pt-section-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pt__section-title {
    margin: 0 0 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #ffffff;
  }

  .pt__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pt__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 15px 18px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .pt__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .pt__row--hidden .pt__row-title,
  .pt__row--hidden .pt__row-date,
  .pt__row--hidden .pt__row-link {
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

  .pt__row-link {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: var(--accent, #00c3d0);
    text-decoration: none;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .pt__row-link:hover { opacity: 1; }

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
    border-radius: 10px;
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
    width: min(620px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    transform: translate(-50%, -50%);
    animation: ptm-in 0.3s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .ptm::-webkit-scrollbar { display: none; }

  @keyframes ptm-in {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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

  .ptm__close:hover { color: #ffffff; }

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
    gap: 8px;
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
    color-scheme: dark;
    transition: border-color 0.2s ease;
  }

  .ptm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .ptm__input::placeholder { color: #464646; }

  .ptm__input--textarea {
    resize: vertical;
    min-height: 70px;
  }

  /* Обложка */
  .ptm__image-ready {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ptm__image-ready img {
    width: 160px;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 8px;
  }

  .ptm__image-remove {
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

  .ptm__image-remove:hover { background: rgba(255, 90, 90, 0.1); }

  .ptm__image-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ptm__image-actions .ptm__input {
    flex: 1;
    min-width: 160px;
  }

  .ptm__upload-btn {
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

  .ptm__upload-btn:hover:not(:disabled) {
    border-color: var(--accent, #00c3d0);
  }

  .ptm__upload-btn:disabled { opacity: 0.6; }

  .ptm__or {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
    white-space: nowrap;
  }

  /* Артисты и партнёры */
  .ptm__artist,
  .ptm__partner {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px;
    background: #0c0c0c;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
  }

  .ptm__artist-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .ptm__partner-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .ptm__person-photo {
    position: relative;
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 8px;
    overflow: visible;
  }

  .ptm__person-photo img {
    width: 46px;
    height: 46px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .ptm__person-photo-add {
    width: 46px;
    height: 46px;
    font-size: 20px;
    line-height: 1;
    color: #8e8e93;
    background: rgba(255, 255, 255, 0.05);
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .ptm__person-photo-add:hover {
    color: var(--accent, #00c3d0);
    border-color: var(--accent, #00c3d0);
  }

  .ptm__person-photo-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    padding: 0;
    font-size: 13px;
    line-height: 1;
    color: #ffffff;
    background: #d93a56;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ptm__remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    padding: 0;
    background: rgba(255, 90, 90, 0.1);
    border: none;
    border-radius: 8px;
    color: #ff5a5a;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .ptm__remove-btn:hover { background: rgba(255, 90, 90, 0.2); }

  .ptm__add-small {
    align-self: flex-start;
    padding: 9px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: var(--accent, #00c3d0);
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }

  .ptm__add-small:hover {
    border-color: var(--accent, #00c3d0);
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
    .ptm__row { grid-template-columns: 1fr; }
    .pt__row { padding: 14px 16px; }
  }
`;