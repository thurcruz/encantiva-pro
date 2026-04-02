import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Encantiva Pro — Plataforma para Decoradoras de Festas",
    template: "%s | Encantiva Pro",
  },
  description:
    "Encantiva Pro é a plataforma completa para decoradoras e buffeteiras. Gerencie contratos, catálogo, agenda, financeiro e muito mais em um só lugar.",
  keywords: [
    "Encantiva Pro",
    "plataforma para decoradoras",
    "software para festa na mesa",
    "gestão de mini festas",
    "contratos para decoradoras",
    "precificação de festa na mesa",
    "catálogo de festas",
    "decoração de festas",
    "sistema para pegue e monte",
    "sistema locação de mini festas na mesa",
  ],
  authors: [{ name: "Encantiva Pro", url: "https://encantivapro.com.br" }],
  creator: "Encantiva Pro",
  publisher: "Encantiva Pro",
  metadataBase: new URL("https://encantivapro.com.br"),
  alternates: {
    canonical: "https://encantivapro.com.br",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://encantivapro.com.br",
    siteName: "Encantiva Pro",
    title: "Encantiva Pro — Plataforma para Decoradoras de Festas",
    description:
      "A plataforma completa para gestão de Festa na Mesa e pegue e Monte. Contratos, catálogo, agenda, financeiro e cortador de painéis em um só lugar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Encantiva Pro — Plataforma para Decoradoras de Festas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Encantiva Pro — Plataforma para Decoradoras de Festas",
    description:
      "A plataforma completa para gestão de Festa na Mesa e pegue e Monte. Contratos, catálogo, agenda e muito mais.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/enc_pro_avatar.png",
    apple: "/enc_pro_avatar.png",
    shortcut: "/enc_pro_avatar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}