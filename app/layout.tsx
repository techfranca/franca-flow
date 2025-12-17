import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Franca Flow - Upload de Materiais",
  description: "Sistema de upload de materiais para clientes Franca",
};

// 🔥 CONFIGURAÇÃO CRÍTICA DO VIEWPORT (corrige zoom/pinça)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

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
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}