# Contract Deployment & Env Wiring — Design Spec

**Date:** 2026-05-16  
**Status:** Approved

---

## Goal

Generate a funded deployer wallet, deploy the three Swarmint contracts to the 0G Galileo testnet, and automatically propagate the deployed addresses into `agent/.env` and `web/.env.local`.

---

## Target Network

| Property | Value |
|---|---|
| Name | 0G Galileo Testnet |
| Chain ID | 16600 |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Explorer | `https://chainscan-galileo.0g.ai` |

---

## Contracts

Three contracts are deployed via the existing Hardhat Ignition module (`blockend/ignition/modules/Deploy.ts`):

| Contract | Ignition key |
|---|---|
| `AgentINFT` | `SwarmintDeploy#AgentINFT` |
| `AgentRegistry` | `SwarmintDeploy#AgentRegistry` |
| `SwarmMetaINFT` | `SwarmintDeploy#SwarmMetaINFT` |

---

## Address Mapping

After deployment the three addresses flow into two env files:

| Contract | `agent/.env` key | `web/.env.local` key |
|---|---|---|
| `AgentINFT` | `AGENT_INFT_ADDRESS` | `NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS` |
| `AgentRegistry` | `AGENT_REGISTRY_ADDRESS` | `NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS` |
| `SwarmMetaINFT` | `SWARM_META_INFT_ADDRESS` | `NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS` |
| `SwarmMetaINFT` | *(same)* | `NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS` |

Both `NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS` and `NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS` receive the `SwarmMetaINFT` address (confirmed by the comment in `web/lib/swarmArtifacts.ts`).

---

## Two-Phase Flow

### Phase 1 — `npm run setup` (run once)

**Script:** `blockend/scripts/setup-wallet.ts`

1. Call `ethers.Wallet.createRandom()` → produces address + private key.
2. Call `crypto.randomBytes(32).toString('hex')` → produces `ZG_ENCRYPTION_KEY`.
3. Write `PRIVATE_KEY=0x<key>` into `blockend/.env` (replacing the existing empty value).
4. Write `ZG_ENCRYPTION_KEY=<hex>` into `agent/.env` (replacing the existing empty value).
5. Print to stdout:
   - Wallet address (to fund)
   - Confirmation that keys have been written
   - Instruction: "Fund this address on Galileo testnet, then run: npm run deploy:galileo && npm run wire"

The deployer wallet is also the agent's operational wallet (same `PRIVATE_KEY` in both). The agent's `PRIVATE_KEY` is wired in Phase 2 (not here) so that it comes from the same source of truth.

**New npm script in `blockend/package.json`:**
```
"setup": "ts-node scripts/setup-wallet.ts"
```

---

### Phase 2 — `npm run deploy:galileo && npm run wire`

**Deploy** (already exists):
```
"deploy:galileo": "hardhat ignition deploy ignition/modules/Deploy.ts --network galileo"
```

**Wire script:** `blockend/scripts/wire-env.ts`

1. Reads `blockend/ignition/deployments/chain-16600/deployed_addresses.json`.
2. Extracts the three contract addresses.
3. Writes `blockend/deployments.json` (same as existing `save-deployments.ts` — the wire script subsumes it).
4. Updates `agent/.env` in-place:
   - `PRIVATE_KEY` (copied from `blockend/.env`)
   - `AGENT_INFT_ADDRESS`
   - `AGENT_REGISTRY_ADDRESS`
   - `SWARM_META_INFT_ADDRESS`
5. Updates `web/.env.local` in-place:
   - `NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS`
6. Prints a summary table of all written values plus 0G Explorer links.

In-place update strategy: read each file, replace `KEY=<anything>` lines with `KEY=<newvalue>` using a regex line replacement. Keys not in the target list are left unchanged.

**New npm scripts in `blockend/package.json`:**
```
"wire": "ts-node scripts/wire-env.ts"
```

The old `"save-deployments"` script is superseded by `wire` and can be removed.

---

## File Changes

| File | Change |
|---|---|
| `blockend/scripts/setup-wallet.ts` | **New** — Phase 1 script |
| `blockend/scripts/wire-env.ts` | **New** — Phase 2 wire script |
| `blockend/scripts/save-deployments.ts` | **Delete** — superseded by wire-env.ts |
| `blockend/package.json` | Add `setup` and `wire` scripts; remove `save-deployments` |

---

## Error Handling

- `setup-wallet.ts`: fails fast if `blockend/.env` or `agent/.env` do not exist.
- `wire-env.ts`: fails fast if `deployed_addresses.json` does not exist (directs user to run deploy first); fails if any expected Ignition key is missing from the file.

---

## Security Notes

- `.env` files are already gitignored (`blockend/.env`, `agent/.env`).
- The private key is never printed to stdout — only the wallet address is shown.
- `ZG_ENCRYPTION_KEY` is never printed to stdout.
