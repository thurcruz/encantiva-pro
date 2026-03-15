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

export const metadata = {
  title: 'Encantiva Pro',
  description: 'Plataforma para decoradoras de festas an mesa e pegue e monte',
  icons: {
    icon: '/enc_pro_avatar.png',        // ← favicon
    apple: '/enc_pro_avatar.png',       // ← ícone no iPhone
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