import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QS Pulse",
  description: "Portal do Colaborador",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface-1 text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
