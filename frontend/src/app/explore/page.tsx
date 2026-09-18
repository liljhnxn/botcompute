"use client";

import React, { useState, useMemo } from "react";
import { useReadContract } from "wagmi";
import { Cpu, Filter, ArrowUpDown, Search, Server, Plus, Loader2 } from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { ProviderCard } from "@/components/ProviderCard";
import { RegisterProviderModal } from "@/components/RegisterProviderModal";
import { ProviderData } from "@/lib/types";

export default function ExplorePage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<string>("price-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Fetch all providers from contract
  const {
    data: rawProviders,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getAllProviders",
  });

  const filterCategories = ["ALL", "GPU", "CPU", "AI", "RENDERING"];

  const filteredAndSortedProviders = useMemo(() => {
    if (!rawProviders || !Array.isArray(rawProviders)) return [];

    let list = [...(rawProviders as unknown as ProviderData[])];

    // Filter by computeType
    if (selectedFilter !== "ALL") {
      list = list.filter((p) =>
        p.computeType.toUpperCase().includes(selectedFilter)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.hardware.toLowerCase().includes(q) ||
          p.wallet.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortOption === "price-asc") {
        return Number(a.pricePerHour - b.pricePerHour);
      }
      if (sortOption === "price-desc") {
        return Number(b.pricePerHour - a.pricePerHour);
      }
      if (sortOption === "capacity-desc") {
        return Number(b.capacity - a.capacity);
      }
      if (sortOption === "jobs-desc") {
        return Number(b.jobsCompleted - a.jobsCompleted);
      }
      return 0;
    });

    return list;
  }, [rawProviders, selectedFilter, searchQuery, sortOption]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white font-mono">
              Compute Marketplace
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Browse verified on-chain hardware providers, compare pricing, and deploy workloads.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Node</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedFilter === cat
                  ? "bg-cyan-500 text-black shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat === "ALL" ? "All Compute" : cat}
            </button>
          ))}
        </div>

        {/* Search & Sorting Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hardware, name, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="price-asc" className="bg-slate-900 text-white">
                Price: Low to High
              </option>
              <option value="price-desc" className="bg-slate-900 text-white">
                Price: High to Low
              </option>
              <option value="capacity-desc" className="bg-slate-900 text-white">
                Highest Capacity
              </option>
              <option value="jobs-desc" className="bg-slate-900 text-white">
                Most Jobs Completed
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Provider Cards Grid */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Querying provider registry from BotCompute.sol on Botchain Testnet...
          </p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
          <p className="text-sm font-semibold text-rose-400">
            Unable to fetch providers from Botchain Testnet.
          </p>
          <p className="text-xs text-slate-400">
            Please ensure your RPC connection is reachable or configure a deployed contract address.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
          >
            Retry Query
          </button>
        </div>
      ) : filteredAndSortedProviders.length === 0 ? (
        <div className="py-20 text-center space-y-4 glass-panel rounded-2xl border border-dashed border-slate-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Server className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No compute providers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedFilter !== "ALL"
                ? "No providers matched your current search and filter criteria."
                : "No compute providers registered yet on Botchain Testnet. Be the first to register your node and start earning BOT!"}
            </p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold"
          >
            Register First Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProviders.map((provider) => (
            <ProviderCard key={provider.wallet} provider={provider} />
          ))}
        </div>
      )}

      {/* Register Provider Modal */}
      <RegisterProviderModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
