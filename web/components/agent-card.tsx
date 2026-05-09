"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Agent } from "@/types/agents";

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group rounded-xl overflow-hidden cursor-pointer min-h-[500px]"
      onClick={() => onClick?.(agent)}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-cyan-900/20 to-purple-900/20" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-purple-500/50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-purple-500/50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl" />

      {/* Main content container */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Agent Type Badge */}
        <div
          className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 
          rounded-full border border-purple-500/30 text-xs font-medium text-cyan-300 backdrop-blur-sm"
        >
          {agent.type}
        </div>

        {/* Avatar container with effects */}
        <div className="relative w-full h-[250px] mb-6">
          {/* Glow effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div
            className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
          />

          {/* Avatar image */}
          <div className="relative h-full w-full">
            <Image
              src={agent.avatarUrl}
              alt={agent.name}
              width={250}
              height={250}
              className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              priority
            />
          </div>

          {/* Scanlines effect */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_3px)] opacity-20" />
        </div>

        {/* Content section */}
        <div className="flex-1 space-y-4 z-10">
          {/* Name and description */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-wide">
              <span
                className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 
                bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"
              >
                {agent.name}
              </span>
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {agent.description}
            </p>
          </div>

          {/* Capabilities section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-cyan-300/80">
              Capabilities
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.slice(0, 3).map((cap, i) => (
                <motion.span
                  key={cap.name}
                  className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-sm
                    ${
                      i % 2 === 0
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:border-purple-500/50"
                        : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50"
                    }
                    transition-all duration-300 hover:scale-105 cursor-help
                    shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                  whileHover={{ y: -2 }}
                  title={cap.description}
                >
                  {cap.name.replace("Capability", "")}
                </motion.span>
              ))}
              {agent.capabilities.length > 3 && (
                <motion.span
                  className="text-xs px-3 py-1.5 rounded-full 
                    bg-gray-500/10 text-gray-300 border border-gray-500/30
                    hover:border-gray-500/50 transition-all duration-300
                    shadow-[0_0_10px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                  whileHover={{ y: -2 }}
                >
                  +{agent.capabilities.length - 3} more
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Hover reveal line effect */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default AgentCard;
