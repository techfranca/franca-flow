import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Franca Flow - Upload de Materiais",
  description: "Sistema de upload de materiais para clientes Franca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
