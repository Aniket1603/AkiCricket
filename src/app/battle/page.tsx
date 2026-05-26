"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, RotateCcw, ArrowLeft, Play, Pause, ChevronRight, HelpCircle, Check, X, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { BattleRound } from "@/lib/gemini";

export default function BattleArena() {
  const [category, setCategory] = useState("player");
  const [history, setHistory] = useState<{ question: string; answer: "yes" | "no" | "dont_know" }[]>([]);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [battleFinished, setBattleFinished] = useState(false);
  const [winnerName, setWinnerName] = useState("");

  const categories = [
    { id: "player", name: "Players" },
    { id: "team", name: "Teams" },
    { id: "stadium", name: "Stadiums" },
    { id: "moment", name: "Moments" },
  ];

  // AutoPlay loop trigger
  useEffect(() => {
    let timer: any;
    if (autoPlay && isRunning && !battleFinished && !loading) {
      timer = setTimeout(() => {
        simulateNextRound();
      }, 3500); // 3.5s delay per round
    }
    return () => clearTimeout(timer);
  }, [autoPlay, isRunning, battleFinished, loading]);

  const startBattle = () => {
    setHistory([]);
    setRounds([]);
    setBattleFinished(false);
    setIsRunning(true);
    setWinnerName("");
    simulateNextRound([]);
  };

  const simulateNextRound = async (currentHistory = history) => {
    if (currentHistory.length >= 12) {
      // End battle as a demonstration after 12 rounds or when confidence is maxed
      setBattleFinished(true);
      
      // Determine a funny mock target
      const targets = {
        player: "MS Dhoni",
        team: "Chennai Super Kings",
        stadium: "Wankhede Stadium",
        moment: "2016 RCB Run",
      };
      setWinnerName((targets as any)[category] || "Virat Kohli");
      setIsRunning(false);
      setAutoPlay(false);
      return;
    }

    try {
      setLoading(true);
      const savedKey = sessionStorage.getItem("GEMINI_DEV_KEY");
      
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedKey ? { "x-gemini-key": savedKey } : {}),
        },
        body: JSON.stringify({
          category,
          history: currentHistory,
        }),
      });

      if (!res.ok) throw new Error("Battle API failed");
      const roundData: BattleRound = await res.json();

      setRounds((prev) => [...prev, roundData]);

      // Mock answer generation to feed back into Agent A's history loop
      const answers: ("yes" | "no" | "dont_know")[] = ["yes", "no", "yes", "dont_know", "no"];
      const nextAnswer = answers[currentHistory.length % answers.length];
      
      const newHistory = [...currentHistory, { question: roundData.question, answer: nextAnswer }];
      setHistory(newHistory);

      // Check if Agent A's confidence reached guess limits
      if (roundData.confidenceA >= 95) {
        setBattleFinished(true);
        const targets = {
          player: "MS Dhoni",
          team: "Mumbai Indians",
          stadium: "Chinnaswamy Stadium",
          moment: "Brendon McCullum 158",
        };
        setWinnerName((targets as any)[category] || "AB de Villiers");
        setIsRunning(false);
        setAutoPlay(false);
      }
    } catch (error) {
      console.error("Failed to run battle round:", error);
      setIsRunning(false);
      setAutoPlay(false);
    } finally {
      setLoading(false);
    }
  };

  const stopBattle = () => {
    setIsRunning(false);
    setAutoPlay(false);
  };

  const getPredictionMatch = (round: BattleRound) => {
    const q1 = round.question.toLowerCase().trim();
    const q2 = round.prediction.toLowerCase().trim();
    
    // Check similarity
    if (q1 === q2) return "perfect";
    if (q1.includes(q2) || q2.includes(q1)) return "close";
    return "miss";
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-2">
      {/* Header Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </Link>
        <span className="text-xs font-mono text-rose-600 font-bold tracking-widest uppercase flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" /> AI Battle Arena
        </span>
      </div>

      {/* Intro Panel */}
      {!isRunning && !battleFinished && (
        <section className="glass-panel border-white/60 rounded-3xl p-6 text-center max-w-2xl mx-auto shadow-sm">
          <Swords className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Simulate Dual-AI Guessing Duels</h2>
          <p className="text-xs text-slate-500 font-mono leading-relaxed mb-6">
            Agent A (The Guesser) searches the IPL knowledge database using structured elimination. Agent B (The Forecaster) uses model logic to anticipate Agent A's search prompts.
          </p>

          <div className="flex flex-col gap-4">
            {/* Category Select */}
            <div>
              <p className="text-xs font-bold text-slate-400 font-mono uppercase mb-2">Select Battle Target Category</p>
              <div className="flex justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      category === cat.id
                        ? "bg-rose-500 text-white border border-rose-500"
                        : "bg-white/40 border border-sky-100 text-slate-600 hover:border-sky-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startBattle}
              className="mt-4 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-rose-400 to-purple-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.15)] hover:scale-105 transition"
            >
              Initialize Simulation
            </button>
          </div>
        </section>
      )}

      {/* Active Battle Board */}
      {(isRunning || battleFinished) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Agent A & Agent B Hologram details */}
          <div className="flex flex-col gap-6">
            {/* Agent A Details */}
            <div className="glass-panel border-white/60 rounded-3xl p-5 relative overflow-hidden flex items-center gap-4 bg-white/60">
              <div className="absolute top-2 left-2 text-[8px] font-mono text-purple-600 font-bold">
                AGENT A: THE GUESSER
              </div>
              <Avatar expression={battleFinished ? "victory" : loading ? "thinking" : "confident"} size={100} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 mb-1">AkiGuesser AI</h4>
                <div className="bg-white/50 p-2 rounded-lg border border-sky-100/50 h-16 flex items-center">
                  <p className="text-[10px] text-slate-600 font-mono italic leading-relaxed">
                    &ldquo;{rounds[rounds.length - 1]?.commentaryA || "Awaiting target prompt initialization..."}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-mono text-slate-400">Confidence:</span>
                  <span className="text-[10px] font-mono font-bold text-purple-600">
                    {rounds[rounds.length - 1]?.confidenceA || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Agent B Details */}
            <div className="glass-panel border-white/60 rounded-3xl p-5 relative overflow-hidden flex items-center gap-4 bg-white/60">
              <div className="absolute top-2 left-2 text-[8px] font-mono text-sky-600 font-bold">
                AGENT B: THE FORECASTER
              </div>
              <Avatar expression={battleFinished ? "victory" : loading ? "thinking" : "happy"} size={100} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 mb-1">AkiPredictor AI</h4>
                <div className="bg-white/50 p-2 rounded-lg border border-sky-100/50 h-16 flex items-center">
                  <p className="text-[10px] text-slate-600 font-mono italic leading-relaxed">
                    &ldquo;{rounds[rounds.length - 1]?.commentaryB || "Listening to Agent A's signal waves..."}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-mono text-slate-400">System Accuracy:</span>
                  <span className="text-[10px] font-mono font-bold text-sky-600">
                    High Sync
                  </span>
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="glass-panel border-white/50 rounded-3xl p-4 flex flex-col gap-2 bg-white/40">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                <span>SIMULATION CONTROLLER</span>
                <span className="text-sky-600 animate-pulse">
                  {loading ? "PROCESSING" : "READY"}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  disabled={battleFinished}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                    autoPlay
                      ? "bg-rose-500/15 border-rose-400 text-rose-600"
                      : "bg-white/45 border-sky-200 text-slate-700"
                  }`}
                >
                  {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{autoPlay ? "Pause Auto" : "Auto Play"}</span>
                </button>

                <button
                  onClick={() => simulateNextRound()}
                  disabled={loading || battleFinished || autoPlay}
                  className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-30 shadow-sm"
                >
                  <span>Step Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={startBattle}
                className="w-full py-2 bg-white/50 border border-slate-200 hover:bg-white/70 text-slate-700 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Simulation</span>
              </button>
            </div>
          </div>

          {/* Right/Center panel: Live Dual-Log and Predictions details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Victory card overlay if finished */}
            {battleFinished && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel border-amber-300 rounded-3xl p-6 shadow-md text-center bg-white/60"
              >
                <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2 animate-spin" />
                <h3 className="text-lg font-black text-slate-800">DUEL SIMULATION COMPLETE</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Agent A parsed the elimination tree and locked target after {rounds.length} deliveries.
                </p>
                <div className="text-xl font-black text-amber-700 tracking-widest my-4 uppercase">
                  Target: {winnerName}
                </div>
                <button
                  onClick={startBattle}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition shadow-sm"
                >
                  Simulate New Battle
                </button>
              </motion.div>
            )}

            {/* Live Round Logs */}
            <div className="glass-panel border-white/60 rounded-3xl p-6 flex flex-col flex-1 min-h-[450px] bg-white/50">
              <div className="flex items-center justify-between border-b border-sky-100/50 pb-4 mb-4">
                <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wider">
                  Live Battle Transcript
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  DELIVERY {rounds.length} / 12
                </span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-2">
                {rounds.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-mono">
                      No rounds recorded. Click "Initialize Simulation" to launch.
                    </p>
                  </div>
                )}

                {rounds.map((round, idx) => (
                  <div
                    key={`round-${idx}`}
                    className="p-4 rounded-2xl bg-white/40 border border-sky-100/50 hover:border-sky-300/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>ROUND {idx + 1}</span>
                      <span className="text-purple-600">Confidence: {round.confidenceA}%</span>
                    </div>

                    {/* Question proposed by A */}
                    <div className="flex gap-2.5 items-start">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                        A
                      </span>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">Guesser Question:</span>
                        <p className="text-xs text-slate-800 font-medium">{round.question}</p>
                      </div>
                    </div>

                    {/* Agent B's forecast prediction comparison */}
                    <div className="flex gap-2.5 items-start border-t border-sky-100/40 pt-2.5">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 shrink-0 mt-0.5">
                        B
                      </span>
                      <div className="flex-1">
                        <span className="text-[9px] font-mono text-slate-400 block">Forecaster Predict:</span>
                        <p className="text-xs text-slate-600 italic">&ldquo;{round.prediction}&rdquo;</p>
                      </div>

                      {/* Sync Match visual status badges */}
                      <div className="shrink-0 mt-1">
                        {getPredictionMatch(round) === "perfect" ? (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-200/50 px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                            <Check className="w-3 h-3" /> SYNCED
                          </span>
                        ) : getPredictionMatch(round) === "close" ? (
                          <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100 border border-amber-200/50 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> MATCH
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-red-600 bg-red-100 border border-red-200/50 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <X className="w-3 h-3" /> MISS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Animated typing dots for loading */}
                {loading && (
                  <div className="p-4 rounded-2xl bg-white/30 border border-sky-100/50 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Agent reasoning logs uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
