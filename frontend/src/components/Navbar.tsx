"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Cpu, Server, Layers, Terminal, Menu, X, ShieldCheck, ExternalLink } from "lucide-react";
import { NetworkBadge } from "./NetworkBadge";
import { WalletButton } from "./WalletButton";
import { BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { getExplorerAddressUrl } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Explore Compute", href: "/explore", icon: Cpu },
    { label: "My Jobs", href: "/dashboard/jobs", icon: Layers },
    { label: "Provider Portal", href: "/dashboard/provider", icon: Server },
    { label: "Worker Daemon", href: "/worker", icon: Terminal },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#06090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-[#06090e] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white font-mono">
                  BOT<span className="text-cyan-400">COMPUTE</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  MVP
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Decentralized Compute & Escrow
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href={getExplorerAddressUrl(BOTCOMPUTE_CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all font-mono group shadow-sm"
              title="View BotCompute Contract on BotScan Mainnet Explorer"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={14}
                height={14}
                className="w-3.5 h-3.5 object-contain group-hover:scale-110 transition-transform"
              />
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            </a>
            <NetworkBadge />
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <WalletButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090d16] px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 mb-2 border-b border-slate-800/60 flex justify-between items-center">
            <NetworkBadge />
            <a
              href={getExplorerAddressUrl(BOTCOMPUTE_CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 font-mono"
            >
              <Image
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                width={14}
                height={14}
                className="w-3.5 h-3.5 object-contain"
              />
              <span>BotScan</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
