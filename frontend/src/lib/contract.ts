import contractData from "./contractData.json";

export const BOTCOMPUTE_ABI = contractData.abi as unknown as readonly any[];

export const BOTCHAIN_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID || "968",
  10
);

// Resolve contract address: check env var first, then fallback to exported deployment artifact
export const BOTCOMPUTE_CONTRACT_ADDRESS: `0x${string}` = (
  process.env.NEXT_PUBLIC_BOTCOMPUTE_CONTRACT_ADDRESS ||
  (contractData as any).address ||
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const hasValidContractAddress =
  BOTCOMPUTE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
  BOTCOMPUTE_CONTRACT_ADDRESS.length === 42;
