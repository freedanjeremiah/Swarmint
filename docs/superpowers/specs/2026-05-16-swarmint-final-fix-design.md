# Swarmint — Final Fix Pass Design Spec

**Date:** 2026-05-16  
**Status:** Approved  
**Urgency:** Hackathon deadline today — 2026-05-16 23:59 UTC+8  

---

## Goal

Close every remaining broken path so the full E2E flow works on 0G Galileo (chain 16602): mint agent iNFT → register in AgentRegistry → create swarm with real token IDs → deliberate → anchor on-chain signed by the swarm owner → view deliberation record with explorer links.

---

## What Is Already Working (Do Not Touch)

- All 12 agent archetype backend files (`agent/src/agents/*.ts`)
- `agent_nft_abi` with `tokenAgentId` getter in `web/lib/deployments.ts`
- `agent_registry_abi` in `web/lib/deployments.ts`
- `web/.env.local` with chain 16602 and all deployed contract addresses
- `NEXT_PUBLIC_EXPLORER_BASE_URL` in `.env.local` makes explorer links work via env override
- All 13 avatar PNGs in `web/public/avatars/`
- Swarm chat page chain reads (`getSwarmMembers` + `tokenAgentId` multicall)
- Deliberation page (sessionStorage read path)
- AgentINFT.sol, SwarmMetaINFT.sol — no bugs, stay at current addresses

---

## Deployed Addresses (chain 16602)

From `blockend/deployments.json`:
- AgentINFT: `0x669545CFbb78C79be84D3B8344e3287FADc49983`
- AgentRegistry: `0x0e10691089F0b5c62937F4598E47C1D1aE4e598A` ← will be replaced after redeploy
- SwarmMetaINFT: `0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B`

---

## Architecture: Target State

```
Mint flow:
  User selects agent (by archetypeId)
  → POST /agents/:archetypeId/prepare-mint → { root }
  → AgentINFT.mint(archetypeId, root) → receipt contains tokenId (from AgentMinted event)
  → AgentRegistry.register(archetypeId, tokenId)  [auto, second wagmi writeContract]
  → Step indicator shows: Encrypt → 0G Storage → Mint iNFT → Register → Done

Create swarm flow:
  User selects agents (by web agent.id string)
  → For each selected agent: AgentRegistry.getTokenId(agent.archetypeId) → tokenId (useReadContracts multicall)
  → If any tokenId returns 0: show error "Mint & register agent first"
  → SwarmMetaINFT.compose(threadId, tokenIds[], bytes32(0)) → swarmTokenId

Chat/deliberation flow:
  User sends message to swarm
  → POST /swarm/:swarmId/:threadId → pipeline runs (NO on-chain call)
  → Pipeline returns { record, deliberationRoot }
  → Frontend calls updateDeliberationRoot(swarmTokenId, root) via wagmi (user signs)
  → Shows tx link; stores record in sessionStorage

Dashboard:
  getUserSwarms(address) → swarmTokenIds[]
  → For each swarmTokenId: swarms(tokenId) for threadId/createdAt + getSwarmMembers(tokenId) → memberTokenIds[]
  → For each memberTokenId: tokenAgentId(tokenId) → archetypeId → find Agent by archetypeId
  → Link to /swarm/{swarmTokenId}
```

---

## Section 1: Contract Fix — AgentRegistry

### Problem
`register(uint256 agentId, uint256 tokenId)` is `onlyOwner`. Users cannot self-register after minting.

### Fix
Remove `Ownable` inheritance. Add inline check: `require(AGENT_INFT.ownerOf(tokenId) == msg.sender, "Not token owner")`. Constructor takes `agentNftAddress` argument.

### New AgentRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentINFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract AgentRegistry {
    IAgentINFT public immutable agentNft;
    mapping(uint256 => uint256) private _agentToToken;

    event AgentRegistered(uint256 indexed agentId, uint256 indexed tokenId, address indexed owner);

    constructor(address agentNftAddress) {
        agentNft = IAgentINFT(agentNftAddress);
    }

    function register(uint256 agentId, uint256 tokenId) external {
        require(agentNft.ownerOf(tokenId) == msg.sender, "Not token owner");
        _agentToToken[agentId] = tokenId;
        emit AgentRegistered(agentId, tokenId, msg.sender);
    }

    function getTokenId(uint256 agentId) external view returns (uint256) {
        return _agentToToken[agentId];
    }
}
```

### Ignition module update
The existing deploy module passes `AgentINFT` address as constructor arg to `AgentRegistry`. Verify this is wired correctly; if not, update the module to pass `agentInft` as a `Future` dependency.

### After redeploy
- Update `blockend/deployments.json` with new AgentRegistry address
- Update `web/.env.local` `NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS`

---

## Section 2: Archetype ID Alignment

### Problem
Web `agents.ts` has `num` field (1–12). Backend agent files have `id` (1–12). The mappings diverge for research agents 6–9:

| Web agent id | Web num | Backend module | Backend id |
|---|---|---|---|
| data-scientist | 6 | dataScientist.ts | **7** |
| news-aggregator | 7 | newsAggregator.ts | **8** |
| pattern-detector | 8 | patternDetector.ts | **9** |
| sentiment-analyzer | 9 | (none — id=9 is pattern-detector) | — |
| proposal-analyzer | 10 | governance.ts | 10 |

### Fix
Add `archetypeId: number` field to each `Agent` in `web/config/agents.ts`. Remove `sentiment-analyzer` (its archetypeId=9 collides with pattern-detector). Updated archetypeId values:

| Web agent id | archetypeId |
|---|---|
| personal-accountant | 1 |
| financial-advisor | 2 |
| degen | 3 |
| risk-manager | 4 |
| god-agent | 5 |
| data-scientist | 7 |
| news-aggregator | 8 |
| pattern-detector | 9 |
| proposal-analyzer | 10 |
| vote-calculator | 11 |
| strategy-coordinator | 12 |

Use `agent.archetypeId` (not `agent.num`) everywhere contracts/backend are called:
- `mint-agent/page.tsx`: `POST /agents/:archetypeId/prepare-mint`, `AgentINFT.mint(archetypeId, root)`
- `createswarm/page.tsx`: `AgentRegistry.getTokenId(archetypeId)` lookup
- `swarm/[slug]/page.tsx`: already uses on-chain reads, no change needed for archetype mapping

---

## Section 3: Mint Page Fix

**File:** `web/app/mint-agent/page.tsx`

### Changes
1. Use `agent.archetypeId` instead of `agent.num` for prepare-mint URL and mint args
2. Add `"uploading"` step: set `setStep("uploading")` after prepare-mint fetch succeeds, before `writeContract`
3. Move `setStep("done")` out of render into `useEffect(() => { if (isSuccess) setStep("done"); }, [isSuccess])`
4. After mint receipt: read `tokenId` from `useWaitForTransactionReceipt` `data.logs` (parse `AgentMinted` event) or use the `tokenId` return via `simulateContract`; then call `AgentRegistry.register(archetypeId, tokenId)` as a second `writeContract`
5. Add a 5th step indicator: "Register"
6. Validate `root` is a valid `bytes32` hex string before calling `writeContract`

### Step sequence
`idle → encrypting → uploading → minting → registering → confirming → done`

### Reading tokenId from receipt
Parse the `AgentMinted` event from `receipt.logs`. AgentINFT emits:
```
event AgentMinted(uint256 indexed tokenId, uint256 indexed agentId, address owner, bytes32 dataHash)
```
Use viem's `decodeEventLog` with the ABI entry, or read `topics[1]` directly (tokenId is the first indexed param).

Add the event to `agent_nft_abi` in `web/lib/deployments.ts`:
```typescript
{
  anonymous: false,
  inputs: [
    { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
    { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
    { indexed: false, internalType: "address", name: "owner", type: "address" },
    { indexed: false, internalType: "bytes32", name: "dataHash", type: "bytes32" },
  ],
  name: "AgentMinted",
  type: "event",
}
```

---

## Section 4: Create Swarm Fix

**File:** `web/app/createswarm/page.tsx`

### Changes
1. Remove `createSwarm` call entirely
2. Add `useReadContracts` multicall: for each selected agent, call `AgentRegistry.getTokenId(agent.archetypeId)` → array of `tokenId` results
3. Before compose: check all tokenIds are non-zero. If any is 0, show error: "Agent [name] not registered — mint it first"
4. Call `SwarmMetaINFT.compose(threadId, memberTokenIds[], bytes32(0))` where `memberTokenIds` are the BigInt token IDs
5. After confirmed, navigate to `/dashboard` or show swarmTokenId with explorer link

### Handling the `swarm_abi compose()` signature
Already in `swarmArtifacts.ts`: `compose(string threadId, uint256[] memberTokenIds, bytes32 deliberationRoot)`. Use as-is.

---

## Section 5: Dashboard Fix

**File:** `web/app/dashboard/page.tsx`

### Changes
Replace all calls to non-existent `getSwarmDetails` and `getSwarmAgents` with:

1. `getUserSwarms(address)` → `uint256[]` of swarmTokenIds (already working)
2. For each swarmTokenId: `swarms(swarmTokenId)` → `{ threadId, deliberationRoot, createdAt, status }` (public mapping, returns tuple minus memberTokenIds — those are a dynamic array and not returned by the auto-getter)
3. For each swarmTokenId: `getSwarmMembers(swarmTokenId)` → `uint256[]` memberTokenIds
4. For each memberTokenId: `AgentINFT.tokenAgentId(tokenId)` → archetypeId → `agents.find(a => a.archetypeId === archetypeId)`

Use two rounds of `useReadContracts` (first getUserSwarms, then batch swarms()+getSwarmMembers() per swarm).

Map result to `Swarm` object:
```typescript
{
  id: swarmTokenId.toString(),
  name: `Swarm #${swarmTokenId}`,
  agents: resolvedAgentIds,  // string[] of agent.id
  lastActive: new Date(Number(createdAt) * 1000).toISOString(),
  created: new Date(Number(createdAt) * 1000).toISOString(),
  threadId,
}
```

---

## Section 6: Pipeline Fix — Remove On-chain Signing

**File:** `agent/src/deliberation/pipeline.ts`

### Changes
1. Remove the `ethers.Wallet` / `ethers.Contract` block (Steps 8) entirely — no `updateDeliberationRoot` call from server
2. Return `record` with `deliberationRoot` set, `onChainTxHash` absent (caller handles on-chain)
3. Before processing: validate all `memberAgentIds` have a known archetype — if any unknown id, throw with HTTP 400 message: `Unknown agent id ${id}`
4. Normalize `deliberationRoot` to bytes32: `ethers.zeroPadValue(root, 32)` if root is shorter than 32 bytes

### Veto semantics (chosen behavior)
On veto: upload record to 0G Storage (off-chain record preserved), but do NOT send `updateDeliberationRoot`. The frontend skips the on-chain anchor when `record.outcome === "vetoed"`. Document in README.

---

## Section 7: Swarm Chat Page — Frontend-signed Anchor

**File:** `web/app/swarm/[slug]/page.tsx`

### Changes (additive to existing chain-read logic)
1. Add `useWriteContract` + `useWaitForTransactionReceipt` for `updateDeliberationRoot`
2. After pipeline fetch succeeds and `record.outcome !== "vetoed"`:
   - Call `writeContract({ functionName: "updateDeliberationRoot", args: [BigInt(swarmTokenId), record.deliberationRoot as \`0x${string}\`] })`
   - Set `record.onChainTxHash = hash` once tx submitted
3. On veto: skip the on-chain call, show "VETOED — no on-chain anchor" in UI
4. Remove the silent fallback: if `getSwarmMembers` returns empty AND member token reads return no valid archetypeIds, show error UI and disable send button — do not silently use `[1,2,4,6,10]`

---

## Section 8: Deliberation Page — Agent Server Fetch

**File:** `web/app/swarm/[slug]/deliberation/page.tsx`  
**File (new):** agent server route `GET /deliberation/:root`

### Agent server route
Add to `agent/src/routes/deliberation.ts` (or inline in `index.ts`):
```
GET /deliberation/:root
→ storage/log.ts download(root) → decrypt → JSON.parse → return DeliberationRecord
```

Requires implementing `download(root)` in `agent/src/storage/log.ts`:
```typescript
export async function download(root: string): Promise<string> {
  const indexerUrl = process.env.ZG_INDEXER_URL ?? "https://indexer-storage-testnet.0g.ai";
  const indexer = new Indexer(indexerUrl);
  const [data, err] = await indexer.download(root);
  if (err) throw err;
  return decrypt(Buffer.from(data));
}
```
**Note:** Verify the exact `Indexer.download()` signature against `@0gfoundation/0g-storage-ts-sdk` — the return shape `[Buffer, Error | null]` matches the upload pattern. If the SDK differs (e.g., returns `Promise<Buffer>` directly), adjust accordingly.

### Deliberation page
1. On mount: read `sessionStorage` first (fast path)
2. If sessionStorage empty: fetch `GET ${BACKEND_URL}/deliberation/${root}` where `root` is read from `SwarmMetaINFT.swarms(swarmTokenId).deliberationRoot` via `useReadContract`
3. Show: Merkle root, outcome badge, per-agent cards (recommendation + attestation + copy button), on-chain tx link

---

## Section 9: Explorer + Env Fixes

**File:** `web/lib/explorer.ts`
- Add `if (chainId === 16602) return "https://chainscan-galileo.0g.ai";` before the 16600 branch (16600 and 16602 both point to the same explorer; keep both)

**File:** `web/.env.example`
- Replace Base Sepolia defaults with 0G Galileo:
```
NEXT_PUBLIC_EXPECTED_CHAIN_ID=16602
NEXT_PUBLIC_EXPLORER_BASE_URL=https://chainscan-galileo.0g.ai
NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS=0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B
NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS=0x794B7E5124a6a9b41681C6F03bEF74B8FE527a6B
NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS=0x669545CFbb78C79be84D3B8344e3287FADc49983
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS=<NEW after redeploy>
```
- Remove Base Sepolia RPC references

---

## Hard Invariants (Preserved)

- Plaintext never leaves `storage/log.ts` unencrypted
- Broker fails closed on TEE attestation failure
- Every on-chain `dataHash` / `deliberationRoot` is independently re-derivable from 0G Storage object
- No `updateDeliberationRoot` sent from server wallet — user's wallet signs all ownership-gated calls

---

## File Map

| Action | File |
|---|---|
| Modify | `blockend/contracts/AgentRegistry.sol` |
| Modify | `blockend/ignition/modules/Deploy.ts` (verify AgentINFT address wired to AgentRegistry constructor) |
| Update | `blockend/deployments.json` (new AgentRegistry address) |
| Modify | `web/config/agents.ts` (add archetypeId, remove sentiment-analyzer) |
| Modify | `web/lib/explorer.ts` (add chainId 16602) |
| Modify | `web/.env.example` (0G Galileo defaults) |
| Modify | `web/.env.local` (update AGENT_REGISTRY after redeploy) |
| Modify | `web/app/mint-agent/page.tsx` (archetypeId, uploading step, useEffect done, auto-register) |
| Modify | `web/app/createswarm/page.tsx` (compose() with token IDs from AgentRegistry) |
| Modify | `web/app/dashboard/page.tsx` (swarms() + getSwarmMembers() + tokenAgentId reads) |
| Modify | `web/app/swarm/[slug]/page.tsx` (frontend updateDeliberationRoot, remove silent fallback) |
| Modify | `web/app/swarm/[slug]/deliberation/page.tsx` (agent server fetch fallback) |
| Modify | `agent/src/deliberation/pipeline.ts` (remove on-chain call, validate IDs, bytes32 normalize) |
| Modify | `agent/src/storage/log.ts` (add download() function) |
| Create | `agent/src/routes/deliberation.ts` (GET /deliberation/:root) |

---

## Out of Scope

- CoinGecko/RSS tools for agents
- ERC-7857 interface implementation
- Auth/rate limiting on agent server
- README/demo video (separate task)
- KV memory failures (already caught; writeMemory errors are non-fatal)
