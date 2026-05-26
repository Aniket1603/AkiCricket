"use client";

import React, { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";

interface ShareCardProps {
  playerName: string;
  category: string;
  questionCount: number;
  cricketIQ: number;
  wasVictory: boolean;
  targetName: string;
  streak?: number;
  confidence?: number;
}

export default function ShareCard({
  playerName,
  category,
  questionCount,
  cricketIQ,
  wasVictory,
  targetName,
  streak = 0,
  confidence = 90,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 450;

    // 1. Background Gradient (Light Sky Blue to White)
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 450);
    bgGrad.addColorStop(0, "#e0f2fe"); // sky-100
    bgGrad.addColorStop(0.6, "#f0f9ff"); // sky-50
    bgGrad.addColorStop(1, "#ffffff");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 450);

    // 2. Draw Subtle Grid Lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 3. Elegant Outer Border
    ctx.strokeStyle = wasVictory ? "#eab308" : "#38bdf8";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 10;
    ctx.shadowColor = wasVictory ? "rgba(234, 179, 8, 0.25)" : "rgba(56, 189, 248, 0.25)";
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Reset shadow for text
    ctx.shadowBlur = 0;

    // 4. Draw AkiCricket branding
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px monospace";
    ctx.fillText("AKICRICKET AI", 40, 50);

    ctx.fillStyle = "#0284c7";
    ctx.font = "14px monospace";
    ctx.fillText("THE ULTIMATE IPL MIND READER", 40, 75);

    // Draw a small decorative glass badge
    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(730, 55, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0369a1";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AI", 730, 59);

    // 5. Main Title & Subtitle
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";

    if (wasVictory) {
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("I Defeated the Mind Reader!", 40, 150);

      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("I was thinking of:", 40, 190);

      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#b45309"; // amber-700
      ctx.fillText(targetName, 40, 235);
    } else {
      ctx.font = "bold 38px sans-serif";
      ctx.fillStyle = "#0369a1";
      ctx.fillText("Mind Reader Wins Again!", 40, 150);

      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("AI guessed my thoughts:", 40, 190);

      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#be123c"; // rose-700
      ctx.fillText(targetName, 40, 235);
    }

    // 6. Stats Cards (Right side - stacked 4 rows)
    const cardX = 500;
    const cardWidth = 250;
    const cardHeight = 60;
    const padding = 12;

    const stats = [
      { label: "QUESTIONS ASKED", val: `${questionCount} / 15`, color: "#0284c7" },
      { label: "CRICKET IQ SCORE", val: cricketIQ.toString(), color: "#10b981" },
      { label: "CURRENT WIN STREAK", val: `${streak} Wins`, color: "#f59e0b" },
      { label: "FINAL AI CONFIDENCE", val: `${confidence}%`, color: "#8b5cf6" },
    ];

    stats.forEach((stat, i) => {
      const cardY = 100 + i * (cardHeight + padding);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.fillText(stat.label, cardX + 15, cardY + 22);

      ctx.fillStyle = stat.color;
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(stat.val, cardX + 15, cardY + 48);
    });

    // 7. Footer details
    ctx.fillStyle = "#64748b";
    ctx.font = "14px monospace";
    ctx.fillText(`Player: ${playerName}`, 40, 360);
    ctx.fillText(`Category: ${category.toUpperCase()}`, 40, 385);

    ctx.textAlign = "right";
    ctx.fillText("akicricket-ai.web.app", 750, 415);

    // Save as image url
    setImageUrl(canvas.toDataURL("image/png"));
  };

  const handleDownload = () => {
    generateCard();
    // Tiny delay to ensure URL is updated
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = `akicricket_score_${questionCount}_q.png`;
      link.href = canvasRef.current?.toDataURL("image/png") || "";
      link.click();
    }, 100);
  };

  return (
    <div className="flex flex-col items-center w-full gap-4 mt-6">
      {/* Hidden canvas used to compile PNG */}
      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 w-full max-w-xs px-6 py-3 rounded-xl font-bold transition-all duration-300 border bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white border-[#38BDF8]/50 shadow-[0_4px_12px_rgba(56,189,248,0.2)] hover:scale-105"
      >
        <Download className="w-5 h-5" />
        <span>Download Share Card</span>
      </button>

      <div className="flex gap-2 justify-center w-full">
        {/* Twitter share helper */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `I ${wasVictory ? "defeated" : "battled"} AkiCricket AI in ${questionCount} questions! My Cricket IQ is ${cricketIQ}. Try it yourself at AkiCricket AI!`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#0369a1] hover:underline flex items-center gap-1 bg-[#38bdf8]/10 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20"
        >
          <Share2 className="w-3.5 h-3.5" /> Share to Twitter
        </a>
      </div>
    </div>
  );
}
