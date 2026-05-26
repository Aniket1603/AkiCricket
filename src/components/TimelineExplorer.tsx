"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TimelineData } from "@/lib/gemini";
import { Calendar, HelpCircle, Loader2, Sparkles, Trophy } from "lucide-react";

interface TimelineExplorerProps {
  target: string;
  category: string;
}

export default function TimelineExplorer({ target, category }: TimelineExplorerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        const res = await fetch("/api/timeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, category }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to generate timeline");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (target) {
      fetchTimeline();
    }
  }, [target, category]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/45 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-mono">
          Gemini generating career timeline...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center bg-rose-50/50 rounded-2xl border border-rose-200 shadow-sm">
        <HelpCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-600 font-mono">
          Could not load player history. Let's research manually!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white/45 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 tracking-wide">
          {data.title}
        </h3>
      </div>
      <p className="text-sm text-sky-600 font-mono mb-6">{data.subtitle}</p>

      {/* Timeline Steps */}
      <div className="relative border-l-2 border-sky-100 ml-3 pl-6 space-y-6 mb-6">
        {data.items.map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            key={`timeline-item-${idx}`}
            className="relative"
          >
            {/* Timeline node */}
            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            </span>

            {/* Content card */}
            <div className="bg-white/50 rounded-xl p-3.5 border border-sky-100/50 hover:border-sky-300 transition-all">
              <span className="inline-block text-xs font-bold font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100 mb-2">
                {item.year}
              </span>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                {item.event}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.details}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fun Fact Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 flex gap-3 items-start"
      >
        <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-sky-600 uppercase tracking-wider font-mono mb-1">
            Gemini Fun Fact
          </h5>
          <p className="text-xs text-slate-600 italic leading-relaxed">
            &ldquo;{data.funFact}&rdquo;
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
