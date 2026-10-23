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
    // MAX — мессенджер, официальная иконка из public/max.svg (цвет — currentColor,
    // поэтому при наведении меняется на акцентный так же, как у Telegram/Instagram)
    <svg viewBox="0 0 720 720" width="30" height="30" fill="currentColor" aria-hidden="true">
      <path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/>
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
    padding: 120px 24px 120px;
  }

  /* Каскадное появление при загрузке */
  .rsc-contacts__heading,
  .rsc-contacts__subheading,
  .rsc-contacts__phone-block,
  .rsc-contacts__socials {
    animation: rsc-contacts-rise 0.7s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  }

  .rsc-contacts__heading      { animation-delay: 0.05s; }
  .rsc-contacts__subheading   { animation-delay: 0.15s; }
  .rsc-contacts__phone-block  { animation-delay: 0.3s; }
  .rsc-contacts__socials      { animation-delay: 0.45s; }

  @keyframes rsc-contacts-rise {
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rsc-contacts__inner {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .rsc-contacts__heading {
    margin: 0 0 10px;
    font-family: var(--font-tablon), 'Arial', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    line-height: 1;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffffff;
  }

  .rsc-contacts__subheading {
    margin: 0 0 64px;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
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
    color: var(--accent, #00c3d0);
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
    color: var(--accent, #00c3d0);
    transition: transform 0.25s ease, color 0.25s ease;
  }

  .rsc-contacts__social:hover {
    transform: translateY(-4px) scale(1.08);
    color: #ffffff;
  }

  /* ---------- Мобилка ---------- */
  @media (max-width: 640px) {
    .rsc-contacts {
      padding: 80px 16px 80px;
    }

    .rsc-contacts__socials {
      gap: 24px;
    }
  }
`;