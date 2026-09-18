import React from "react";
import Link from "next/link";
import { Cpu, ExternalLink, ShieldCheck, Terminal, HeartHandshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#04060a] text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-mono font-bold text-white text-sm">
                BOTCOMPUTE PROTOCOL
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              A decentralized compute marketplace and escrow protocol running on Botchain Testnet.
              Rent compute, provide compute, and earn native BOT with trustless on-chain settlement.
            </p>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-cyan-400 block mb-1">Architecture Disclosure:</strong>
              The blockchain handles provider registration, job agreements, financial escrow, and hash consistency verification.
              Actual GPU/CPU compute workloads are executed off-chain by the sandboxed BotCompute Worker daemon.
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Protocol
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/explore" className="hover:text-cyan-400 transition-colors">
                  Explore Providers
                </Link>
              </li>
              <li>
                <Link href="/dashboard/jobs" className="hover:text-cyan-400 transition-colors">
                  Customer Jobs
                </Link>
              </li>
              <li>
                <Link href="/dashboard/provider" className="hover:text-cyan-400 transition-colors">
                  Provider Portal
                </Link>
              </li>
              <li>
                <Link href="/worker" className="hover:text-cyan-400 transition-colors">
                  Worker Daemon
                </Link>
              </li>
            </ul>
          </div>

          {/* Botchain Network Specs */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Botchain Testnet
            </h4>
            <ul className="space-y-1.5 text-xs font-mono">
              <li className="flex items-center justify-between">
                <span>Chain ID:</span>
                <span className="text-slate-300">968</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Currency:</span>
                <span className="text-slate-300">BOT (18 decimals)</span>
              </li>
              <li>
                <a
                  href="https://rpc.bohr.life"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <span>RPC: rpc.bohr.life</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://scan.bohr.life"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <span>Explorer: scan.bohr.life</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} BotCompute Protocol. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>BotNS-Ready Identity</span>
            <span>•</span>
            <span>Safe Sandboxed Execution</span>
            <span>•</span>
            <span>Non-Custodial Escrow</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
