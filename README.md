# Swarmint

> No-code multi-agent swarm builder. Every agent is an ERC-7857 iNFT. Every swarm is a composable meta-iNFT. Every decision is TEE-attested and anchored on-chain.

Built for the **0G APAC Hackathon 2026**.

## 0G Components Used

| Component | Usage |
|-----------|-------|
| **0G Chain (Galileo, chain ID 16600)** | AgentINFT, AgentRegistry, SwarmMetaINFT contracts |
| **0G Storage (Log layer)** | AES-256-GCM encrypted agent blobs + deliberation records |
| **0G Storage (KV layer)** | Per-agent and per-swarm episodic memory |
| **0G Compute (TEE-attested)** | All agent inference — fails closed if attestation fails |

## Contract Addresses (0G Chain Galileo)

> Contracts will be deployed before the submission deadline. Addresses and explorer links will be added to `blockend/deployments.json`.

| Contract | Address |
|----------|---------|
| AgentINFT | pending deployment |
| AgentRegistry | pending deployment |
| SwarmMetaINFT | pending deployment |

## Architecture

```
web/ (Next.js 15)      →  agent/ (Express + 0G SDKs)  →  0G Compute (Qwen 2.5 7B)
     ↓ wagmi calls                   ↓                     0G Storage Log + KV
blockend/ (3 contracts on 0G Chain Galileo)
```

## The Novel Primitive

Every prior 0G hackathon winner minted isolated agents. Swarmint mints the **team** — the swarm itself is a meta-iNFT anchoring the deliberation record (which agent recommended what, who dissented, whether the Risk Manager vetoed) as a Merkle root on 0G Storage, re-derivable and permanently verifiable.

## Agent Archetypes

| Agent | ID | Role | Veto? |
|-------|----|------|-------|
| Personal Accountant | 1 | Asset monitoring, wallet management | No |
| Financial Advisor | 2 | Trade suggestions, yield identification | No |
| Risk Manager | 4 | Risk assessment, position monitoring | **Yes** |
| Research Agent | 6 | Market data, news, sentiment analysis | No |
| Governance Agent | 10 | DAO proposals, voting strategy | No |

## Local Setup

```bash
# 1. Deploy contracts (requires funded A0GI wallet on 0G Galileo testnet)
cd blockend
npm install
cp .env.example .env  # add PRIVATE_KEY
npm run deploy:galileo
npm run save-deployments

# 2. Start agent server
cd agent
npm install
cp .env.example .env  # add ZG_RPC_URL, PRIVATE_KEY, ZG_PROVIDER_ADDRESS, ZG_ENCRYPTION_KEY, ZG_INDEXER_URL, ZG_KV_URL
npm run dev

# 3. Start frontend
cd web
npm install
# fill in web/.env.local with contract addresses from blockend/deployments.json
npm run dev
# open http://localhost:3000
```

## Deliberation Flow

```
User sends message to swarm
  → POST /swarm/:swarmId/:threadId
      → Non-veto agents run via 0G Compute (TEE-attested)
      → Risk Manager runs last with full context
      → If Risk Manager vetoes → outcome = "vetoed"
      → Deliberation record uploaded to 0G Storage Log → Merkle root
      → SwarmMetaINFT.updateDeliberationRoot(swarmTokenId, root) on-chain
  → Frontend shows per-agent responses + APPROVED/VETOED badge
  → /swarm/[id]/deliberation shows full record with TEE attestations
```
