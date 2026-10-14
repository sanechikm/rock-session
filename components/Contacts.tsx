// components/Contacts.tsx
// Блок «Контакты» — телефон и иконки соцсетей.
// ЗАГЛУШКА: ссылки-заглушки в CONTACTS, позже — редактирование через админку.

/* ---------- ДАННЫЕ (позже — из Supabase) ---------- */
const CONTACTS = {
  phone: '8 928 296-21-28',
  phoneHref: 'tel:+79282962128',
  socials: [
    {
      id: 'telegram',
      name: 'Telegram',
      url: 'https://t.me/', // TODO: вставить ссылку на канал/чат клуба
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://instagram.com/', // TODO: вставить ссылку
    },
    {
      id: 'max',
      name: 'MAX',
      url: 'https://max.ru/', // TODO: вставить ссылку
    },
  ],
};
/* --------------------------------------------------- */

// Иконки соцсетей — inline SVG, без внешних библиотек
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  telegram: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.6 18.8 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6L18 6.9c.4-.3-.1-.5-.6-.2L7.2 13.2l-4.4-1.4c-1-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.3 1z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  max: (
    // MAX — мессенджер (иконка-заглушка в виде круга с буквой)
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path
        d="M7.5 9.5 12 14l4.5-4.5M7.5 13.5 12 18l4.5-4.5"
        fill="none"
        stroke="#060606"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function Contacts() {
  return (
    <>
      <style>{CONTACTS_CSS}</style>

      <section className="rsc-contacts" id="contacts">
        <div className="rsc-contacts__inner">
          {/* Заголовки блока */}
          <h2 className="rsc-contacts__heading">Контакты</h2>
          <p className="rsc-contacts__subheading">Свяжитесь с нами</p>

          {/* Телефон */}
          <div className="rsc-contacts__phone-block">
            <span className="rsc-contacts__phone-label">Телефон:</span>
            <a href={CONTACTS.phoneHref} className="rsc-contacts__phone">
              {CONTACTS.phone}
            </a>
          </div>

          {/* Соцсети */}
          <div className="rsc-contacts__socials">
            {CONTACTS.socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                className="rsc-contacts__social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
              >
                {SOCIAL_ICONS[social.id]}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* Стили в константе — проверенный подход */
const CONTACTS_CSS = `
  .rsc-contacts {
    background: #060606;
    padding: 110px 24px 80px;
  }

  .rsc-contacts__inner {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .rsc-contacts__heading {
    margin: 0 0 10px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-contacts__subheading {
    margin: 0 0 64px;
    font-family: 'Belepotan', 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
  }

  /* Телефон */
  .rsc-contacts__phone-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 48px;
  }

  .rsc-contacts__phone-label {
    font-family: 'Poppins', sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #ffffff;
  }

  .rsc-contacts__phone {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(20px, 2.6vw, 26px);
    font-weight: 500;
    color: #ffffff;
    text-decoration: none;
    transition: color 0.25s ease;
  }

  .rsc-contacts__phone:hover {
    color: var(--accent);
  }

  /* Соцсети */
  .rsc-contacts__socials {
    display: flex;
    justify-content: center;
    gap: 36px;
  }

  .rsc-contacts__social {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    color: var(--accent);
    transition: transform 0.25s ease, color 0.25s ease;
  }

  .rsc-contacts__social:hover {
    transform: translateY(-4px) scale(1.08);
    color: #ffffff;
  }

  /* ---------- Мобилка ---------- */
  @media (max-width: 640px) {
    .rsc-contacts {
      padding: 80px 16px 100px;
    }

    .rsc-contacts__socials {
      gap: 24px;
    }
  }
`;