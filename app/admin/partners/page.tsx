// app/admin/partners/page.tsx
// Вкладка «Партнёры» — три блока:
// 1. Заявки: заявки с сайта, ✓ — принять (в таблицу данных), ✗ — отклонить.
// 2. Таблица данных: CRM по партнёрам (куда попадают принятые заявки).
// 3. На сайте: информационные партнёры — логотипы и названия, видимые на главной.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'gallery';

/* ---------- Типы ---------- */
type Request = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string;
  social: string | null;
  comment: string | null;
  direction: string | null;
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
  show_on_site: boolean;
  sort_order: number;
};

type PartnerForm = {
  name: string;
  phone: string;
  email: string;
  social: string;
  logoUrl: string;
  show_on_site: boolean;
};

const EMPTY_FORM: PartnerForm = {
  name: '',
  phone: '',
  email: '',
  social: '',
  logoUrl: '',
  show_on_site: false,
};

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

  /* Перетаскивание пальцем */
  const listRef = useRef<HTMLUListElement>(null);
  const [touchDrag, setTouchDrag] = useState<number | null>(null);
  const touchRef = useRef<{ index: number; startY: number; active: boolean } | null>(null);

  /* Модалка: null / 'new' / id */
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

  const rejectRequest = async (req: Request) => {
    if (!confirm(`Отклонить заявку от «${req.name}»?`)) return;
    await supabase.from('partner_requests').delete().eq('id', req.id);
    fetchAll();
  };

  /* ---------- Порядок (таблица данных) ---------- */
  const saveOrder = async (list: Partner[]) => {
    await Promise.all(
      list.map((p, i) =>
        supabase.from('partners').update({ sort_order: i }).eq('id', p.id)
      )
    );
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...partners];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPartners(next);
  };

  /* Touch-drag */
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
    if (t?.active) saveOrder(partners);
    touchRef.current = null;
    setTouchDrag(null);
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
      show_on_site: partner.show_on_site ?? false,
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
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ---------- Сохранение ---------- */
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
      show_on_site: form.show_on_site,
    };

    let saveError = null;
    if (modal === 'new') {
      const { error } = await supabase
        .from('partners')
        .insert({ ...record, sort_order: partners.length });
      saveError = error;
    } else {
      const { error } = await supabase.from('partners').update(record).eq('id', modal);
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

  /* ---------- Удаление / видимость / витрина ---------- */
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

  const toggleShowOnSite = async (partner: Partner) => {
    await supabase
      .from('partners')
      .update({ show_on_site: !partner.show_on_site })
      .eq('id', partner.id);
    fetchAll();
  };

  /* ---------- Desktop drag ---------- */
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    reorder(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveOrder(partners);
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="pn">
          <p className="pn__status">Загрузка…</p>
        </div>
      </>
    );
  }

  /* Партнёры, показываемые на главной (витрина) */
  const sitePartners = partners.filter((p) => p.visible && p.show_on_site && p.logo);

  return (
    <>
      <style>{CSS}</style>

      <div className="pn">
        {/* Шапка */}
        <div className="pn__header">
          <div>
            <h1 className="pn__title">Партнёры</h1>
            <p className="pn__subtitle">
              {requests.length} заявок · {partners.length} в базе · {sitePartners.length} на сайте
            </p>
          </div>
        </div>

        {error && <p className="pn__error">{error}</p>}

        {/* ================= 1. ЗАЯВКИ ================= */}
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
                    {req.direction && (
                      <span className="pn__row-direction">{req.direction}</span>
                    )}
                    <span className="pn__row-line">{req.phone}</span>
                    <span className="pn__row-line">{req.email}</span>
                    {req.social && <span className="pn__row-line">{req.social}</span>}
                    {req.comment && (
                      <span className="pn__row-comment">{req.comment}</span>
                    )}
                    <span className="pn__row-date">{formatDateTime(req.created_at)}</span>
                  </div>

                  <div className="pn__request-actions">
                    <button
                      className="pn__round-btn pn__round-btn--ok"
                      onClick={() => approveRequest(req)}
                      aria-label="Принять заявку"
                      title="Принять — в таблицу данных"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                    </button>
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

        {/* ================= 2. ТАБЛИЦА ДАННЫХ ================= */}
        <section className="pn__section">
          <div className="pn__section-header">
            <h2 className="pn__section-title">Таблица данных</h2>
            <button className="pn__add-btn" onClick={openNew}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить
            </button>
          </div>

          {partners.length === 0 ? (
            <p className="pn__status">База пуста — добавьте партнёра или примите заявку</p>
          ) : (
            <>
              {/* Шапка таблицы (десктоп) */}
              <div className="pn__table-head" aria-hidden="true">
                <span>Партнёр</span>
                <span>Телефон</span>
                <span>Почта</span>
                <span>Соцсети</span>
                <span className="pn__table-head-actions">Действия</span>
              </div>

              <ul className="pn__list" ref={listRef}>
                {partners.map((partner, index) => (
                  <li
                    key={partner.id}
                    className={
                      'pn__row pn__table-row' +
                      (dragIndex === index || touchDrag === index ? ' pn__row--dragging' : '') +
                      (!partner.visible ? ' pn__row--hidden' : '')
                    }
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="pn__cell pn__cell--name">
                      {partner.name}
                      {partner.show_on_site && <span className="pn__row-badge">на сайте</span>}
                    </span>
                    <span className="pn__cell">{partner.phone || '—'}</span>
                    <span className="pn__cell">{partner.email || '—'}</span>
                    <span className="pn__cell">{partner.social || '—'}</span>

                    <span className="pn__cell pn__cell--actions">
                      <button
                        className={'pn__mini-btn' + (partner.show_on_site ? ' pn__mini-btn--on' : '')}
                        onClick={() => toggleShowOnSite(partner)}
                        title={partner.show_on_site ? 'Убрать с главной' : 'Показать на главной (нужен логотип)'}
                        aria-label="На сайте"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9S14.5 18.4 12 21c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3z" />
                        </svg>
                      </button>

                      <button className="pn__mini-btn" onClick={() => toggleVisible(partner)}
                        title={partner.visible ? 'Скрыть' : 'Показать'} aria-label="Видимость">
                        {partner.visible ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
                            <circle cx="12" cy="12" r="2.8" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 3l18 18" />
                            <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.7-.3 3.8-.7" />
                            <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
                          </svg>
                        )}
                      </button>

                      <button className="pn__mini-btn" onClick={() => openEdit(partner)}
                        title="Редактировать" aria-label="Редактировать">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3.5 20.5 7 8.5 19H5v-3.5zM14.5 6l3.5 3.5" />
                        </svg>
                      </button>

                      <button className="pn__mini-btn pn__mini-btn--danger" onClick={() => removePartner(partner)}
                        title="Удалить" aria-label="Удалить">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
                        </svg>
                      </button>

                      <span
                        className="pn__grip"
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
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ================= 3. НА САЙТЕ (витрина) ================= */}
        <section className="pn__section">
          <h2 className="pn__section-title">
            На главной странице
            <span className="pn__section-note">логотипы в блоке «Информационные партнёры»</span>
          </h2>

          {sitePartners.length === 0 ? (
            <p className="pn__status">
              Никого. Включите «на сайте» у партнёра с логотипом в таблице данных выше.
            </p>
          ) : (
            <div className="pn__showcase">
              {sitePartners.map((partner) => (
                <div key={partner.id} className="pn__showcase-card">
                  <div className="pn__showcase-logo">
                    <img src={partner.logo!} alt={partner.name} />
                  </div>
                  <span className="pn__showcase-name">{partner.name}</span>
                  <button
                    className="pn__showcase-remove"
                    onClick={() => toggleShowOnSite(partner)}
                    title="Убрать с главной"
                    aria-label="Убрать с главной"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ================= МОДАЛКА ================= */}
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
                <input id="pn-name" className="pnm__input" type="text" name="name"
                  value={form.name} onChange={handleChange} placeholder="ИП Иванов / Радио Рекорд" />
              </div>

              <div className="pnm__row">
                <div className="pnm__field">
                  <label className="pnm__label" htmlFor="pn-phone">Телефон</label>
                  <input id="pn-phone" className="pnm__input" type="tel" name="phone"
                    value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" />
                </div>
                <div className="pnm__field">
                  <label className="pnm__label" htmlFor="pn-email">Почта</label>
                  <input id="pn-email" className="pnm__input" type="email" name="email"
                    value={form.email} onChange={handleChange} placeholder="partner@mail.ru" />
                </div>
              </div>

              <div className="pnm__field">
                <label className="pnm__label" htmlFor="pn-social">Соцсети</label>
                <input id="pn-social" className="pnm__input" type="text" name="social"
                  value={form.social} onChange={handleChange} placeholder="Ссылка на профиль" />
              </div>

              <label className="pnm__checkbox">
                <input type="checkbox" name="show_on_site" checked={form.show_on_site}
                  onChange={handleChange} />
                Показывать в блоке «Информационные партнёры» на главной
              </label>

              <div className="pnm__field">
                <span className="pnm__label">Логотип</span>

                {form.logoUrl ? (
                  <div className="pnm__logo-ready">
                    <img src={form.logoUrl} alt="Логотип" />
                    <button type="button" className="pnm__logo-remove"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}>
                      Убрать
                    </button>
                  </div>
                ) : (
                  <div className="pnm__logo-actions">
                    <button type="button" className="pnm__upload-btn"
                      onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? 'Загрузка…' : 'Загрузить логотип'}
                    </button>
                    <span className="pnm__or">или URL:</span>
                    <input className="pnm__input" type="url" name="logoUrl"
                      value={form.logoUrl} onChange={handleChange} placeholder="https://…" />
                  </div>
                )}

                <input ref={logoInputRef} type="file" accept="image/*" hidden
                  onChange={handleLogoUpload} />
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

const CSS = `
  .pn {
    max-width: 1100px;
    animation: pn-in 0.4s ease;
  }

  @keyframes pn-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pn__header { margin-bottom: 28px; }

  .pn__title {
    margin: 0 0 4px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: #ffffff;
  }

  .pn__subtitle {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #5a5a5e;
  }

  .pn__error {
    padding: 12px 16px;
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #ff5a5a;
    background: rgba(255, 90, 90, 0.08);
    border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 12px;
  }

  .pn__status {
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #5a5a5e;
  }

  .pn__section {
    margin-bottom: 28px;
    padding: 24px;
    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    animation: pn-section-in 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  }

  .pn__section:nth-of-type(1) { animation-delay: 0.05s; }
  .pn__section:nth-of-type(2) { animation-delay: 0.12s; }
  .pn__section:nth-of-type(3) { animation-delay: 0.19s; }

  @keyframes pn-section-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pn__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .pn__section-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
    margin: 0 0 18px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #ffffff;
  }

  .pn__section-header .pn__section-title { margin: 0; }

  .pn__section-note {
    font-family: var(--font-poppins), sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #5a5a5e;
  }

  .pn__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 11px 20px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border: none;
    border-radius: 11px;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .pn__add-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

  .pn__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pn__row {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 14px 18px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: grab;
    transition: border-color 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  }

  .pn__row:hover {
    background: #1c1c1c;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .pn__row--dragging {
    position: relative;
    z-index: 5;
    border-color: var(--accent, #00c3d0);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .pn__grip { touch-action: none; color: #3a3a3a; display: flex; }
  .pn__row:hover .pn__grip { color: #6a6a6e; }

  /* Заявки */
  .pn__row--request { cursor: default; justify-content: space-between; }
  .pn__info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .pn__row-title { font-family: var(--font-poppins), sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; }
  .pn__row-line { font-family: var(--font-poppins), sans-serif; font-size: 13px; font-weight: 300; color: #8e8e93; }
  .pn__row-comment { font-family: var(--font-poppins), sans-serif; font-size: 12px; font-style: italic; color: #8e8e93; margin-top: 4px; }
  .pn__row-date { font-family: var(--font-poppins), sans-serif; font-size: 11px; color: #464646; margin-top: 6px; }

  .pn__row-direction {
    display: inline-block;
    align-self: flex-start;
    margin-top: 2px;
    padding: 3px 10px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 11px;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 6px;
  }

  .pn__row-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: #060606;
    background: var(--accent, #00c3d0);
    border-radius: 5px;
    vertical-align: middle;
  }

  .pn__request-actions { display: flex; gap: 12px; flex-shrink: 0; }

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
    transition: transform 0.2s ease;
  }
  .pn__round-btn:hover { transform: scale(1.1); }
  .pn__round-btn--ok { background: rgba(52, 199, 89, 0.15); color: #34c759; }
  .pn__round-btn--no { background: rgba(255, 90, 90, 0.15); color: #ff5a5a; }

  /* Таблица данных */
  .pn__table-head {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1.2fr 1fr auto;
    gap: 12px;
    padding: 0 18px 10px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5a5a5e;
  }

  .pn__table-row {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1.2fr 1fr auto;
    gap: 12px;
    align-items: center;
    cursor: default;
  }

  .pn__cell {
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #c9c9ce;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .pn__cell--name {
    font-weight: 600;
    color: #ffffff;
    white-space: normal;
  }

  .pn__cell--actions {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
  }

  .pn__mini-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #8e8e93;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .pn__mini-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); }
  .pn__mini-btn--danger:hover { color: #ff5a5a; background: rgba(255, 90, 90, 0.12); }
  .pn__mini-btn--on { color: var(--accent, #00c3d0); }

  .pn__row--hidden .pn__cell { opacity: 0.4; }

  /* Витрина на сайте */
  .pn__showcase {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .pn__showcase-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 18px 14px 14px;
    background: #181818;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    transition: border-color 0.2s ease;
  }

  .pn__showcase-card:hover { border-color: rgba(255, 255, 255, 0.16); }

  .pn__showcase-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 64px;
  }

  .pn__showcase-logo img {
    max-width: 100%;
    max-height: 64px;
    object-fit: contain;
    filter: grayscale(1) brightness(1.6);
  }

  .pn__showcase-name {
    font-family: var(--font-poppins), sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #c9c9ce;
    text-align: center;
  }

  .pn__showcase-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(255, 90, 90, 0.12);
    border: none;
    border-radius: 50%;
    color: #ff5a5a;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background 0.2s ease;
  }

  .pn__showcase-card:hover .pn__showcase-remove { opacity: 1; }
  .pn__showcase-remove:hover { background: rgba(255, 90, 90, 0.25); }

  /* ---------- Модалка ---------- */
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
    scrollbar-width: none;
    padding: 36px 32px 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    transform: translate(-50%, -50%);
    animation: pnm-in 0.3s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .pnm::-webkit-scrollbar { display: none; }

  @keyframes pnm-in {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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
  .pnm__close:hover { color: #ffffff; }

  .pnm__title {
    margin: 0 0 24px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
  }

  .pnm__form { display: flex; flex-direction: column; gap: 16px; }

  .pnm__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .pnm__field { display: flex; flex-direction: column; gap: 8px; }

  .pnm__label { font-family: var(--font-poppins), sans-serif; font-size: 13px; color: #8e8e93; }

  .pnm__input {
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
  .pnm__input:focus { border-color: var(--accent, #00c3d0); }
  .pnm__input::placeholder { color: #464646; }

  .pnm__checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #8e8e93;
    cursor: pointer;
  }
  .pnm__checkbox input { width: 16px; height: 16px; accent-color: var(--accent, #00c3d0); }

  .pnm__logo-ready { display: flex; align-items: center; gap: 14px; }
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
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #ff5a5a;
    background: transparent;
    border: 1px solid rgba(255, 90, 90, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .pnm__logo-remove:hover { background: rgba(255, 90, 90, 0.1); }

  .pnm__logo-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pnm__logo-actions .pnm__input { flex: 1; min-width: 150px; }

  .pnm__upload-btn {
    padding: 11px 16px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 13px;
    color: #ffffff;
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s ease;
    white-space: nowrap;
  }
  .pnm__upload-btn:hover:not(:disabled) { border-color: var(--accent, #00c3d0); }
  .pnm__upload-btn:disabled { opacity: 0.6; }
  .pnm__or { font-family: var(--font-poppins), sans-serif; font-size: 13px; color: #464646; white-space: nowrap; }

  .pnm__error { margin: 0; font-family: var(--font-poppins), sans-serif; font-size: 13px; color: #ff5a5a; }

  .pnm__submit {
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
  .pnm__submit:disabled { opacity: 0.6; cursor: default; }

  /* ---------- Адаптив ---------- */
  @media (max-width: 900px) {
    .pn__table-head { display: none; }
    .pn__table-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .pn__cell--actions { justify-content: flex-start; margin-top: 6px; }
  }

  @media (max-width: 640px) {
    .pn__section { padding: 18px 16px; }
    .pn__row { padding: 12px 14px; gap: 12px; }
    .pnm__row { grid-template-columns: 1fr; }
  }
`;