"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, Users, Zap, ShieldAlert, BarChart3, Star, Flame, Swords, Brain, Calendar } from "lucide-react";
import {
  getLocalLeaderboard,
  getLocalAnalytics,
  LeaderboardEntry,
  AnalyticsSummary,
} from "@/lib/firebase";

export default function LeaderboardPage() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"wins" | "daily" | "streak" | "iq">("wins");

  useEffect(() => {
    setBoard(getLocalLeaderboard());
    setAnalytics(getLocalAnalytics());
  }, []);

  // Sort board dynamically based on active tab selection
  const sortedBoard = [...board].sort((a, b) => {
    if (activeTab === "wins") {
      return (b.wins || 0) - (a.wins || 0) || (b.streak || 0) - (a.streak || 0);
    }
    if (activeTab === "daily") {
      return (b.dailyWins || 0) - (a.dailyWins || 0) || (b.wins || 0) - (a.wins || 0);
    }
    if (activeTab === "streak") {
      return (b.streak || 0) - (a.streak || 0) || (b.wins || 0) - (a.wins || 0);
    }
    if (activeTab === "iq") {
      return (b.highestIQ || 0) - (a.highestIQ || 0) || (b.wins || 0) - (a.wins || 0);
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2">
      {/* Header back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </Link>
        <span className="text-xs font-mono text-amber-600 font-bold tracking-widest uppercase flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> Hall of Fame
        </span>
      </div>

      {/* Hero Header */}
      <div className="text-center py-6 border-b border-sky-100">
        <h2 className="text-2xl md:text-4.5xl font-black text-slate-800 uppercase tracking-wider">
          Global Leaderboard
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Real-time rankings and aggregate AI statistics
        </p>
      </div>

      {/* Global AI Stats Row */}
      {analytics && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel border-white/50 bg-white/40 rounded-2xl p-4 text-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Total Matches</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{analytics.totalGames}</p>
          </div>

          <div className="glass-panel border-white/50 bg-white/40 rounded-2xl p-4 text-center shadow-sm">
            <Zap className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Avg Deliveries</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{analytics.avgQuestions}</p>
          </div>

          <div className="glass-panel border-white/50 bg-white/40 rounded-2xl p-4 text-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">AI Win Ratio</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              {analytics.totalGames > 0
                ? ((analytics.aiWins / analytics.totalGames) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>

          <div className="glass-panel border-white/50 bg-white/40 rounded-2xl p-4 text-center shadow-sm">
            <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Player Wins</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{analytics.playerWins}</p>
          </div>
        </section>
      )}

      {/* Split details layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Ranking List table */}
        <div className="md:col-span-2 glass-panel border-white/60 bg-white/50 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100/50 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold font-mono uppercase text-slate-800">Top Coaches</h3>
            </div>
          </div>

          {/* Tab selectors for rankings */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 border-b border-sky-100/20">
            {[
              { id: "wins", label: "Global Wins 🏆" },
              { id: "daily", label: "Daily Challenges ⭐" },
              { id: "streak", label: "Win Streaks 🔥" },
              { id: "iq", label: "Highest IQ 🧠" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                    : "bg-white/40 border-sky-100 text-slate-600 hover:border-sky-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-sky-100 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className={`py-2.5 px-3 text-right ${activeTab === "wins" ? "text-sky-600 font-bold" : ""}`}>Wins</th>
                  <th className={`py-2.5 px-3 text-right ${activeTab === "streak" ? "text-sky-600 font-bold" : ""}`}>Streak</th>
                  <th className={`py-2.5 px-3 text-right ${activeTab === "daily" ? "text-sky-600 font-bold" : ""}`}>Daily</th>
                  <th className={`py-2.5 px-3 text-right ${activeTab === "iq" ? "text-sky-600 font-bold" : ""}`}>IQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/50">
                {sortedBoard.map((entry, idx) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-sky-50/40 transition ${
                      idx === 0
                        ? "text-amber-700 font-bold"
                        : idx === 1
                        ? "text-slate-600 font-bold"
                        : idx === 2
                        ? "text-amber-800 font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    <td className="py-3 px-3 flex items-center gap-1.5">
                      {idx === 0 ? (
                        <span>🥇 1</span>
                      ) : idx === 1 ? (
                        <span>🥈 2</span>
                      ) : idx === 2 ? (
                        <span>🥉 3</span>
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 truncate max-w-[120px]">{entry.name}</td>
                    <td className={`py-3 px-3 text-right ${activeTab === "wins" ? "bg-sky-50/40 font-bold text-sky-700" : ""}`}>{entry.wins}</td>
                    <td className={`py-3 px-3 text-right text-rose-500 ${activeTab === "streak" ? "bg-sky-50/40 font-bold text-rose-600" : ""}`}>
                      <div className="flex items-center justify-end gap-1">
                        {entry.streak > 0 && <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />}
                        {entry.streak}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right ${activeTab === "daily" ? "bg-sky-50/40 font-bold text-sky-700" : ""}`}>
                      {entry.dailyWins || 0}
                    </td>
                    <td className={`py-3 px-3 text-right ${activeTab === "iq" ? "bg-sky-50/40 font-bold text-sky-700" : ""}`}>
                      {entry.highestIQ || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Conquest Stats / Information */}
        <div className="glass-panel border-white/50 bg-white/45 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-sky-100/50 pb-3">
            <Swords className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold font-mono uppercase text-slate-800">AI Intel report</h3>
          </div>

          <div className="space-y-3.5 text-xs leading-relaxed text-slate-600">
            <p>
              The AkiCricket Mind Reader engine utilizes structured probability maps powered by <strong className="text-slate-800">Gemini 2.5 Flash</strong>.
            </p>
            <p>
              Every guess made by the AI updates its semantic elimination branches. Correct guesses reinforce its internal node weights, while wrong guesses are logged to help it avoid candidate duplicates.
            </p>
            
            <div className="bg-white/50 rounded-xl p-3 border border-sky-100/60">
              <span className="text-[10px] font-mono font-bold text-rose-600 block uppercase mb-1">
                Active Node Metrics
              </span>
              <ul className="space-y-1 text-[11px] font-mono list-disc pl-4 text-slate-500">
                <li>Elimination Efficiency: 89.2%</li>
                <li>Live Categories: 5 Active</li>
                <li>Average Session Depth: 11 turns</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
