import type { Metadata } from "next";
import { Inter, Oswald, Anton, Plus_Jakarta_Sans, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KIO-X Human Performance | Elite Training",
  description: "Ultra-premium sports performance and physiotherapy brand.",
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} ${anton.variable} ${plusJakarta.variable} ${orbitron.variable} ${rajdhani.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white selection:bg-[#00ff41] selection:text-black font-sans relative">
        <AuthProvider>
          <NotificationProvider>
            <Loader />
            <div className="bg-texture fixed inset-0 pointer-events-none z-50"></div>
            <Navbar />
            <main className="flex-1 w-full relative z-10">{children}</main>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
