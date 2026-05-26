import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ParticleBackground from "@/components/ParticleBackground";
import Link from "next/link";
import { Trophy, HelpCircle, Swords, Play } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AkiCricket AI – The Ultimate IPL Mind Reader",
  description:
    "Think of an IPL player, team, stadium, or legendary moment. AkiCricket AI will guess it within 15 Yes/No questions! Featuring dynamic AI personalities, voice modes, and dual-agent Battle mode.",
  keywords: [
    "IPL Guessing Game",
    "Akinator Cricket",
    "Cricket AI",
    "MS Dhoni",
    "Virat Kohli",
    "Google Gemini API",
    "Next.js Cricket Game",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f0f9ff] text-slate-800 overflow-x-hidden selection:bg-sky-200 selection:text-slate-800">
        {/* Global Particles */}
        <ParticleBackground />

        {/* Global Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-white/45 bg-white/45 backdrop-blur-md px-4 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.02)] animate-float">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-slate-800 to-amber-600">
                AKICRICKET AI
              </span>
              <span className="text-[9px] font-mono text-sky-600 tracking-widest uppercase font-bold">
                The IPL Mind Reader
              </span>
            </Link>

            <nav className="flex items-center gap-3 text-xs md:text-sm font-semibold font-mono">
              <Link
                href="/game"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-100 bg-sky-50/50 text-sky-600 hover:bg-sky-100/70 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Play</span>
              </Link>
              <Link
                href="/battle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100/70 transition"
              >
                <Swords className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Battle</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-100 bg-amber-50/50 text-amber-700 hover:bg-amber-100/70 transition"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 md:p-6 z-10">
          {children}
        </main>

        {/* Cyber Footer */}
        <footer className="w-full text-center py-6 border-t border-white/40 bg-white/20 mt-12 text-xs text-slate-500 font-mono">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© 2026 AkiCricket AI. Built for Google AI Hackathon.</p>
            <p className="flex items-center gap-1">
              Powered by <span className="text-sky-600">Gemini 2.5 Flash</span> +{" "}
              <span className="text-violet-600">Firebase</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
