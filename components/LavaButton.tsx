// components/LavaButton.tsx
// Покупка билета через Lava (llava.ru): вместо перехода по ссылке
// виджет Lava открывается прямо на сайте, в своём модальном окне (iframe).
// ID события берём из ticket_url афиши (если это ссылка llava.ru/e/<id>),
// иначе подставляется общий ID события клуба.

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const LAVA_DEFAULT_EVENT_ID = '37bf52f4e6b07fb8e1f0138e73fa803a';

/* ID события Lava из ссылки вида https://llava.ru/e/<id> */
export const lavaEventIdFromUrl = (url: string | null | undefined): string => {
  if (!url) return LAVA_DEFAULT_EVENT_ID;
  const match = url.match(/llava\.ru\/e\/([a-f0-9]{32})/);
  return match ? match[1] : LAVA_DEFAULT_EVENT_ID;
};

export default function LavaButton({
  ticketUrl,
  className,
  label = 'Купить билет',
}: {
  ticketUrl: string | null | undefined;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const eventId = lavaEventIdFromUrl(ticketUrl);

  /* Закрытие по Escape + блокировка скролла под виджетом */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <style>{LAVA_CSS}</style>

      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        style={{ borderRadius: 0 }} /* острые углы у кнопки */
      >
        {label}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        /* Портал в body: окно позиционируется от экрана, а не от
           трансформированного предка (модалки афиши), и точно поверх всего */
        createPortal(
          <div className="rsc-lava" role="dialog" aria-modal="true" aria-label="Покупка билета">
            <div className="rsc-lava__backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="rsc-lava__box">
              {/* Виджет Lava (официальный embed).
                  Своя кнопка закрытия не нужна — она есть в шапке
                  самого виджета; закрытие также по фону и Escape. */}
              <iframe
                src={`https://llava.ru/e/${eventId}?mode=widget`}
                allow="payment"
                className="rsc-lava__frame"
                title="Покупка билета"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const LAVA_CSS = `
  .rsc-lava {
    position: fixed;
    inset: 0;
    z-index: 400; /* поверх модалки афиши (210) и всего остального */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .rsc-lava__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .rsc-lava__box {
    position: relative;
    width: min(550px, 100%);
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    overflow: hidden;
  }

  .rsc-lava__frame {
    display: block;
    width: 100%;
    height: 500px;
    max-height: calc(100vh - 90px);
    border: 0;
  }

`;