import type { Metadata } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KIO-X Human Performance | Elite Training",
  description: "Ultra-premium sports performance and physiotherapy brand.",
  manifest: "/manifest.json",
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import { TimezoneProvider } from "@/components/providers/TimezoneProvider";
import PWAInstallButton from "@/components/PWAInstallButton";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var stored = localStorage.getItem('kio-x-theme');
              var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? 'dark' : 'light';
              var theme = stored || preferred || 'dark';
              document.documentElement.classList.remove('dark', 'light');
              document.documentElement.classList.add(theme);
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-green)] selection:text-[var(--text-on-green)] font-sans relative overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <TimezoneProvider>
              <NotificationProvider>
                <Loader />
                <div className="bg-texture fixed inset-0 pointer-events-none z-50"></div>
                <Navbar />
                <main className="flex-1 w-full relative z-10">{children}</main>
                <Footer />
                <PWAInstallButton />
              </NotificationProvider>
            </TimezoneProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
