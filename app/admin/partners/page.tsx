// app/admin/partners/page.tsx
// Вкладка «Партнёры».
// Секция «Заявки»: заявки с сайта (таблица partner_requests),
//   ✓ — принять (создаёт партнёра и удаляет заявку), ✗ — отклонить.
// Секция «Партнёры»: CRUD с логотипом (Storage), видимостью и порядком.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'gallery'; // логотипы — в тот же public bucket

/* ---------- Типы ---------- */
type Request = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string;
  social: string | null;
  comment: string | null;
  created_at: string;
};

type Partner = {
  id: number;
  name: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  social: string | null;
  visible: boolean;
  sort_order: number;
};

type PartnerForm = {
  name: string;
  phone: string;
  email: string;
  social: string;
  logoUrl: string;
};

const EMPTY_FORM: PartnerForm = {
  name: '',
  phone: '',
  email: '',
  social: '',
  logoUrl: '',
};

/* Формат даты заявки */
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminPartnersPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /* Модалка партнёра: null / 'new' / id */
  const [modal, setModal] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Загрузка ---------- */
  const fetchAll = useCallback(async () => {
    const [{ data: reqData, error: reqError }, { data: partData, error: partError }] =
      await Promise.all([
        supabase
          .from('partner_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('partners').select('*').order('sort_order', { ascending: true }),
      ]);

    if (reqError) setError('Заявки: ' + reqError.message);
    else setRequests(reqData || []);

    if (partError) setError('Партнёры: ' + partError.message);
    else setPartners(partData || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- Заявки ---------- */
  // Принять: создаём партнёра из заявки и удаляем заявку
  const approveRequest = async (req: Request) => {
    const { error: insertError } = await supabase.from('partners').insert({
      name: req.company?.trim() || req.name,
      phone: req.phone,
      email: req.email,
      social: req.social,
      sort_order: partners.length,
    });

    if (insertError) {
      setError('Ошибка: ' + insertError.message);
      return;
    }

    await supabase.from('partner_requests').delete().eq('id', req.id);
    fetchAll();
  };

  // Отклонить: удаляем заявку
  const rejectRequest = async (req: Request) => {
    if (!confirm(`Отклонить заявку от «${req.name}»?`)) return;
    await supabase.from('partner_requests').delete().eq('id', req.id);
    fetchAll();
  };

  /* ---------- Партнёры: порядок ---------- */
  const saveOrder = async (list: Partner[]) => {
    await Promise.all(
      list.map((p, i) =>
        supabase.from('partners').update({ sort_order: i }).eq('id', p.id)
      )
    );
  };

  /* ---------- Логотип ---------- */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingLogo(true);
    setFormError(null);

    const ext = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      setFormError('Ошибка загрузки логотипа: ' + uploadError.message);
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setForm((f) => ({ ...f, logoUrl: urlData.publicUrl }));
    setUploadingLogo(false);
  };

  /* ---------- Модалка ---------- */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal('new');
  };

  const openEdit = (partner: Partner) => {
    setForm({
      name: partner.name,
      phone: partner.phone || '',
      email: partner.email || '',
      social: partner.social || '',
      logoUrl: partner.logo || '',
    });
    setFormError(null);
    setModal(partner.id);
  };

  const closeModal = () => setModal(null);

  useEffect(() => {
    document.body.style.overflow = modal !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ---------- Сохранение партнёра ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) return setFormError('Введите имя / название');

    setSaving(true);

    const record = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      social: form.social.trim() || null,
      logo: form.logoUrl.trim() || null,
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('partners')
        .insert({ ...record, sort_order: partners.length });
      saveError = error;
    } else {
      const { error } = await supabase
        .from('partners')
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
    fetchAll();
  };

  /* ---------- Удаление / видимость / drag ---------- */
  const removePartner = async (partner: Partner) => {
    if (!confirm(`Удалить партнёра «${partner.name}»?`)) return;
    const { error: deleteError } = await supabase
      .from('partners')
      .delete()
      .eq('id', partner.id);
    if (deleteError) {
      setError('Ошибка удаления: ' + deleteError.message);
      return;
    }
    // Удаляем логотип из Storage, если он у нас
    if (partner.logo?.includes(`/${BUCKET}/`)) {
      const fileName = partner.logo.split('/').pop();
      if (fileName) await supabase.storage.from(BUCKET).remove([fileName]);
    }
    fetchAll();
  };

  const toggleVisible = async (partner: Partner) => {
    await supabase
      .from('partners')
      .update({ visible: !partner.visible })
      .eq('id', partner.id);
    fetchAll();
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...partners];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setPartners(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(partners);
  };

  if (loading) {
    return (
      <>
        <style>{PARTNERS_CSS}</style>
        <div className="pn">
          <p className="pn__status">Загрузка…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PARTNERS_CSS}</style>

      <div className="pn">
        <h1 className="pn__title">Партнёры</h1>

        {error && <p className="pn__error">{error}</p>}

        {/* ---------- ЗАЯВКИ ---------- */}
        <section className="pn__section">
          <h2 className="pn__section-title">Заявки</h2>

          {requests.length === 0 ? (
            <p className="pn__status">Новых заявок нет</p>
          ) : (
            <ul className="pn__list">
              {requests.map((req) => (
                <li key={req.id} className="pn__row pn__row--request">
                  <div className="pn__info">
                    <span className="pn__row-title">
                      {req.name}
                      {req.company && ` (${req.company})`}
                    </span>
                    <span className="pn__row-line">{req.phone}</span>
                    <span className="pn__row-line">{req.email}</span>
                    {req.social && <span className="pn__row-line">{req.social}</span>}
                    {req.comment && (
                      <span className="pn__row-comment">{req.comment}</span>
                    )}
                    <span className="pn__row-date">
                      {formatDateTime(req.created_at)}
                    </span>
                  </div>

                  <div className="pn__request-actions">
                    {/* Принять */}
                    <button
                      className="pn__round-btn pn__round-btn--ok"
                      onClick={() => approveRequest(req)}
                      aria-label="Принять заявку"
                      title="Принять — создать партнёра"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                    </button>

                    {/* Отклонить */}
                    <button
                      className="pn__round-btn pn__round-btn--no"
                      onClick={() => rejectRequest(req)}
                      aria-label="Отклонить заявку"
                      title="Отклонить и удалить"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- ПАРТНЁРЫ ---------- */}
        <section className="pn__section">
          <div className="pn__section-header">
            <h2 className="pn__section-title">Партнёры</h2>
            <button className="pn__add-btn" onClick={openNew}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить
            </button>
          </div>

          {partners.length === 0 ? (
            <p className="pn__status">Партнёров пока нет</p>
          ) : (
            <ul className="pn__list">
              {partners.map((partner, index) => (
                <li
                  key={partner.id}
                  className={
                    'pn__row' +
                    (dragIndex === index ? ' pn__row--dragging' : '') +
                    (!partner.visible ? ' pn__row--hidden' : '')
                  }
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Логотип */}
                  <div className="pn__logo">
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} />
                    ) : (
                      <span className="pn__logo-placeholder" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-4.5-4.5L6 21" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="pn__info">
                    <span className="pn__row-title">{partner.name}</span>
                    {partner.phone && (
                      <span className="pn__row-line">{partner.phone}</span>
                    )}
                    {partner.email && (
                      <span className="pn__row-line">{partner.email}</span>
                    )}
                    {partner.social && (
                      <span className="pn__row-line">{partner.social}</span>
                    )}
                  </div>

                  {/* Контролы */}
                  <div className="pn__controls">
                    <button className="pn__icon-btn" onClick={() => removePartner(partner)} aria-label="Удалить" title="Удалить">
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                      </svg>
                    </button>

                    <button className="pn__icon-btn" onClick={() => openEdit(partner)} aria-label="Редактировать" title="Редактировать">
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
                      </svg>
                    </button>

                    <button
                      className="pn__icon-btn"
                      onClick={() => toggleVisible(partner)}
                      aria-label={partner.visible ? 'Скрыть' : 'Показать'}
                      title={partner.visible ? 'Скрыть с сайта' : 'Показать на сайте'}
                    >
                      {partner.visible ? (
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

                    <span className="pn__grip" aria-hidden="true">
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
          )}
        </section>
      </div>

      {/* ---------- МОДАЛКА ПАРТНЁРА ---------- */}
      {modal !== null && (
        <>
          <div className="pnm-overlay" onClick={closeModal} aria-hidden="true" />

          <div className="pnm" role="dialog" aria-modal="true">
            <button className="pnm__close" onClick={closeModal} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="pnm__title">
              {modal === 'new' ? 'Новый партнёр' : 'Редактировать партнёра'}
            </h2>

            <form className="pnm__form" onSubmit={handleSubmit} noValidate>
              <div className="pnm__field">
                <label className="pnm__label" htmlFor="pn-name">Имя / название *</label>
                <input
                  id="pn-name"
                  className="pnm__input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ИП Иванов / Радио Рекорд"
                />
              </div>

              <div className="pnm__row">
                <div className="pnm__field">
                  <label className="pnm__label" htmlFor="pn-phone">Телефон</label>
                  <input
                    id="pn-phone"
                    className="pnm__input"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
                <div className="pnm__field">
                  <label className="pnm__label" htmlFor="pn-email">Почта</label>
                  <input
                    id="pn-email"
                    className="pnm__input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="partner@mail.ru"
                  />
                </div>
              </div>

              <div className="pnm__field">
                <label className="pnm__label" htmlFor="pn-social">Соцсети</label>
                <input
                  id="pn-social"
                  className="pnm__input"
                  type="text"
                  name="social"
                  value={form.social}
                  onChange={handleChange}
                  placeholder="Ссылка на профиль"
                />
              </div>

              {/* Логотип */}
              <div className="pnm__field">
                <span className="pnm__label">Логотип</span>

                {form.logoUrl ? (
                  <div className="pnm__logo-ready">
                    <img src={form.logoUrl} alt="Логотип" />
                    <button
                      type="button"
                      className="pnm__logo-remove"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}
                    >
                      Убрать
                    </button>
                  </div>
                ) : (
                  <div className="pnm__logo-actions">
                    <button
                      type="button"
                      className="pnm__upload-btn"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Загрузка…' : 'Загрузить логотип'}
                    </button>
                    <span className="pnm__or">или URL:</span>
                    <input
                      className="pnm__input"
                      type="url"
                      name="logoUrl"
                      value={form.logoUrl}
                      onChange={handleChange}
                      placeholder="https://…"
                    />
                  </div>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoUpload}
                />
              </div>

              {formError && <p className="pnm__error">{formError}</p>}

              <button type="submit" className="pnm__submit" disabled={saving}>
                {saving ? 'Сохранение…' : modal === 'new' ? 'Добавить партнёра' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const PARTNERS_CSS = `
  .pn {
    max-width: 900px;
  }

  .pn__title {
    margin: 0 0 40px;
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
  }

  .pn__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.1);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 10px;
  }

  .pn__status {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #464646;
  }

  .pn__section {
    margin-bottom: 48px;
  }

  .pn__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .pn__section-title {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
  }

  .pn__add-btn {
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

  .pn__add-btn:hover {
    border-color: var(--accent, #00c3d0);
    color: var(--accent, #00c3d0);
  }

  .pn__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Строка */
  .pn__row {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 18px 24px;
    background: #1e1e1e;
    border: 1px solid transparent;
    border-radius: 14px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease;
  }

  .pn__row:active {
    cursor: grabbing;
  }

  .pn__row--dragging {
    border-color: var(--accent, #00c3d0);
    opacity: 0.7;
  }

  .pn__row--hidden .pn__row-title,
  .pn__row--hidden .pn__row-line,
  .pn__row--hidden .pn__logo {
    opacity: 0.35;
  }

  /* Заявки не перетаскиваются */
  .pn__row--request {
    cursor: default;
    justify-content: space-between;
  }

  .pn__logo {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    background: #141414;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s ease;
  }

  .pn__logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 6px;
  }

  .pn__logo-placeholder {
    color: #464646;
  }

  .pn__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .pn__row-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .pn__row-line {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 300;
    color: #8e8e93;
  }

  .pn__row-comment {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-style: italic;
    color: #8e8e93;
    margin-top: 4px;
  }

  .pn__row-date {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #464646;
    margin-top: 6px;
  }

  /* Кнопки заявки: круглые */
  .pn__request-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  .pn__round-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .pn__round-btn:hover {
    transform: scale(1.1);
  }

  .pn__round-btn--ok {
    background: rgba(52, 199, 89, 0.15);
    color: #34c759;
  }

  .pn__round-btn--no {
    background: rgba(255, 90, 90, 0.15);
    color: #ff5a5a;
  }

  /* Иконки партнёров */
  .pn__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .pn__icon-btn {
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

  .pn__icon-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .pn__grip {
    display: flex;
    margin-left: 8px;
    color: #464646;
  }

  /* ---------- МОДАЛКА ---------- */
  .pnm-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .pnm {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    transform: translate(-50%, -50%);
    animation: pnm-in 0.25s ease;
  }

  @keyframes pnm-in {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .pnm__close {
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

  .pnm__close:hover {
    color: #ffffff;
  }

  .pnm__title {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .pnm__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pnm__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .pnm__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pnm__label {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .pnm__input {
    padding: 12px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .pnm__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .pnm__input::placeholder {
    color: #464646;
  }

  .pnm__logo-ready {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .pnm__logo-ready img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    background: #060606;
    border-radius: 10px;
    padding: 6px;
  }

  .pnm__logo-remove {
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

  .pnm__logo-remove:hover {
    background: rgba(255, 90, 90, 0.1);
  }

  .pnm__logo-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .pnm__logo-actions .pnm__input {
    flex: 1;
    min-width: 150px;
  }

  .pnm__upload-btn {
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

  .pnm__upload-btn:hover:not(:disabled) {
    border-color: var(--accent, #00c3d0);
  }

  .pnm__upload-btn:disabled {
    opacity: 0.6;
  }

  .pnm__or {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #464646;
    white-space: nowrap;
  }

  .pnm__error {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .pnm__submit {
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

  .pnm__submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 640px) {
    .pnm__row {
      grid-template-columns: 1fr;
    }

    .pn__row {
      padding: 14px 16px;
      gap: 12px;
    }
  }
`;