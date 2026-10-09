"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ExternalLink,
  Globe,
  Compass,
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
            <span>BOT Chain Mainnet Native Escrow • Chain ID 677</span>
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

          {/* Verified Mainnet Contract & Explorer Quick-Link */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <a
              href={`https://scan.botchain.ai/address/${BOTCOMPUTE_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm group"
              title="View verified contract on BOT Chain Mainnet Explorer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-400">Mainnet Contract:</span>
              <span className="text-cyan-400 font-semibold">{BOTCOMPUTE_CONTRACT_ADDRESS.slice(0, 6)}...{BOTCOMPUTE_CONTRACT_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
            </a>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-400 transition-all font-mono group shadow-sm"
              title="Open official BOT Chain Explorer"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={15}
                height={15}
                className="w-3.5 h-3.5 object-contain group-hover:scale-110 transition-transform"
              />
              <span>BotScan Explorer</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 ml-0.5" />
            </a>
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
              <span className="text-cyan-400">BOT Chain (ID: 677)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Settlement Layer:</span>
              <span className="text-white">BotCompute Escrow</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Mainnet Explorer:</span>
              <a
                href={`https://scan.botchain.ai/address/${BOTCOMPUTE_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1.5 font-semibold group"
              >
                <Image
                  src="/botchain-logo.png"
                  alt="BOT Chain"
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 object-contain group-hover:scale-110 transition-transform"
                />
                <span>View On-Chain</span>
                <ExternalLink className="w-3 h-3" />
              </a>
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

      {/* BOT Chain Ecosystem Section */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#070c17] to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              {/* BOT Chain Logo */}
              <div className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 p-1 shadow-lg shadow-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                <Image
                  src="/botchain-logo.png"
                  alt="BOT Chain Official Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                    BOT Chain Ecosystem
                  </h2>
                  <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Mainnet (677)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Decentralized Autonomous L1 Blockchain for Next-Gen Compute & Intelligent Agents
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              BotCompute is deeply integrated with BOT Chain Mainnet, utilizing native BOT for non-custodial
              escrow, provider collateral staking, and low-latency task verification. Explore the ecosystem
              and verify transactions on the official explorer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
            {/* BOT Chain Website Button with Logo at the front */}
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-bold text-white hover:text-emerald-300 transition-all font-mono shadow-md group"
              title="Visit official BOT Chain Website"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={18}
                height={18}
                className="w-4.5 h-4.5 object-contain group-hover:scale-110 transition-transform"
              />
              <span>BOT Chain Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300" />
            </a>

            {/* BOT Chain Explorer Button with Logo at the front */}
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white transition-all font-mono shadow-md group"
              title="Open official BOT Chain Explorer"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Explorer Logo"
                width={18}
                height={18}
                className="w-4.5 h-4.5 object-contain group-hover:scale-110 transition-transform"
              />
              <span>BOT Chain Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
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
