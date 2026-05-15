# swArmInt — UI Completion Spec
_Date: 2026-05-15_

---

## 1. Scope

Three targeted changes to complete the web frontend. No new pages, no layout restructuring, no dependency additions.

---

## 2. Avatar assets

**Source:** `Reference/blockchAIn/web/public/avatars/` (13 PNG files)  
**Destination:** `Swarmint/web/public/avatars/`

Files to copy:
- `data-scientist.png`
- `degen.png`
- `financial-advisor.png`
- `god.png`
- `news-aggregator.png`
- `pattern-detector.png`
- `personal-accountant.png`
- `proposal-analyzer.png`
- `risk-manager.png`
- `sentiment-analyzer.png`
- `strategy-coordinator.png`
- `user.png`
- `vote-calculator.png`

---

## 3. Agent config update

**File:** `web/config/agents.ts`

All 12 agent entries currently use `avatarUrl: "/avatars/default.svg"`. Each entry is updated to its specific PNG. The agent ID matches the filename directly, with one exception:

| Agent ID | avatarUrl |
|---|---|
| `personal-accountant` | `/avatars/personal-accountant.png` |
| `financial-advisor` | `/avatars/financial-advisor.png` |
| `degen` | `/avatars/degen.png` |
| `risk-manager` | `/avatars/risk-manager.png` |
| `god-agent` | `/avatars/god.png` |
| `data-scientist` | `/avatars/data-scientist.png` |
| `news-aggregator` | `/avatars/news-aggregator.png` |
| `pattern-detector` | `/avatars/pattern-detector.png` |
| `sentiment-analyzer` | `/avatars/sentiment-analyzer.png` |
| `proposal-analyzer` | `/avatars/proposal-analyzer.png` |
| `vote-calculator` | `/avatars/vote-calculator.png` |
| `strategy-coordinator` | `/avatars/strategy-coordinator.png` |

---

## 4. Logo redesign

**File:** `web/components/logo.tsx`

Replace the two-row "blockchAIn" split layout with a single-row "swArmInt" layout.

### Rendering

Five `<span>` segments on one line:

| Segment | Text | Style |
|---|---|---|
| 1 | `sw` | `text-purple-500`, cyan shadow offset, existing glow |
| 2 | `A` | `text-cyan-400`, stronger purple glow (`drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]`) |
| 3 | `rm` | `text-purple-500`, cyan shadow offset |
| 4 | `I` | `text-cyan-400`, stronger purple glow |
| 5 | `nt` | `text-purple-500`, cyan shadow offset |

Each segment keeps the existing glitch offset duplicate `<span>` (absolute, +2px translate, 80% opacity, swapped color) to preserve the chromatic aberration effect.

### Preserved from current logo
- `size` prop (`small` / `medium` / `large`) and `sizeClasses` map
- `font-pixel font-bold` on all text
- Gradient decorative line below the text (`from-purple-500 via-cyan-400 to-purple-500`)
- Animated glitch overlay div (`bg-cyan-400/20`, x oscillation)
- Background blur div and `whileHover` scale on the outer wrapper

### Removed
- The two-row flex layout with `justify-between`, `pl-44`, `pl-96`, `-mt-10` offset hacks — all hardcoded pixel positioning that only works at fixed viewport sizes

### Landing page
`app/page.tsx` uses `<LogoComponent size="large" />` unchanged — no edits required.

---

## 5. Out of scope

- Additional landing page effects from the reference project (floating lines, gradient orbs, corner tick animations)
- Any other pages, components, or backend changes
