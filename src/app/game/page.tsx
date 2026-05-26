"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Flame,
  ArrowLeft,
  Volume2,
  HelpCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  Trophy,
  Brain,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import Avatar, { AvatarExpression } from "@/components/Avatar";
import VoiceHandler from "@/components/VoiceHandler";
import ShareCard from "@/components/ShareCard";
import TimelineExplorer from "@/components/TimelineExplorer";
import {
  getLocalUser,
  updateLocalUser,
  updateLocalAnalytics,
  trackGameStarted,
  getDailyChallengeWord,
  UserStats,
} from "@/lib/firebase";
import { ExplanationResponse } from "@/lib/gemini";
import confetti from "canvas-confetti";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "player";
  const isDaily = searchParams.get("daily") === "true";

  // Game States
  const [history, setHistory] = useState<{ question: string; answer: "yes" | "no" | "dont_know" }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(10);
  const [remainingCandidates, setRemainingCandidates] = useState<string[]>([]);
  const [aiResponseText, setAiResponseText] = useState<string>("Analyzing your thoughts... Think of a target!");
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [gameState, setGameState] = useState<"loading" | "questioning" | "confirming_guess" | "victory" | "defeat">("loading");
  
  // User Profile
  const [user, setUser] = useState<UserStats | null>(null);
  const [roastMode, setRoastMode] = useState<boolean>(true);
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<{ skip: boolean; reveal: boolean; remove: boolean }>({
    skip: false,
    reveal: false,
    remove: false,
  });

  // Target input when AI loses
  const [correctTarget, setCorrectTarget] = useState("");

  // Enhanced features states
  const [startTime] = useState<number>(Date.now());
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  // Daily Challenge state
  const [dailyTarget, setDailyTarget] = useState("");
  const [dailyCompletedToday, setDailyCompletedToday] = useState(false);
  const [dailyAttemptsToday, setDailyAttemptsToday] = useState(0);

  // AI Thinking Visualization steps
  const thinkingSteps = [
    "Analyzing response patterns...",
    "Eliminating matching nodes...",
    "Comparing active IPL statistics...",
    "Pruning candidate decision tree...",
    "Recalculating confidence metrics...",
  ];

  // Determine current AI expression based on game state and confidence
  const getAvatarExpression = (): AvatarExpression => {
    if (gameState === "loading") return "thinking";
    if (gameState === "victory") return "victory"; // AI won
    if (gameState === "defeat") return "shocked"; // AI lost
    if (gameState === "confirming_guess") return "confident";
    
    // During questioning
    const qCount = history.length;
    if (qCount >= 12) return "shocked"; // dramatic last 3 questions
    if (confidenceScore >= 90) return "happy";
    if (confidenceScore >= 80) return "confident";
    if (confidenceScore < 40) return "shocked";
    return "thinking";
  };

  // Get Live Confidence Level Descriptor
  const getConfidenceLabel = (score: number) => {
    if (score < 40) return "Exploring";
    if (score < 75) return "Getting Closer";
    return "Almost Certain";
  };

  // 1. Initialize Game & Fetch Q1
  useEffect(() => {
    const localUser = getLocalUser();
    setUser(localUser);

    // Track game started in analytics
    trackGameStarted(mode);

    // Handle Daily challenge parameters
    if (isDaily) {
      const challenge = getDailyChallengeWord();
      setDailyTarget(challenge.player);
      
      const dateStr = challenge.date;
      const isCompleted = localUser.dailyCompleted?.[dateStr] === true;
      const attempts = localUser.dailyAttempts?.[dateStr] || 0;

      setDailyCompletedToday(isCompleted);
      setDailyAttemptsToday(attempts);

      // Increment daily attempts on start
      const updatedAttempts = { ...(localUser.dailyAttempts || {}), [dateStr]: attempts + 1 };
      const updated = updateLocalUser({ dailyAttempts: updatedAttempts });
      setUser(updated);
      setDailyAttemptsToday(attempts + 1);
    }

    fetchNextQuestion([]);
  }, []);

  // Fetch next question from Gemini with animated thinking visualizer
  const fetchNextQuestion = async (
    currentHistory: { question: string; answer: "yes" | "no" | "dont_know" }[]
  ) => {
    try {
      setGameState("loading");
      setShowThinking(true);
      setThinkingStep(0);

      // Cycle thinking steps in UI
      const interval = setInterval(() => {
        setThinkingStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 3500 / 5);

      const savedKey = sessionStorage.getItem("GEMINI_DEV_KEY");
      
      const apiCall = fetch("/api/guess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedKey ? { "x-gemini-key": savedKey } : {}), // pass dev key if exists
        },
        body: JSON.stringify({
          category: mode,
          history: currentHistory,
        }),
      });

      // Enforce minimum animation time of 1.6s so user sees deduction process
      const [res] = await Promise.all([
        apiCall,
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);

      clearInterval(interval);
      setShowThinking(false);

      if (!res.ok) throw new Error("API Route failure");
      const data = await res.json();

      setConfidenceScore(data.confidenceScore || 20);
      setRemainingCandidates(data.remainingCandidates || []);
      setAiResponseText(data.aiResponseText || "Let's proceed.");

      // Check if AI is ready to make a guess
      if (data.guess) {
        setCurrentGuess(data.guess);
        setGameState("confirming_guess");
      } else if (currentHistory.length >= 15) {
        // Reached question limit without a guess, AI loses
        setGameState("defeat");
      } else {
        setCurrentQuestion(data.nextQuestion || "Is it related to IPL?");
        setGameState("questioning");
      }
    } catch (error) {
      console.error("Failed to load question:", error);
      setShowThinking(false);
      // Fallback
      setCurrentQuestion("Is this an active player?");
      setGameState("questioning");
    }
  };

  // 2. Handle User Answer (Yes / No / Don't Know)
  const handleAnswer = (answer: "yes" | "no" | "dont_know") => {
    if (!currentQuestion) return;
    
    const updatedHistory = [...history, { question: currentQuestion, answer }];
    setHistory(updatedHistory);
    
    fetchNextQuestion(updatedHistory);
  };

  // Fetch reasoning explanation from Gemini
  const fetchExplanation = async (targetName: string) => {
    try {
      setLoadingExplanation(true);
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetName,
          category: mode,
          history,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
      }
    } catch (err) {
      console.warn("Failed to load guess explanation:", err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // 3. Confirm AI Guess (AI says: Is it Dhoni?)
  const handleGuessConfirmation = (isCorrect: boolean) => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    if (isCorrect) {
      // AI Wins! User Loses.
      setGameState("victory");
      updateLocalAnalytics(true, history.length, mode, elapsedSeconds);
      
      // Reset User Streak
      if (user) {
        const updated = updateLocalUser({ streak: 0 });
        setUser(updated);
      }
      
      // Trigger guess explanation
      if (currentGuess) {
        fetchExplanation(currentGuess);
      }

      // Trigger shake feedback
      const element = document.getElementById("game-card");
      if (element) {
        element.classList.add("animate-bounce");
        setTimeout(() => element.classList.remove("animate-bounce"), 1000);
      }
    } else {
      // AI was wrong.
      // If questions < 15, we resume asking questions
      if (history.length < 15) {
        const updatedHistory = [...history, { question: `Is it ${currentGuess}?`, answer: "no" as const }];
        setHistory(updatedHistory);
        setCurrentGuess(null);
        fetchNextQuestion(updatedHistory);
      } else {
        // Reached 15th question, AI loses
        setGameState("defeat");
      }
    }
  };

  // Check and unlock new achievements
  const checkAchievements = (newStreak: number, questionsCount: number, iq: number) => {
    if (!user) return;
    const currentBadges = [...user.badges];
    const newUnlocked: string[] = [];

    // IPL Guru
    if (mode === "legends" && !currentBadges.includes("guru")) {
      newUnlocked.push("guru");
    }
    // Winning Streak
    if (newStreak >= 5 && !currentBadges.includes("unbeatable")) {
      newUnlocked.push("unbeatable");
    }
    // Under 10 questions
    if (questionsCount <= 10 && !currentBadges.includes("under_10")) {
      newUnlocked.push("under_10");
    }
    // Mind Hacker
    if (iq >= 90 && !currentBadges.includes("mind_hacker")) {
      newUnlocked.push("mind_hacker");
    }
    // Cricket Legend
    const totalWins = (user.wins || 0) + 1;
    if (totalWins >= 10 && !currentBadges.includes("legend")) {
      newUnlocked.push("legend");
    }
    // Daily challenge badge
    if (isDaily && !currentBadges.includes("daily_champ")) {
      newUnlocked.push("daily_champ");
    }

    if (newUnlocked.length > 0) {
      // Pick the first one to show a beautiful notification overlay
      setNewBadge(newUnlocked[0]);
      return [...currentBadges, ...newUnlocked];
    }
    return currentBadges;
  };

  // Get Personalized Cricket IQ Title & Description
  const getCricketIQDetails = (score: number) => {
    if (score >= 90) {
      return {
        title: "Cricket Encyclopedia 🧠",
        desc: "You have a flawless, encyclopedic memory of IPL matches, statistics, and players. The AI stands no chance!",
      };
    } else if (score >= 70) {
      return {
        title: "IPL Expert 🏏",
        desc: "You know your stats, franchises, and stadiums inside out. You're a formidable strategist.",
      };
    } else if (score >= 50) {
      return {
        title: "Casual Fan 🏟️",
        desc: "You enjoy the game and remember key highlights, but can sometimes get clean bowled by deep trivia.",
      };
    } else {
      return {
        title: "Gully Cricket Novice 🪵",
        desc: "You're just starting your IPL journey! Time to watch more match highlights and play again.",
      };
    }
  };

  // 4. Submit correct target when AI loses (so we can generate card/timeline)
  const handleDefeatResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctTarget.trim()) return;

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const iq = calculateCricketIQ();

    // Player wins! Reward coins, update streak, unlock badges
    let rewards = isDaily ? 25 : 15; // base coins for winning, bonus for daily
    let newStreak = (user?.streak || 0) + 1;
    let nextIqHistory = [...(user?.iqHistory || []), iq];
    
    // Check daily completion
    let nextDailyCompleted = { ...(user?.dailyCompleted || {}) };
    if (isDaily) {
      const dateStr = new Date().toISOString().split("T")[0];
      nextDailyCompleted[dateStr] = true;
      setDailyCompletedToday(true);
    }

    // Process badges
    const updatedBadges = checkAchievements(newStreak, history.length, iq) || [];

    if (user) {
      const updated = updateLocalUser({
        score: user.score + rewards,
        streak: newStreak,
        bestStreak: Math.max(user.bestStreak || 0, newStreak),
        badges: updatedBadges,
        iqHistory: nextIqHistory,
        dailyCompleted: nextDailyCompleted,
      });
      setUser(updated);
    }

    updateLocalAnalytics(false, history.length, mode, elapsedSeconds);
    fetchExplanation(correctTarget);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.65 },
      colors: ["#38bdf8", "#ffd700", "#10b981", "#8b5cf6"],
    });

    // We toggle state to "defeat" but with resolved target
    setGameState("defeat");
  };

  // Hint Helpers
  const useSkipQuestion = () => {
    if (!user || user.score < 5 || hintUsed.skip) return;
    const updated = updateLocalUser({ score: user.score - 5 });
    setUser(updated);
    setHintUsed({ ...hintUsed, skip: true });
    
    // Request another question without answering
    fetchNextQuestion(history);
  };

  const useRevealCategory = () => {
    if (!user || user.score < 10 || hintUsed.reveal) return;
    const updated = updateLocalUser({ score: user.score - 10 });
    setUser(updated);
    setHintUsed({ ...hintUsed, reveal: true });
    
    // Provide alert with category detail or remaining candidate count
    alert(`AI Analysis: Category is "${mode.toUpperCase()}". Current active search tree has matches like: ${remainingCandidates.join(", ")}`);
  };

  const useRemoveCandidates = () => {
    if (!user || user.score < 15 || hintUsed.remove) return;
    const updated = updateLocalUser({ score: user.score - 15 });
    setUser(updated);
    setHintUsed({ ...hintUsed, remove: true });
    
    // Filter down mock candidates list
    if (remainingCandidates.length > 2) {
      const filtered = remainingCandidates.slice(0, Math.ceil(remainingCandidates.length / 2));
      setRemainingCandidates(filtered);
    }
    alert("AI Emitter has successfully pruned 50% of candidate paths!");
  };

  const calculateCricketIQ = () => {
    // Formulation: 100 - (Questions asked * 4) + (streak * 5)
    const base = 100 - (history.length * 4);
    const bonus = (user?.streak || 0) * 5;
    return Math.max(10, Math.min(100, base + bonus));
  };

  const restartGame = () => {
    setHistory([]);
    setCurrentQuestion(null);
    setConfidenceScore(10);
    setRemainingCandidates([]);
    setCurrentGuess(null);
    setCorrectTarget("");
    setExplanation(null);
    setNewBadge(null);
    setHintUsed({ skip: false, reveal: false, remove: false });
    fetchNextQuestion([]);
  };

  // Get AI comments based on roast mode and AI confidence personality states
  const getRoastCommentary = () => {
    if (gameState === "victory") {
      return "Celebrate? That was easy. My prediction logic holds a 99% accuracy rate. Better luck next game! 😎";
    }
    if (gameState === "defeat") {
      return "Fine. You outplayed my elimination branches. But remember, a single boundary doesn't win the tournament! 🥺";
    }
    
    if (!roastMode) return aiResponseText;

    // Enhanced AI Personalities based on confidence score & final questions
    const qCount = history.length;
    if (qCount >= 12) {
      return "High stakes now! We're in the death overs... One wrong choice and my search tree collapses! 😰";
    }
    if (confidenceScore >= 85) {
      return "Analyzing clues... I've virtually locked on your target! Prepare to be clean bowled. 😈";
    }
    if (confidenceScore < 35) {
      return "Wait... these clues are conflicting. Are you trying to reverse-sweep my algorithms? 🧐";
    }
    return aiResponseText;
  };

  // Daily puzzle attempt block checks
  if (isDaily && dailyCompletedToday) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-12 text-center">
        <div className="glass-panel rounded-3xl p-8 border-white/60">
          <Award className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-slate-800">Daily Challenge Complete!</h2>
          <p className="text-sm text-slate-500 font-mono mt-2">
            You successfully completed the daily mystery puzzle today. Check the global leaderboards to see where you rank!
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => router.push("/leaderboard")}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition"
            >
              Check Leaderboards
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white/60 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-white/80 transition"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDaily && dailyAttemptsToday > 3) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-12 text-center">
        <div className="glass-panel rounded-3xl p-8 border-white/60">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">No Attempts Remaining</h2>
          <p className="text-sm text-slate-500 font-mono mt-2">
            You have already used your maximum 3 attempts for today's daily puzzle. Try again tomorrow!
          </p>
          <div className="mt-8">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iqResult = getCricketIQDetails(calculateCricketIQ());

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2">
      {/* Newly Unlocked Achievement Banner overlay */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed inset-x-4 bottom-8 md:inset-x-auto md:right-8 md:bottom-8 z-50 max-w-sm mx-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl p-4 shadow-xl border border-yellow-400 flex items-center gap-4"
          >
            <div className="p-3 bg-white/20 rounded-xl text-white">
              <Trophy className="w-7 h-7 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-yellow-100">
                Achievement Unlocked!
              </span>
              <h4 className="text-base font-black">
                {newBadge === "guru"
                  ? "🏆 IPL Guru"
                  : newBadge === "unbeatable"
                  ? "🔥 Winning Streak"
                  : newBadge === "under_10"
                  ? "🎯 Under 10"
                  : newBadge === "mind_hacker"
                  ? "🧠 Mind Hacker"
                  : newBadge === "daily_champ"
                  ? "⭐ Daily Champ"
                  : "👑 Cricket Legend"}
              </h4>
              <p className="text-xs text-yellow-50/80 font-mono mt-0.5">
                Saved in your coach profile stats.
              </p>
            </div>
            <button
              onClick={() => setNewBadge(null)}
              className="p-1 text-yellow-100 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top action header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </button>

        <div className="flex items-center gap-3 text-xs font-mono">
          {isDaily && (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Daily Challenge (Attempt {dailyAttemptsToday}/3)</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Coins className="w-3.5 h-3.5" />
            <span>{user?.score || 0} Coins</span>
          </div>
          <div className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>{user?.streak || 0} Streak</span>
          </div>
        </div>
      </div>

      {/* Main Holographic Playing Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Hologram Avatar column */}
        <div className="flex flex-col items-center justify-center glass-panel rounded-3xl p-6 relative overflow-hidden border-white/50">
          <div className="absolute top-2 left-2 text-[8px] font-mono text-sky-600 font-bold tracking-widest uppercase">
            Glass Orb Analyst
          </div>
          <Avatar expression={getAvatarExpression()} size={200} />
          
          {/* Personality Comment Container */}
          <div className="mt-4 text-center w-full">
            <p className="text-xs text-sky-600 font-bold font-mono tracking-wider uppercase mb-1">
              Commentary
            </p>
            <div className="bg-white/50 border border-sky-100 rounded-xl p-3 min-h-[60px] flex items-center justify-center">
              <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                &ldquo;{getRoastCommentary()}&rdquo;
              </p>
            </div>
          </div>

          {/* AI Roast Mode Toggle */}
          <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-slate-400">
            <span>Roast Mode:</span>
            <button
              onClick={() => setRoastMode(!roastMode)}
              className={`px-2 py-0.5 rounded border transition ${
                roastMode
                  ? "bg-rose-50 border-rose-200 text-rose-600 font-bold"
                  : "bg-white/30 border-slate-200 text-slate-500"
              }`}
            >
              {roastMode ? "ON 🔥" : "OFF"}
            </button>
          </div>
        </div>

        {/* Central Game controller cards */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* Loading / Processing Question / Thinking visualizer */}
            {gameState === "loading" && (
              <motion.div
                key="loading-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] border-white/60 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-sky-400 to-violet-400 animate-[pulse_1.5s_infinite]" style={{ width: `${(thinkingStep + 1) * 20}%`, transition: "width 0.4s ease" }} />
                
                <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-6" />
                
                {/* Visualizer deduction steps */}
                <div className="w-full max-w-xs space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-1.5">
                    <Brain className="w-4 h-4 text-sky-500" />
                    <span>AI Reasoning Engines</span>
                  </h4>
                  {thinkingSteps.map((step, idx) => (
                    <div
                      key={`step-${idx}`}
                      className={`flex items-center gap-2 text-xs font-mono transition-opacity duration-300 ${
                        idx < thinkingStep
                          ? "text-sky-600 opacity-100 font-bold"
                          : idx === thinkingStep
                          ? "text-slate-700 opacity-100 animate-pulse font-bold"
                          : "text-slate-300 opacity-40"
                      }`}
                    >
                      <span>
                        {idx < thinkingStep ? (
                          <CheckCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        ) : idx === thinkingStep ? (
                          <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin shrink-0" />
                        ) : (
                          <HelpCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        )}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Standard Questioning Stage */}
            {gameState === "questioning" && (
              <motion.div
                key="question-card"
                id="game-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[300px] shadow-sm relative border-white/60"
              >
                {/* Confidence Bar / Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-slate-500">
                    DELIVERY {history.length + 1} / 15
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">Confidence:</span>
                    <div className="w-20 bg-slate-100 rounded-full h-2 border border-sky-100 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-300 to-sky-500 h-full transition-all duration-500"
                        style={{ width: `${confidenceScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-sky-600 font-bold shrink-0">
                      {confidenceScore}% <span className="text-slate-400 font-normal">({getConfidenceLabel(confidenceScore)})</span>
                    </span>
                  </div>
                </div>

                {/* Main Question Display */}
                <div className="my-6">
                  <p className="text-xs font-mono text-sky-600 uppercase tracking-widest font-semibold mb-2">
                    AkiCricket Asks:
                  </p>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-800 leading-relaxed">
                    {currentQuestion}
                  </h2>
                </div>

                {/* Response Action Buttons */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <button
                    onClick={() => handleAnswer("yes")}
                    className="py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:scale-[1.02] transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleAnswer("no")}
                    className="py-3 px-4 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.15)] hover:scale-[1.02] transition"
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleAnswer("dont_know")}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-white/60 hover:bg-white/80 text-slate-700 border border-sky-100 hover:scale-[1.02] transition"
                  >
                    Don't Know
                  </button>
                </div>

                {/* Voice mode widget inside board */}
                <div className="border-t border-sky-100/50 pt-4 mt-6">
                  <VoiceHandler
                    currentQuestion={currentQuestion}
                    onAnswer={handleAnswer}
                    voiceActive={voiceActive}
                    setVoiceActive={setVoiceActive}
                    coins={user?.score || 0}
                    onSkip={useSkipQuestion}
                  />
                </div>
              </motion.div>
            )}

            {/* Confirming Guess Stage (AI guesses target) */}
            {gameState === "confirming_guess" && (
              <motion.div
                key="confirm-guess-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel border-amber-300 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[300px] shadow-md bg-white/65"
              >
                <div className="text-center">
                  <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 mb-4 animate-bounce">
                    ★ CRITICAL DECISION ★
                  </span>
                  <p className="text-sm font-mono text-slate-500 mb-2">
                    My calculation engines are locked on. Are you thinking of:
                  </p>
                  <h2 className="text-2xl md:text-3.5xl font-black text-amber-700 glow-gold tracking-wide my-4 uppercase">
                    {currentGuess}
                  </h2>
                </div>

                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => handleGuessConfirmation(true)}
                    className="flex-1 py-3.5 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.15)] transition"
                  >
                    Yes, That's It!
                  </button>
                  <button
                    onClick={() => handleGuessConfirmation(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.15)] transition"
                  >
                    No, Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Victory Screen (AI guessed correctly, user lost) */}
            {gameState === "victory" && (
              <motion.div
                key="victory-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel border-white/60 bg-white/60 rounded-3xl p-6 md:p-8 text-center space-y-6"
              >
                <div>
                  <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <h2 className="text-2xl md:text-3.5xl font-black text-slate-800 mb-2">
                    AI Guessed It!
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    The AI mind reader successfully guessed <span className="text-sky-600 font-bold">{currentGuess}</span> in {history.length} questions.
                  </p>
                </div>

                {/* Explanation Reasoning Card */}
                {loadingExplanation ? (
                  <div className="p-5 bg-white/50 border border-sky-100 rounded-2xl animate-pulse text-center">
                    <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-mono">Gemini formulating brain logic report...</p>
                  </div>
                ) : explanation ? (
                  <div className="bg-white/75 border border-sky-100 rounded-2xl p-5 text-left text-xs space-y-3.5 shadow-sm">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1 text-sky-600">
                      <Brain className="w-4 h-4" /> AI Brain Logic Report
                    </h4>
                    <div>
                      <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-1">Critical Clues Filtered</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        {explanation.importantQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-0.5">Elimination Process</span>
                      <p className="text-slate-600 leading-relaxed font-sans">{explanation.eliminationStrategy}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-0.5">Selection Parameter</span>
                      <p className="text-slate-600 leading-relaxed font-sans">{explanation.whySelected}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={restartGame}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-sky-500 text-white hover:bg-sky-600 transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3.5 rounded-xl font-bold bg-white/60 border border-slate-200 text-slate-700 hover:bg-white/80 transition"
                  >
                    Return to Lobby
                  </button>
                </div>

                {currentGuess && (
                  <div className="mt-8 border-t border-sky-100 pt-6 text-left">
                    <TimelineExplorer target={currentGuess} category={mode} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Defeat Screen (AI failed to guess, user won!) */}
            {gameState === "defeat" && (
              <motion.div
                key="defeat-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel border-white/60 bg-white/60 rounded-3xl p-6 md:p-8"
              >
                {!correctTarget ? (
                  /* Form to declare what player/team the user thought of */
                  <form onSubmit={handleDefeatResolution} className="text-center max-w-sm mx-auto">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-black text-slate-800 mb-2">You Defeated AI!</h2>
                    <p className="text-xs text-slate-500 mb-6">
                      The AI could not confidently guess your target in 15 questions. Enter the correct answer to claim your victory and coins!
                    </p>

                    <input
                      type="text"
                      placeholder="Who were you thinking of? (e.g. Virat Kohli)"
                      value={correctTarget}
                      onChange={(e) => setCorrectTarget(e.target.value)}
                      className="w-full bg-white/80 border border-sky-200 rounded-xl px-4 py-2.5 text-center text-slate-800 focus:outline-none focus:border-sky-500 mb-4"
                      required
                    />

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                    >
                      Log Victory & Earn Coins
                    </button>
                  </form>
                ) : (
                  /* Victory Summary Board, Share Card, and Timeline Explorer */
                  <div className="space-y-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
                      <h2 className="text-2xl md:text-3.5xl font-black text-slate-800 mb-1">
                        Victory Earned!
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">
                        You outplayed the AI on {correctTarget} in {history.length} deliveries.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-md mx-auto text-left">
                        {/* Cricket IQ result card */}
                        <div className="bg-white/60 border border-sky-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                          <div>
                            <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">Personal Cricket IQ</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{calculateCricketIQ()}</p>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-bold text-slate-800 block">{iqResult.title}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-sans">{iqResult.desc}</p>
                          </div>
                        </div>

                        <div className="bg-white/60 border border-sky-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                          <div>
                            <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">Rewards Earned</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">+{isDaily ? 25 : 15} <span className="text-xs font-normal">Coins</span></p>
                          </div>
                          <div className="mt-3 border-t border-sky-100/40 pt-2.5">
                            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Current Win Streak</span>
                            <span className="text-sm font-bold text-slate-800 block">{(user?.streak || 0)} Matches</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Explanation Reasoning Card */}
                    {loadingExplanation ? (
                      <div className="p-5 bg-white/50 border border-sky-100 rounded-2xl animate-pulse text-center">
                        <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-mono">Gemini formulating brain logic report...</p>
                      </div>
                    ) : explanation ? (
                      <div className="bg-white/75 border border-sky-100 rounded-2xl p-5 text-left text-xs space-y-3.5 shadow-sm max-w-xl mx-auto">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1 text-sky-600">
                          <Brain className="w-4 h-4" /> AI Brain Logic Report
                        </h4>
                        <div>
                          <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-1">Critical Clues Filtered</span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {explanation.importantQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-0.5">Elimination Process</span>
                          <p className="text-slate-600 leading-relaxed font-sans">{explanation.eliminationStrategy}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block font-mono uppercase text-[9px] mb-0.5">Selection Parameter</span>
                          <p className="text-slate-600 leading-relaxed font-sans">{explanation.whySelected}</p>
                        </div>
                      </div>
                    ) : null}

                    <ShareCard
                      playerName={user?.name || "Player 1"}
                      category={mode}
                      questionCount={history.length}
                      cricketIQ={calculateCricketIQ()}
                      wasVictory={true}
                      targetName={correctTarget}
                      streak={user?.streak || 0}
                      confidence={confidenceScore}
                    />

                    <div className="max-w-xl mx-auto">
                      <TimelineExplorer target={correctTarget} category={mode} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center border-t border-sky-100 pt-6">
                      <button
                        onClick={restartGame}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-sky-500 text-white hover:bg-sky-600 transition shadow-sm"
                      >
                        <RotateCcw className="w-4.5 h-4.5" /> Play Again
                      </button>
                      <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 rounded-xl font-bold bg-white/60 border border-slate-200 text-slate-700 hover:bg-white/80 transition"
                      >
                        Return to Lobby
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Hint economy and powerup actions */}
      {gameState === "questioning" && (
        <section className="glass-panel border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Hint & Power-Up System
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Spend coins to disrupt AI elimination</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Hint 1: Skip */}
            <button
              onClick={useSkipQuestion}
              disabled={hintUsed.skip || !user || user.score < 5}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                hintUsed.skip
                  ? "bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white/50 border-sky-100 text-slate-700 hover:border-sky-400 hover:scale-[1.02]"
              }`}
            >
              <div>
                <h5 className="text-xs font-bold font-mono text-sky-600 mb-1">
                  ⚡ Skip Question
                </h5>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  Forces AI to generate a different question branch.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 mt-3">
                {hintUsed.skip ? "● USED" : "5 Coins"}
              </span>
            </button>

            {/* Hint 2: Reveal Category */}
            <button
              onClick={useRevealCategory}
              disabled={hintUsed.reveal || !user || user.score < 10}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                hintUsed.reveal
                  ? "bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white/50 border-violet-100 text-slate-700 hover:border-violet-400 hover:scale-[1.02]"
              }`}
            >
              <div>
                <h5 className="text-xs font-bold font-mono text-violet-600 mb-1">
                  👁 Reveal Category
                </h5>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  Inspect the active category matches and branch parameters.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 mt-3">
                {hintUsed.reveal ? "● USED" : "10 Coins"}
              </span>
            </button>

            {/* Hint 3: Remove Candidates */}
            <button
              onClick={useRemoveCandidates}
              disabled={hintUsed.remove || !user || user.score < 15}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                hintUsed.remove
                  ? "bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white/50 border-emerald-100 text-slate-700 hover:border-emerald-400 hover:scale-[1.02]"
              }`}
            >
              <div>
                <h5 className="text-xs font-bold font-mono text-emerald-600 mb-1">
                  ✂ Cut Candidates
                </h5>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  Forcibly prune 50% of the AI's current remaining candidate list.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 mt-3">
                {hintUsed.remove ? "● USED" : "15 Coins"}
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-mono animate-pulse">Loading stadium lights...</p>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
