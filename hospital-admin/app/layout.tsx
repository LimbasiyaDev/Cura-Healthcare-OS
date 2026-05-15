import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cura — Clinical Management",
  description: "Hospital Admin Dashboard",
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}