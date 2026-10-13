// app/(site)/page.tsx
// Главная страница: блоки рендерятся в порядке из админки,
// выключенные блоки не показываются.

import Hero from '@/components/Hero';
import About from '@/components/About';
import Posters from '@/components/Posters';
import PastEvents from '@/components/PastEvents';
import Partners from '@/components/Partners';
import News from '@/components/News';
import Gallery from '@/components/Gallery';
import Videos from '@/components/Videos';
import Faq from '@/components/Faq';
import Contacts from '@/components/Contacts';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Дефолтный порядок блоков (если в базе пусто)
const DEFAULT_BLOCKS = [
  { id: 'about', title: 'О нас', visible: true },
  { id: 'posters', title: 'Афиши', visible: true },
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
  posters: (
    <>
      <Posters />
      <PastEvents />
    </>
  ),
  partners: <Partners />,
  news: <News />,
  gallery: <Gallery />,
  videos: <Videos />,
  faq: <Faq />,
  contacts: <Contacts />,
};

export default async function Home() {
  // Порядок и видимость блоков из админки
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'landing_blocks')
    .single();

  const blocks = (data?.value as typeof DEFAULT_BLOCKS) || DEFAULT_BLOCKS;

  return (
    <main>
      {/* Hero всегда первым — это обложка сайта, в админке не управляется */}
      <Hero />

      {/* Остальные блоки — в порядке из админки, только видимые */}
      {blocks
        .filter((b) => b.visible)
        .map((b) => (
          <div key={b.id}>{BLOCK_COMPONENTS[b.id]}</div>
        ))}

      {/* FAQ не входит в список управляемых блоков — показываем всегда */}
    </main>
  );
}