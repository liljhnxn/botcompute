"use client";

import React from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { botchainTestnet } from "@/lib/wagmi";

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        <span>Botchain Testnet (968)</span>
      </div>
    );
  }

  const isCorrectChain = chainId === botchainTestnet.id;

  const handleSwitchOrAddNetwork = async () => {
    try {
      if (switchChain) {
        switchChain({ chainId: botchainTestnet.id });
      }
    } catch (err: any) {
      // If chain not yet added to MetaMask, prompt wallet_addEthereumChain
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x3c8", // 968
                chainName: "Botchain Testnet",
                nativeCurrency: {
                  name: "BOT",
                  symbol: "BOT",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.bohr.life"],
                blockExplorerUrls: ["https://scan.bohr.life"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Botchain Testnet to wallet:", addError);
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
        title="Click to add/switch to Botchain Testnet in wallet"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>+ Add / Switch to Botchain</span>
        {isPending && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Botchain (968)</span>
    </div>
  );
}
