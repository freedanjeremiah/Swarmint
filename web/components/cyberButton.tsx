"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@/components/ui/button";

interface CyberButtonProps extends Omit<ButtonProps, "size"> {
  glowColor?: "purple" | "cyan" | "gradient";
  cyberSize?: "default" | "lg" | "xl";
  variant?: "default" | "outline" | "ghost";
  withShine?: boolean;
  hoverEffect?: "glitch" | "slide" | "both";
}

const glowStyles = {
  purple:
    "from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 border-purple-500/50 shadow-purple-500/30 hover:shadow-purple-500/50",
  cyan: "from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 border-cyan-500/50 shadow-cyan-500/30 hover:shadow-cyan-500/50",
  gradient:
    "from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-cyan-400/50 shadow-cyan-400/30 hover:shadow-cyan-400/50",
};

const cyberSizeStyles = {
  default: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-8 py-4 text-lg",
};

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  (
    {
      className,
      children,
      glowColor = "gradient",
      cyberSize = "default",
      variant = "default",
      withShine = true,
      hoverEffect = "both",
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative group">
        {/* Animated border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

        {/* Corner decorations */}
        {variant !== "ghost" && (
          <>
            {[
              "-top-1 -left-1",
              "-top-1 -right-1",
              "-bottom-1 -left-1",
              "-bottom-1 -right-1",
            ].map((position, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 ${position} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                animate={{
                  opacity: [0, 1, 0],
                  rotate: [0, 90, 180, 270, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <div className="absolute inset-0 border border-cyan-400" />
                <div className="absolute inset-0 border border-purple-500 transform translate-x-[1px] translate-y-[1px]" />
              </motion.div>
            ))}
          </>
        )}

        <Button
          className={cn(
            // Base styles
            "relative font-pixel tracking-wider overflow-hidden transition-all duration-300 z-10",
            // Size variations
            cyberSizeStyles[cyberSize],
            // Variant styles
            variant === "default" &&
              `bg-gradient-to-r ${glowStyles[glowColor]} border shadow-lg hover:shadow-xl`,
            variant === "outline" &&
              "border-2 bg-transparent hover:bg-gradient-to-r hover:border-opacity-0",
            variant === "ghost" &&
              "bg-transparent border-none shadow-none hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-500/10",
            // Custom glow effect
            variant !== "ghost" &&
              "shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]",
            "backdrop-blur-sm bg-opacity-75",
            className
          )}
          ref={ref}
          {...props}
        >
          {/* Background pulse effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />

          {/* Shine effect */}
          {withShine && variant !== "ghost" && (
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}

          {/* Glitch effect on hover */}
          {(hoverEffect === "glitch" || hoverEffect === "both") && (
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-cyan-300/30 opacity-0 group-hover:opacity-100"
              animate={{
                x: [0, -2, 2, -1, 1, 0],
                y: [0, 1, -1, 1, -1, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              {children}
            </motion.span>
          )}

          {/* Slide effect on hover */}
          {(hoverEffect === "slide" || hoverEffect === "both") && (
            <motion.span
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Main text */}
          <span className="relative z-10 group-hover:text-white transition-colors duration-200">
            {children}
          </span>

          {/* Scanlines */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_100%)] bg-size-[100%_4px] pointer-events-none" />
        </Button>
      </div>
    );
  }
);

CyberButton.displayName = "CyberButton";

export default CyberButton;
