"use client";

import React from "react";
import { motion } from "framer-motion";

type LogoSize = "small" | "medium" | "large";

interface LogoComponentProps {
  size?: LogoSize;
}

const sizeClasses: Record<LogoSize, string> = {
  small: "text-2xl",
  medium: "text-4xl",
  large: "text-6xl",
};

const segments = [
  {
    text: "sw",
    primary: "text-purple-500",
    shadow: "text-cyan-400",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  },
  {
    text: "A",
    primary: "text-cyan-400",
    shadow: "text-purple-500",
    glow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]",
  },
  {
    text: "rm",
    primary: "text-purple-500",
    shadow: "text-cyan-400",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  },
  {
    text: "I",
    primary: "text-cyan-400",
    shadow: "text-purple-500",
    glow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]",
  },
  {
    text: "nt",
    primary: "text-purple-500",
    shadow: "text-cyan-400",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  },
];

const LogoComponent: React.FC<LogoComponentProps> = ({ size = "large" }) => {
  const cls = sizeClasses[size];

  return (
    <motion.div
      className="relative cursor-pointer p-2"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg" />

      <div className="relative flex flex-col items-center">
        {/* Single-row logo */}
        <div className="flex items-baseline">
          {segments.map(({ text, primary, shadow, glow }, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <span
                className={`${cls} font-pixel font-bold ${primary} ${glow} relative z-10`}
              >
                {text}
              </span>
              {/* Chromatic aberration offset */}
              <span
                className={`${cls} font-pixel font-bold ${shadow} absolute left-[2px] top-[2px] opacity-80 z-0`}
              >
                {text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Decorative gradient line */}
        <motion.div
          className="w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 mt-2 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />
      </div>

      {/* Animated glitch overlay */}
      <motion.div
        animate={{
          opacity: [0, 0.2, 0],
          x: [-2, 2, -2],
          transition: {
            duration: 0.4,
            repeat: Infinity,
            repeatType: "reverse",
          },
        }}
        className="absolute inset-0 bg-cyan-400/20"
      />
    </motion.div>
  );
};

export default LogoComponent;
