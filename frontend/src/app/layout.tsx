import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eduvera — Institutional School Management System",
  description: "Next-gen school management portal, SIS, and academic governance system",
  icons: {
    icon: "/images/eduvera-icon-square.png",
    shortcut: "/images/eduvera-icon-square.png",
    apple: "/images/eduvera-icon-square.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const themeInitScript = `
    (function() {
      try {
        var tId = localStorage.getItem('eduvera_theme') || 'word-blue';
        var palettes = {
          'word-blue': { primary: '#2563eb', hover: '#1d4ed8', dark: '#1e40af', light: '#eff6ff', border: '#bfdbfe' },
          'excel-green': { primary: '#059669', hover: '#047857', dark: '#065f46', light: '#ecfdf5', border: '#a7f3d0' },
          'powerpoint-crimson': { primary: '#e11d48', hover: '#be123c', dark: '#9f1239', light: '#fff1f2', border: '#fecdd3' },
          'onenote-purple': { primary: '#7c3aed', hover: '#6d28d9', dark: '#5b21b6', light: '#f5f3ff', border: '#ddd6fe' },
          'outlook-cyan': { primary: '#0891b2', hover: '#0e7490', dark: '#155e75', light: '#ecfeff', border: '#a5f3fc' },
          'teams-indigo': { primary: '#4f46e5', hover: '#4338ca', dark: '#3730a3', light: '#eef2ff', border: '#c7d2fe' }
        };
        var p = palettes[tId] || palettes['word-blue'];
        var s = document.createElement('style');
        s.id = 'eduvera-dynamic-theme-css';
        s.textContent = ':root { --theme-primary:' + p.primary + '; --theme-primary-hover:' + p.hover + '; --theme-primary-dark:' + p.dark + '; --theme-primary-light:' + p.light + '; --theme-primary-border:' + p.border + '; } ' +
          '.bg-blue-600, .bg-blue-500, .bg-theme-primary { background-color:' + p.primary + ' !important; } ' +
          '.hover\\\\:bg-blue-700:hover, .hover\\\\:bg-blue-600:hover { background-color:' + p.hover + ' !important; } ' +
          '.text-blue-600, .text-blue-500, .text-blue-400 { color:' + p.primary + ' !important; } ' +
          '.text-blue-700, .text-blue-800 { color:' + p.dark + ' !important; } ' +
          '.bg-blue-50, .bg-blue-500\\\\/20, .bg-blue-600\\\\/10 { background-color:' + p.light + ' !important; } ' +
          '.border-blue-200, .border-blue-300, .border-blue-500\\\\/30 { border-color:' + p.border + ' !important; }';
        document.head.appendChild(s);
      } catch(e) {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
