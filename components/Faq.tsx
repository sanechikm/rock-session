// components/Faq.tsx
// Блок «Вопросы и ответы» — аккордеон. Данные из Supabase (таблица faq,
// порядок по sort_order). Если база пуста — подставляются вопросы-заглушки.

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- Заглушка на случай пустой базы ---------- */
type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const PLACEHOLDER_FAQ: FaqItem[] = [
  {
    id: 1,
    question: 'Где проходят мероприятия?',
    answer:
      'Мы выбираем лучшие локации города. Чаще всего это ресторан «Полёт» (ул. Красноармейская, 168/99). Следите за афишей — место может меняться.',
  },
  {
    id: 2,
    question: 'Что входит в стоимость билета?',
    answer:
      'В стоимость билета входит концерт живой музыки, ужин от шеф-повара площадки и welcome-напиток. Точный состав указан на странице каждого события.',
  },
  {
    id: 3,
    question: 'Можно ли прийти со своими напитками?',
    answer:
      'Нет, приносить напитки с собой нельзя — в каждой локации работает бар с полной картой. Welcome-напиток уже включён в билет.',
  },
  {
    id: 4,
    question: 'Как формируется рассадка?',
    answer:
      'Рассадка свободная в пределах выбранной зоны, указанной на билете. Рекомендуем приходить заранее — лучшие места занимают первые гости.',
  },
  {
    id: 5,
    question: 'Есть ли дресс-код?',
    answer:
      'Да, на наших вечерах действует smart casual. Мы создаём атмосферу особенного вечера — внешний вид гостей её часть.',
  },
  {
    id: 6,
    question: 'Как вернуть билет?',
    answer:
      'Вернуть билет можно не позднее чем за 72 часа до начала мероприятия через сервис, в котором он был приобретён. Возврат средств занимает до 5 рабочих дней.',
  },
  {
    id: 7,
    question: 'Можно ли купить билет на месте?',
    answer:
      'Если остаются свободные места — да, за час до начала концерта. Но количество мест ограничено, поэтому рекомендуем покупать заранее.',
  },
  {
    id: 8,
    question: 'Как стать партнёром?',
    answer:
      'Напишите нам через форму «Стать партнёром» в разделе «Партнёры» — мы обсудим формат сотрудничества под ваши задачи.',
  },
];
/* ----------------------------------------------------- */

export default function Faq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  /* Появление блока при прокрутке */
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('faq')
        .select('id, question, answer')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      const list = data && data.length > 0 ? data : PLACEHOLDER_FAQ;
      setItems(list);
      setOpenId(list[0]?.id ?? null); /* первый вопрос открыт по умолчанию */
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
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
  }, [loading]);

  const toggle = (id: number) => {
    setOpenId((current) => (current === id ? null : id));
  };

  if (!loading && items.length === 0) return null;

  return (
    <>
      <style>{FAQ_CSS}</style>

      <section
        className={'rsc-faq' + (inView ? ' rsc-faq--in' : '')}
        id="faq"
        ref={sectionRef}
      >
        <div className="rsc-faq__inner">
          <h2 className="rsc-faq__heading">Вопросы и ответы</h2>
          <p className="rsc-faq__subheading">Всё, что важно знать о клубе</p>

          <div className="rsc-faq__list">
            {items.map((item, index) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={'rsc-faq__item' + (isOpen ? ' rsc-faq__item--open' : '')}
                  style={{ transitionDelay: inView ? `${0.2 + index * 0.06}s` : '0s' }}
                >
                  <button
                    className="rsc-faq__question"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="rsc-faq__question-text">{item.question}</span>
                    <span className="rsc-faq__chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className="rsc-faq__answer"
                    id={`faq-answer-${item.id}`}
                    role="region"
                  >
                    <div className="rsc-faq__answer-inner">
                      <p className="rsc-faq__answer-text">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

const FAQ_CSS = `
  .rsc-faq {
    background: #060606;
    padding: 110px 24px 120px;
    overflow-x: clip;
  }

  .rsc-faq__inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* ---------- Появление ---------- */
  .rsc-faq__heading,
  .rsc-faq__subheading,
  .rsc-faq__item {
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  .rsc-faq:not(.rsc-faq--in) .rsc-faq__heading,
  .rsc-faq:not(.rsc-faq--in) .rsc-faq__subheading,
  .rsc-faq:not(.rsc-faq--in) .rsc-faq__item {
    opacity: 0;
    transform: translateY(24px);
  }

  .rsc-faq--in .rsc-faq__heading { transition-delay: 0s; }
  .rsc-faq--in .rsc-faq__subheading { transition-delay: 0.1s; }

  .rsc-faq__heading {
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

  .rsc-faq__subheading {
    margin: 0 0 64px;
    text-align: center;
    font-family: var(--font-bicubik), 'Poppins', sans-serif;
    font-size: clamp(17px, 2.2vw, 24px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #00c3d0);
  }

  .rsc-faq__list {
    display: flex;
    flex-direction: column;
  }

  .rsc-faq__item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .rsc-faq__item:first-child {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .rsc-faq__question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    width: 100%;
    padding: 26px 4px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: padding-left 0.25s ease;
  }

  .rsc-faq__question:hover,
  .rsc-faq__item--open .rsc-faq__question {
    padding-left: 12px;
  }

  .rsc-faq__question-text {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(17px, 2vw, 22px);
    font-weight: 600;
    line-height: 1.35;
    color: #ffffff;
    transition: color 0.25s ease;
  }

  .rsc-faq__question:hover .rsc-faq__question-text,
  .rsc-faq__item--open .rsc-faq__question-text {
    color: var(--accent, #00c3d0);
  }

  .rsc-faq__chevron {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8e8e93;
    transition: transform 0.35s ease, color 0.25s ease;
  }

  .rsc-faq__item--open .rsc-faq__chevron {
    transform: rotate(180deg);
    color: var(--accent, #00c3d0);
  }

  /* Ответ: плавное раскрытие через grid */
  .rsc-faq__answer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s ease;
  }

  .rsc-faq__item--open .rsc-faq__answer {
    grid-template-rows: 1fr;
  }

  .rsc-faq__answer-inner {
    overflow: hidden;
    min-height: 0;
  }

  .rsc-faq__answer-text {
    margin: 0;
    padding: 0 4px 28px 12px;
    max-width: 860px;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(14px, 1.8vw, 17px);
    font-weight: 300;
    line-height: 1.75;
    color: #8e8e93;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s;
  }

  .rsc-faq__item--open .rsc-faq__answer-text {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    .rsc-faq {
      padding: 80px 16px 90px;
    }

    .rsc-faq__question {
      padding: 20px 2px;
    }

    .rsc-faq__question:hover,
    .rsc-faq__item--open .rsc-faq__question {
      padding-left: 6px;
    }

    .rsc-faq__answer-text {
      padding: 0 2px 22px 6px;
    }
  }
`;