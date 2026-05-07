import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "9th Grade Exam Prep",
  description: "Pakistan 9th Grade Board Exam Preparation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
