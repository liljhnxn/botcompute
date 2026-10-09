import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Cpu, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#04060a] text-slate-400 text-xs pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BOT Chain Ecosystem Banner */}
        <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#070b14] to-slate-900/90 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* BOT Chain Official Logo */}
            <div className="w-12 h-12 rounded-xl bg-black border border-emerald-500/30 p-1 shadow-lg shadow-emerald-500/20 flex-shrink-0 flex items-center justify-center">
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
                <h3 className="text-base font-bold text-white tracking-tight font-mono flex items-center gap-2">
                  <span>BOT Chain Ecosystem</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Mainnet 677
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The high-performance Layer-1 blockchain for decentralized intelligence, verifiable compute, and autonomous bots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* BOT Chain Website Button with Logo at the front */}
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-xs font-semibold text-white hover:text-emerald-300 transition-all font-mono group shadow-sm"
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
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-300" />
            </a>

            {/* BOT Chain Explorer Button with Logo at the front */}
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:text-white transition-all font-mono group shadow-sm"
              title="Open BOT Chain Block Explorer"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Explorer Logo"
                width={18}
                height={18}
                className="w-4.5 h-4.5 object-contain group-hover:scale-110 transition-transform"
              />
              <span>BOT Chain Explorer</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Navigation Grid */}
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
              A decentralized compute marketplace and escrow protocol running on BOT Chain Mainnet.
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

          {/* BOT Chain Mainnet Specs */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              BOT Chain Links
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors group"
                >
                  <Image
                    src="/botchain-logo.png"
                    alt="BOT Chain"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                  />
                  <span>Website: botchain.ai</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 ml-auto" />
                </a>
              </li>
              <li>
                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors group"
                >
                  <Image
                    src="/botchain-logo.png"
                    alt="BOT Chain Explorer"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                  />
                  <span>Explorer: scan.botchain.ai</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400 ml-auto" />
                </a>
              </li>
              <li className="flex items-center justify-between text-slate-400 pt-1 border-t border-white/5">
                <span>Chain ID:</span>
                <span className="text-slate-300">677</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span>Currency:</span>
                <span className="text-slate-300">BOT (18 decimals)</span>
              </li>
              <li>
                <a
                  href="https://scan.botchain.ai/address/0xB8D1c1b2d783d87B965C02a187b6AeF5D802030B"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline pt-1"
                  title="View BotCompute Protocol Contract on BotScan"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contract: 0xB8D1...030B</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} BotCompute Protocol. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain"
                width={13}
                height={13}
                className="w-3.5 h-3.5 object-contain"
              />
              <span>BOT Chain</span>
            </a>
            <span>•</span>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <Image
                src="/botchain-logo.png"
                alt="BotScan"
                width={13}
                height={13}
                className="w-3.5 h-3.5 object-contain"
              />
              <span>BotScan</span>
            </a>
            <span>•</span>
            <span>Non-Custodial Escrow</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
