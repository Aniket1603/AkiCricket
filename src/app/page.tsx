"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Swords,
  Coins,
  Flame,
  Award,
  Settings,
  Zap,
  Users,
  Compass,
  Key,
  BarChart3,
  Calendar,
  Sparkles,
  PieChart,
  Clock,
  LogOut,
  ChevronRight,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import {
  getLocalUser,
  getLocalLeaderboard,
  getLocalAnalytics,
  getDailyChallengeWord,
  updateLocalUser,
  signInWithGoogle,
  logoutUser,
  isFirebaseEnabled,
  auth,
  UserStats,
  AnalyticsSummary,
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Dashboard() {
  const [user, setUser] = useState<UserStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminAnalytics, setShowAdminAnalytics] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [dailyWord, setDailyWord] = useState("");
  const [isDailyCompletedToday, setIsDailyCompletedToday] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Load local user profile
    const u = getLocalUser();
    setUser(u);
    
    // Load daily challenge word
    const challenge = getDailyChallengeWord();
    setDailyWord(challenge.player);

    const dateStr = challenge.date;
    setIsDailyCompletedToday(u.dailyCompleted?.[dateStr] === true);

    // Load analytics
    setAnalytics(getLocalAnalytics());

    // Load gemini key from session storage if present
    const savedKey = sessionStorage.getItem("GEMINI_DEV_KEY");
    if (savedKey) {
      setGeminiKey(savedKey);
    }

    // Subscribe to Firebase Auth changes if enabled
    if (isFirebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setCurrentUser(fbUser);
        if (fbUser) {
          // Sync profile state from local/session storage
          setUser(getLocalUser());
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleGoogleSignIn = async () => {
    const profile = await signInWithGoogle();
    if (profile) {
      setUser(profile);
      alert(`Welcome, ${profile.name}! Progress is now synced with Firestore.`);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUser(getLocalUser());
    alert("Signed out successfully. Switched to local guest mode.");
  };

  const saveDeveloperKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey) {
      sessionStorage.setItem("GEMINI_DEV_KEY", geminiKey);
      alert("Developer API Key saved to session storage. The API routes will prioritize this key.");
    } else {
      sessionStorage.removeItem("GEMINI_DEV_KEY");
      alert("Custom API Key cleared. Default environment variables will be used.");
    }
    setShowSettings(false);
  };

  const gameModes = [
    {
      id: "player",
      title: "IPL Player Guess",
      desc: "Think of an active or recent IPL superstar. Kohli, Dhoni, Rohit...",
      color: "from-sky-400 to-sky-500",
      border: "border-sky-200/60",
      accent: "text-sky-600",
      examples: "Dhoni, Kohli, Rohit, ABD",
      difficulty: "Normal",
    },
    {
      id: "team",
      title: "IPL Team Guess",
      desc: "Think of any active or historic IPL team franchises. CSK, MI, RCB...",
      color: "from-violet-400 to-purple-500",
      border: "border-violet-200/60",
      accent: "text-violet-600",
      examples: "CSK, MI, RCB, KKR",
      difficulty: "Easy",
    },
    {
      id: "moment",
      title: "Historic IPL Moments",
      desc: "Iconic matches, final ball finishes, McCullum's 158...",
      color: "from-rose-400 to-pink-500",
      border: "border-rose-200/60",
      accent: "text-rose-600",
      examples: "2016 RCB, 2023 CSK Final",
      difficulty: "Hard",
    },
    {
      id: "stadium",
      title: "Mystery Stadium",
      desc: "Legendary battlegrounds of the IPL. Wankhede, Chinnaswamy...",
      color: "from-emerald-400 to-teal-500",
      border: "border-emerald-200/60",
      accent: "text-emerald-600",
      examples: "Wankhede, Eden Gardens",
      difficulty: "Normal",
    },
    {
      id: "legends",
      title: "IPL Legends Only",
      desc: "Legendary players who changed the face of the tournament. Hard mode.",
      color: "from-amber-400 to-orange-500",
      border: "border-amber-200/60",
      accent: "text-amber-700",
      examples: "Sachin, Warne, Gilchrist",
      difficulty: "Special Hard",
    },
  ];

  const badgesList = [
    {
      id: "guru",
      name: "🏆 IPL Guru",
      desc: "Defeat AI in Legends category",
      unlocked: user?.badges.includes("guru"),
    },
    {
      id: "unbeatable",
      name: "🔥 Winning Streak",
      desc: "Achieve a 5-win streak",
      unlocked: user?.badges.includes("unbeatable") || (user?.streak && user.streak >= 5),
    },
    {
      id: "under_10",
      name: "🎯 Under 10",
      desc: "Win in under 10 questions",
      unlocked: user?.badges.includes("under_10"),
    },
    {
      id: "mind_hacker",
      name: "🧠 Mind Hacker",
      desc: "Achieve a Cricket IQ of 90+",
      unlocked: user?.badges.includes("mind_hacker"),
    },
    {
      id: "daily_champ",
      name: "⭐ Daily Champ",
      desc: "Complete Daily Challenge",
      unlocked: user?.badges.includes("daily_champ") || isDailyCompletedToday,
    },
    {
      id: "legend",
      name: "👑 Cricket Legend",
      desc: "Defeat AI 10 times total",
      unlocked: user?.badges.includes("legend") || (user?.wins && user.wins >= 10),
    },
  ];

  const totalPlayed = user?.totalGames || 0;
  const playerWins = user?.wins || 0;
  const playerLosses = user?.losses || 0;
  const winRate = totalPlayed > 0 ? Math.round((playerWins / totalPlayed) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      
      {/* Hero Welcome Banner */}
      <section className="text-center py-10 md:py-14 relative rounded-3xl glass-panel overflow-hidden border-white/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-200/40 opacity-50 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200/40 opacity-50 blur-3xl rounded-full" />
        
        <div className="relative z-10 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-600 text-xs font-mono font-bold mb-4 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>AI HYPER ENGINE ONLINE</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6.5xl font-black tracking-tight text-slate-800 mb-4">
            AkiCricket <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-600">AI</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            Think of any IPL player, team, stadium, or legendary moment. Answer Yes/No questions and see if our AI commentator can read your mind in 15 deliveries!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/game?mode=player"
              className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-[0_4px_12px_rgba(56,189,248,0.2)] hover:from-sky-500 hover:to-sky-600 hover:scale-105 hover:shadow-[0_6px_20px_rgba(56,189,248,0.3)] transition"
            >
              Start Guessing Game
            </Link>
            
            {/* Google Sign-In status check */}
            {isFirebaseEnabled && (
              currentUser ? (
                <div className="flex items-center gap-3 bg-white/60 border border-sky-200/80 rounded-xl px-4 py-2 text-xs font-mono font-bold text-slate-700 shadow-sm">
                  {currentUser.photoURL && (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-sky-200" />
                  )}
                  <span>{user?.name || currentUser.displayName}</span>
                  <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" /> Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Google Sign In</span>
                </button>
              )
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white/50 border border-sky-200/80 text-slate-700 hover:border-sky-400 hover:bg-white/80 transition shadow-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Developer Keys</span>
            </button>
            <button
              onClick={() => setShowAdminAnalytics(!showAdminAnalytics)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white/50 border border-sky-200/80 text-slate-700 hover:border-sky-400 hover:bg-white/80 transition shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* Developer API Key Panel Modal overlay */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-sky-300 rounded-2xl p-6 shadow-lg bg-white/70"
        >
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">Developer API Console</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-mono leading-relaxed">
            By default, AkiCricket AI runs in **Offline/Mock Mode** with predefined answers (allowing immediate tests), or reads from standard server environment variables. Paste a custom Gemini Key below to test live generated questions!
          </p>
          <form onSubmit={saveDeveloperKey} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 font-mono mb-1">
                GEMINI API KEY (Saved locally in session storage)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-white/80 border border-sky-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 text-white font-bold text-xs rounded-lg hover:bg-sky-600 transition shadow-sm"
              >
                Apply Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeminiKey("");
                  sessionStorage.removeItem("GEMINI_DEV_KEY");
                  alert("Custom key cleared.");
                }}
                className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="ml-auto px-4 py-2 text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admin Analytics Dashboard overlay */}
      {showAdminAnalytics && analytics && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-sky-300 rounded-2xl p-6 shadow-xl bg-white/90 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">System Admin Analytics Console</h3>
            </div>
            <button
              onClick={() => setShowAdminAnalytics(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold font-mono"
            >
              Close [X]
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <Zap className="w-4 h-4 text-sky-600 mb-1" />
              <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Games Started</span>
              <span className="text-xl font-black text-slate-800">{analytics.gamesStarted || 0}</span>
            </div>
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <CheckCircle className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Games Completed</span>
              <span className="text-xl font-black text-slate-800">{analytics.gamesCompleted || 0}</span>
            </div>
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <PieChart className="w-4 h-4 text-violet-600 mb-1" />
              <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Retention / Completion</span>
              <span className="text-xl font-black text-slate-800">
                {analytics.gamesStarted > 0
                  ? ((analytics.gamesCompleted / analytics.gamesStarted) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <Clock className="w-4 h-4 text-rose-500 mb-1" />
              <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Avg Session Length</span>
              <span className="text-xl font-black text-slate-800">
                {analytics.sessionCount > 0
                  ? (analytics.totalSessionDuration / analytics.sessionCount).toFixed(0)
                  : 0}
                s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 p-4 rounded-xl border border-sky-100/50">
              <h4 className="text-xs font-bold font-mono text-slate-700 uppercase mb-3 border-b border-sky-100 pb-1.5">
                Popular Categories (Admin Hits)
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {["player", "team", "stadium", "moment", "legends"].map((cat) => {
                  const hits = analytics.modeCounts?.[cat] || 0;
                  const totalHits = Object.values(analytics.modeCounts || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = ((hits / totalHits) * 100).toFixed(0);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span className="uppercase font-bold">{cat}</span>
                        <span>{hits} hits ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/60 p-4 rounded-xl border border-sky-100/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-700 uppercase mb-3 border-b border-sky-100 pb-1.5">
                  AI Success Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">AI WIN COUNT</span>
                    <span className="text-2xl font-black text-rose-600">{analytics.aiWins}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">PLAYER WIN COUNT</span>
                    <span className="text-2xl font-black text-emerald-600">{analytics.playerWins}</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-4 font-mono leading-relaxed">
                * Note: Admin data aggregates local sandbox transactions to simulate database workloads in mock environments.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Stats & Achievements Quick Summary bar */}
      {user && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 border-white/50">
            <div className="p-3 bg-sky-100 rounded-xl text-sky-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase">Hint Economy</p>
              <p className="text-xl font-black text-slate-800">{user.score} <span className="text-xs text-amber-600 font-mono font-normal">Coins</span></p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 border-white/50">
            <div className="p-3 bg-red-100 rounded-xl text-red-500">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase">Win Streak</p>
              <p className="text-xl font-black text-slate-800">{user.streak} <span className="text-xs text-red-500 font-mono font-normal">Active</span></p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 col-span-2 border-white/50">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mb-1">Badges Earned</p>
              <div className="flex gap-2 flex-wrap">
                {user.badges.length === 0 ? (
                  <span className="text-xs text-slate-400 font-mono italic">No badges unlocked yet</span>
                ) : (
                  user.badges.map((badge, i) => (
                    <span key={i} className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {badge === "guru"
                        ? "🏆 Guru"
                        : badge === "unbeatable"
                        ? "🔥 Unbeatable"
                        : badge === "under_10"
                        ? "🎯 Under 10"
                        : badge === "mind_hacker"
                        ? "🧠 Mind Hacker"
                        : badge === "daily_champ"
                        ? "⭐ Daily Champ"
                        : "👑 Legend"}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coach statistics Dashboard */}
      {user && (
        <section className="glass-panel border-white/60 bg-white/45 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-sky-100/50 pb-3">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold font-mono uppercase text-slate-800">
              Coach Profile & Statistics Dashboard
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Numeric metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 p-3 rounded-xl border border-sky-100/40">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Games Played</span>
                <span className="text-2xl font-black text-slate-800">{totalPlayed}</span>
              </div>
              <div className="bg-white/50 p-3 rounded-xl border border-sky-100/40">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Win Rate</span>
                <span className="text-2xl font-black text-emerald-600">{winRate}%</span>
              </div>
              <div className="bg-white/50 p-3 rounded-xl border border-sky-100/40">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Wins / Losses</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  {playerWins} W / {playerLosses} L
                </span>
              </div>
              <div className="bg-white/50 p-3 rounded-xl border border-sky-100/40">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Favorite Mode</span>
                <span className="text-xs font-black text-sky-600 uppercase block mt-1 truncate">
                  {user.favoriteMode || "None"}
                </span>
              </div>
            </div>

            {/* Win/Loss Balance visual bar */}
            <div className="bg-white/50 p-4 rounded-2xl border border-sky-100/40 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold mb-2">Battle Win-Loss Ratio</span>
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                  <div className="bg-emerald-500 h-full" style={{ width: `${winRate}%` }} />
                  <div className="bg-rose-500 h-full" style={{ width: `${100 - winRate}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-4">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Coach Wins ({playerWins})</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> AI Wins ({playerLosses})</span>
              </div>
            </div>

            {/* Sparkline Cricket IQ History */}
            <div className="bg-white/50 p-4 rounded-2xl border border-sky-100/40 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold mb-1">Cricket IQ History</span>
                <p className="text-[10px] text-slate-500 font-mono mb-2">Trend over last 12 matches</p>
              </div>
              <div className="flex items-end gap-1.5 h-12 bg-white/40 border border-sky-100/30 rounded-xl p-1.5">
                {user.iqHistory && user.iqHistory.length > 0 ? (
                  user.iqHistory.slice(-12).map((iq, i) => (
                    <div
                      key={i}
                      className="bg-sky-400 rounded-t w-full hover:bg-sky-500 transition-all cursor-pointer"
                      style={{ height: `${(iq / 100) * 100}%` }}
                      title={`Match ${i + 1}: IQ ${iq}`}
                    />
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono italic mx-auto">No matches recorded</span>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Main Grid: Game Modes */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Select Game Mode</h2>
          <span className="text-xs font-mono text-slate-400">Pick a category to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameModes.map((mode, idx) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={mode.id}
              className={`flex flex-col glass-panel border-${mode.border} rounded-2xl p-5 hover:shadow-[0_8px_24px_rgba(56,189,248,0.06)] border-white/60 transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/80 border border-sky-100 ${mode.accent}`}>
                  {mode.difficulty}
                </span>
                <span className="text-xs font-mono text-slate-400">Mode {idx + 1}</span>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-2">{mode.title}</h3>
              <p className="text-xs text-slate-500 mb-6 flex-1 leading-relaxed">{mode.desc}</p>
              
              <div className="text-[10px] font-mono text-slate-500 mb-4 bg-white/30 p-2 rounded-lg border border-sky-100/50">
                Examples: {mode.examples}
              </div>

              <Link
                href={`/game?mode=${mode.id}`}
                className="w-full text-center py-2.5 rounded-xl font-bold bg-white/60 hover:bg-sky-500 hover:text-white text-slate-700 border border-sky-100 hover:border-sky-300 text-xs transition"
              >
                Choose Category
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Secondary Row: Battle Mode and Daily Challenge links */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Battle Mode Card */}
        <div className="bg-gradient-to-br from-rose-50/50 to-purple-50/50 border border-rose-200/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200 opacity-20 blur-2xl rounded-full" />
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-6 h-6 text-rose-500" />
              <h3 className="text-base font-black uppercase text-slate-800 tracking-wide">
                AI Battle Arena
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Watch two Gemini agents duel! Agent A thinks of an IPL card, while Agent B uses forecasting logic to predict and guess Agent A's moves in a real-time animated holographic console.
            </p>
          </div>

          <Link
            href="/battle"
            className="w-full py-3 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.15)] text-center text-xs transition"
          >
            Enter Battle Arena
          </Link>
        </div>

        {/* Daily Challenge Card */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200 opacity-20 blur-2xl rounded-full" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-black uppercase text-slate-800 tracking-wide">
                Daily Mystery Puzzle
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              A new mystery IPL target is updated every 24 hours. Can you guess who the community is hunting today and claim a slot on the daily speed leaderboards?
            </p>
            {isDailyCompletedToday && (
              <div className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-4">
                <CheckCircle className="w-3.5 h-3.5" /> Challenge Completed Today!
              </div>
            )}
          </div>

          <Link
            href="/game?mode=player&daily=true"
            className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white text-center text-xs shadow-[0_4px_12px_rgba(16,185,129,0.15)] transition"
          >
            {isDailyCompletedToday ? "Replay Daily Challenge" : "Play Daily Challenge"}
          </Link>
        </div>
      </section>

      {/* Achievements Showcase */}
      <section className="glass-panel border-white/50 rounded-3xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black uppercase text-slate-800">IPL Achievements System</h3>
          </div>
          <Link href="/leaderboard" className="text-xs text-sky-600 hover:underline">
            View Global Rankings &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badgesList.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? "bg-amber-50/50 border-amber-200 text-slate-800 shadow-sm font-semibold"
                  : "bg-white/20 border-slate-200 text-slate-400"
              }`}
            >
              <h4 className={`text-sm font-bold mb-1 ${badge.unlocked ? "text-amber-700" : "text-slate-400"}`}>
                {badge.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">{badge.desc}</p>
              <span className="inline-block mt-3 text-[9px] uppercase tracking-wider font-mono font-bold">
                {badge.unlocked ? "● UNLOCKED" : "○ LOCKED"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
