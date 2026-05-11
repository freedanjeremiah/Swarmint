"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";

export default function LandingPage() {
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setIsMounted(true);
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2563eb15_0%,transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#7c3aed15_0%,transparent_50%)] animate-pulse delay-75" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div className="absolute inset-0">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 ${
              i % 2 === 0 ? "bg-purple-400/40" : "bg-cyan-400/40"
            } rounded-full`}
            initial={{
              x: (i * 37) % windowSize.width,
              y: (i * 53) % windowSize.height,
            }}
            animate={{
              y: [null, -windowSize.height],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: (i % 5) + 3,
              repeat: Infinity,
              delay: (i % 7) * 0.4,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 space-y-16">
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="relative p-8 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-400/10 to-purple-500/10 rounded-lg opacity-35" />
          <div className="absolute inset-0 backdrop-blur-sm rounded-lg border border-purple-500/20" />
          <div className="relative">
            <LogoComponent size="large" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-xl md:text-2xl font-pixel text-center max-w-3xl relative p-4"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg -z-10" />
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400">
            Compose specialized agents into swarms.
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <CyberButton
            cyberSize="xl"
            glowColor="gradient"
            className="font-pixel"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            hoverEffect="both"
          >
            Launch dApp
          </CyberButton>
        </motion.div>
      </div>
    </div>
  );
}
