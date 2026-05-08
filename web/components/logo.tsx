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

const LogoComponent: React.FC<LogoComponentProps> = ({ size = "large" }) => {
  return (
    <motion.div
      className="relative cursor-pointer p-2"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg" />

      {/* Main logo container */}
      <div className="relative flex flex-col items-center">
        {/* Top row: block ch n */}
        <div className="flex items-center justify-between w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <span
              className={`${sizeClasses[size]} font-pixel font-bold text-purple-500 
              drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] relative z-10`}
            >
              block
            </span>
            <span
              className={`${sizeClasses[size]} font-pixel font-bold text-cyan-400 
              absolute left-[2px] top-[2px] opacity-80 z-0`}
            >
              block
            </span>
          </motion.div>

          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <span
                className={`${sizeClasses[size]} font-pixel font-bold text-cyan-400 
                drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10`}
              >
                ch
              </span>
              <span
                className={`${sizeClasses[size]} font-pixel font-bold text-purple-500 
                absolute left-[2px] top-[2px] opacity-80 z-0`}
              >
                ch
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative pl-44"
            >
              <span
                className={`${sizeClasses[size]} font-pixel font-bold text-cyan-400
                drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] relative z-10`}
              >
                n
              </span>
              <span
                className={`${sizeClasses[size]} font-pixel font-bold  text-purple-500 
                absolute left-[2px] top-[2px] opacity-80 z-0  pl-44 `}
              >
                n
              </span>
            </motion.div>
          </div>
        </div>

        {/* Bottom row: AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative pl-96 -mt-10 -ml-4" // Adjusted spacing
        >
          <span
            className={`${sizeClasses[size]} font-pixel font-bold text-purple-500 
            drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10`}
          >
            AI
          </span>
          <span
            className={`${sizeClasses[size]} font-pixel font-bold text-cyan-400 
            absolute left-[2px] top-[2px] opacity-80 z-0 pl-96`}
          >
            AI
          </span>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          className="w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 mt-2 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />
      </div>

      {/* Animated glitch effect */}
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
