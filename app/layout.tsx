import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";


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
  title: "Encantiva Pro — Plataforma para Decoradoras e Buffeteiras",
  description: "Organize sua empresa de festas com catálogo, contratos, financeiro e muito mais. Teste grátis por 7 dias.",
  icons: {
    icon: "/enc_favicon.png",
    apple: "/enc_favicon.png",
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