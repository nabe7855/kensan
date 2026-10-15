import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "研鑽 KENSAN",
  description: "最後まで、研ぎ切る。",
  applicationName: "研鑽",
  appleWebApp: { capable: true, title: "研鑽", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png", icon: "/icons/icon-192.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${barlow.variable} ${notoSansJP.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
