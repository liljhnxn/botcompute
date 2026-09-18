"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import {
  Cpu,
  Server,
  HardDrive,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Clock,
  Coins,
  Loader2,
} from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { formatAddress } from "@/lib/identity";
import { formatBOT, formatDate, getExplorerAddressUrl } from "@/lib/utils";
import { ProviderData } from "@/lib/types";

export default function ProviderProfilePage() {
  const params = useParams();
  const providerAddress = (params.address as `0x${string}`) || "0x0";

  const {
    data: rawProvider,
    isLoading,
    isError,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProvider",
    args: [providerAddress],
  });

  const { data: providerJobIds } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProviderJobs",
    args: [providerAddress],
  });

  const provider = rawProvider as unknown as ProviderData | undefined;
  const isRegistered = provider && provider.wallet && provider.wallet !== "0x0000000000000000000000000000000000000000";

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">
          Loading provider profile from Botchain Testnet...
        </p>
      </div>
    );
  }

  if (isError || !isRegistered) {
    return (
      <div className="p-8 rounded-2xl glass-panel text-center space-y-4 max-w-lg mx-auto my-12 border border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Server className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Provider Not Found</h2>
        <p className="text-xs text-slate-400">
          No active compute provider is registered on Botchain Testnet at address{" "}
          <span className="font-mono text-cyan-400">{providerAddress}</span>.
        </p>
        <div className="pt-2">
          <Link
            href="/explore"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner & Action */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white font-mono">
                    {provider.name}
                  </h1>
                  {provider.active ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active & Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  )}
                </div>
                <a
                  href={getExplorerAddressUrl(provider.wallet)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-slate-400 hover:text-cyan-400 mt-1 transition-colors"
                >
                  <span>{provider.wallet}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/create-job/${provider.wallet}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Create Compute Job</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              Compute Type
            </span>
            <span className="text-base font-bold text-cyan-400 font-mono">
              {provider.computeType}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              Hourly Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-white font-mono">
                {formatBOT(provider.pricePerHour)}
              </span>
              <span className="text-xs text-slate-400 font-medium">BOT / hr</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              Capacity Units
            </span>
            <span className="text-base font-bold text-white font-mono">
              {provider.capacity.toString()} Units
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              Collateral Staked
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {formatBOT(provider.stake)} BOT
            </span>
          </div>
        </div>
      </div>

      {/* Hardware & Reputation Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Hardware & Environment
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
              <span className="text-slate-400 block">Hardware Specification:</span>
              <p className="font-mono text-white text-sm">{provider.hardware}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5 text-slate-400">
              <span>Registration Date:</span>
              <span className="text-slate-200">{formatDate(provider.registeredAt)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5 text-slate-400">
              <span>Assigned Total Jobs:</span>
              <span className="text-slate-200">
                {providerJobIds ? (providerJobIds as any[]).length : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Performance & Protocol Record
          </h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block">Completed Jobs:</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {provider.jobsCompleted.toString()}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block">Total Earned:</span>
                <span className="text-xl font-bold text-purple-400 font-mono">
                  {formatBOT(provider.totalEarned)} BOT
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed pt-2">
              Collateral stake is held by the BotCompute contract. In case of malicious results
              or abandonment, disputes are adjudicated by the protocol arbitrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
