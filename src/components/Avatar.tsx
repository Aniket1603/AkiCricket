"use client";

import React from "react";
import { motion } from "framer-motion";

export type AvatarExpression = "thinking" | "confident" | "happy" | "shocked" | "victory";

interface AvatarProps {
  expression: AvatarExpression;
  size?: number;
}

export default function Avatar({ expression, size = 150 }: AvatarProps) {
  // Visor eye path/elements based on expression
  const renderVisorEyes = () => {
    switch (expression) {
      case "thinking":
        return (
          <g>
            {/* Spinning/pulsing thinking dots */}
            <motion.circle
              cx="45"
              cy="50"
              r="4"
              fill="#c084fc"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            />
            <motion.circle
              cx="55"
              cy="50"
              r="4"
              fill="#c084fc"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
            />
            <motion.circle
              cx="65"
              cy="50"
              r="4"
              fill="#c084fc"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
            />
          </g>
        );
      case "confident":
        return (
          <g>
            {/* Sleek confident digital line eyes */}
            <motion.rect
              x="42"
              y="47"
              width="10"
              height="4"
              rx="2"
              fill="#38bdf8"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
            />
            <motion.rect
              x="58"
              y="47"
              width="10"
              height="4"
              rx="2"
              fill="#38bdf8"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
            />
            {/* Determined eyebrows */}
            <path d="M 40 43 L 52 45" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d="M 70 43 L 58 45" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case "happy":
        return (
          <g>
            {/* Happy curved eyes */}
            <path
              d="M 40 50 Q 47 42 54 50"
              stroke="#10b981"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="transparent"
            />
            <path
              d="M 56 50 Q 63 42 70 50"
              stroke="#10b981"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="transparent"
            />
            {/* Subtle digital blushing cheeks */}
            <circle cx="36" cy="54" r="3" fill="#10b981" opacity="0.4" filter="blur(1px)" />
            <circle cx="74" cy="54" r="3" fill="#10b981" opacity="0.4" filter="blur(1px)" />
          </g>
        );
      case "shocked":
        return (
          <g>
            {/* Wide shocked circles */}
            <motion.circle
              cx="45"
              cy="50"
              r="6.5"
              fill="#f97316"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <motion.circle
              cx="65"
              cy="50"
              r="6.5"
              fill="#f97316"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          </g>
        );
      case "victory":
        return (
          <g>
            {/* Star or blinking happy eyes for victory */}
            <path
              d="M 40 48 L 45 52 L 50 48"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
            />
            <path
              d="M 60 48 L 65 52 L 70 48"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
            />
            {/* Victory sparks */}
            <path d="M 45 40 L 45 37" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <path d="M 65 40 L 65 37" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  };

  // Visor glow color
  const getGlowColor = () => {
    switch (expression) {
      case "thinking":
        return "rgba(167, 139, 250, 0.4)";
      case "confident":
        return "rgba(56, 189, 248, 0.4)";
      case "happy":
        return "rgba(16, 185, 129, 0.4)";
      case "shocked":
        return "rgba(249, 115, 22, 0.4)";
      case "victory":
        return "rgba(245, 158, 11, 0.4)";
    }
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Orb Ambient Glow */}
      <motion.div
        className="absolute rounded-full filter blur-[20px] opacity-40 transition-all duration-700"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          backgroundColor: getGlowColor(),
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
      />

      {/* Floating Glass Orb SVG */}
      <motion.svg
        viewBox="0 0 110 110"
        className="w-full h-full relative z-10 drop-shadow-lg"
        animate={{
          y: [-3, 3, -3],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
        }}
      >
        <defs>
          {/* Metallic helmet gradient */}
          <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Pedestal Gradient */}
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </linearGradient>

          {/* Glass sphere radial shading */}
          <radialGradient id="glassSphere" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="45%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="85%" stopColor="rgba(56, 189, 248, 0.05)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.2)" />
          </radialGradient>

          {/* Glass reflection gradient */}
          <linearGradient id="glare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* 1. Behind the Robot: Inner Orb Glow and Rays */}
        <circle cx="55" cy="50" r="44" fill="rgba(255, 255, 255, 0.3)" />
        
        {/* 2. Frosted Base/Pedestal */}
        <ellipse
          cx="55"
          cy="92"
          rx="32"
          ry="8"
          fill="url(#pedestalGrad)"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1"
        />
        <ellipse cx="55" cy="94" rx="20" ry="4" fill="rgba(56, 189, 248, 0.2)" filter="blur(1px)" />

        {/* 3. The Robot Analyst Head */}
        <g id="robot-analyst">
          {/* Ears/Side Bolts */}
          <rect x="25" y="44" width="6" height="12" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <rect x="79" y="44" width="6" height="12" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

          {/* Antenna */}
          <line x1="55" y1="28" x2="55" y2="20" stroke="#cbd5e1" strokeWidth="2.5" />
          <motion.circle
            cx="55"
            cy="18"
            r="3"
            fill={
              expression === "thinking"
                ? "#c084fc"
                : expression === "confident"
                ? "#38bdf8"
                : expression === "happy"
                ? "#10b981"
                : expression === "shocked"
                ? "#f97316"
                : "#f59e0b"
            }
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
            }}
          />

          {/* Main Helmet Head */}
          <rect
            x="29"
            y="26"
            width="52"
            height="48"
            rx="24"
            fill="url(#metallic)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Dark Glass Visor Screen */}
          <rect x="35" y="38" width="40" height="24" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* Visor digital expressions */}
          {renderVisorEyes()}

          {/* Cute neck collar */}
          <path d="M 45 74 L 65 74 L 62 82 L 48 82 Z" fill="#94a3b8" />
        </g>

        {/* 4. Glass Sphere Top Layer (Gives the glass lens effect) */}
        <circle
          cx="55"
          cy="50"
          r="44"
          fill="url(#glassSphere)"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth="1.5"
        />

        {/* 5. Curved Glare Highlight on Top Left of Orb */}
        <path
          d="M 20 30 Q 30 14 55 10 Q 75 12 85 20 Q 70 18 55 18 Q 35 20 20 30 Z"
          fill="url(#glare)"
        />

        {/* 6. Subtle reflection point at the bottom right */}
        <ellipse
          cx="78"
          cy="78"
          rx="6"
          ry="3"
          transform="rotate(-40 78 78)"
          fill="rgba(255, 255, 255, 0.2)"
        />
      </motion.svg>
    </div>
  );
}
