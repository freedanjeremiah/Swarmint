"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { agents } from "@/config/agents";

interface SwarmPreviewProps {
  selectedAgents: string[];
  hoveredAgent: string | null;
  setHoveredAgent: (agentId: string | null) => void;
}

interface Position {
  x: number;
  y: number;
  scale: number;
}

const FORMATION_CONFIG = {
  agentScale: 1,
  centerScale: 1.1,
  defaultSpacing: 120,
  yOffset: -50,
  rotationDegree: 15,
};

const SwarmPreview: React.FC<SwarmPreviewProps> = ({
  selectedAgents = [],
  hoveredAgent,
  setHoveredAgent,
}) => {
  const [dimensions, setDimensions] = React.useState({
    width: 1000,
    height: 600,
  });

  React.useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const getAgentPosition = (index: number, total: number): Position => {
    if (total <= 1) return { x: 0, y: 0, scale: 1.2 };

    const formations = {
      2: [
        { x: -FORMATION_CONFIG.defaultSpacing, y: 0, scale: 1.1 },
        { x: FORMATION_CONFIG.defaultSpacing, y: 0, scale: 1.1 },
      ],
      3: [
        { x: -FORMATION_CONFIG.defaultSpacing, y: 20, scale: 1 },
        { x: 0, y: -FORMATION_CONFIG.yOffset, scale: 1.2 },
        { x: FORMATION_CONFIG.defaultSpacing, y: 20, scale: 1 },
      ],
      4: [
        { x: -FORMATION_CONFIG.defaultSpacing * 1.5, y: 20, scale: 0.9 },
        {
          x: -FORMATION_CONFIG.defaultSpacing * 0.5,
          y: -FORMATION_CONFIG.yOffset,
          scale: 1,
        },
        {
          x: FORMATION_CONFIG.defaultSpacing * 0.5,
          y: -FORMATION_CONFIG.yOffset,
          scale: 1,
        },
        { x: FORMATION_CONFIG.defaultSpacing * 1.5, y: 20, scale: 0.9 },
      ],
      5: [
        { x: -FORMATION_CONFIG.defaultSpacing * 2, y: 30, scale: 0.85 },
        {
          x: -FORMATION_CONFIG.defaultSpacing,
          y: -FORMATION_CONFIG.yOffset,
          scale: 0.95,
        },
        { x: 0, y: -80, scale: 1.1 },
        {
          x: FORMATION_CONFIG.defaultSpacing,
          y: -FORMATION_CONFIG.yOffset,
          scale: 0.95,
        },
        { x: FORMATION_CONFIG.defaultSpacing * 2, y: 30, scale: 0.85 },
      ],
    };

    const formation = formations[total as keyof typeof formations];
    if (formation?.[index]) {
      return formation[index];
    }

    // Default circular formation for larger groups
    const angle = (2 * Math.PI * index) / total;
    const radius = FORMATION_CONFIG.defaultSpacing * 2;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle) * 0.4 - FORMATION_CONFIG.yOffset,
      scale: 0.9,
    };
  };

  return (
    <div className="relative min-h-[400px] rounded-xl overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-cyan-900/20 to-purple-900/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:32px_32px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:16px_16px] opacity-50" />
      </div>

      {/* Energy circle effect */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            "radial-gradient(circle at center, rgba(34, 211, 238, 0.15) 0%, transparent 70%)",
            "radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main content */}
      <div className="relative h-full flex items-center justify-center perspective-[2000px]">
        {selectedAgents.length === 0 ? (
          <motion.div
            className="text-center space-y-4"
            animate={{
              y: [100, -2, 100],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="text-6xl mb-4">🤖</div>
            <div className="text-2xl text-gray-400">
              Select agents to build your swarm
            </div>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-500/20"
                initial={{ width: 100, height: 100 }}
                animate={{
                  width: [100, 300],
                  height: [100, 300],
                  opacity: [0.5, 0],
                  scale: [1, 1.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <div className="relative w-full h-full">
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {selectedAgents.map((agentId, i) =>
                selectedAgents.map((targetId, j) => {
                  if (i >= j) return null;
                  const pos1 = getAgentPosition(i, selectedAgents.length);
                  const pos2 = getAgentPosition(j, selectedAgents.length);
                  const centerX = dimensions.width / 2;
                  const centerY = dimensions.height / 2;

                  return (
                    <motion.line
                      key={`${agentId}-${targetId}`}
                      x1={centerX + pos1.x}
                      y1={centerY + pos1.y}
                      x2={centerX + pos2.x}
                      y2={centerY + pos2.y}
                      stroke="url(#gradient-line)"
                      strokeWidth="2"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  );
                })
              )}
              <defs>
                <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
            </svg>

            {/* Agents */}
            {selectedAgents.map((agentId, index) => {
              const agent = agents.find((a) => a.id === agentId);
              if (!agent) return null;

              const position = getAgentPosition(index, selectedAgents.length);
              const isHovered = hoveredAgent === agentId;
              const centerIndex = Math.floor(selectedAgents.length / 2);
              const isCenterAgent = index === centerIndex;

              return (
                <motion.div
                  key={agentId}
                  className="absolute left-1/2 top-1/2 w-[200px] h-[250px] cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: isHovered ? position.scale * 1.2 : position.scale,
                    x:
                      position.x -
                      50 +
                      (isHovered ? (position.x > 0 ? 20 : -20) : 0),
                    y: position.y + 50 + (isHovered ? -20 : 0),
                    rotateY: isHovered ? -FORMATION_CONFIG.rotationDegree : 0,
                    zIndex: isHovered ? 50 : isCenterAgent ? 30 : index,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  onHoverStart={() => setHoveredAgent(agentId)}
                  onHoverEnd={() => setHoveredAgent(null)}
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 
                      blur-xl rounded-full"
                    animate={{
                      opacity: isHovered
                        ? [0.4, 0.8, 0.4]
                        : isCenterAgent
                        ? [0.2, 0.4, 0.2]
                        : 0,
                      scale: isHovered ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />

                  {/* Agent image */}
                  <motion.div
                    className="relative"
                    animate={
                      isHovered
                        ? {
                            y: [0, -10, 0],
                          }
                        : isCenterAgent
                        ? {
                            y: [0, -5, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: isHovered ? 2 : 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Image
                      src={agent.avatarUrl}
                      alt={agent.name}
                      width={200}
                      height={250}
                      className="object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                      priority
                    />
                  </motion.div>

                  {/* Agent name */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                          text-sm whitespace-nowrap"
                      >
                        <div
                          className="px-3 py-1 rounded-full 
                          bg-gradient-to-r from-purple-500/90 to-cyan-500/90
                          border border-white/20 backdrop-blur-sm
                          text-white font-medium shadow-lg"
                        >
                          {agent.name}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Power-up effects */}
            {hoveredAgent && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/50 rounded-full"
                    initial={{
                      x: "50%",
                      y: "50%",
                      scale: 0,
                    }}
                    animate={{
                      x: ["50%", `${Math.random() * 100}%`],
                      y: ["50%", `${Math.random() * 100}%`],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: Math.random() * 2 + 1,
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwarmPreview;
