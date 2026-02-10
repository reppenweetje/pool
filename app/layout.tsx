import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pool Competitie - Jesse vs Flip",
  description: "Streak-based pool competitie tracker met power-ups",
  manifest: "/manifest.json",
  themeColor: "#0D5C2C",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pool Competitie",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
