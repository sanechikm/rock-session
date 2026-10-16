import type { Metadata } from "next";
import "./globals.css";
import localFont from 'next/font/local';

/* Локальные шрифты проекта */
const tablon = localFont({
  src: '../public/fonts/Tablon-Black.ttf',
  variable: '--font-tablon',
  weight: '600',
});

const bicubik = localFont({
  src: '../public/fonts/Bicubik.otf',
  variable: '--font-bicubik',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'RockSession Club',
  description: 'Закрытый клуб живой музыки в Ростове-на-Дону',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${tablon.variable} ${bicubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
