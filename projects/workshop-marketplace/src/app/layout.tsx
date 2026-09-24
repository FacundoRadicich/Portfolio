import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OH My Chalk! — Marketplace de Talleres",
    template: "%s | OH My Chalk!",
  },
  description:
    "Encontrá talleres de pintura tiza cerca tuyo. Aprendé con las mejores profesoras de OH My Chalk! en Argentina.",
  keywords: ["pintura tiza", "talleres", "chalk paint", "OH My Chalk", "muebles"],
  openGraph: {
    siteName: "OH My Chalk!",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${lato.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
