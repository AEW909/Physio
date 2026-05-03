import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Physio",
  description: "Clinical records platform for physiotherapy practices.",
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
