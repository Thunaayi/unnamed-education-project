import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";

const fraunces = Fraunces({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Study Smarter",
  description: "A well-kept notebook for board exam preparation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
