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
  inn: '6162034117',
  ogrnip: '1026103056430',
  kpp: '616801001',
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
    <svg viewBox="0 0 720 720" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/>
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
            <span>КПП: {REQUISITES.kpp}</span>
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
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
    text-decoration: none;
    transition: color 0.25s ease;
  }

  .rsc-footer__link:hover {
    color: var(--accent, #00c3d0);
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
    color: var(--accent, #00c3d0);
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
    font-family: 'Poppins', sans-serif;
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
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #8e8e93;
  }

  /* Копирайт */
  .rsc-footer__copy {
    margin: 0;
    font-family: 'Poppins', sans-serif;
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