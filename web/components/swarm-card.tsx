"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import CyberButton from "@/components/cyberButton";
import { Swarm } from "@/types/agents";
import { getAgent } from "@/config/agents";

interface SwarmCardProps {
  swarm: Swarm;
  onClick?: (swarm: Swarm) => void;
}

const SwarmCard: React.FC<SwarmCardProps> = ({ swarm, onClick }) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group rounded-xl overflow-hidden min-h-[500px]"
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
      <div className="relative h-full p-6">
        {/* Agents Preview with 3D effect */}
        <div className="relative h-[280px] flex items-center justify-center mb-6 perspective-[2000px]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-[1]" />

          <div className="relative w-full h-full flex items-center justify-center">
            {swarm.agents.map((agentId, index) => {
              const agent = getAgent(agentId);
              if (!agent) return null;

              const baseX = -25 * (swarm.agents.length - 1) + 50 * index;
              const isHovered = hoveredAgent === agentId;

              return (
                <motion.div
                  key={agentId}
                  className="absolute w-[200px] h-[250px] cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    zIndex: isHovered ? 50 : swarm.agents.length - index,
                  }}
                  initial={{ x: baseX, scale: 0.9, rotateY: 0, z: 0 }}
                  animate={{
                    x: isHovered ? baseX - 15 : baseX,
                    scale: isHovered ? 1.1 : 0.9,
                    rotateY: isHovered ? -15 : 0,
                    z: isHovered ? 50 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onHoverStart={() => setHoveredAgent(agentId)}
                  onHoverEnd={() => setHoveredAgent(null)}
                >
                  {/* Glow effect on hover */}
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 
                      blur-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Agent image */}
                  <div className="relative">
                    <Image
                      src={agent.avatarUrl}
                      alt={agent.name}
                      width={200}
                      height={250}
                      className="object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      priority
                    />
                  </div>

                  {/* Agent name below image */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[24px] left-1/2 transform -translate-x-1/2 
                          text-xs text-cyan-300 font-medium text-center whitespace-nowrap "
                      >
                        {agent.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Rest of the card content... */}
        <div className="space-y-4 z-10 relative">
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-wide text-center ">
              <span
                className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 
                bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"
              >
                {swarm.name}
              </span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed w-3/4 text-center mx-auto">
              {swarm.description}
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-purple-500/20 flex-col gap-4">
            <div className="text-sm">
              <span className="text-cyan-300/80">
                {swarm.agents.length} Agents
              </span>
              {/* <span className="mx-2 text-gray-500">•</span> */}
            </div>
            <div className="text-xs text-center">
              <span className="text-purple-300/80">
                Last active:{" "}
                {new Date(swarm.lastActive || Date.now()).toLocaleString()}
              </span>
            </div>
            <CyberButton
              cyberSize="default"
              onClick={() => onClick?.(swarm)}
              variant="outline"
              glowColor="gradient"
            >
              Enter Swarm
            </CyberButton>
          </div>
        </div>

        {/* Scanlines effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_3px)] opacity-20" />
      </div>
    </motion.div>
  );
};

export default SwarmCard;
