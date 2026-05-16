# Dashboard Mint Modal + Swarm Chat UI + README Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the mint flow into the dashboard via a modal, upgrade the swarm chat to a 3-column reference layout, and write the hackathon submission README.

**Architecture:** Three independent UI changes — a new `MintAgentModal` component wired into the dashboard's Explore tab, a full layout rewrite of the swarm chat page preserving all existing wagmi logic, and a root `README.md` written for hackathon judges.

**Tech Stack:** Next.js 15, wagmi v2, viem `decodeEventLog`, Tailwind CSS, TypeScript

---

## 1. Dashboard Mint Modal

### Files
- **Create:** `web/components/MintAgentModal.tsx`
- **Modify:** `web/app/dashboard/page.tsx`

### MintAgentModal.tsx

A self-contained modal component that accepts `agent: Agent` and `onClose: () => void` props.

**Internal state:**
```typescript
type MintStep = "idle" | "encrypting" | "uploading" | "minting" | "registering" | "done";
const [step, setStep] = useState<MintStep>("idle");
const [storageRoot, setStorageRoot] = useState<string>("");
const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);
const [mintTxHash, setMintTxHash] = useState<string>("");
const [registerTxHash, setRegisterTxHash] = useState<string>("");
```

**Wagmi hooks (same as current mint-agent page):**
```typescript
const { writeContractAsync: writeMint } = useWriteContract();
const { writeContractAsync: writeRegister } = useWriteContract();
```

**Step indicator (5 steps):**
```
encrypting → uploading → minting → registering → done
```

**Mint flow (triggered by "Mint iNFT" button):**
1. `setStep("encrypting")` — POST `/agents/${agent.archetypeId}/prepare-mint` to agent server
2. `setStep("uploading")` — await response, get `{ root }`
3. Validate root is valid bytes32: `root.startsWith("0x") && root.length === 66`
4. `setStep("minting")` — `writeMint` → `AgentINFT.mint(agent.archetypeId, root)`
5. Wait for receipt, parse `AgentMinted` event via `decodeEventLog` to get `tokenId`
6. `setStep("registering")` — `writeRegister` → `AgentRegistry.register(agent.archetypeId, tokenId)`
7. Wait for register receipt → `setStep("done")`

**Done state:** Shows storage root (truncated), mint tx explorer link, register tx explorer link, and "Close" button.

**Error handling:** Any step failure shows error message with retry option, modal stays open.

**Modal overlay:** Fixed full-screen backdrop (`bg-black/70`), centered card with cyberpunk border styling matching the rest of the app.

### Dashboard Changes

In `web/app/dashboard/page.tsx`, the "Explore Agents" tab renders agent cards. Changes:

```typescript
const [mintingAgent, setMintingAgent] = useState<Agent | null>(null);
```

Each agent card in the Explore tab gets a "Mint iNFT" button:
```tsx
<button onClick={() => setMintingAgent(agent)}>Mint iNFT</button>
```

At the bottom of the page:
```tsx
{mintingAgent && (
  <MintAgentModal agent={mintingAgent} onClose={() => setMintingAgent(null)} />
)}
```

The existing `/mint-agent` page is left unchanged.

---

## 2. Swarm Chat — 3-Column Layout

### Files
- **Modify:** `web/app/swarm/[slug]/page.tsx` — full layout rewrite, all existing wagmi logic preserved

### Layout

Three columns in a full-viewport flex row:

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│  SWARM MEMBERS  │         CHAT             │     EVENTS      │
│  w-64, fixed    │  flex-1, scrollable      │  w-72, fixed    │
│                 │                          │                 │
│ [Avatar]        │  user message (right)    │ ON-CHAIN        │
│ Agent Name      │                          │ Root: 0x7a07... │
│ #archetypeId    │  swarm response (left)   │ Tx: 0x84d0...   │
│                 │  [APPROVED/VETOED badge] │ [Explorer link] │
│ [Avatar]        │  consensus summary       │                 │
│ Agent Name      │                          │ AGENT RESPONSES │
│ #archetypeId    │  ● ● ● typing indicator  │ [1] Accountant  │
│                 │                          │ "recommendation │
│                 │  [input + send button]   │  text..."       │
└─────────────────┴──────────────────────────┴─────────────────┘
```

### Left Sidebar — Swarm Members

Populated from existing `getSwarmMembers` + `tokenAgentId` multicall reads already wired. For each member:

```tsx
<div className="flex flex-col items-center gap-2 p-3">
  <img src={agent.avatarUrl} className="w-16 h-16 rounded-full border-2 border-cyan-500" />
  <span className="text-sm font-bold">{agent.name}</span>
  <span className="text-xs text-cyan-400">#{agent.archetypeId}</span>
</div>
```

If `noMembers` error state: show error panel in the sidebar, disable input.

### Center — Chat Messages

**Message types:**
- User messages: right-aligned bubble, plain background
- Swarm responses: left-aligned, shows outcome badge + summary paragraph

**Outcome badge:**
```tsx
// APPROVED
<span className="px-2 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded">
  APPROVED
</span>
// VETOED
<span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500 rounded">
  VETOED
</span>
```

**Typing indicator** (shown while `isLoading`):
```tsx
<div className="flex gap-1">
  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms]" />
  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
</div>
```

**Swarm response message** also shows anchor status inline below the bubble:
- While anchoring: "Anchoring to chain..."
- Confirmed: ExplorerTxLink component with tx hash

### Right Sidebar — Events

Two stacked sections separated by a divider:

**On-Chain section:**
```tsx
<div className="text-xs text-gray-400 font-mono">
  Root: {root.slice(0,10)}...{root.slice(-6)}
  <button onClick={() => navigator.clipboard.writeText(root)}>Copy</button>
</div>
<ExplorerTxLink hash={anchorTxHash} chainId={16602} />
```
Populated after `writeAnchor` confirms. Empty state: "No anchor yet."

**Agent Responses section:**
Per-agent cards populated after each deliberation returns. From `record.agents[]`:
```tsx
{record.agents.map(a => (
  <div key={a.agentId} className="p-2 border border-gray-700 rounded mb-2">
    <span className="text-xs font-bold text-cyan-400">{a.agentName}</span>
    <p className="text-xs text-gray-300 mt-1">{a.recommendation}</p>
  </div>
))}
```
Empty state: "Start a conversation to see agent responses."

### Preserved Logic (unchanged)
- `useReadContracts` for `getSwarmMembers` + `tokenAgentId` multicall
- `noMembers` error state check
- `useWriteContract` + `useWaitForTransactionReceipt` for `updateDeliberationRoot`
- POST `/swarm/{swarmId}/{threadId}` with `prompt + memberAgentIds + swarmTokenId`
- `record` state typed as `DeliberationRecord`
- All `ExplorerTxLink` usage

---

## 3. README

### File
- **Create:** `README.md` (root of repo, full rewrite)

### Structure

```markdown
# Swarmint

[tagline + hackathon]

## 1. Live Demo
[links when deployed]

## 2. Architecture
[text diagram of full flow]

## 3. Problem
[verbatim from user — multi-agent accountability gap]

## 4. Solution
[verbatim from user — iNFT + swarm meta-iNFT + TEE + KV]

## 5. Agent Archetypes
[table: archetypeId | name | group | role]

## 6. Deployed Contracts (Galileo Testnet, chain 16602)
| Contract       | Address                                      | Explorer |
|----------------|----------------------------------------------|---------|
| AgentINFT      | 0x669545CFbb78C79be84D3B8344e3287FADc49983   | [link]  |
| AgentRegistry  | 0x68CDD71731a71bDFf83f991F2047F95a04EF8FD8   | [link]  |
| SwarmMetaINFT  | 0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B   | [link]  |

## 7. 0G Integrations
- 0G Compute — TEE-verified LLM inference (dstack attestation, qwen-2.5-7b)
- 0G Storage — AES-256-GCM encrypted deliberation records, Merkle-rooted
- 0G Chain Galileo — 3 deployed contracts on chain 16602

## 8. Tech Stack
[table]

## 9. Running Locally
[env vars + commands for blockend, agent, web]
```

---

## Scope Boundaries

- `/mint-agent` page is NOT deleted or changed
- No changes to agent server routes beyond what already exists
- No changes to deliberation logic or pipeline
- No changes to blockend contracts
- The swarm chat's 3-column layout is desktop-first (no mobile breakpoint work)
