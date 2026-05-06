import { baseSepolia } from "viem/chains";

export const EXPECTED_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID ?? baseSepolia.id
);
