"use client";

import React, { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Large floating blobs
    const blobs = [
      {
        x: width * 0.2,
        y: height * 0.3,
        r: Math.min(width, height) * 0.35,
        vx: 0.25,
        vy: 0.15,
        color: "rgba(56, 189, 248, 0.22)", // Sky Blue
      },
      {
        x: width * 0.8,
        y: height * 0.7,
        r: Math.min(width, height) * 0.4,
        vx: -0.2,
        vy: -0.18,
        color: "rgba(167, 139, 250, 0.18)", // Soft Violet
      },
      {
        x: width * 0.5,
        y: height * 0.5,
        r: Math.min(width, height) * 0.3,
        vx: 0.15,
        vy: -0.25,
        color: "rgba(251, 207, 232, 0.15)", // Pale Pink
      },
    ];

    // Bubbles
    const bubbleCount = 30;
    const bubbles: {
      x: number;
      y: number;
      r: number;
      speed: number;
      opacity: number;
      wobble: number;
      wobbleSpeed: number;
    }[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height + height,
        r: Math.random() * 6 + 3,
        speed: Math.random() * 0.6 + 0.3,
        opacity: Math.random() * 0.25 + 0.15,
        wobble: Math.random() * 100,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient just in case body is transparent
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#f0f9ff"); // Sky 50
      grad.addColorStop(1, "#e0f2fe"); // Sky 100
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw blobs
      blobs.forEach((blob) => {
        // Move blobs
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce blobs off walls
        if (blob.x - blob.r < -100 || blob.x + blob.r > width + 100) blob.vx *= -1;
        if (blob.y - blob.r < -100 || blob.y + blob.r > height + 100) blob.vy *= -1;

        // Draw radial gradient for blob (simulating blur)
        const blobGrad = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.r
        );
        blobGrad.addColorStop(0, blob.color);
        blobGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = blobGrad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw rising glass-like bubbles
      bubbles.forEach((bubble) => {
        bubble.y -= bubble.speed;
        bubble.wobble += bubble.wobbleSpeed;

        const currentX = bubble.x + Math.sin(bubble.wobble) * 15;

        // Recycle bubble when it goes off screen
        if (bubble.y < -20) {
          bubble.y = height + Math.random() * 50;
          bubble.x = Math.random() * width;
        }

        // Draw bubble body
        ctx.beginPath();
        ctx.arc(currentX, bubble.y, bubble.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 1.5})`;
        ctx.lineWidth = 0.5;
        ctx.fill();
        ctx.stroke();

        // Highlight glint inside bubble
        ctx.beginPath();
        ctx.arc(
          currentX - bubble.r * 0.3,
          bubble.y - bubble.r * 0.3,
          bubble.r * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 2})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none"
    />
  );
}
