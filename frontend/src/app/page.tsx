"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import {
  Cpu,
  Server,
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Layers,
} from "lucide-react";
import {
  BOTCOMPUTE_ABI,
  BOTCOMPUTE_CONTRACT_ADDRESS,
  hasValidContractAddress,
} from "@/lib/contract";
import { formatBOT } from "@/lib/utils";
import { RegisterProviderModal } from "@/components/RegisterProviderModal";

export default function HomePage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Live on-chain contract queries
  const { data: providerCountData } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProviderCount",
  });

  const { data: jobCountData } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getJobCount",
  });

  const { data: availableProvidersData, refetch: refetchProviders } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getAvailableProviders",
  });

  const { data: allProvidersData } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getAllProviders",
  });

  // Calculate live protocol metrics from on-chain data
  const providerCount = providerCountData ? Number(providerCountData) : 0;
  const activeProviders = availableProvidersData ? (availableProvidersData as any[]).length : 0;
  const totalJobs = jobCountData ? Number(jobCountData) : 0;

  // Compute live capacity & earnings from providers
  let totalCapacity = 0;
  let totalEarnings = 0n;
  let totalJobsCompleted = 0;

  if (allProvidersData && Array.isArray(allProvidersData)) {
    for (const p of allProvidersData) {
      if (p.active) totalCapacity += Number(p.capacity || 0);
      totalEarnings += BigInt(p.totalEarned || 0);
      totalJobsCompleted += Number(p.jobsCompleted || 0);
    }
  }

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Botchain Testnet Native Escrow • Chain ID 968</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-mono">
            Rent compute. <br />
            Provide compute. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Earn on-chain.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
            A decentralized marketplace for computing power. Lock BOT payment into trustless
            escrow, run deterministic tasks across verified providers, and settle seamlessly upon verified completion.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <Link
              href="/explore"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Cpu className="w-4 h-4" />
              <span>Explore Compute</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm transition-all hover:border-cyan-500/40"
            >
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Become a Provider</span>
            </button>
          </div>
        </div>

        {/* Hero Interactive Terminal / Status Card */}
        <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-500 ml-2">worker://botchain-node</span>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="py-4 space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Network:</span>
              <span className="text-cyan-400">Botchain (ID: 968)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Settlement Layer:</span>
              <span className="text-white">BotCompute Escrow</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Off-Chain Daemon:</span>
              <span className="text-emerald-400">Sandboxed Node.js</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Integrity Anchor:</span>
              <span className="text-purple-400">SHA-256 Digest</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-cyan-400">$ botcompute-worker --status</div>
            <div>Worker: Sandboxed Workload Daemon v1.0.0</div>
            <div>Allowed: SHA256, JSON_PROCESS, MATH, TEXT</div>
            <div className="text-emerald-400">✓ 0 arbitrary shell execution permitted</div>
          </div>
        </div>
      </section>

      {/* Live Protocol Metrics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs uppercase tracking-widest font-mono font-semibold text-slate-400">
              Live On-Chain Protocol Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Source: BotCompute.sol</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Active Providers</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {activeProviders > 0 ? activeProviders : "0"}
            </div>
            <p className="text-[11px] text-slate-500">
              {providerCount} registered node{providerCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Available Compute</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">
              {totalCapacity > 0 ? `${totalCapacity} Units` : "0 Units"}
            </div>
            <p className="text-[11px] text-slate-500">Aggregated provider units</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Jobs Completed</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {totalJobsCompleted}
            </div>
            <p className="text-[11px] text-slate-500">{totalJobs} total jobs submitted</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Provider Earnings</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-400 truncate">
              {formatBOT(totalEarnings)} BOT
            </div>
            <p className="text-[11px] text-slate-500">Settled through escrow</p>
          </div>
        </div>
      </section>

      {/* How It Works Grid */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono">
            How BotCompute Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Clear separation between trustless blockchain escrow and high-performance off-chain computation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-semibold text-white">1. Lock BOT in Escrow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customers choose a provider, configure workload duration, and lock exact BOT payment
              into the BotCompute smart contract. Payment remains protected in escrow.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-semibold text-white">2. Off-Chain Workload Run</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The provider’s off-chain worker daemon accepts the job and executes the sandboxed task.
              Once complete, the provider anchors the deterministic SHA-256 result hash on-chain.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-semibold text-white">3. Verify & Settle</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customers verify hash consistency locally. Upon approval, the smart contract releases
              funds to the provider via pull-payment accounting, minus a 2.5% protocol fee.
            </p>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      <RegisterProviderModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => refetchProviders()}
      />
    </div>
  );
}
