# Swarmint

**Verifiable AI Agent Swarms on 0G** — 0G APAC Hackathon 2026

Swarmint lets you mint AI agent iNFTs, compose them into swarms, deliberate on-chain questions with TEE-attested inference, and anchor every decision permanently on 0G Storage.

---

## 2. Architecture

```
User
 ├─ Mint agent iNFT
 │   POST /agents/{archetypeId}/prepare-mint   ← agent server encrypts system prompt
 │   → 0G Storage (AES-256-GCM, Merkle root)
 │   → AgentINFT.mint(archetypeId, storageRoot)
 │   → AgentRegistry.register(archetypeId, tokenId)
 │
 ├─ Compose swarm
 │   → SwarmMetaINFT.compose(threadId, memberTokenIds[], bytes32(0))
 │
 └─ Chat with swarm
     POST /swarm/{swarmId}/{threadId}
     → 0G Compute (TEE-attested LLM inference, one call per agent)
     → deliberation record assembled (recommendations + attestations)
     → 0G Storage (encrypted record, Merkle root returned)
     → SwarmMetaINFT.updateDeliberationRoot(swarmTokenId, root)  ← user signs via wagmi
```

---

## 3. Problem

Multi-agent AI is becoming the default architecture for consequential work. Instead of one model, teams of specialized agents now plan, debate, and execute together — and increasingly they are handed authority to act, not just advise: to move money, place trades, allocate capital, sign off on decisions with real downside.

But when a team of agents makes a decision that goes wrong, there is no way to reconstruct how it was made. The deliberation happens inside ephemeral context windows on a vendor's servers, and then it is gone. Three failures follow, and they hold in any domain — finance, operations, healthcare — not just crypto:

**No audit trail for collective decisions.** Human institutions that wield real authority keep minutes, dissent records, and sign-off chains — you can always answer who recommended this, who objected, was the safety check overruled. Multi-agent systems answer none of it. The decision is simply "what the system produced." Accountability dissolves into the swarm.

**No proof the system ran what it claims.** You are told five specialist agents deliberated. You cannot verify that they did — not that those specific agents ran, not that a cheaper model was not silently substituted, not that the risk checker was not skipped under load. The user trusts the operator's word.

**The decision-making asset is not yours.** The team you assembled, the context it accumulated, the track record it built — all of it is trapped inside a platform. You cannot audit it independently, cannot carry it elsewhere, cannot prove its history to anyone who was not already inside that vendor.

This is a real, present problem the moment a multi-agent system touches anything that matters — and it is unsolved today regardless of chain or platform. Autonomous finance is simply where it bites first and hardest, and it is exactly where Swarmint operates.

---

## 4. Solution

Swarmint keeps the core idea of blockchAIn — the visual swarm builder and the five role-based agent archetypes — and rebuilds the foundation so the product's promises are actually enforced on-chain:

**Every agent is an ERC-7857 iNFT.** Its system prompt, capabilities, and accumulated memory are encrypted client-side and stored on 0G Storage; the Merkle root is the dataHash on the token. Own the iNFT, own the agent.

**Every swarm is a meta-iNFT.** A composed swarm is itself an on-chain token whose data references its member agent iNFTs and anchors the swarm's deliberation record. This is the novel primitive — prior 0G winners mint individual agents; nobody tokenized composition or made the team's decision process auditable.

**Every decision is verifiable.** Agent reasoning runs through 0G Compute with TEE attestation. Each agent's contribution to a swarm decision — its recommendation, its dissent, whether the risk checker ran — is captured as an attested, replayable record before any transaction is signed.

**Every swarm gets smarter and more valuable over time.** Persistent memory in 0G KV means a seasoned swarm with months of context is worth more than a fresh one — memory becomes the moat, and the moat is a tradable asset.

| Problem | Swarmint answer |
|---------|----------------|
| No audit trail for collective decisions | The swarm meta-iNFT anchors a deliberation record on 0G Storage — which agent recommended, who dissented, whether the Risk Manager veto fired — Merkle-rooted and on-chain |
| No proof the system ran what it claims | Each agent's inference is TEE-attested via 0G Compute; the attestation per participating agent is bound into the swarm's decision record |
| The decision-making asset is not yours | The swarm is a user-owned meta-iNFT; transferring it transfers the agents, their encrypted memory, and the full track record |

---

## 5. Agent Archetypes

| archetypeId | Name | Group | Role |
|-------------|------|-------|------|
| 1 | Personal Accountant | deFAI | Asset balance monitoring, fund transfers, wallet management |
| 2 | Financial Advisor | deFAI | Trade suggestions, price monitoring, yield identification |
| 3 | Degen | deFAI | High-risk momentum trading, social sentiment signals |
| 4 | Risk Manager | deFAI | Position risk assessment; holds hard veto in swarm decisions |
| 5 | Universal Controller | Supreme | Full-capability agent across all domains |
| 7 | Data Scientist | Research | On-chain data analysis and pattern recognition |
| 8 | News Aggregator | Research | Real-time news monitoring and market impact analysis |
| 9 | Pattern Detector | Research | Market pattern identification and trading signal generation |
| 10 | Proposal Analyzer | Governance | DAO proposal analysis and stakeholder assessment |
| 11 | Vote Calculator | Governance | Voting power optimization and strategy |
| 12 | Strategy Coordinator | Governance | Governance strategy coordination and execution |

---

## 6. Deployed Contracts (Galileo Testnet, chain 16602)

| Contract | Address | Explorer |
|----------|---------|---------|
| AgentINFT | `0x669545CFbb78C79be84D3B8344e3287FADc49983` | [View](https://chainscan-galileo.0g.ai/address/0x669545CFbb78C79be84D3B8344e3287FADc49983) |
| AgentRegistry | `0x68CDD71731a71bDFf83f991F2047F95a04EF8FD8` | [View](https://chainscan-galileo.0g.ai/address/0x68CDD71731a71bDFf83f991F2047F95a04EF8FD8) |
| SwarmMetaINFT | `0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B` | [View](https://chainscan-galileo.0g.ai/address/0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B) |

---

## 7. 0G Integrations

| Integration | Usage |
|------------|-------|
| **0G Compute** | TEE-verified LLM inference via dstack attestation. Model: `qwen/qwen-2.5-7b-instruct`. Each agent response includes a full attestation quote bound into the deliberation record. |
| **0G Storage** | Agent system prompts and deliberation records stored as AES-256-GCM encrypted blobs. Merkle root (`bytes32`) is the on-chain pointer — plaintext never leaves the agent server. |
| **0G Chain Galileo** | Chain ID 16602. All three contracts deployed via Hardhat Ignition. Wallet signs `updateDeliberationRoot` directly via wagmi — no server-side private key touches on-chain state. |
| **0G KV** | Persistent swarm memory across deliberation sessions (optional; gracefully degraded if unavailable). |

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, Tailwind CSS, wagmi v2, viem |
| Wallet / Auth | Dynamic Labs |
| Smart Contracts | Solidity 0.8.24, Hardhat, Hardhat Ignition |
| Agent Server | Node.js, Express, TypeScript, tsx |
| 0G SDKs | `@0gfoundation/0g-compute-ts-sdk`, `@0gfoundation/0g-storage-ts-sdk` |
| Encryption | AES-256-GCM (Node.js `crypto`) |

---

## 9. Running Locally

### Prerequisites

- Node.js 20+
- A wallet funded with 0G Galileo testnet tokens
- An agent server wallet with ≥ 3 OG (for 0G Compute ledger)

### Environment Variables

**`agent/.env`**
```
ZG_RPC_URL=https://evmrpc-testnet.0g.ai
PRIVATE_KEY=0x<agent-server-wallet-private-key>
ZG_PROVIDER_ADDRESS=0xa48f01287233509FD694a22Bf840225062E67836
ZG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
ZG_ENCRYPTION_KEY=<32-byte-hex>
ZG_KV_URL=https://kv-testnet.0g.ai
AGENT_INFT_ADDRESS=0x669545CFbb78C79be84D3B8344e3287FADc49983
AGENT_REGISTRY_ADDRESS=0x68CDD71731a71bDFf83f991F2047F95a04EF8FD8
SWARM_META_INFT_ADDRESS=0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B
FRONTEND_URL=http://localhost:3000
PORT=8000
```

**`web/.env.local`**
```
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS=0x669545CFbb78C79be84D3B8344e3287FADc49983
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS=0x68CDD71731a71bDFf83f991F2047F95a04EF8FD8
NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS=0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B
NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS=0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_EXPLORER_BASE_URL=https://chainscan-galileo.0g.ai
```

### One-time: Initialize 0G Compute Ledger

```bash
cd agent
node fund-compute.mjs   # deposits 3 OG into 0G Compute payment channel
```

### Start Agent Server

```bash
cd agent
npm run dev
# → Listening on http://localhost:8000
```

### Start Web App

```bash
cd web
npm run dev
# → http://localhost:3000
```

### User Flow

1. Connect wallet (Dynamic Labs) on 0G Galileo (chain 16602)
2. Go to **Dashboard → Explore Agents** → click **Mint iNFT** on any agent
3. Approve 2 transactions: `AgentINFT.mint` then `AgentRegistry.register`
4. Go to **Create Swarm** → select 2+ minted agents → compose swarm
5. Approve 1 transaction: `SwarmMetaINFT.compose`
6. Click your swarm → chat with it → approve `updateDeliberationRoot` to anchor on-chain
7. View **Deliberation Record** to see per-agent responses, Merkle root, and explorer links
