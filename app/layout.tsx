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

const belepotan = localFont({
  src: '../public/fonts/Belepotan Rus.otf',
  variable: '--font-belepotan',
  weight: '400',
});

/* Poppins с Google Fonts */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'RockSession Club',
  description: 'Закрытый клуб живой музыки в Ростове-на-Дону',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${tablon.variable} ${belepotan.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
