import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "BotCompute — Rent compute. Provide compute. Earn on-chain.",
  description:
    "Decentralized compute marketplace and trustless escrow protocol on Botchain Testnet (Chain ID 968). Rent CPU/GPU compute, provide compute, and earn native BOT.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="cyber-background flex flex-col min-h-screen text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppProviders>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
