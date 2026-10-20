// components/Partners.tsx
// Блок «Партнёры»: направления сотрудничества + информационные партнёры.
// Форма заявки: направление зависит от нажатой кнопки, соцсети — список с добавлением.
// Логотипы: при переполнении (>8 десктоп / >4 мобилка) — бегущая лента с затемнением краёв.

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- Направления партнёрства ---------- */
const DIRECTIONS = [
  { id: 'business', label: 'Бизнес и культурные проекты' },
  { id: 'media', label: 'СМИ' },
  { id: 'photo', label: 'Фотографам и видеографам' },
];

/* Человекочитаемое название направления для заявки */
const directionLabel = (id: string) =>
  DIRECTIONS.find((d) => d.id === id)?.label || id;

type Partner = {
  id: number;
  name: string;
  logo: string | null;
};

type FormData = {
  name: string;
  company: string;
  phone: string;
  email: string;
  comment: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  company: '',
  phone: '',
  email: '',
  comment: '',
};

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  /* Направление выбранное нажатой кнопкой */
  const [direction, setDirection] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  /* Соцсети — динамический список */
  const [socials, setSocials] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  /* Появление блока при прокрутке */
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Логотипы информационных партнёров */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('partners')
        .select('id, name, logo')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      setPartners(data || []);
    })();
  }, []);

  const openModal = (dirId: string) => {
    setDirection(dirId);
    setIsSent(false);
    setSendError(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  /* ---------- Соцсети: динамический список ---------- */
  const addSocial = () => setSocials((s) => [...s, '']);
  const removeSocial = (i: number) =>
    setSocials((s) => s.filter((_, idx) => idx !== i));
  const changeSocial = (i: number, value: string) =>
    setSocials((s) => s.map((v, idx) => (idx === i ? value : v)));

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = 'Введите имя';
    if (!form.phone.trim()) newErrors.phone = 'Введите телефон';
    if (!form.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Некорректный email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    setSendError(null);

    const { error } = await supabase.from('partner_requests').insert({
      name: form.name.trim(),
      company: form.company.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim(),
      social: socials.map((s) => s.trim()).filter(Boolean).join('\n') || null,
      comment: form.comment.trim() || null,
      direction: direction ? directionLabel(direction) : null,
    });

    setSending(false);

    if (error) {
      setSendError('Не удалось отправить заявку. Попробуйте позже.');
      return;
    }

    setIsSent(true);
    setForm(EMPTY_FORM);
    setSocials([]);
  };

  /* Логотипы с логотипами: бегущая лента при переполнении */
  const logos = partners.filter((p) => p.logo);
  const scrollDesktop = logos.length > 8;
  const scrollMobile = logos.length > 4;

  return (
    <>
      <style>{PARTNERS_CSS}</style>

      <section
        className={'rsc-partners' + (inView ? ' rsc-partners--in' : '')}
        id="partners"
        ref={sectionRef}
      >
        <div className="rsc-partners__inner">
          {/* Заголовки блока */}
          <h2 className="rsc-partners__heading">Партнёры</h2>
          <p className="rsc-partners__subheading">
            Пространство для сильных решений
          </p>

          {/* Текстовое описание */}
          <div className="rsc-partners__text">
            <p className="rsc-partners__lead">
              RockSession открыт к сотрудничеству с брендами, которым близки ценности живого звука, культуры и внимания к деталям. Мы создаём закрытые вечера для избранной аудитории — и приглашаем вас стать частью этого пространства.
            </p>
            <p className="rsc-partners__body">
              Предлагаем не стандартные интеграции, а продуманное партнёрство: от деликатного присутствия в атмосфере вечера до совместных проектов внутри клуба. Всё обсуждаем индивидуально.
            </p>
          </div>

          {/* Карточки направлений */}
          <div className="rsc-partners__cards">
            {DIRECTIONS.map((dir, i) => (
              <div key={dir.id} className="rsc-partners__card">
                <h3 className="rsc-partners__card-title">{dir.label}</h3>
                <button
                  className="rsc-partners__card-btn"
                  onClick={() => openModal(dir.id)}
                >
                  Стать партнёром
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Информационные партнёры — только логотипы */}
          {logos.length > 0 && (
            <>
              <h3 className="rsc-partners__info-heading">
                Информационные партнёры
              </h3>

              <div
                className={
                  'rsc-partners__logos' +
                  (scrollDesktop ? ' rsc-logos--scroll' : '') +
                  (scrollMobile && !scrollDesktop ? ' rsc-logos--scroll-mobile' : '')
                }
              >
                <div className="rsc-partners__logos-track">
                  {/* Две копии для бесшовной ленты */}
                  {[...logos, ...logos].map((pl, i) => (
                    <img
                      key={`${pl.id}-${i}`}
                      src={pl.logo!}
                      alt={pl.name}
                      title={pl.name}
                      className="rsc-partners__logo"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---------- МОДАЛЬНОЕ ОКНО ЗАЯВКИ ---------- */}
      <div
        className={'rsc-modal-overlay' + (isModalOpen ? ' rsc-modal-overlay--visible' : '')}
        onClick={closeModal}
        aria-hidden="true"
      />

      <div
        className={'rsc-modal' + (isModalOpen ? ' rsc-modal--open' : '')}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isModalOpen}
      >
        <button
          className="rsc-modal__close"
          onClick={closeModal}
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {isSent ? (
          <div className="rsc-modal__success">
            <div className="rsc-modal__success-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <h3 className="rsc-modal__success-title">Заявка отправлена</h3>
            <p className="rsc-modal__success-text">
              Мы свяжемся с вами в ближайшее время.
            </p>
            <button className="rsc-modal__submit" onClick={closeModal}>
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <h3 className="rsc-modal__title">Стать партнёром</h3>
            <p className="rsc-modal__subtitle">
              {direction
                ? `Направление: ${directionLabel(direction)}. Заполните форму — мы свяжемся с вами`
                : 'Заполните форму — мы свяжемся с вами'}
            </p>

            <form className="rsc-modal__form" onSubmit={handleSubmit} noValidate>
              <div className="rsc-modal__field">
                <label className="rsc-modal__label" htmlFor="partner-name">
                  Имя <span className="rsc-modal__required">*</span>
                </label>
                <input
                  id="partner-name"
                  className={'rsc-modal__input' + (errors.name ? ' rsc-modal__input--error' : '')}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Как к вам обращаться"
                />
                {errors.name && <span className="rsc-modal__error">{errors.name}</span>}
              </div>

              <div className="rsc-modal__field">
                <label className="rsc-modal__label" htmlFor="partner-company">
                  Компания
                </label>
                <input
                  id="partner-company"
                  className="rsc-modal__input"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Если есть"
                />
              </div>

              <div className="rsc-modal__field">
                <label className="rsc-modal__label" htmlFor="partner-phone">
                  Телефон <span className="rsc-modal__required">*</span>
                </label>
                <input
                  id="partner-phone"
                  className={'rsc-modal__input' + (errors.phone ? ' rsc-modal__input--error' : '')}
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+7 (___) ___-__-__"
                />
                {errors.phone && <span className="rsc-modal__error">{errors.phone}</span>}
              </div>

              <div className="rsc-modal__field">
                <label className="rsc-modal__label" htmlFor="partner-email">
                  Email <span className="rsc-modal__required">*</span>
                </label>
                <input
                  id="partner-email"
                  className={'rsc-modal__input' + (errors.email ? ' rsc-modal__input--error' : '')}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                {errors.email && <span className="rsc-modal__error">{errors.email}</span>}
              </div>

              {/* Соцсети — динамический список */}
              <div className="rsc-modal__field">
                <span className="rsc-modal__label">Соцсети</span>

                {socials.map((social, i) => (
                  <div key={i} className="rsc-modal__social-row">
                    <input
                      className="rsc-modal__input"
                      type="text"
                      value={social}
                      onChange={(e) => changeSocial(i, e.target.value)}
                      placeholder="Ссылка на профиль"
                    />
                    <button
                      type="button"
                      className="rsc-modal__social-remove"
                      onClick={() => removeSocial(i)}
                      aria-label="Удалить соцсеть"
                      title="Удалить"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="rsc-modal__social-add"
                  onClick={addSocial}
                >
                  + Добавить соцсеть
                </button>
              </div>

              <div className="rsc-modal__field">
                <label className="rsc-modal__label" htmlFor="partner-comment">
                  Комментарий
                </label>
                <textarea
                  id="partner-comment"
                  className="rsc-modal__input rsc-modal__input--textarea"
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  placeholder="Расскажите о вашей идее"
                  rows={4}
                />
              </div>

              {sendError && <p className="rsc-modal__send-error">{sendError}</p>}

              <button type="submit" className="rsc-modal__submit" disabled={sending}>
                {sending ? 'Отправка…' : 'Отправить заявку'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

const PARTNERS_CSS = `
  .rsc-partners {
    background: #060606;
    padding: 110px 24px 120px;
    overflow-x: clip;
  }

  .rsc-partners__inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  /* ---------- Появление блока ---------- */
  .rsc-partners__heading,
  .rsc-partners__subheading,
  .rsc-partners__text,
  .rsc-partners__card,
  .rsc-partners__info-heading,
  .rsc-partners__logos {
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  /* Скрыты только ДО появления: даже если обсервер не сработал, контент виден */
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__heading,
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__subheading,
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__text,
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__card,
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__info-heading,
  .rsc-partners:not(.rsc-partners--in) .rsc-partners__logos {
    opacity: 0;
    transform: translateY(30px);
  }

  /* Каскад после появления */
  .rsc-partners--in .rsc-partners__heading { transition-delay: 0s; }
  .rsc-partners--in .rsc-partners__subheading { transition-delay: 0.1s; }
  .rsc-partners--in .rsc-partners__text { transition-delay: 0.2s; }
  .rsc-partners--in .rsc-partners__cards .rsc-partners__card:nth-child(1) { transition-delay: 0.3s; }
  .rsc-partners--in .rsc-partners__cards .rsc-partners__card:nth-child(2) { transition-delay: 0.4s; }
  .rsc-partners--in .rsc-partners__cards .rsc-partners__card:nth-child(3) { transition-delay: 0.5s; }
  .rsc-partners--in .rsc-partners__info-heading { transition-delay: 0.5s; }
  .rsc-partners--in .rsc-partners__logos { transition-delay: 0.6s; }

  .rsc-partners__heading {
    margin: 0 0 10px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-partners__subheading {
    margin: 0 0 56px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-partners__text {
    max-width: 1000px;
    margin: 0 auto 64px;
  }

  .rsc-partners__lead {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(18px, 2.2vw, 24px);
    font-weight: 500;
    line-height: 1.5;
    color: #ffffff;
  }

  .rsc-partners__body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(15px, 1.8vw, 18px);
    font-weight: 300;
    line-height: 1.7;
    color: #8e8e93;
  }

  .rsc-partners__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    margin-bottom: 80px;
  }

  .rsc-partners__card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 32px;
    padding: 36px 32px;
    background: #141414;
  }

  .rsc-partners__card-title {
    margin: 0;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(18px, 2vw, 24px);
    line-height: 1.3;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-partners__card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: 2px solid var(--accent, #00c3d0);
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease;
  }

  .rsc-partners__card-btn:hover {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-partners__card-btn svg {
    transition: transform 0.25s ease;
  }

  .rsc-partners__card-btn:hover svg {
    transform: translateX(4px);
  }

  .rsc-partners__info-heading {
    margin: 0 0 40px;
    text-align: center;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(22px, 3vw, 34px);
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* ---------- Логотипы ---------- */
  .rsc-partners__logos {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 40px;
  }

  .rsc-partners__logos-track {
    display: contents; /* статичный режим: логотипы лежат в общем flex */
  }

  /* Бегущая лента: края затемнены, логотипы въезжают справа и уходят влево */
  .rsc-logos--scroll,
  .rsc-logos--scroll-mobile {
    display: block;
    overflow: hidden;
    flex-wrap: nowrap;
    /* Затемнение по краям */
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  }

  .rsc-logos--scroll .rsc-partners__logos-track,
  .rsc-logos--scroll-mobile .rsc-partners__logos-track {
    display: flex;
    align-items: center;
    gap: 56px;
    width: max-content;
    padding-right: 56px; /* шов между копиями */
    will-change: transform;
  }

  .rsc-logos--scroll .rsc-partners__logos-track {
    animation: rsc-logos-scroll 30s linear infinite;
  }

  /* На мобильном лента включается при >4 логотипах */
  @media (max-width: 640px) {
    .rsc-logos--scroll-mobile .rsc-partners__logos-track {
      animation: rsc-logos-scroll 22s linear infinite;
    }
  }

  @keyframes rsc-logos-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); } /* ровно одна копия списка */
  }

  .rsc-partners__logo {
    max-width: 170px;
    max-height: 64px;
    object-fit: contain;
    flex-shrink: 0;
    filter: grayscale(1) brightness(1.6);
    opacity: 0.8;
    transition: opacity 0.25s ease, filter 0.25s ease;
  }

  .rsc-partners__logo:hover {
    opacity: 1;
    filter: none;
  }

  /* ---------- МОДАЛЬНОЕ ОКНО ---------- */
  .rsc-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .rsc-modal-overlay--visible {
    opacity: 1;
    visibility: visible;
  }

  .rsc-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 210;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    scrollbar-width: none; /* Firefox: полоса прокрутки скрыта */
    padding: 40px 36px 36px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0;
    visibility: hidden;
    transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
  }

  .rsc-modal--open {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    visibility: visible;
  }

  .rsc-modal::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Edge: полоса прокрутки скрыта */
  }

  .rsc-modal__close {
    position: absolute;
    top: 16px;
    right: 16px;
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
    transition: color 0.25s ease;
  }

  .rsc-modal__close:hover {
    color: #ffffff;
  }

  .rsc-modal__title {
    margin: 0 0 6px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-modal__subtitle {
    margin: 0 0 28px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #8e8e93;
  }

  .rsc-modal__form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .rsc-modal__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rsc-modal__label {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .rsc-modal__required {
    color: var(--accent, #00c3d0);
  }

  .rsc-modal__input {
    padding: 13px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.25s ease;
  }

  .rsc-modal__input::placeholder {
    color: #464646;
  }

  .rsc-modal__input:focus {
    border-color: var(--accent, #00c3d0);
  }

  .rsc-modal__input--error {
    border-color: #ff5a5a;
  }

  .rsc-modal__input--textarea {
    resize: vertical;
    min-height: 90px;
  }

  .rsc-modal__error {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #ff5a5a;
  }

  .rsc-modal__send-error {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  /* Соцсети: строки с удалением + кнопка добавления */
  .rsc-modal__social-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .rsc-modal__social-row .rsc-modal__input {
    flex: 1;
    min-width: 0;
  }

  .rsc-modal__social-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    padding: 0;
    background: rgba(255, 90, 90, 0.1);
    border: none;
    border-radius: 6px;
    color: #ff5a5a;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .rsc-modal__social-remove:hover {
    background: rgba(255, 90, 90, 0.2);
  }

  .rsc-modal__social-add {
    align-self: flex-start;
    padding: 10px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: var(--accent, #00c3d0);
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }

  .rsc-modal__social-add:hover {
    border-color: var(--accent, #00c3d0);
  }

  .rsc-modal__submit {
    margin-top: 8px;
    padding: 15px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    background: var(--accent, #00c3d0);
    color: #060606;
    border: 2px solid var(--accent, #00c3d0);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.25s ease, color 0.25s ease;
  }

  .rsc-modal__submit:hover:not(:disabled) {
    background: transparent;
    color: var(--accent, #00c3d0);
  }

  .rsc-modal__submit:disabled {
    opacity: 0.6;
  }

  .rsc-modal__success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0;
  }

  .rsc-modal__success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin-bottom: 20px;
    color: var(--accent, #00c3d0);
    border: 2px solid var(--accent, #00c3d0);
    border-radius: 50%;
  }

  .rsc-modal__success-title {
    margin: 0 0 8px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-modal__success-text {
    margin: 0 0 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #8e8e93;
  }

  @media (max-width: 900px) {
    .rsc-partners__cards {
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 64px;
    }
  }

  @media (max-width: 640px) {
    .rsc-partners {
      padding: 80px 16px 90px;
    }

    .rsc-modal {
      padding: 32px 20px 24px;
    }

    .rsc-partners__logos {
      gap: 24px;
    }
  }
`;