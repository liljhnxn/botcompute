"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Wallet, LogOut, ExternalLink, ChevronDown, Check } from "lucide-react";
import { formatAddress } from "@/lib/identity";
import { formatBOT, getExplorerAddressUrl } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-32 rounded-lg bg-slate-800/50 animate-pulse" />
    );
  }

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => {
          const connector = connectors[0];
          if (connector) connect({ connector });
        }}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm shadow-md hover:shadow-cyan-500/20 transition-all active:scale-95"
      >
        <Wallet className="w-4 h-4" />
        <span>{isPending ? "Connecting..." : "Connect Wallet"}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-sm transition-all"
      >
        <div className="flex flex-col text-left">
          <span className="font-mono text-xs text-cyan-400">
            {formatAddress(address)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {formatBOT(balanceData?.value)} BOT
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl">
            <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Connected Account
              </p>
              <p className="font-mono text-white break-all">{formatAddress(address, 6)}</p>
              <p className="text-cyan-400 font-semibold mt-1">
                {formatBOT(balanceData?.value)} BOT
              </p>
            </div>

            <div className="py-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg transition-all"
              >
                <span>Copy Address</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Click</span>
                )}
              </button>

              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg transition-all"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            <div className="pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
