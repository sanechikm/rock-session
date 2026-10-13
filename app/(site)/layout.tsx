// app/(site)/layout.tsx
// Layout сайта: Header, Footer + акцентный цвет из Supabase (CSS-переменная --accent)

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const DEFAULT_ACCENT = '#00C3D0';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Читаем акцентный цвет из настроек
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', 'accent_color')
    .single();

  const accent = (data?.value as string) || DEFAULT_ACCENT;

  return (
    <>
      {/* Акцентный цвет всего сайта — задаётся в админке */}
      <style>{`:root { --accent: ${accent}; }`}</style>

      <Header />
      {children}
      <Footer />
    </>
  );
}