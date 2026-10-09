"use client";

import React from "react";
import Image from "next/image";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";
import { botchainMainnet } from "@/lib/wagmi";

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <a
        href="https://scan.botchain.ai"
        target="_blank"
        rel="noreferrer"
        className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-all font-mono group"
        title="View BOT Chain Mainnet on BotScan"
      >
        <Image
          src="/botchain-logo.png"
          alt="BOT Chain"
          width={13}
          height={13}
          className="w-3.5 h-3.5 object-contain"
        />
        <span>BOT Chain Mainnet (677)</span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      </a>
    );
  }

  const isCorrectChain = chainId === botchainMainnet.id;

  const handleSwitchOrAddNetwork = async () => {
    try {
      if (switchChain) {
        switchChain({ chainId: botchainMainnet.id });
      }
    } catch (err: any) {
      // If chain not yet added to MetaMask, prompt wallet_addEthereumChain
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2a5", // 677 in hex
                chainName: "BOT Chain Mainnet",
                nativeCurrency: {
                  name: "BOT",
                  symbol: "BOT",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.botchain.ai"],
                blockExplorerUrls: ["https://scan.botchain.ai"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add BOT Chain Mainnet to wallet:", addError);
        }
      }
    }
  };

  if (!isCorrectChain) {
    return (
      <button
        onClick={handleSwitchOrAddNetwork}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer font-medium"
        title="Click to add/switch to BOT Chain Mainnet in wallet"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>+ Switch to Mainnet (677)</span>
        {isPending && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
      </button>
    );
  }

  return (
    <a
      href="https://scan.botchain.ai"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all font-mono group"
      title="Connected to BOT Chain Mainnet — Click to open BotScan Explorer"
    >
      <Image
        src="/botchain-logo.png"
        alt="BOT Chain"
        width={13}
        height={13}
        className="w-3.5 h-3.5 object-contain"
      />
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        BOT Chain Mainnet (677)
      </span>
      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
    </a>
  );
}
