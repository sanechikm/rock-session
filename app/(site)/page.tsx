// app/(site)/page.tsx
// Главная страница: Hero → бегущая строка → блоки из админки
// (между блоками — «рваные» разделители) → FAQ.

export const dynamic = 'force-dynamic';

import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Posters from '@/components/Posters';
import PastEvents from '@/components/PastEvents';
import Partners from '@/components/Partners';
import News from '@/components/News';
import Gallery from '@/components/Gallery';
import Videos from '@/components/Videos';
import Faq from '@/components/Faq';
import Contacts from '@/components/Contacts';
import JaggedDivider from '@/components/JaggedDivider';
import { supabase } from '@/lib/supabase';

// Дефолтный порядок блоков (если в базе пусто)
const DEFAULT_BLOCKS = [
  { id: 'about', title: 'О нас', visible: true },
  { id: 'posters', title: 'Афиши', visible: true },
  { id: 'past', title: 'Отыграли', visible: true },
  { id: 'partners', title: 'Партнёры', visible: true },
  { id: 'news', title: 'Новости', visible: true },
  { id: 'gallery', title: 'Галерея', visible: true },
  { id: 'videos', title: 'Видео', visible: true },
  { id: 'faq', title: 'FAQ', visible: true },
  { id: 'contacts', title: 'Контакты', visible: true },
];

// Соответствие id блока → компонент
const BLOCK_COMPONENTS: Record<string, React.ReactNode> = {
  about: <About />,
  posters: <Posters />,
  past: <PastEvents />,
  partners: <Partners />,
  news: <News />,
  gallery: <Gallery />,
  videos: <Videos />,
  faq: <Faq />,
  contacts: <Contacts />,
};

export default function Home() {
  return (
    <main>
      {/* Hero всегда первым — это обложка сайта, в админке не управляется */}
      <Hero />

      {/* Бегущая строка после Hero */}
      <Marquee />

      {/* Остальные блоки — в порядке из админки, только видимые */}
      <Blocks />

      {/* Разделитель после последнего блока (Контакты) перед FAQ */}
      <JaggedDivider index={7} />

    </main>
  );
}

/* Слияние сохранённых блоков с дефолтами:
   порядок и видимость из базы сохраняются, а новые блоки
   (например, «Отыграли») подставляются после своего «соседа»
   даже если настройки были сохранены до их появления. */
function mergeBlocks(
  defaults: typeof DEFAULT_BLOCKS,
  saved: typeof DEFAULT_BLOCKS | null
): typeof DEFAULT_BLOCKS {
  if (!saved) return defaults;

  // известные блоки — в сохранённом порядке
  const result = saved.filter((b) => defaults.some((d) => d.id === b.id));

  // недостающие дефолтные — вставляем после предыдущего блока из дефолтов
  for (const d of defaults) {
    if (result.some((b) => b.id === d.id)) continue;
    const prev = defaults[defaults.indexOf(d) - 1];
    const prevIndex = prev ? result.findIndex((b) => b.id === prev.id) : -1;
    if (prevIndex >= 0) result.splice(prevIndex + 1, 0, d);
    else result.push(d);
  }

  return result;
}

/* Блоки с «рваными» разделителями между ними */
async function Blocks() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'landing_blocks')
    .single();

  const saved = data?.value as typeof DEFAULT_BLOCKS | null;
  const blocks = mergeBlocks(DEFAULT_BLOCKS, saved);
  const visibleBlocks = blocks.filter((b) => b.visible);

  return (
    <>
      {visibleBlocks.map((b, i) => (
        <div key={b.id}>
          {/* Разделитель перед каждым блоком, кроме первого */}
          {i > 0 && <JaggedDivider index={i - 1} />}
          {BLOCK_COMPONENTS[b.id]}
        </div>
      ))}
    </>
  );
}