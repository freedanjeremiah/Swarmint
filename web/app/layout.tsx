import type { Metadata } from "next";
import "./globals.css";
import { Press_Start_2P } from "next/font/google";
import { Providers } from "@/lib/provider";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Swarm dApp",
  description: "Multi-agent swarm builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${pixelFont.variable} font-pixel antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
