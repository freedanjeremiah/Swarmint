"use client";

import React, { useState, useEffect } from "react";

const OptimizedBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2c1250_0%,#000000_100%)]" />

      {/* Grid using CSS animation */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:16px_16px] opacity-50" />
      </div>

      {/* Reduced number of particles using CSS animations */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-1 h-1 rounded-full
              ${i % 2 === 0 ? "bg-purple-400/40" : "bg-cyan-400/40"}
              animate-float-up
            `}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 5 + 5}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs using CSS animations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-delayed" />

      {/* Scanlines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#00000015,#00000015_1px,transparent_1px,transparent_2px)]" />
    </div>
  );
};

export default OptimizedBackground;
