import { formatEther, parseEther } from "viem";

const EXPLORER_BASE = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.bohr.life";

export function formatBOT(wei?: bigint | string | number): string {
  if (wei === undefined || wei === null) return "0.00";
  try {
    const valBigInt = typeof wei === "bigint" ? wei : BigInt(wei.toString());
    const etherStr = formatEther(valBigInt);
    const num = parseFloat(etherStr);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } catch {
    return "0.00";
  }
}

export function parseBOT(botAmount: string): bigint {
  try {
    if (!botAmount || isNaN(Number(botAmount))) return 0n;
    return parseEther(botAmount);
  } catch {
    return 0n;
  }
}

export function formatDate(timestamp?: bigint | number): string {
  if (!timestamp || Number(timestamp) === 0) return "—";
  const ms = Number(timestamp) * 1000;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRemaining(deadline?: bigint | number): {
  isExpired: boolean;
  formatted: string;
} {
  if (!deadline || Number(deadline) === 0) {
    return { isExpired: false, formatted: "No deadline set" };
  }
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  if (diff <= 0) {
    return { isExpired: true, formatted: "Expired" };
  }
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return {
    isExpired: false,
    formatted: `${hours}h ${minutes}m remaining`,
  };
}

/**
 * Client-side deterministic SHA-256 hash using Web Crypto API.
 * Returns 0x-prefixed 32-byte hex string (bytes32).
 */
export async function computeClientSha256(text: string): Promise<`0x${string}`> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hexString}` as `0x${string}`;
}

export function getExplorerTxUrl(hash?: string): string {
  if (!hash) return EXPLORER_BASE;
  return `${EXPLORER_BASE.replace(/\/$/, "")}/tx/${hash}`;
}

export function getExplorerAddressUrl(address?: string): string {
  if (!address) return EXPLORER_BASE;
  return `${EXPLORER_BASE.replace(/\/$/, "")}/address/${address}`;
}
