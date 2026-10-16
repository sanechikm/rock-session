import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

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

// const poppins = localFont({
//   src: '../public/fonts/PoppinsCyr-Bold.otf',
//   variable: '--font-poppins',
//   weight: '300',
// });

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
