"use client";

import React from "react";
import { motion } from "framer-motion";
import CyberButton from "@/components/cyberButton";

const CreateSwarmCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group rounded-xl overflow-hidden min-h-[500px] cursor-pointer"
      onClick={onClick}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-cyan-900/20 to-purple-900/20" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-purple-500/50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-purple-500/50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl" />

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 space-y-6">
        {/* Animated plus icon */}
        <motion.div
          className="relative w-24 h-24 mb-4"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-xl" />
          <div className="relative w-full h-full border-2 border-cyan-500/50 rounded-full flex items-center justify-center">
            <span className="text-4xl text-cyan-400">+</span>
          </div>
        </motion.div>

        <h3 className="text-2xl font-bold">
          <span
            className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 
            bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"
          >
            Create New Swarm
          </span>
        </h3>

        <p className="text-gray-300 text-center max-w-sm">
          Combine multiple agents to create a powerful AI swarm. Mix and match
          capabilities for maximum efficiency.
        </p>

        {/* Animated placeholder agents */}
        <div className="relative w-full h-24">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 
                rounded-full border border-purple-500/30"
              initial={{ x: i * 60 - 30, opacity: 0.3 }}
              animate={{
                x: i * 60 - 100,
                y: [0, -10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                },
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                },
              }}
              style={{
                left: "50%",
                transform: `translateX(${i * 60 - 90}px)`,
              }}
            />
          ))}
        </div>

        <CyberButton cyberSize="lg" glowColor="gradient" className="mt-4">
          Create Swarm
        </CyberButton>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 border border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default CreateSwarmCard;
