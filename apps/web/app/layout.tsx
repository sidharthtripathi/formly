import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formly — AI-Powered Form Builder",
  description: "Create, publish, and manage forms with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
