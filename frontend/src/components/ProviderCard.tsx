"use client";

import React from "react";
import Link from "next/link";
import { Cpu, HardDrive, Zap, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { ProviderData } from "@/lib/types";
import { formatAddress } from "@/lib/identity";
import { formatBOT } from "@/lib/utils";

export function ProviderCard({ provider }: { provider: ProviderData }) {
  const getBadgeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("GPU")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    if (t.includes("AI")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    if (t.includes("RENDERING")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  };

  return (
    <div className="glass-panel-interactive rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top row: Name, status badge, compute type */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                {provider.name || "Unnamed Provider"}
              </h3>
              {provider.active ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  <XCircle className="w-3 h-3" />
                  Inactive
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              {formatAddress(provider.wallet)}
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getBadgeStyle(
              provider.computeType
            )}`}
          >
            {provider.computeType}
          </span>
        </div>

        {/* Hardware & Specs Grid */}
        <div className="space-y-2 mb-4 bg-slate-950/40 p-3 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate" title={provider.hardware}>
              {provider.hardware || "Standard x86_64 Node"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Units / Capacity:
            </span>
            <span className="font-semibold text-white">
              {provider.capacity.toString()} Cores/Units
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Collateral Staked:
            </span>
            <span className="font-semibold text-emerald-400">
              {formatBOT(provider.stake)} BOT
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
            Rate
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-cyan-400 font-mono">
              {formatBOT(provider.pricePerHour)}
            </span>
            <span className="text-xs text-slate-400 font-medium">BOT / hr</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/provider/${provider.wallet}`}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Details
          </Link>
          <Link
            href={`/create-job/${provider.wallet}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold shadow-sm transition-all"
          >
            <span>Rent</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
