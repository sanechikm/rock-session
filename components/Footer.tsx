// components/Footer.tsx
// Подвал лендинга RockSession Club.
// Логотип, навигация, соцсети, юридические ссылки, реквизиты, копирайт.

import Image from 'next/image';
import Link from 'next/link';
import AnchorLink from './AnchorLink';

/* ---------- ДАННЫЕ (позже частично — из админки) ---------- */
const NAV = [
  { label: 'Афиши', href: '#posters' },
  { label: 'О клубе', href: '#about' },
  { label: 'Партнёры', href: '#partners' },
  { label: 'Новости', href: '#news' },
  { label: 'Галерея', href: '#gallery' },
  { label: 'Контакты', href: '#contacts' },
];

const SOCIALS = [
  { id: 'telegram', name: 'Telegram', url: 'https://t.me/' },      // TODO: ссылка клуба
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/' }, // TODO
  { id: 'max', name: 'MAX', url: 'https://max.ru/' },               // TODO
];

// Юридические документы — страницы появятся позже
const LEGAL = [
  { label: 'Политика конфиденциальности', href: '/privacy' },
  { label: 'Политика обработки персональных данных', href: '/personal-data' },
];

const REQUISITES = {
  inn: '614103375516',
  ogrnip: '319619600034368',
};
/* ---------------------------------------------------------- */

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  telegram: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.6 18.8 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6L18 6.9c.4-.3-.1-.5-.6-.2L7.2 13.2l-4.4-1.4c-1-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.3 1z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  max: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
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

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{FOOTER_CSS}</style>

      <footer className="rsc-footer">
        <div className="rsc-footer__inner">
          {/* Логотип */}
          <Link href="/" className="rsc-footer__logo" aria-label="RockSession Club — на главную">
            <Image
              src="/logo.png"
              alt="RockSession Club"
              width={64}
              height={64}
            />
          </Link>

          {/* Навигация */}
          <nav className="rsc-footer__nav" aria-label="Навигация в подвале">
            {NAV.map((item) => (
              <AnchorLink key={item.href} href={item.href} className="rsc-footer__link">
                {item.label}
              </AnchorLink>
            ))}
          </nav>

          {/* Соцсети — белые иконки */}
          <div className="rsc-footer__socials">
            {SOCIALS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                className="rsc-footer__social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
              >
                {SOCIAL_ICONS[social.id]}
              </a>
            ))}
          </div>

          {/* Юридические ссылки */}
          <div className="rsc-footer__legal">
            {LEGAL.map((doc) => (
              <Link key={doc.href} href={doc.href} className="rsc-footer__legal-link">
                {doc.label}
              </Link>
            ))}
          </div>

          {/* Реквизиты */}
          <div className="rsc-footer__requisites">
            <span>ИНН: {REQUISITES.inn}</span>
            <span>ОГРНИП: {REQUISITES.ogrnip}</span>
          </div>

          {/* Копирайт */}
          <p className="rsc-footer__copy">
            © {year} RockSession Club. Все права защищены.
          </p>
        </div>
      </footer>
    </>
  );
}

/* Стили в константе — проверенный подход */
const FOOTER_CSS = `
  .rsc-footer {
    background: #060606;
    // border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 64px 24px 48px;
  }

  .rsc-footer__inner {
    max-width: 1180px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* Логотип */
  .rsc-footer__logo {
    display: flex;
    line-height: 0;
    margin-bottom: 40px;
    transition: opacity 0.25s ease;
  }

  .rsc-footer__logo:hover {
    opacity: 0.8;
  }

  /* Навигация */
  .rsc-footer__nav {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px 48px;
    margin-bottom: 40px;
  }

  .rsc-footer__link {
    font-family: var(--font-poppins), sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
    text-decoration: none;
    transition: color 0.25s ease;
  }

  .rsc-footer__link:hover {
    color: #00c3d0;
  }

  /* Соцсети — белые */
  .rsc-footer__socials {
    display: flex;
    gap: 32px;
    margin-bottom: 44px;
  }

  .rsc-footer__social {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    transition: transform 0.25s ease, color 0.25s ease;
  }

  .rsc-footer__social:hover {
    transform: translateY(-3px);
    color: #00c3d0;
  }

  /* Юридические ссылки */
  .rsc-footer__legal {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px 32px;
    margin-bottom: 28px;
  }

  .rsc-footer__legal-link {
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #8e8e93;
    text-decoration: none;
    transition: color 0.25s ease;
  }

  .rsc-footer__legal-link:hover {
    color: #ffffff;
  }

  /* Реквизиты */
  .rsc-footer__requisites {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 32px;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #8e8e93;
  }

  /* Копирайт */
  .rsc-footer__copy {
    margin: 0;
    font-family: var(--font-poppins), sans-serif;
    font-size: 14px;
    color: #464646;
  }

  /* ---------- Мобилка ---------- */
  @media (max-width: 640px) {
    .rsc-footer {
      padding: 48px 16px 36px;
    }

    .rsc-footer__nav {
      gap: 12px 24px;
      margin-bottom: 32px;
    }

    .rsc-footer__socials {
      gap: 24px;
      margin-bottom: 36px;
    }
  }
`;