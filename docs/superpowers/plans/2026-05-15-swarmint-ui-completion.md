# swArmInt UI Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy agent avatar assets from the reference project, wire them into the agent config, and rewrite the logo component to render "swArmInt" as a single styled row.

**Architecture:** Three isolated changes with no cross-dependencies — assets copy first (unblocks config), config update second, logo rewrite third. No new dependencies. TypeScript compilation is used as the verification gate for code changes.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, PowerShell (asset copy)

---

### Task 1: Copy avatar assets

**Files:**
- Create: `web/public/avatars/data-scientist.png`
- Create: `web/public/avatars/degen.png`
- Create: `web/public/avatars/financial-advisor.png`
- Create: `web/public/avatars/god.png`
- Create: `web/public/avatars/news-aggregator.png`
- Create: `web/public/avatars/pattern-detector.png`
- Create: `web/public/avatars/personal-accountant.png`
- Create: `web/public/avatars/proposal-analyzer.png`
- Create: `web/public/avatars/risk-manager.png`
- Create: `web/public/avatars/sentiment-analyzer.png`
- Create: `web/public/avatars/strategy-coordinator.png`
- Create: `web/public/avatars/user.png`
- Create: `web/public/avatars/vote-calculator.png`

- [ ] **Step 1: Copy all PNGs from the reference project**

Run in PowerShell from any directory:
```powershell
Copy-Item "C:\Users\freed\OneDrive\Desktop\Reference\blockchAIn\web\public\avatars\*.png" "C:\Users\freed\OneDrive\Desktop\Swarmint\web\public\avatars\"
```

- [ ] **Step 2: Verify all 13 files landed**

```powershell
Get-ChildItem "C:\Users\freed\OneDrive\Desktop\Swarmint\web\public\avatars\*.png" | Select-Object Name
```

Expected output (order may vary):
```
data-scientist.png
degen.png
financial-advisor.png
god.png
news-aggregator.png
pattern-detector.png
personal-accountant.png
proposal-analyzer.png
risk-manager.png
sentiment-analyzer.png
strategy-coordinator.png
user.png
vote-calculator.png
```

- [ ] **Step 3: Commit**

```bash
git add web/public/avatars/
git commit -m "feat(web): add agent avatar PNGs from reference project"
```

---

### Task 2: Wire avatar URLs into agent config

**Files:**
- Modify: `web/config/agents.ts`

- [ ] **Step 1: Replace every `avatarUrl` value in `web/config/agents.ts`**

Open `web/config/agents.ts`. Find each agent entry and update `avatarUrl` as shown below. Every `"/avatars/default.svg"` value is replaced — no other lines change.

```ts
// num: 1 — personal-accountant
avatarUrl: "/avatars/personal-accountant.png",

// num: 2 — financial-advisor
avatarUrl: "/avatars/financial-advisor.png",

// num: 3 — degen
avatarUrl: "/avatars/degen.png",

// num: 4 — risk-manager
avatarUrl: "/avatars/risk-manager.png",

// num: 5 — god-agent  (filename is god.png, not god-agent.png)
avatarUrl: "/avatars/god.png",

// num: 6 — data-scientist
avatarUrl: "/avatars/data-scientist.png",

// num: 7 — news-aggregator
avatarUrl: "/avatars/news-aggregator.png",

// num: 8 — pattern-detector
avatarUrl: "/avatars/pattern-detector.png",

// num: 9 — sentiment-analyzer
avatarUrl: "/avatars/sentiment-analyzer.png",

// num: 10 — proposal-analyzer
avatarUrl: "/avatars/proposal-analyzer.png",

// num: 11 — vote-calculator
avatarUrl: "/avatars/vote-calculator.png",

// num: 12 — strategy-coordinator
avatarUrl: "/avatars/strategy-coordinator.png",
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd web && npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add web/config/agents.ts
git commit -m "feat(web): wire per-agent avatar PNGs in config"
```

---

### Task 3: Rewrite logo component — "swArmInt"

**Files:**
- Rewrite: `web/components/logo.tsx`

- [ ] **Step 1: Replace the entire contents of `web/components/logo.tsx`**

The new component renders `swArmInt` as a single row of five segments. Lowercase segments (`sw`, `rm`, `nt`) are purple with a cyan glitch shadow. Uppercase segments (`A`, `I`) are cyan with a stronger purple glow — making "AI" pop. All other behaviour (size prop, glitch overlay, gradient line, hover scale) is preserved.

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd web && npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Spot-check in the browser**

```bash
cd web && npm run dev
```

Open `http://localhost:3000`. Verify:
- Landing page shows `swArmInt` on one line with `A` and `I` in cyan, `sw`/`rm`/`nt` in purple
- Open `http://localhost:3000/dashboard` — header logo renders at half-scale without overflow or misalignment
- "Explore Agents" tab — all agent cards show their specific avatar images instead of the grey default
- Open `http://localhost:3000/mint-agent` — agent selection thumbnails show PNG images, not the grey default

- [ ] **Step 4: Commit**

```bash
git add web/components/logo.tsx
git commit -m "feat(web): rewrite logo as single-row swArmInt with A/I emphasis"
```
