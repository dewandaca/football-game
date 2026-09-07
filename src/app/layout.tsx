import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Football AI Games — Family 100 & Draft Auction',
  description:
    'Platform mini-game sepak bola interaktif berbasis AI. Mainkan Family 100 trivia atau 1v1 Draft Auction 4-3-3 dengan AI Groq.',
  keywords: ['football', 'sepak bola', 'game', 'AI', 'family 100', 'draft auction', 'trivia'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${jakarta.variable} font-sans bg-slate-950 text-white antialiased selection:bg-emerald-500/30 selection:text-emerald-300`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
